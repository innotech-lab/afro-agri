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
