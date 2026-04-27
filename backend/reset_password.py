import os
import django
import sys

# Configure django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'melmac.settings')
django.setup()

from api.models import User_Enterprise
from api.encrypt import Encrypt

email = 'super@saroa.co'
new_password = 'admin123'

try:
    users = User_Enterprise.objects.filter(email=email)
    
    if not users.exists():
        print(f"[{email}] ERROR: No se encontró este usuario en la base de datos.")
    else:
        password_enc = Encrypt().encrypt_code(new_password)
        for user in users:
            user.password = password_enc
            user.save()
            print(f"[{email}] (ID: {user.id}) Se actualizó la contraseña correctamente.")
        
except Exception as e:
    print(f"Error inesperado: {e}")
