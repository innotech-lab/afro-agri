from django.db import models


class Champ(models.Model):
    SOURCE_EAU = [
        ('Forage', 'Forage'),
        ('Pluie', 'Pluie'),
        ('Irrigation', 'Irrigation'),
        ('Riviere', 'Riviere'),
    ]
    id_champ = models.AutoField(primary_key=True)
    superficie = models.FloatField(null=True, blank=True)
    source_eau = models.CharField(max_length=20, choices=SOURCE_EAU)
    longitude = models.FloatField()
    latitude = models.FloatField()
    image = models.ImageField(upload_to='soil_studies/', null=True, blank=True)
    date_analyse = models.DateField(db_column='date', null=True, blank=True)
    ph_sol = models.CharField(max_length=100, db_column='py_sol', null=True, blank=True)
    matiere_organique = models.CharField(max_length=100, null=True, blank=True)
    azote = models.CharField(max_length=100, null=True, blank=True)
    phosphore = models.CharField(max_length=100, null=True, blank=True)
    potassium = models.CharField(max_length=100, null=True, blank=True)
    humidite = models.CharField(max_length=100, null=True, blank=True)
    type_sol = models.CharField(max_length=100, null=True, blank=True)
    fertilite = models.CharField(max_length=100, null=True, blank=True)
    rapport_analyse = models.CharField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(db_column='created_at', auto_now=True)
    updated_at = models.DateTimeField(db_column='updated_at', null=True, blank=True)

    class Meta:
        db_table = 'champs'
        managed = True
