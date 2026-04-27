from django.contrib.auth import get_user_model

try:
    User = get_user_model()
    
    # Check if hernan exists
    user = User.objects.filter(email='hernan@saroa.co').first()
    if not user:
        user = User.objects.filter(username='hernan@saroa.co').first()
    
    if user:
        user.set_password('admin123')
        user.save()
        print("EXITO: Se encontro hernan@saroa.co y se actualizo la clave a admin123")
    else:
        # Create it if not exists!
        try:
            print("INFO: Creando hernan@saroa.co como superusuario activo...")
            User.objects.create_superuser(email='hernan@saroa.co', username='hernan@saroa.co', password='admin123')
            print("EXITO: Cuenta creada con correo hernan@saroa.co y clave admin123")
        except Exception as e:
            print("ERROR CREANDO SUPERUSER:", str(e))
            # Just fetch an admin user and reset their password
            admin = User.objects.filter().first()
            if admin:
                admin.set_password('admin123')
                admin.save()
                print(f"ALTERNATIVA: No se pudo crear. Usa este usuario en vez: {admin.email} / admin123")
except Exception as e:
    print("ERROR TOTAL:", str(e))
