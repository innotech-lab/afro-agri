from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """
    Configuration de l'interface d'administration pour les paiements.
    """
    list_display = ('id', 'user', 'subscription', 'montant', 'statut', 'paid_at', 'created_at')
    list_filter = ('statut', 'created_at', 'paid_at')
    search_fields = ('user__username', 'user__email', 'subscription__id')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)

    # Utiliser raw_id_fields est efficace pour les clés étrangères avec beaucoup d'entrées
    raw_id_fields = ('user', 'subscription')
