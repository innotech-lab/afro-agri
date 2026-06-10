from django.urls import path
from .views import ChampListCreateView, ChampDetailView

urlpatterns = [
    path('', ChampListCreateView.as_view()),
    path('<int:id_champ>/', ChampDetailView.as_view()),
]
