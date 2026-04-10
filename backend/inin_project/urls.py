"""
inin_project/urls.py - Configuration principale des URLs du projet ININ
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from rest_framework_simplejwt.views import TokenObtainPairView

from core.serializers import CustomTokenObtainPairSerializer


# ── Vue JWT personnalisée ─────────────────────────────────────
# Hérite de TokenObtainPairView et utilise notre serializer enrichi.
# Retourne access, refresh + email, first_name, last_name, role, photo_profil.

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


urlpatterns = [
    # ── Administration Django ──────────────────────────────────
    path('admin/', admin.site.urls),

    # ── Authentification JWT ───────────────────────────────────
    # ✅ /api/auth/token/ → vue personnalisée (renvoie les infos user en plus)
    path('api/auth/token/',         CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(),          name='token_refresh'),
    path('api/auth/token/verify/',  TokenVerifyView.as_view(),           name='token_verify'),

    # ── Application principale ─────────────────────────────────
    path('api/', include('core.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,   document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL,  document_root=settings.STATIC_ROOT)