from rest_framework import serializers
from .models import EtudeSol

class EtudeSolSerializer(serializers.ModelSerializer):
    class Meta:
        model = EtudeSol
        fields = '__all__'
