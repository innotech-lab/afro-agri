from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from journal.models import JournalPlante
from journal.serializers import JournalPlanteSerializer
from .models import DiagnosticResult
from .serializers import DiagnosticResultSerializer
from .ia_service import diagnostiquer


class DiagnosticImageView(APIView):
    """
    POST /api/diagnostic/analyser/
    Reçoit une image de plante, lance le diagnostic IA,
    consulte GitHub et retourne le résultat complet.

    Form-data:
        - image       : fichier image (obligatoire)
        - id_journal  : int (obligatoire) - lien avec journal_plante
        - nom_plante  : str (optionnel)
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image = request.FILES.get('image')
        id_journal = request.data.get('id_journal')

        if not image:
            return Response({'error': 'Image requise.'}, status=status.HTTP_400_BAD_REQUEST)
        if not id_journal:
            return Response({'error': 'id_journal requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            journal = JournalPlante.objects.get(pk=id_journal)
        except JournalPlante.DoesNotExist:
            return Response({'error': 'Journal introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        nom_plante = request.data.get('nom_plante', journal.id_plante.nom_plante)

        # --- Pipeline IA ---
        resultat = diagnostiquer(image, nom_plante)

        # Sauvegarder le diagnostic
        diagnostic = DiagnosticResult.objects.create(
            id_journal=journal,
            image=image,
            maladie_detectee=resultat['maladie_detectee'],
            confiance=resultat['confiance'],
            ravageur_detecte=resultat.get('ravageur', ''),
            traitement_suggere=resultat['traitement_suggere'],
            source_github=resultat['github'].get('url', ''),
        )

        # Mettre à jour journal_plante avec le diagnostic
        journal.maladie_suspecte = resultat['maladie_detectee']
        journal.symptomes = resultat['classe_complete']
        journal.save(update_fields=['maladie_suspecte', 'symptomes'])

        return Response({
            'diagnostic': DiagnosticResultSerializer(diagnostic).data,
            'journal': JournalPlanteSerializer(journal).data,
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
    Retourne l'historique des diagnostics pour un journal donné.
    """
    def get(self, request, id_journal):
        diagnostics = DiagnosticResult.objects.filter(id_journal=id_journal).order_by('-created_at')
        return Response(DiagnosticResultSerializer(diagnostics, many=True).data)
