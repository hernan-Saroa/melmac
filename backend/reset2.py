from api.models import User_Enterprise
from api.encrypt import Encrypt

try:
    u = User_Enterprise.objects.filter(email='super@saroa.co').first()
    if u:
        u.password = Encrypt().encrypt_code('admin123')
        u.login_state = True
        u.login_count = 0
        u.save()
        print("EXITO: Cuenta super@saroa.co DESBLOQUEADA y reseteada con Encrypt()")
    else:
        print("ERROR: NO SE ENCONTRO EL USUARIO")
except Exception as e:
    print("ERROR TOTAL:", str(e))
