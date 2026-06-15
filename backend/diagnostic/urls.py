from django.urls import path
from .views import DiagnosticListView, DiagnosticDetailView, DiagnosticImageView, DiagnosticHistoriqueView

urlpatterns = [
    path('', DiagnosticListView.as_view()),
    path('<int:pk>/', DiagnosticDetailView.as_view()),
    path('analyser/', DiagnosticImageView.as_view()),
    path('historique/<int:id_journal>/', DiagnosticHistoriqueView.as_view()),
]
