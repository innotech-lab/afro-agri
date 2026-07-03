from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import User
from type_user.models import TypeUser


class TypeUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeUser
        fields = ['id_type', 'type']


class UserSerializer(serializers.ModelSerializer):
    id_type = TypeUserSerializer(read_only=True)
    id_type_id = serializers.PrimaryKeyRelatedField(
        queryset=TypeUser.objects.all(), source='id_type', write_only=True
    )

    class Meta:
        model = User
        fields = ['id_user', 'nom', 'prenom', 'email', 'password',
                  'created_at', 'updated_at', 'id_type', 'id_type_id']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().update(instance, validated_data)
