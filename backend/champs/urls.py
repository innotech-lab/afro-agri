from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChampViewSet

router = DefaultRouter()
router.register(r'', ChampViewSet, basename='champ')

urlpatterns = [
    path('', include(router.urls)),
]
