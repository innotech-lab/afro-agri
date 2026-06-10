from django.urls import path
from .views import DiagnosticImageView, DiagnosticHistoriqueView

urlpatterns = [
    path('analyser/', DiagnosticImageView.as_view()),
    path('historique/<int:id_journal>/', DiagnosticHistoriqueView.as_view()),
]
