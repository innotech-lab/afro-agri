from django.db import models


class TypeUser(models.Model):
    id_type = models.AutoField(primary_key=True)
    type = models.CharField(max_length=50)

    class Meta:
        db_table = 'type_user'
        managed = True
