import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'melmac.settings')
django.setup()

from api.models import Permit_Enterprise, User_Enterprise, Permit, Enterprise
from api.util import group_view_keys

enterprise_admin = 11

permits = Permit_Enterprise.objects.filter(enterprise_id=enterprise_admin)
print(f"Total permits for Enterprise 11: {permits.count()}")

if permits.count() == 0:
    print("Creating default permits for Enterprise 11...")
    print(f"Total Permit Types in System: {Permit.objects.count()}")
    for pt in Permit.objects.all():
        Permit_Enterprise.objects.create(
            permit_type=pt,
            enterprise_id=enterprise_admin,
            name=pt.name,
            description=pt.description,
            status=False
        )
    print("Default permits created successfully!")
else:
    print("Permits already exist.")
