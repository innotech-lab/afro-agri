from django.urls import path
from .views import EtudeSolView, EtudeSolDetailView

urlpatterns = [
    path('', EtudeSolView.as_view()),
    path('<int:pk>/', EtudeSolDetailView.as_view()),
]
