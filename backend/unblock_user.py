import os
import django
import sys

# Configure django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'melmac.settings')
django.setup()

from api.models import User_Enterprise

email = 'super@saroa.co'

try:
    # First, let's try to get the user
    # Login might fail because login_state = False or login_count >= 3
    users = User_Enterprise.objects.filter(email=email)
    
    if not users.exists():
        print(f"[{email}] ERROR: No se encontró este usuario en la base de datos.")
    else:
        for user in users:
            updates = []
            
            if hasattr(user, 'login_state') and not user.login_state:
                user.login_state = True
                updates.append("login_state=True")
                
            if hasattr(user, 'login_count') and user.login_count > 0:
                user.login_count = 0
                updates.append("login_count=0")
                
            if hasattr(user, 'state') and not user.state:
                user.state = True
                updates.append("state=True")

            if updates:
                user.save()
                print(f"[{email}] (ID: {user.id}) La cuenta fue desbloqueada. Cambios realizados: {', '.join(updates)}")
            else:
                print(f"[{email}] (ID: {user.id}) La cuenta existe, pero no parece estar bloqueada según los campos de la app (login_state={getattr(user, 'login_state', 'N/A')}).")
        
except Exception as e:
    print(f"Error inesperado: {e}")
