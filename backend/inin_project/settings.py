"""
Django settings for inin_project project.
"""

from pathlib import Path
from datetime import timedelta
import os
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

SITE_URL = os.environ.get('SITE_URL', 'http://127.0.0.1:8000')

# ==============================================================================
# SÉCURITÉ
# ==============================================================================

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-$r5u2@6y3yustw=qj!@2q5o8!6v77+b7dq2f_yw6etjl!%$b&5')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = ["gestioninin.onrender.com", "localhost", "127.0.0.1"]

CORS_ALLOWED_ORIGINS = [
    "https://gestion-inin.vercel.app",  
    "http://localhost:5173",            
]


# ==============================================================================
# APPLICATIONS
# ==============================================================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Librairies tierces
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    # Application ININ
    'core',
]


# ==============================================================================
# MIDDLEWARE
# CorsMiddleware doit être placé AVANT CommonMiddleware
# ==============================================================================

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', 
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', 
    'django.contrib.sessions.middleware.SessionMiddleware',          
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'inin_project.urls'

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

WSGI_APPLICATION = 'inin_project.wsgi.application'


# ==============================================================================
# BASE DE DONNÉES - PostgreSQL
# ==============================================================================

DATABASES = {
    'default': dj_database_url.config(
        default='postgresql://postgres:careerguidance@localhost:5432/ININassociation',
        conn_max_age=600,
    )
}


# ==============================================================================
# MODÈLE UTILISATEUR PERSONNALISÉ
# Doit pointer vers notre User qui étend AbstractUser
# ==============================================================================

AUTH_USER_MODEL = 'core.User'


# ==============================================================================
# DJANGO REST FRAMEWORK
# ==============================================================================

REST_FRAMEWORK = {
    # Authentification par JWT (token Bearer dans le header Authorization)
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    # Par défaut, toutes les routes nécessitent une authentification
    # Les vues publiques surchargent avec AllowAny individuellement
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    # Pagination automatique des listes (20 éléments par page)
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    # Format de date ISO 8601 (ex: "2024-03-15")
    'DATE_FORMAT': '%Y-%m-%d',
    'DATETIME_FORMAT': '%Y-%m-%dT%H:%M:%S',
}


# ==============================================================================
# JWT - SIMPLE JWT
# ==============================================================================

SIMPLE_JWT = {
    # Durée de vie du token d'accès : 1 heure
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    # Durée de vie du token de rafraîchissement : 7 jours
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    # Générer un nouveau refresh token à chaque rafraîchissement
    'ROTATE_REFRESH_TOKENS': True,
    # Invalider l'ancien refresh token après rotation
    'BLACKLIST_AFTER_ROTATION': False,
    # Algorithme de signature
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    # Header HTTP attendu : Authorization: Bearer <token>
    'AUTH_HEADER_TYPES': ('Bearer',),
    # Champs retournés dans le token
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}


# ==============================================================================
# CORS - Autorisations cross-origin pour le frontend
# En développement, on autorise toutes les origines localhost
# ==============================================================================

# Origines autorisées à consommer l'API (frontend React/Vue/etc.)
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',   # React (Create React App)
    'http://localhost:5173',   # Vite / Vue
    'http://localhost:4200',   # Angular
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
]

# Autoriser les cookies et headers d'authentification cross-origin
CORS_ALLOW_CREDENTIALS = True

# Headers autorisés dans les requêtes cross-origin
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]


# ==============================================================================
# VALIDATION DES MOTS DE PASSE
# ==============================================================================

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# ==============================================================================
# INTERNATIONALISATION
# ==============================================================================

LANGUAGE_CODE = 'fr-fr'       # Interface admin en français
TIME_ZONE = 'Africa/Abidjan'  # Fuseau horaire Afrique de l'Ouest (UTC+0)
USE_I18N = True
USE_TZ = True


# ==============================================================================
# FICHIERS STATIQUES ET MÉDIAS
# ==============================================================================

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'   # Collecte pour la production (collectstatic)
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


FRONTEND_URL = os.environ.get('FRONTEND_URL')
if FRONTEND_URL:
    CORS_ALLOWED_ORIGINS.append(FRONTEND_URL)


    
# Fichiers uploadés par les utilisateurs (photos actions, justificatifs PDF, etc.)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


# ==============================================================================
# CLÉ PRIMAIRE PAR DÉFAUT
# ==============================================================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'