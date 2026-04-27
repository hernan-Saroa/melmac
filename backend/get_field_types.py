import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'melmac.settings')
django.setup()

from api.models import Field_Type

print("Field Types:")
for f in Field_Type.objects.all():
    print(f.id, f.name, f.description)
