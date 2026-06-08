from pathlib import Path

# Chemin de base du projet
BASE_DIR = Path(__file__).resolve().parent.parent

# Clé secrète utilisée pour la sécurité - ne jamais exposer en production
SECRET_KEY = 'django-insecure-!)phz(w%u=#q@$ck!2szakryyr!3jx7d5#x!ddqu_v98$9)^=%'

# Mode débogage - désactiver en production
DEBUG = True

# Hôtes autorisés à accéder au serveur
ALLOWED_HOSTS = []

# Applications installées dans le projet
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'users',
    'champs',
    'plantes',
    'journal',
    'etude_sol',
    'type_user',
]

# Middlewares exécutés à chaque requête
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Fichier principal des URLs du projet
ROOT_URLCONF = 'afroagri.urls'

# Configuration des templates HTML
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Application WSGI pour le déploiement
WSGI_APPLICATION = 'afroagri.wsgi.application'

# Configuration de la base de données MySQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',  # Moteur MySQL
        'NAME': 'afroagri',                     # Nom de la base de données
        'USER': 'root',                          # Utilisateur MySQL
        'PASSWORD': '',                          # Mot de passe MySQL
        'HOST': 'localhost',                     # Hôte de la base de données
        'PORT': '3306',                          # Port MySQL par défaut
        'OPTIONS': {
            'sql_mode': 'STRICT_TRANS_TABLES',   # Active le mode strict pour l'intégrité des données
        },
    }
}

# Validateurs de mot de passe pour la sécurité des comptes
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Langue par défaut de l'application
LANGUAGE_CODE = 'en-us'

# Fuseau horaire du serveur
TIME_ZONE = 'UTC'

# Activation de l'internationalisation
USE_I18N = True

# Activation des fuseaux horaires
USE_TZ = True

# URL pour les fichiers statiques (CSS, JS, images)
STATIC_URL = 'static/'
