from django.urls import path
from .views import (
    JournalPlanteView, PlantDiseaseGithubView,
    EnrichJournalPlanteView, JournalQuickCreateView,
    AnalyserImageView, ConfirmerIAView,
)

urlpatterns = [
    path('', JournalPlanteView.as_view()),
    path('quick-create/', JournalQuickCreateView.as_view()),
    path('analyser-image/', AnalyserImageView.as_view()),
    path('plant-diseases/', PlantDiseaseGithubView.as_view()),
    path('<int:pk>/enrich/', EnrichJournalPlanteView.as_view()),
    path('<int:pk>/confirmer-ia/', ConfirmerIAView.as_view()),
]
