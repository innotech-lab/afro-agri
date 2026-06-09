from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth.hashers import make_password
from .models import User
from .serializers import UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'id_user'

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Endpoint pour changer le mot de passe d'un utilisateur"""
        user_id = request.data.get('user_id')
        new_password = request.data.get('new_password')
        
        if not user_id or not new_password:
            return Response(
                {'error': 'user_id et new_password requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id_user=user_id)
            user.password = make_password(new_password)
            user.save()
            return Response({'message': 'Mot de passe mis à jour avec succès'})
        except User.DoesNotExist:
            return Response({'error': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
