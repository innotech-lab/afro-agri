from django.db import models
from champs.models import Champ


class EtudeSol(models.Model):
    id_etude = models.AutoField(primary_key=True, db_column='id_etude_sol') # Nommé id_etude en DB
    id_champ = models.ForeignKey(Champ, db_column='id_champ', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='soil_studies/', db_column='image_sol', null=True, blank=True)
    date_analyse = models.DateField(db_column='date_analyse') # Nommé date_analyse en DB
    ph_sol = models.CharField(max_length=100, db_column='ph_sol') # Nommé ph_sol en DB
    matiere_organique = models.CharField(max_length=100)
    azote = models.CharField(max_length=100)
    phosphore = models.CharField(max_length=100)
    potassium = models.CharField(max_length=100)
    humidite = models.CharField(max_length=100, db_column='himidite') # Erreur de frappe en DB: himidite
    type_sol = models.CharField(max_length=100)
    fertilite = models.CharField(max_length=100)
    rapport_analyse = models.TextField() # C'est un champ TEXT en DB
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'etude_sol'
        managed = True
