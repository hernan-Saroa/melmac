import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'melmac.settings')
django.setup()

from api.models import Permit_Enterprise, Permit, Enterprise

total_enterprises = Enterprise.objects.count()
print(f"Total Enterprises: {total_enterprises}")
all_permits = list(Permit.objects.all())

total_created = 0

for ent in Enterprise.objects.all():
    # Only create if they are missing
    if Permit_Enterprise.objects.filter(enterprise_id=ent.id).count() < len(all_permits):
        for pt in all_permits:
            # We use get_or_create to prevent duplicate crashes
            obj, created = Permit_Enterprise.objects.get_or_create(
                permit_type=pt,
                enterprise_id=ent.id,
                defaults={
                    'name': pt.name,
                    'description': pt.name,
                    'status': True if ent.id == 1 else False # True for SA
                }
            )
            if created:
                total_created += 1

print(f"Successfully generated {total_created} missing Permit_Enterprise mappings for all workspaces.")
