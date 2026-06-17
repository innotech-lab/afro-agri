from django.urls import path
from .views import (
    JournalPlanteView, JournalPlanteDetailView, PlantDiseaseGithubView,
    EnrichJournalPlanteView, JournalQuickCreateView,
    AnalyserImageView, ConfirmerIAView,
    ScanQRCodeView,
)

urlpatterns = [
    path('', JournalPlanteView.as_view()),
    path('<int:pk>/', JournalPlanteDetailView.as_view()),
    path('quick-create/', JournalQuickCreateView.as_view()),
    path('analyser-image/', AnalyserImageView.as_view()),
    path('scan/<str:code>/', ScanQRCodeView.as_view()),
    path('plant-diseases/', PlantDiseaseGithubView.as_view()),
    path('<int:pk>/enrich/', EnrichJournalPlanteView.as_view()),
    path('<int:pk>/confirmer-ia/', ConfirmerIAView.as_view()),
]
