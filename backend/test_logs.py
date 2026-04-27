import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'melmac.settings')
django.setup()

from api.models import System_Log

print('Total System Logs in melmac_pre:', System_Log.objects.count())
