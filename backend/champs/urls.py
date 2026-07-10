from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChampViewSet, ChampAnalyserView

router = DefaultRouter()
router.register(r'', ChampViewSet, basename='champ')

urlpatterns = [
    path('analyser/', ChampAnalyserView.as_view()),
    path('', include(router.urls)),
]
