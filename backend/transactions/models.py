from django.db import models
from payments.models import Payment

class Transaction(models.Model):
    """
    Modèle pour logger les transactions brutes avec un fournisseur de paiement (Stripe, CinetPay, etc.).
    """
    class Statut(models.TextChoices):
        EN_ATTENTE = 'pending', 'En attente'
        SUCCES = 'success', 'Succès'
        ECHEC = 'failure', 'Échec'

    class Type(models.TextChoices):
        PAIEMENT = 'payment', 'Paiement'
        REMBOURSEMENT = 'refund', 'Remboursement'

    # id: Créé automatiquement par Django.

    # id_payment: Lien vers l'enregistrement de paiement interne.
    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE, # Si le paiement est supprimé, la transaction l'est aussi.
        related_name='transaction_logs',
        verbose_name="Paiement associé"
    )

    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.EN_ATTENTE, verbose_name="Statut de la transaction")
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.PAIEMENT, verbose_name="Type de transaction")

    # provider: ex: 'stripe', 'paypal', 'cinetpay'
    provider = models.CharField(max_length=50, verbose_name="Fournisseur de paiement")

    montant = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Montant")
    currency = models.CharField(max_length=10, default='XOF', verbose_name="Devise")

    # reference: ID de transaction unique du fournisseur.
    reference = models.CharField(max_length=255, unique=True, verbose_name="Référence fournisseur")

    message = models.TextField(blank=True, null=True, verbose_name="Message du fournisseur")

    # raw_response: Pour stocker la réponse JSON complète du fournisseur pour le débogage.
    raw_response = models.JSONField(blank=True, null=True, verbose_name="Réponse brute")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")

    def __str__(self):
        return f"Transaction {self.reference} ({self.provider}) - {self.statut}"

    class Meta:
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"
        ordering = ['-created_at']