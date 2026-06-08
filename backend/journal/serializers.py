from rest_framework import serializers
from .models import JournalPlante

class JournalPlanteSerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalPlante
        fields = '__all__'
