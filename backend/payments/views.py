from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser
from .models import Payment
from .serializers import PaymentSerializer

class PaymentViewSet(viewsets.ModelViewSet):
    """
    API endpoint qui permet de voir et modifier les paiements.
    L'accès est restreint aux administrateurs.
    """
    queryset = Payment.objects.all().order_by('-created_at')
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminUser]
