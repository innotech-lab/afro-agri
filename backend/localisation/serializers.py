from rest_framework import serializers
from .models import Province, Commune, Zone


class ProvinceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Province
        fields = '__all__'
        read_only_fields = ['id_province', 'created_at', 'updated_at']


class CommuneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commune
        fields = '__all__'
        read_only_fields = ['id_commune', 'created_at', 'updated_at']


class ZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zone
        fields = '__all__'
        read_only_fields = ['id_zone', 'created_at', 'updated_at']
