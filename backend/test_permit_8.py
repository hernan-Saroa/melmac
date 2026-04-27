import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'melmac.settings')
django.setup()

from api.models import Permit, Permit_Enterprise

print('Permit 8 exists:', Permit.objects.filter(id=8).exists())
print('Ent 1 has Permit 8:', Permit_Enterprise.objects.filter(enterprise_id=1, permit_type_id=8).exists())

for i, p in enumerate(Permit_Enterprise.objects.filter(enterprise_id=1)):
    if i < 5: print(p.id, p.permit_type_id, p.status)
