from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Plante
from .serializers import PlanteSerializer

class PlanteView(APIView):
    def get(self, request):
        plantes = Plante.objects.all()
        return Response(PlanteSerializer(plantes, many=True).data)

    def post(self, request):
        serializer = PlanteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
