from django.db import models
from plantes.models import Plante
from users.models import User


class JournalPlante(models.Model):
    id_journal = models.AutoField(primary_key=True)
    id_plante = models.ForeignKey(Plante, db_column='id_plante', on_delete=models.CASCADE)
    date_observation = models.DateField()
    stade_croissance = models.CharField(max_length=100)
    symptomes = models.CharField(max_length=150)
    ravageur_suspecte = models.CharField(max_length=150)
    maladie_suspecte = models.CharField(max_length=150)
    id_user = models.ForeignKey(User, db_column='id_user', on_delete=models.CASCADE)
    session_uuid = models.CharField(max_length=150)
    longitude = models.FloatField()
    latitude = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'journal_plante'
        managed = False
