from django.urls import path
from .views import (
    EtudeSolView,
    EtudeSolDetailView,
    AnalyserEtudeSolView,
    ExtraireDonneesSolView,
)

urlpatterns = [
    path('', EtudeSolView.as_view()),
    path('<int:pk>/', EtudeSolDetailView.as_view()),
    path('analyser/', AnalyserEtudeSolView.as_view()),
    path('extraire-donnees/', ExtraireDonneesSolView.as_view()),
]