from django.db import models
from django.conf import settings
from subscriptions.models import Subscription

class Payment(models.Model):
    """
    Modèle pour gérer les paiements liés aux abonnements.
    """
    class Statut(models.TextChoices):
        EN_ATTENTE = 'en_attente', 'En attente'
        COMPLETE = 'complete', 'Complété'
        ECHOUE = 'echoue', 'Échoué'

    # id: Créé automatiquement par Django.

    # id_user: Lié à l'utilisateur.
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, # Garde la trace du paiement même si l'utilisateur est supprimé
        null=True,
        related_name='payments',
        verbose_name="Utilisateur"
    )

    # id_subscription: Lié à l'abonnement.
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE, # Si l'abonnement est supprimé, ses paiements le sont aussi
        related_name='payments',
        verbose_name="Abonnement"
    )

    montant = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Montant")

    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.EN_ATTENTE, verbose_name="Statut")

    paid_at = models.DateTimeField(null=True, blank=True, verbose_name="Date de paiement")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")

    def __str__(self):
        return f"Paiement de {self.montant} pour {self.subscription}"

    class Meta:
        verbose_name = "Paiement"
        verbose_name_plural = "Paiements"
        ordering = ['-created_at']
