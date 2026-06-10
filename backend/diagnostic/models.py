from django.db import models
from journal.models import JournalPlante


class DiagnosticResult(models.Model):
    id_diagnostic = models.AutoField(primary_key=True)
    id_journal = models.ForeignKey(JournalPlante, db_column='id_journal', on_delete=models.CASCADE, related_name='diagnostics')
    image = models.ImageField(upload_to='diagnostics/')
    maladie_detectee = models.CharField(max_length=200)
    confiance = models.FloatField()  # score de confiance IA en %
    ravageur_detecte = models.CharField(max_length=200, blank=True)
    traitement_suggere = models.TextField(blank=True)
    source_github = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'diagnostic_result'
