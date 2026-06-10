from rest_framework import serializers
from .models import DiagnosticResult


class DiagnosticResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiagnosticResult
        fields = '__all__'
