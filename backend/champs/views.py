from django.utils import timezone
from rest_framework import viewsets
from .models import Champ
from .serializers import ChampSerializer


class ChampViewSet(viewsets.ModelViewSet):
    queryset = Champ.objects.all()
    serializer_class = ChampSerializer
    lookup_field = 'id_champ'

    def perform_create(self, serializer):
        serializer.save(updated_at=timezone.now())

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())
