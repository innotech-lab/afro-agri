from django.urls import path
from .views import JournalPlanteView

urlpatterns = [
    path('', JournalPlanteView.as_view()),
]
