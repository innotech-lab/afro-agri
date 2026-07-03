from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProvinceViewSet, CommuneViewSet, ZoneViewSet

router = DefaultRouter()
router.register(r'provinces', ProvinceViewSet, basename='province')
router.register(r'communes', CommuneViewSet, basename='commune')
router.register(r'zones', ZoneViewSet, basename='zone')

urlpatterns = [
    path('', include(router.urls)),
]
