from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import TypeUser
from .serializers import TypeUserSerializer


class TypeUserView(APIView):
    def get(self, request, pk=None):
        if pk is not None:
            try:
                type_user = TypeUser.objects.get(pk=pk)
            except TypeUser.DoesNotExist:
                return Response({"detail": "TypeUser not found."}, status=status.HTTP_404_NOT_FOUND)
            return Response(TypeUserSerializer(type_user).data)

        types = TypeUser.objects.all()
        return Response(TypeUserSerializer(types, many=True).data)

    def post(self, request):
        serializer = TypeUserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
        if pk is None:
            return Response({"detail": "PK is required for update."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            type_user = TypeUser.objects.get(pk=pk)
        except TypeUser.DoesNotExist:
            return Response({"detail": "TypeUser not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = TypeUserSerializer(type_user, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk=None):
        if pk is None:
            return Response({"detail": "PK is required for partial update."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            type_user = TypeUser.objects.get(pk=pk)
        except TypeUser.DoesNotExist:
            return Response({"detail": "TypeUser not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = TypeUserSerializer(type_user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        if pk is None:
            return Response({"detail": "PK is required for delete."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            type_user = TypeUser.objects.get(pk=pk)
        except TypeUser.DoesNotExist:
            return Response({"detail": "TypeUser not found."}, status=status.HTTP_404_NOT_FOUND)

        type_user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
