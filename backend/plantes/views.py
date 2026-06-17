from django.utils import timezone
from rest_framework import viewsets
from .models import Plante
from .serializers import PlanteSerializer


class PlanteViewSet(viewsets.ModelViewSet):
    queryset = Plante.objects.all()
    serializer_class = PlanteSerializer
    lookup_field = 'id_plante'

    def get_queryset(self):
        qs = super().get_queryset()
        id_champ = self.request.query_params.get('id_champ')
        if id_champ:
            qs = qs.filter(id_champ=id_champ)
        return qs

    def perform_create(self, serializer):
        serializer.save(updated_at=timezone.now())

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())
