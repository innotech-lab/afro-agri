import uuid
import requests
from django.conf import settings
from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from .models import JournalPlante
from .serializers import JournalPlanteSerializer
from diagnostic.ia_service import diagnostiquer


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


class JournalPlanteDetailView(APIView):
    def get_object(self, pk):
        from django.shortcuts import get_object_or_404
        return get_object_or_404(JournalPlante, pk=pk)

    def get(self, request, pk):
        return Response(JournalPlanteSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        serializer = JournalPlanteSerializer(self.get_object(pk), data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        serializer = JournalPlanteSerializer(self.get_object(pk), data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


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
                    "INSERT INTO champs (superficie, source_eau, longitude, latitude) VALUES (1.0, 'pluie', 0.0, 0.0)"
                )
                cursor.execute('SELECT id_champ FROM champs LIMIT 1')
                row = cursor.fetchone()
            id_champ = row[0]

            # plante
            cursor.execute('SELECT id_plante FROM plantes LIMIT 1')
            row = cursor.fetchone()
            if not row:
                cursor.execute(
                    "INSERT INTO plantes (nom_plante, variete, date_plantation, id_champ, updated_at) VALUES (%s, %s, %s, %s, NOW())",
                    [nom_plante, today, today, id_champ]
                )
                cursor.execute('SELECT id_plante FROM plantes LIMIT 1')
                row = cursor.fetchone()
            id_plante = row[0]

            cursor.execute(
                '''
                INSERT INTO journal_plante
                (id_plante, date_observation, stade_croissance, symptomes,
                 ravageur_suspecte, maladie_suspecte, id_user,
                 session_uuid, longitude, latitude, updated_at)
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


class AnalyserImageView(APIView):
    """
    POST /api/journal/analyser-image/
    Analyse l'image via IA et enregistre automatiquement le journal_plante.
    Retourne directement le journal enregistré (AUCUNE confirmation utilisateur).
    
    Form-data: { image, nom_plante (optionnel), latitude (optionnel), longitude (optionnel) }
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image = request.FILES.get('image')
        if not image:
            return Response({'error': 'Image requise.'}, status=status.HTTP_400_BAD_REQUEST)

        nom_plante = request.data.get('nom_plante', 'plante inconnue')
        latitude = request.data.get('latitude', None)
        longitude = request.data.get('longitude', None)
        
        try:
            latitude = float(latitude) if latitude is not None else None
            longitude = float(longitude) if longitude is not None else None
        except (ValueError, TypeError):
            latitude, longitude = None, None

        # LOG: Déboguer les coordonnées reçues
        print(f'[BACKEND] AnalyserImageView reçu: latitude={latitude}, longitude={longitude}')

        # Validation: coordonnées doivent être présentes et valides
        if latitude is None or longitude is None:
            print(f'[BACKEND] ❌ Coordonnées manquantes!')
            return Response(
                {'error': 'Latitude et longitude sont requises.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier que ce ne sont pas des 0.0 purs
        if latitude == 0.0 and longitude == 0.0:
            print(f'[BACKEND] ❌ Coordonnées 0,0 invalides!')
            return Response(
                {'error': 'Coordonnées GPS invalides (0,0). Veuillez autoriser la localisation.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier la plage valide
        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            print(f'[BACKEND] ❌ Coordonnées hors limites!')
            return Response(
                {'error': f'Coordonnées GPS hors limites: {latitude}, {longitude}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        print(f'[BACKEND] ✅ Coordonnées valides: {latitude}, {longitude}')

        today = __import__('datetime').date.today()
        session = str(uuid.uuid4())[:20]

        # Analyse IA complète avec extraction automatique de stade, symptômes, ravageurs
        resultat = diagnostiquer(image, nom_plante)

        with connection.cursor() as cursor:
            # Créer/récupérer type_user
            cursor.execute('SELECT id_type FROM type_user LIMIT 1')
            row = cursor.fetchone()
            if not row:
                cursor.execute("INSERT INTO type_user (type) VALUES ('agriculteur')")
                cursor.execute('SELECT id_type FROM type_user LIMIT 1')
                row = cursor.fetchone()
            id_type = row[0]

            # Créer/récupérer user par défaut
            cursor.execute('SELECT id_user FROM users LIMIT 1')
            row = cursor.fetchone()
            if not row:
                cursor.execute(
                    "INSERT INTO users (prenom, id_type, email, password, created_date) VALUES ('agriculteur_mobile', %s, 'mobile@afroagri.com', 'mobile', NOW())",
                    [id_type]
                )
                cursor.execute('SELECT id_user FROM users LIMIT 1')
                row = cursor.fetchone()
            id_user = row[0]

            # Créer/récupérer champ par défaut
            cursor.execute('SELECT id_champ FROM champs LIMIT 1')
            row = cursor.fetchone()
            if not row:
                cursor.execute(
                    "INSERT INTO champs (superficie, source_eau, longitude, latitude) VALUES (1.0, 'pluie', 0.0, 0.0)"
                )
                cursor.execute('SELECT id_champ FROM champs LIMIT 1')
                row = cursor.fetchone()
            id_champ = row[0]

            # Créer/récupérer plante
            nom_plante_clean = resultat['plante_detectee'] or nom_plante
            cursor.execute(
                'SELECT id_plante FROM plantes WHERE nom_plante LIKE %s LIMIT 1',
                [f'%{nom_plante_clean}%']
            )
            row = cursor.fetchone()
            if not row:
                cursor.execute(
                    "INSERT INTO plantes (nom_plante, variete, date_plantation, id_champ, updated_at) VALUES (%s, %s, %s, %s, NOW())",
                    [nom_plante_clean, 'variété détectée', today, id_champ]
                )
                cursor.execute(
                    'SELECT id_plante FROM plantes WHERE nom_plante LIKE %s LIMIT 1',
                    [f'%{nom_plante_clean}%']
                )
                row = cursor.fetchone()
            id_plante = row[0]

            # ENREGISTREMENT AUTOMATIQUE avec données IA extraites et GPS du mobile
            print(f'[BACKEND] Enregistrement journal avec: stade={resultat["stade_croissance"]}, symptomes={resultat["symptomes"]}, lat={latitude}, lon={longitude}')
            cursor.execute(
                '''INSERT INTO journal_plante
                   (id_plante, date_observation, stade_croissance, symptomes,
                    ravageur_suspecte, maladie_suspecte, id_user,
                    session_uuid, longitude, latitude, updated_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())''',
                [
                    id_plante,
                    today,
                    resultat['stade_croissance'],  # Généré par IA
                    resultat['symptomes'],         # Généré par IA
                    resultat['ravageur_suspecte'], # Généré par IA
                    resultat['maladie_detectee'],
                    id_user,
                    session,
                    longitude,  # Du téléphone - IMPORTANT!
                    latitude    # Du téléphone - IMPORTANT!
                ]
            )
            id_journal = cursor.lastrowid
            print(f'[BACKEND] ✅ Journal enregistré: id_journal={id_journal}')

            # Récupérer le journal enregistré pour confirmation
            cursor.execute(
                'SELECT id_journal, date_observation, stade_croissance, symptomes, ravageur_suspecte, maladie_suspecte, longitude, latitude FROM journal_plante WHERE id_journal = %s',
                [id_journal]
            )
            cols = [c[0] for c in cursor.description]
            row = cursor.fetchone()
            journal_data = dict(zip(cols, row)) if row else {}

        # Retourner le journal enregistré avec les infos IA pour affichage
        return Response({
            'success': True,
            'message': f'Journal #{id_journal} enregistré automatiquement',
            'id_journal': id_journal,
            'journal': journal_data,
            'latitude': latitude,
            'longitude': longitude,
            'ia_analysis': {
                'plante': resultat['plante_detectee'],
                'maladie': resultat['maladie_detectee'],
                'traitement': resultat['traitement_suggere'],
                'confiance': resultat['confiance'],
                'est_saine': resultat['est_saine'],
                'github': resultat['github'],
            }
        }, status=status.HTTP_201_CREATED)



class ConfirmerIAView(APIView):
    """
    PATCH /api/journal/<id>/confirmer-ia/
    L'utilisateur confirme ou corrige les suggestions IA et met a jour le journal.
    Body: { stade_croissance, symptomes, ravageur_suspecte, maladie_suspecte }
    """
    def patch(self, request, pk):
        champs = ['stade_croissance', 'symptomes', 'ravageur_suspecte', 'maladie_suspecte']
        updates = {c: request.data[c] for c in champs if c in request.data}
        if not updates:
            return Response({'error': 'Aucun champ fourni.'}, status=status.HTTP_400_BAD_REQUEST)

        set_clause = ', '.join(f'{c} = %s' for c in updates)
        with connection.cursor() as cursor:
            cursor.execute(f'SELECT id_journal FROM journal_plante WHERE id_journal = %s', [pk])
            if not cursor.fetchone():
                return Response(status=status.HTTP_404_NOT_FOUND)
            cursor.execute(
                f'UPDATE journal_plante SET {set_clause} WHERE id_journal = %s',
                list(updates.values()) + [pk]
            )
            cursor.execute(
                'SELECT id_journal, stade_croissance, symptomes, ravageur_suspecte, maladie_suspecte FROM journal_plante WHERE id_journal = %s',
                [pk]
            )
            cols = [c[0] for c in cursor.description]
            row  = cursor.fetchone()

        return Response(dict(zip(cols, row)))


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


class ScanQRCodeView(APIView):
    """
    GET /api/journal/scan/<code>/
    Recherche les journaux correspondant au code scanné.
    Le code peut être : id_journal, id_plante (numérique) ou un nom de plante.
    """
    def get(self, request, code):
        # essayer comme entier (id_journal ou id_plante)
        qs = None
        try:
            num = int(code)
            qs = JournalPlante.objects.filter(id_journal=num)
            if not qs.exists():
                qs = JournalPlante.objects.filter(id_plante__id_plante=num)
        except ValueError:
            qs = JournalPlante.objects.filter(id_plante__nom_plante__icontains=code)

        data = JournalPlanteSerializer(qs, many=True).data
        if not data:
            return Response({'error': 'Aucun journal trouvé pour ce code.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'resultats': data})
