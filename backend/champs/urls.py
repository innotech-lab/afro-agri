from django.urls import path
from .views import ChampView

urlpatterns = [
    path('', ChampView.as_view()),
]
