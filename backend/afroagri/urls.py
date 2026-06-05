# Fichier de configuration des URLs du projet afroagri
from django.contrib import admin
from django.urls import path

# Liste des routes URL disponibles dans l'application
urlpatterns = [
    # Route vers l'interface d'administration Django
    path('admin/', admin.site.urls),
]
