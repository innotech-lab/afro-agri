import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'afroagri.settings')
django.setup()

from type_user.models import TypeUser
from users.models import User
from django.contrib.auth.hashers import make_password

# Create types
admin_type, _ = TypeUser.objects.get_or_create(type='admin')
minister_type, _ = TypeUser.objects.get_or_create(type='minister')
agriculteur_type, _ = TypeUser.objects.get_or_create(type='agriculteur')

# Create users
User.objects.get_or_create(
    email='admin@kit-hub.com',
    defaults={
        'nom': 'admin',
        'prenom': 'kithub',
        'id_type': admin_type,
        'password': make_password('password')
    }
)

User.objects.get_or_create(
    email='admin@afroagri.com',
    defaults={
        'nom': 'admin',
        'prenom': 'afroagri',
        'id_type': agriculteur_type,
        'password': make_password('admin')
    }
)

User.objects.get_or_create(
    email='minister@afroagri.com',
    defaults={
        'nom': 'minister',
        'prenom': 'afroagri',
        'id_type': minister_type,
        'password': make_password('minister')
    }
)

print("Data seeded successfully!")
