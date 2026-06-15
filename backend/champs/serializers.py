from rest_framework import serializers
from .models import Champ

class ChampSerializer(serializers.ModelSerializer):
    class Meta:
        model = Champ
        fields = '__all__'
        read_only_fields = ['id_champ', 'created_at', 'updated_at']