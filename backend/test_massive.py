import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'melmac.settings')
django.setup()

from api.models import Massive_File

count = Massive_File.objects.filter(type=4).count()
print('Massive Files type 4 count:', count)
