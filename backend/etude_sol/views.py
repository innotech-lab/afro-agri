
from django.shortcuts import get_object_or_404

import datetime

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import EtudeSol
from .serializers import EtudeSolSerializer
from .ia_soil_service import analyser_sol
from champs.models import Champ


class EtudeSolView(APIView):
    def get(self, request):
        etudes = EtudeSol.objects.all()
        id_champ = request.query_params.get('id_champ')
        if id_champ:
            etudes = etudes.filter(id_champ=id_champ)
        return Response(EtudeSolSerializer(etudes, many=True).data)

    def post(self, request):
        serializer = EtudeSolSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EtudeSolDetailView(APIView):
    def get_object(self, pk):
        return get_object_or_404(EtudeSol, pk=pk)

    def get(self, request, pk):
        return Response(EtudeSolSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        serializer = EtudeSolSerializer(self.get_object(pk), data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        serializer = EtudeSolSerializer(self.get_object(pk), data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

from rest_framework.parsers import MultiPartParser, FormParser

from .ia_soil_service import analyser_sol, analyser_visuelle_sol

class ExtraireDonneesSolView(APIView):
    """
    POST /api/etude-sol/extraire-donnees/
    Analyse l'image et retourne des estimations pour pré-remplir le formulaire.
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image = request.FILES.get('image')
        if not image:
            return Response({'error': 'Image requise'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Extraction IA (simulée)
        vsa = analyser_visuelle_sol(image)
        
        return Response({
            'suggestions': {
                'ph_sol': vsa['ph_estime'],
                'azote': vsa['azote_estime'],
                'phosphore': vsa['phosphore_estime'],
                'potassium': vsa['potassium_estime'],
                'matiere_organique': vsa['matiere_org_estimee'],
                'type_sol': vsa['texture_detectee'],
                'humidite': vsa['humidite_visuelle'],
                'observation': vsa['observation_ia']
            }
        })

class AnalyserEtudeSolView(APIView):
    """
    POST /api/etude-sol/analyser/
    Analyse les données NPK/pH + Image et enregistre l'étude de sol.
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        data = request.data
        image = request.FILES.get('image')
        
        # 1. Analyse IA (Chimique + Visuelle)
        try:
            analyse = analyser_sol(data, image)
            if 'error' in analyse:
                return Response({'error': analyse['error']}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as ia_err:
            return Response({'error': f"Erreur IA: {str(ia_err)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # 2. Récupération précise du champ
        id_champ_raw = data.get('id_champ')
        print(f"DEBUG: id_champ reçu = {id_champ_raw}")
        
        champ = Champ.objects.filter(id_champ=int(id_champ_raw)).first() if id_champ_raw and str(id_champ_raw).isdigit() else None
        
        if not champ:
            champ = Champ.objects.first()
            print(f"DEBUG: Repli sur le champ #{champ.id_champ if champ else 'AUCUN'}")
        
        if not champ:
            return Response({'error': 'Veuillez d\'abord créer un champ.'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Sauvegarde dans la table etude_sol
        try:
            etude = EtudeSol.objects.create(
                id_champ=champ,
                image=image,
                date_analyse=datetime.date.today(),
                ph_sol=str(data.get('ph_sol', '7.0')),
                matiere_organique=str(data.get('matiere_organique', 'N/A')),
                azote=str(data.get('azote', '0')),
                phosphore=str(data.get('phosphore', '0')),
                potassium=str(data.get('potassium', '0')),
                humidite=str(data.get('humidite', '0')),
                type_sol=str(analyse['type_sol']),
                fertilite=str(analyse['fertilite']),
                rapport_analyse=str(analyse['rapport_analyse']) # TEXT field, pas de troncature nécessaire
            )
            print(f"DEBUG: Étude créée avec succès! ID Étude = {etude.id_etude}")
            
            return Response({
                'id_etude_sol': etude.id_etude,
                'analyse_ia': analyse
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"ERREUR CRITIQUE SAUVEGARDE: {str(e)}")
            return Response({'error': f"Erreur base de données: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

