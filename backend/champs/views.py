import datetime
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Champ
from .serializers import ChampSerializer
from etude_sol.ia_soil_service import analyser_sol


class ChampViewSet(viewsets.ModelViewSet):
    queryset = Champ.objects.all()
    serializer_class = ChampSerializer
    lookup_field = 'id_champ'

    def perform_create(self, serializer):
        serializer.save(updated_at=timezone.now())

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())


class ChampAnalyserView(APIView):
    """
    POST /api/champs/analyser/
    Form-data:
        - image        : fichier image (optionnel)
        - superficie   : float (optionnel)
        - source_eau   : str (optionnel)
        - latitude     : float (optionnel)
        - longitude    : float (optionnel)
        - ph_sol, azote, phosphore, potassium, matiere_organique, humidite : str (optionnel)
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image = request.FILES.get('image')
        data = request.data

        # Analyse IA du sol
        resultat = analyser_sol(data, image)

        if 'error' in resultat:
            return Response({'error': resultat['error']}, status=status.HTTP_400_BAD_REQUEST)

        try:
            latitude = float(data.get('latitude', 0.0))
            longitude = float(data.get('longitude', 0.0))
            superficie = float(data.get('superficie', 0.0)) if data.get('superficie') else None
        except (ValueError, TypeError):
            latitude, longitude, superficie = 0.0, 0.0, None

        champ = Champ.objects.create(
            superficie=superficie,
            source_eau=data.get('source_eau', 'Pluie'),
            latitude=latitude,
            longitude=longitude,
            image=image,
            date_analyse=datetime.date.today(),
            ph_sol=resultat.get('ph_sol'),
            matiere_organique=resultat.get('matiere_organique'),
            azote=resultat.get('azote'),
            phosphore=resultat.get('phosphore'),
            potassium=resultat.get('potassium'),
            humidite=resultat.get('humidite'),
            type_sol=resultat.get('type_sol'),
            fertilite=resultat.get('fertilite'),
            rapport_analyse=resultat.get('rapport_analyse'),
            updated_at=timezone.now(),
        )

        return Response({
            'success': True,
            'id_champ': champ.id_champ,
            'ia_analysis': resultat,
        }, status=status.HTTP_201_CREATED)
