from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Champ
from .serializers import ChampSerializer

class ChampView(APIView):
    def get(self, request):
        champs = Champ.objects.all()
        return Response(ChampSerializer(champs, many=True).data)

    def post(self, request):
        serializer = ChampSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
