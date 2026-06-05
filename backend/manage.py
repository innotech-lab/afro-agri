#!/usr/bin/env python
# Point d'entrée principal pour les commandes Django (ex: migrate, runserver)
import os
import sys


def main():
    # Définit le fichier de configuration Django à utiliser
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'afroagri.settings')
    try:
        # Importe le gestionnaire de commandes Django
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        # Erreur si Django n'est pas installé ou l'environnement virtuel n'est pas activé
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    # Exécute la commande passée en argument
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
