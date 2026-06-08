from django.urls import path
from .views import EtudeSolView

urlpatterns = [
    path('', EtudeSolView.as_view()),
]
