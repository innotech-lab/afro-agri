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
    created_at = models.DateTimeField(db_column='created_at', auto_now=True)
    updated_at = models.DateTimeField(db_column='updated_at', null=True, blank=True)

    class Meta:
        db_table = 'champs'
        managed = True
