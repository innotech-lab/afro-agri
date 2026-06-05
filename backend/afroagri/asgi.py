# Configuration ASGI pour le projet afroagri
# Utilisé pour les serveurs asynchrones (ex: Daphne, Uvicorn)
import os

from django.core.asgi import get_asgi_application

# Définit le module de configuration Django à utiliser
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'afroagri.settings')

# Point d'entrée ASGI exposé au serveur
application = get_asgi_application()
