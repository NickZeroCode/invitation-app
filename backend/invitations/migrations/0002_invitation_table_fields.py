from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("invitations", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="invitation",
            name="table_number",
            field=models.CharField(blank=True, default="", max_length=32, verbose_name="numéro de table"),
        ),
        migrations.AddField(
            model_name="invitation",
            name="table_text",
            field=models.CharField(blank=True, default="", max_length=255, verbose_name="texte de table"),
        ),
    ]
