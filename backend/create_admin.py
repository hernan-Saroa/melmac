import os
import django
import sys

# Configure django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'melmac.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

username = 'admin'
password = 'admin123'

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, f'{username}@example.com', password)
    print(f"Creado nuevo usuario: {username}")
else:
    u = User.objects.get(username=username)
    u.set_password(password)
    u.save()
    print(f"Contraseña actualizada para el usuario: {username}")
