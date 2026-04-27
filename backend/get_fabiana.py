import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'melmac.settings')
django.setup()

from api.models import User_Enterprise
from api.encrypt import Encrypt

target_email = 'fabiana@tuproyecto.com'
users = User_Enterprise.objects.filter(email=target_email)

if users.exists():
    user = users.first()
    crypt = Encrypt()
    
    try:
        # Try to decode the existing hash if it's reversible
        if hasattr(crypt, 'decrypt_code'):
            password = crypt.decrypt_code(user.password)
            print(f"[{target_email}] RECOVERED PASSWORD: {password}")
        else:
            raise Exception("No decryption method")
    except:
        # If hash is irreversible (e.g. Argon2/PBKDF2), force a reset to admin123
        new_pass = 'admin123'
        user.password = crypt.encrypt_code(new_pass)
        user.login_state = True
        user.login_count = 0
        user.save()
        print(f"[{target_email}] FORCED NEW PASSWORD: {new_pass}")
else:
    print(f"USER NOT FOUND: {target_email}")
