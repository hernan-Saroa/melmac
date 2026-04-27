import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'melmac.settings')
django.setup()

from django.test import RequestFactory
from api.controllers.enterprise import EnterpriseAttempt
from api.models import User_Enterprise

# Find a superadmin
user_ent = User_Enterprise.objects.filter(role_id=1).first()

factory = RequestFactory()
request = factory.get('/api/enterprise/attempts/1')
request.user = user_ent.user
request.auth = type('obj', (object,), {'key': user_ent.token})

view = EnterpriseAttempt.as_view()
response = view(request, pk=1)

print("GET RESPONSE:", response.status_code, response.data)
