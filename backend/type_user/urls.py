from django.urls import path
from .views import TypeUserView

urlpatterns = [
    path('', TypeUserView.as_view(), name='type-user-list'),
    path('<int:pk>/', TypeUserView.as_view(), name='type-user-detail'),
]
