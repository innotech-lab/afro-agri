from django.urls import path
from .views import JournalPlanteView, PlantDiseaseGithubView, EnrichJournalPlanteView, JournalQuickCreateView

urlpatterns = [
    path('', JournalPlanteView.as_view()),
    path('quick-create/', JournalQuickCreateView.as_view()),
    path('plant-diseases/', PlantDiseaseGithubView.as_view()),
    path('<int:pk>/enrich/', EnrichJournalPlanteView.as_view()),
]
