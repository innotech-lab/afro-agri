from django.db import models
from type_user.models import TypeUser


class User(models.Model):
    id_user = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=50, null=True, blank=True)
    prenom = models.CharField(max_length=50)
    id_type = models.ForeignKey(TypeUser, db_column='id_type', on_delete=models.CASCADE)
    email = models.CharField(max_length=50, unique=True)
    password = models.CharField(max_length=200)
    created_date = models.DateTimeField(auto_now=True)
    update_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'users'
        managed = False
