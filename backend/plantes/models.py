from django.db import models
from champs.models import Champ


class Plante(models.Model):
    id_plante = models.AutoField(primary_key=True)
    nom_plante = models.CharField(max_length=50)
    variete = models.CharField(max_length=50)
    date_plantation = models.DateField()
    id_champ = models.ForeignKey(Champ, db_column='id_champ', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now=True, db_column='updated_at')

    class Meta:
        db_table = 'plantes'
        managed = True
