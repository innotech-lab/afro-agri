from django.db import models


class Province(models.Model):
    id_province = models.AutoField(primary_key=True)
    nom_province = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'province'


class Commune(models.Model):
    id_commune = models.AutoField(primary_key=True)
    id_province = models.ForeignKey(Province, on_delete=models.CASCADE, db_column='id_province')
    nom_commune = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'commune'


class Zone(models.Model):
    id_zone = models.AutoField(primary_key=True)
    id_commune = models.ForeignKey(Commune, on_delete=models.CASCADE, db_column='id_commune')
    nom_zone = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'zone'
