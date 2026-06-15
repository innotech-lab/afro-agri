from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlanteViewSet

router = DefaultRouter()
router.register(r'', PlanteViewSet, basename='plante')

urlpatterns = [
    path('', include(router.urls)),
]
