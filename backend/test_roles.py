import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'melmac.settings')
django.setup()

from api.models import User_Enterprise

try:
    user_enterprise_values = User_Enterprise.objects.filter(
        role_id=2,
    ).select_related(
        'enterprise'
    ).values(
        'id',
        'first_name',
        'first_last_name',
        'type_identification_id',
        'identification',
        'email',
        'phone',
        'enterprise_id',
        'enterprise__name',
        'enterprise__theme_id',
        'enterprise__state',
        'enterprise__max_users',
        'enterprise__visit_form',
        'login_state',
    )
    print("SUCCESS", list(user_enterprise_values))
except Exception as e:
    import traceback
    traceback.print_exc()

