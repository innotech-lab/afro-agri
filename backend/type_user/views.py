from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import TypeUser
from .serializers import TypeUserSerializer

class TypeUserView(APIView):
    def get(self, request):
        types = TypeUser.objects.all()
        return Response(TypeUserSerializer(types, many=True).data)

    def post(self, request):
        serializer = TypeUserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
