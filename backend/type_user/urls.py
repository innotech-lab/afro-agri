from django.urls import path
from .views import TypeUserView

urlpatterns = [
    path('', TypeUserView.as_view()),
]
