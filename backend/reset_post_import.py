import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'melmac.settings')
django.setup()

from api.models import User_Enterprise
from api.encrypt import Encrypt

users = User_Enterprise.objects.filter(email='super@saroa.co')
if users.exists():
    user = users.first()
    new_password_encrypted = Encrypt().encrypt_code('admin123')
    user.password = new_password_encrypted
    user.login_state = True
    user.login_count = 0
    user.save()
    print("Pre-production SuperAdmin access successfully unlocked!")
else:
    print("Warning: super@saroa.co not found in pre-production dump.")
