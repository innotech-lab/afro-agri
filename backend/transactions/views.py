from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser
from .models import Transaction
from .serializers import TransactionSerializer

class TransactionViewSet(viewsets.ModelViewSet):
    """
    API endpoint qui permet de voir les logs de transactions.
    L'accès est restreint aux administrateurs.
    Les logs de transactions ne devraient généralement pas être modifiés,
    cet endpoint est donc principalement en lecture seule.
    """
    queryset = Transaction.objects.all().order_by('-created_at')
    serializer_class = TransactionSerializer
    permission_classes = [IsAdminUser]
    http_method_names = ['get', 'head', 'options'] # On autorise que la lecture
