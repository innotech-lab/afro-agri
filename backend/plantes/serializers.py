from rest_framework import serializers
from .models import Plante
from champs.models import Champ


class PlanteSerializer(serializers.ModelSerializer):
    id_champ = serializers.PrimaryKeyRelatedField(queryset=Champ.objects.all())

    class Meta:
        model = Plante
        fields = ['id_plante', 'id_champ', 'nom_plante', 'variete', 'date_plantation', 'created_at', 'updated_at']
        read_only_fields = ['id_plante', 'created_at', 'updated_at']
