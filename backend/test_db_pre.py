import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'melmac.settings')
django.setup()

from api.models import Enterprise, User_Enterprise

print("Total Enterprises in melmac_pre:", Enterprise.objects.count())
print("Total Users in melmac_pre:", User_Enterprise.objects.count())
