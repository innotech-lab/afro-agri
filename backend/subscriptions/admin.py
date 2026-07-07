from django.contrib import admin
from .models import Subscription

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    """
    Configuration de l'interface d'administration pour le modèle Subscription.
    """
    list_display = ('user', 'statut', 'start_date', 'end_date', 'created_at')
    list_filter = ('statut', 'start_date', 'end_date')
    search_fields = ('user__username', 'user__email')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
