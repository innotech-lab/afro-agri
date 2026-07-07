from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser
from .models import Subscription
from .serializers import SubscriptionSerializer

class SubscriptionViewSet(viewsets.ModelViewSet):
    """
    API endpoint qui permet de voir et modifier les abonnements.
    """
    queryset = Subscription.objects.all().order_by('-created_at')
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAdminUser]
