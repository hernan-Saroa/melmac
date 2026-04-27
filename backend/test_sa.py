import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'melmac.settings')
django.setup()

from api.models import User_Enterprise

# Find anyone with role_id == 1
# And check fabiana@tuproyecto.com
sa_users = User_Enterprise.objects.filter(role_id=1)
for sa in sa_users:
    print(f"SuperAdmin: {sa.user.email}, Ent ID: {sa.enterprise_id}")

try:
    fabiana = User_Enterprise.objects.get(user__email="fabiana@tuproyecto.com")
    print(f"Fabiana: {fabiana.user.email}, Role ID: {fabiana.role_id}, Ent ID: {fabiana.enterprise_id}")
except Exception as e:
    print(e)
