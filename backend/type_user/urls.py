from django.urls import path
from .views import TypeUserView, TypeUserDetailView

urlpatterns = [
    path('', TypeUserView.as_view()),
    path('<int:pk>/', TypeUserDetailView.as_view()),
]
