import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'melmac.settings')
django.setup()

from api.models import Enterprise, User_Enterprise

print("Total Enterprises:", Enterprise.objects.count())
print("All Enterprises:", list(Enterprise.objects.all().values('id', 'name')))
print("Users attached to Ent 1:", User_Enterprise.objects.filter(enterprise_id=1).count())
