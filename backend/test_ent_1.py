import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'melmac.settings')
django.setup()

from api.models import Permit_Enterprise

print('Total Permit_Enterprise rows:', Permit_Enterprise.objects.count())
print('Permit_Enterprise for Ent 1 (SA):', Permit_Enterprise.objects.filter(enterprise_id=1).count())
