from django.db import models
from django.conf import settings

class Subscription(models.Model):
    """
    Modèle pour gérer les abonnements des utilisateurs.
    """
    class Statut(models.TextChoices):
        ACTIF = 'actif', 'Actif'
        EXPIRE = 'expire', 'Expiré'
        ANNULE = 'annule', 'Annulé'
        EN_ATTENTE = 'en_attente', 'En attente'

    # Le champ 'id' est créé automatiquement par Django.

    # id_user: Clé étrangère vers le modèle User de votre projet.
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subscriptions',
        verbose_name="Utilisateur"
    )

    # statut: Champ avec des choix prédéfinis pour la cohérence.
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.EN_ATTENTE,
        verbose_name="Statut de l'abonnement"
    )

    start_date = models.DateField(verbose_name="Date de début")
    end_date = models.DateField(verbose_name="Date de fin")

    # created_at: Date de création, ajoutée automatiquement.
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")

    def __str__(self):
        # Affiche une représentation textuelle claire dans l'interface d'administration.
        return f"Abonnement de {self.user.username if self.user else 'N/A'} - {self.statut}"

    class Meta:
        verbose_name = "Abonnement"
        verbose_name_plural = "Abonnements"
        ordering = ['-created_at']