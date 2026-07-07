from django.utils import timezone
from rest_framework import viewsets
from .models import Subscription, Payment, Transaction
from .serializers import SubscriptionSerializer, PaymentSerializer, TransactionSerializer


class SubscriptionViewSet(viewsets.ModelViewSet):
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionSerializer

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())
