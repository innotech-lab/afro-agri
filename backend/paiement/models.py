from django.db import models
from users.models import User


class Subscription(models.Model):
    id = models.AutoField(primary_key=True)
    id_user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='id_user')
    statut = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'subscriptions'


class Payment(models.Model):
    id = models.AutoField(primary_key=True)
    id_user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='id_user')
    id_subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_subscription')
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    statut = models.CharField(max_length=50)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payments'


class Transaction(models.Model):
    id = models.AutoField(primary_key=True)
    id_payment = models.ForeignKey(Payment, on_delete=models.CASCADE, db_column='id_payment')
    statut = models.CharField(max_length=50)
    type = models.CharField(max_length=50)
    provider = models.CharField(max_length=100)
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10)
    reference = models.CharField(max_length=200, null=True, blank=True)
    message = models.CharField(max_length=200, null=True, blank=True)
    raw_response = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'transactions'
