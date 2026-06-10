import uuid
import requests
from django.conf import settings
from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import JournalPlante
from .serializers import JournalPlanteSerializer


class JournalPlanteView(APIView):
    def get(self, request):
        journaux = JournalPlante.objects.all()
        return Response(JournalPlanteSerializer(journaux, many=True).data)

    def post(self, request):
        serializer = JournalPlanteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JournalQuickCreateView(APIView):
    """
    POST /api/journal/quick-create/
    Cree un journal_plante directement en SQL sans dependre
    des ForeignKeys id_plante / id_user depuis l'interface.
    Body: { "nom_plante": "tomate", "stade": "floraison" }
    """
    def post(self, request):
        nom_plante = request.data.get('nom_plante', 'plante inconnue')
        stade      = request.data.get('stade', 'non renseigne')
        today      = __import__('datetime').date.today()
        session    = str(uuid.uuid4())[:20]

        with connection.cursor() as cursor:
            # type_user
            cursor.execute('SELECT id_type FROM type_user LIMIT 1')
            row = cursor.fetchone()
            if not row:
                cursor.execute("INSERT INTO type_user (type) VALUES ('agriculteur')")
                cursor.execute('SELECT id_type FROM type_user LIMIT 1')
                row = cursor.fetchone()
            id_type = row[0]

            # user
            cursor.execute('SELECT id_user FROM users LIMIT 1')
            row = cursor.fetchone()
            if not row:
                cursor.execute(
                    "INSERT INTO users (prenom, id_type, email, password, created_date) VALUES ('admin', %s, 'admin@afroagri.com', 'admin', NOW())",
                    [id_type]
                )
                cursor.execute('SELECT id_user FROM users LIMIT 1')
                row = cursor.fetchone()
            id_user = row[0]

            # champ
            cursor.execute('SELECT id_champ FROM champs LIMIT 1')
            row = cursor.fetchone()
            if not row:
                cursor.execute(
                    "INSERT INTO champs (superficie, source_eau, longitude, latitude, created_at) VALUES (1.0, 'Pluie', 0.0, 0.0, NOW())"
                )
                cursor.execute('SELECT id_champ FROM champs LIMIT 1')
                row = cursor.fetchone()
            id_champ = row[0]

            # plante
            cursor.execute('SELECT id_plante FROM plantes LIMIT 1')
            row = cursor.fetchone()
            if not row:
                cursor.execute(
                    "INSERT INTO plantes (nom_plante, variete, date_plantation, id_champ, created_at, updated_at) VALUES (%s, 'inconnue', %s, %s, NOW(), NOW())",
                    [nom_plante, today, id_champ]
                )
                cursor.execute('SELECT id_plante FROM plantes LIMIT 1')
                row = cursor.fetchone()
            id_plante = row[0]

            cursor.execute(
                '''
                INSERT INTO journal_plante
                (id_plante, date_observation, stade_croissance, symptomes,
                 ravageur_suspecte, maladie_suspecte, id_user,
                 session_uuid, longitude, latitude, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                ''',
                [id_plante, today, stade, 'en cours de diagnostic',
                 'inconnu', 'inconnu', id_user, session, 0.0, 0.0]
            )
            journal_id = cursor.lastrowid

        return Response({'id_journal': journal_id, 'nom_plante': nom_plante}, status=status.HTTP_201_CREATED)


class PlantDiseaseGithubView(APIView):
    """
    Récupère des données open source GitHub sur les maladies des plantes.
    GET /api/journal/plant-diseases/  -> liste des repos GitHub sur les maladies
    GET /api/journal/plant-diseases/?nom_plante=tomato -> filtre par nom de plante
    """
    def get(self, request):
        nom_plante = request.query_params.get('nom_plante', '')
        query = f'plant disease {nom_plante} dataset' if nom_plante else 'plant disease dataset'
        url = f'https://api.github.com/search/repositories?q={query}&sort=stars&per_page=10'

        try:
            resp = requests.get(url, headers={'Accept': 'application/vnd.github.v3+json'}, timeout=10)
            resp.raise_for_status()
        except requests.RequestException as e:
            return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        items = resp.json().get('items', [])
        data = [
            {
                'nom': item['full_name'],
                'description': item['description'],
                'url': item['html_url'],
                'stars': item['stargazers_count'],
                'topics': item.get('topics', []),
            }
            for item in items
        ]
        return Response({'source': 'GitHub Open Source', 'query': query, 'resultats': data})


class EnrichJournalPlanteView(APIView):
    """
    Enrichit un journal_plante avec des suggestions de maladies depuis GitHub.
    POST /api/journal/<id>/enrich/
    Body: { "symptomes": "taches jaunes", "nom_plante": "tomate" }
    """
    def post(self, request, pk):
        try:
            journal = JournalPlante.objects.get(pk=pk)
        except JournalPlante.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        symptomes = request.data.get('symptomes', journal.symptomes)
        nom_plante = request.data.get('nom_plante', '')

        # Recherche sur GitHub de ressources liées aux symptômes
        query = f'{nom_plante} {symptomes} plant disease'
        url = f'https://api.github.com/search/repositories?q={query}&sort=stars&per_page=5'

        try:
            resp = requests.get(url, headers={'Accept': 'application/vnd.github.v3+json'}, timeout=10)
            resp.raise_for_status()
            items = resp.json().get('items', [])
        except requests.RequestException as e:
            return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        suggestions = [
            {'nom': i['full_name'], 'description': i['description'], 'url': i['html_url']}
            for i in items
        ]

        # Mise à jour du champ maladie_suspecte avec la première suggestion
        if suggestions:
            journal.maladie_suspecte = suggestions[0]['nom']
            journal.save(update_fields=['maladie_suspecte'])

        return Response({
            'journal': JournalPlanteSerializer(journal).data,
            'suggestions_github': suggestions,
        })
