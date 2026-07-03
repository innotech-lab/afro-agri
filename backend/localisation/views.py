from django.utils import timezone
from rest_framework import viewsets
from .models import Province, Commune, Zone
from .serializers import ProvinceSerializer, CommuneSerializer, ZoneSerializer


class ProvinceViewSet(viewsets.ModelViewSet):
    queryset = Province.objects.all()
    serializer_class = ProvinceSerializer
    lookup_field = 'id_province'

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())


class CommuneViewSet(viewsets.ModelViewSet):
    queryset = Commune.objects.all()
    serializer_class = CommuneSerializer
    lookup_field = 'id_commune'

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())


class ZoneViewSet(viewsets.ModelViewSet):
    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer
    lookup_field = 'id_zone'

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())
