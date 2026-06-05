# Configuration WSGI pour le projet afroagri
# Utilisé pour les serveurs synchrones (ex: Gunicorn, Apache)
import os

from django.core.wsgi import get_wsgi_application

# Définit le module de configuration Django à utiliser
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'afroagri.settings')

# Point d'entrée WSGI exposé au serveur
application = get_wsgi_application()
