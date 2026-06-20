import uuid
import datetime

from django.db import connection, transaction
from django.shortcuts import get_object_or_404

from django.core.files.storage import default_storage
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from .ia_service import diagnostiquer
from .models import DiagnosticResult
from .serializers import DiagnosticResultSerializer
from journal.models import JournalPlante
from plantes.models import Plante
from champs.models import Champ
from users.models import User


class DiagnosticListView(APIView):
    def get(self, request):
        diagnostics = DiagnosticResult.objects.all()
        id_journal = request.query_params.get('id_journal')
        if id_journal:
            diagnostics = diagnostics.filter(id_journal=id_journal)
        return Response(DiagnosticResultSerializer(diagnostics, many=True).data)


class DiagnosticDetailView(APIView):
    def get_object(self, pk):
        return get_object_or_404(DiagnosticResult, pk=pk)

    def get(self, request, pk):
        return Response(DiagnosticResultSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        serializer = DiagnosticResultSerializer(self.get_object(pk), data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        serializer = DiagnosticResultSerializer(self.get_object(pk), data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DiagnosticImageView(APIView):
    """
    POST /api/diagnostic/analyser/
    Form-data:
        - image      : fichier image (obligatoire)
        - nom_plante : str (optionnel)
        - stade      : str (optionnel)
        - id_champ   : int (optionnel)
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image = request.FILES.get('image')
        if not image:
            return Response({'error': 'Image requise.'}, status=status.HTTP_400_BAD_REQUEST)

        nom_plante = request.data.get('nom_plante', 'plante inconnue')
        stade = request.data.get('stade', 'non renseigne')
        id_champ_req = request.data.get('id_champ')
        
        latitude = request.data.get('latitude', None)
        longitude = request.data.get('longitude', None)
        try:
            latitude = float(latitude) if latitude is not None else None
            longitude = float(longitude) if longitude is not None else None
        except (ValueError, TypeError):
            latitude, longitude = None, None

        today = datetime.date.today()
        session = str(uuid.uuid4())[:20]

        # --- Analyse IA ---
        resultat = diagnostiquer(image, nom_plante)

        try:
            with transaction.atomic():
                # 1. Utilisateur
                user = User.objects.first()
                if not user:
                    return Response({'error': 'Aucun utilisateur en base.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                # 2. Champ
                if id_champ_req:
                    champ = Champ.objects.filter(id_champ=id_champ_req).first()
                else:
                    champ = Champ.objects.first()
                
                if not champ:
                    champ = Champ.objects.create(
                        superficie=1.0,
                        source_eau='pluie',
                        longitude=longitude if longitude is not None else 0.0,
                        latitude=latitude if latitude is not None else 0.0
                    )

                # 3. Plante
                plante, _ = Plante.objects.get_or_create(
                    nom_plante=nom_plante,
                    defaults={
                        'variete': str(today),
                        'id_champ': champ,
                        'date_plantation': today
                    }
                )

                # 4. Journal
                journal = JournalPlante.objects.create(
                    id_plante=plante,
                    date_observation=today,
                    stade_croissance=resultat.get('stade_croissance', stade),
                    symptomes=resultat.get('symptomes', resultat['classe_complete']),
                    ravageur_suspecte=resultat.get('ravageur_suspecte', 'inconnu'),
                    maladie_suspecte=resultat['maladie_detectee'],
                    id_user=user,
                    session_uuid=session,
                    longitude=longitude if longitude is not None else 0.0,
                    latitude=latitude if latitude is not None else 0.0
                )

                # 5. Diagnostic
                image.seek(0)
                diagnostic = DiagnosticResult.objects.create(
                    id_journal=journal,
                    image=image,
                    maladie_detectee=resultat['maladie_detectee'],
                    confiance=resultat['confiance'],
                    ravageur_detecte=resultat.get('ravageur_suspecte', ''),
                    traitement_suggere=resultat['traitement_suggere'],
                    source_github=resultat['github'].get('url', '')
                )

            return Response({
                'success': True,
                'id_journal': journal.id_journal,
                'id_diagnostic': diagnostic.id_diagnostic,
                'latitude': latitude if latitude is not None else 0.0,
                'longitude': longitude if longitude is not None else 0.0,
                'journal': {
                    'date_observation': str(journal.date_observation),
                    'stade_croissance': journal.stade_croissance,
                    'symptomes': journal.symptomes,
                    'ravageur_suspecte': journal.ravageur_suspecte,
                    'maladie_suspecte': journal.maladie_suspecte,
                    'latitude': journal.latitude,
                    'longitude': journal.longitude,
                },
                'ia_analysis': {
                    'plante': resultat['plante_detectee'],
                    'maladie': resultat['maladie_detectee'],
                    'traitement': resultat['traitement_suggere'],
                    'confiance': resultat['confiance'],
                    'est_saine': resultat['est_saine'],
                    'github': resultat['github'],
                },
                'suggestions_ia': {
                    'plante_detectee': resultat['plante_detectee'],
                    'maladie_suspecte': resultat['maladie_detectee'],
                    'symptomes': resultat['classe_complete'],
                    'confiance': resultat['confiance'],
                    'est_saine': resultat['est_saine'],
                    'traitement_suggere': resultat['traitement_suggere'],
                    'source': resultat['github'],
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DiagnosticHistoriqueView(APIView):
    """
    GET /api/diagnostic/historique/<id_journal>/
    """
    def get(self, request, id_journal):
        diagnostics = DiagnosticResult.objects.filter(id_journal=id_journal).order_by('-created_at')
        serializer = DiagnosticResultSerializer(diagnostics, many=True)
        return Response(serializer.data)
