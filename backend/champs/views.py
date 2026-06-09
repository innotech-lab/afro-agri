from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Champ
from .serializers import ChampSerializer

class ChampListCreateView(APIView):
    def get(self, request):
        champs = Champ.objects.all()
        return Response(ChampSerializer(champs, many=True).data)

    def post(self, request):
        serializer = ChampSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChampDetailView(APIView):
    def get_object(self, id_champ):
        return get_object_or_404(Champ, id_champ=id_champ)

    def get(self, request, id_champ):
        champ = self.get_object(id_champ)
        return Response(ChampSerializer(champ).data)

    def put(self, request, id_champ):
        champ = self.get_object(id_champ)
        serializer = ChampSerializer(champ, data=request.data)
        if serializer.is_valid():
            serializer.save(updated_at=timezone.now())
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, id_champ):
        champ = self.get_object(id_champ)
        serializer = ChampSerializer(champ, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(updated_at=timezone.now())
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id_champ):
        champ = self.get_object(id_champ)
        champ.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
