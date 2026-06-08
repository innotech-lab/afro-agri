from django.urls import path
from .views import PlanteView

urlpatterns = [
    path('', PlanteView.as_view()),
]
