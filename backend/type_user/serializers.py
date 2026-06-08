from rest_framework import serializers
from .models import TypeUser

class TypeUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeUser
        fields = '__all__'
