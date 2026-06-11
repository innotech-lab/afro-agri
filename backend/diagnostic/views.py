import uuid
import datetime
from django.db import connection
from django.core.files.storage import default_storage
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from .ia_service import diagnostiquer


class DiagnosticImageView(APIView):
    """
    POST /api/diagnostic/analyser/
    Form-data:
        - image      : fichier image (obligatoire)
        - nom_plante : str (optionnel)
        - stade      : str (optionnel)

    Pipeline complet :
    1. Analyse IA de l'image
    2. Cree journal_plante en MySQL
    3. Cree diagnostic_result en MySQL
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image = request.FILES.get('image')
        if not image:
            return Response({'error': 'Image requise.'}, status=status.HTTP_400_BAD_REQUEST)

        nom_plante = request.data.get('nom_plante', 'plante inconnue')
        stade = request.data.get('stade', 'non renseigne')
        today = datetime.date.today()
        session = str(uuid.uuid4())[:20]

        # --- Analyse IA ---
        resultat = diagnostiquer(image, nom_plante)

        # --- Sauvegarde en MySQL ---
        with connection.cursor() as cur:

            # id_user
            cur.execute('SELECT id_user FROM users LIMIT 1')
            row = cur.fetchone()
            if not row:
                return Response({'error': 'Aucun utilisateur en base.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            id_user = row[0]

            # id_champ
            cur.execute('SELECT id_champ FROM champs LIMIT 1')
            row = cur.fetchone()
            if not row:
                cur.execute(
                    "INSERT INTO champs (superficie, source_eau, longitude, latitude, created_at) VALUES (1.0, 'pluie', 0.0, 0.0, NOW())"
                )
                cur.execute('SELECT id_champ FROM champs LIMIT 1')
                row = cur.fetchone()
            id_champ = row[0]

            # id_plante
            cur.execute('SELECT id_plante FROM plantes WHERE nom_plante = %s LIMIT 1', [nom_plante])
            row = cur.fetchone()
            if not row:
                cur.execute(
                    "INSERT INTO plantes (nom_plante, variete, date_plantation, id_champ, created_at, update_at) VALUES (%s, %s, %s, %s, NOW(), NOW())",
                    [nom_plante, today, today, id_champ]
                )
                cur.execute('SELECT id_plante FROM plantes WHERE nom_plante = %s LIMIT 1', [nom_plante])
                row = cur.fetchone()
            id_plante = row[0]

            # journal_plante
            cur.execute(
                '''INSERT INTO journal_plante
                   (id_plante, date_observation, stade_croissance, symptomes,
                    ravageur_suspecte, maladie_suspecte, id_user,
                    session_uuid, longitude, latitude, created_at, updated_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 0.0, 0.0, NOW(), NOW())''',
                [id_plante, today, stade,
                 resultat['classe_complete'],
                 'inconnu',
                 resultat['maladie_detectee'],
                 id_user, session]
            )
            id_journal = cur.lastrowid

            # Sauvegarder l'image
            image.seek(0)
            image_path = default_storage.save(f'diagnostics/{session}.jpg', image)

            # diagnostic_result
            cur.execute(
                '''INSERT INTO diagnostic_result
                   (id_journal, image, maladie_detectee, confiance,
                    ravageur_detecte, traitement_suggere, source_github, created_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())''',
                [id_journal, image_path,
                 resultat['maladie_detectee'],
                 resultat['confiance'],
                 '',
                 resultat['traitement_suggere'],
                 resultat['github'].get('url', '')]
            )
            id_diagnostic = cur.lastrowid

        return Response({
            'id_journal': id_journal,
            'id_diagnostic': id_diagnostic,
            'details': {
                'plante_detectee': resultat['plante_detectee'],
                'maladie': resultat['maladie_detectee'],
                'confiance_pct': f"{resultat['confiance']}%",
                'est_saine': resultat['est_saine'],
                'traitement': resultat['traitement_suggere'],
                'source_open_source': resultat['github'],
            }
        }, status=status.HTTP_201_CREATED)


class DiagnosticHistoriqueView(APIView):
    """
    GET /api/diagnostic/historique/<id_journal>/
    """
    def get(self, request, id_journal):
        with connection.cursor() as cur:
            cur.execute(
                '''SELECT id_diagnostic, image, maladie_detectee, confiance,
                          traitement_suggere, source_github, created_at
                   FROM diagnostic_result
                   WHERE id_journal = %s
                   ORDER BY created_at DESC''',
                [id_journal]
            )
            cols = [c[0] for c in cur.description]
            rows = [dict(zip(cols, row)) for row in cur.fetchall()]
        return Response(rows)
