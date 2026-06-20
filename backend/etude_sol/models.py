from django.db import models
from champs.models import Champ


class EtudeSol(models.Model):
    id_etude_sol = models.AutoField(primary_key=True, db_column='id_etude_sol')
    id_champ = models.ForeignKey(Champ, db_column='id_champ', on_delete=models.CASCADE)
    date_analyse = models.DateField(db_column='date')
    ph_sol = models.CharField(max_length=100, db_column='py_sol')
    matiere_organique = models.CharField(max_length=100)
    azote = models.CharField(max_length=100)
    phosphore = models.CharField(max_length=100)
    potassium = models.CharField(max_length=100)
    humidite = models.CharField(max_length=100)
    type_sol = models.CharField(max_length=100)
    fertilite = models.CharField(max_length=100)
    rapport_analyse = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'etude_sol'
        managed = True
