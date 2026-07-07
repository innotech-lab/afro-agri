from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubscriptionViewSet

# Crée un routeur pour générer automatiquement les URLs CRUD
router = DefaultRouter()
router.register(r'', SubscriptionViewSet, basename='subscription')

urlpatterns = [
    path('', include(router.urls)),
]