import os
import django
from django.db import connections

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'melmac.settings')
django.setup()

from api.models import Permit

old_conn = connections['melmac']
with old_conn.cursor() as cursor:
    cursor.execute("SELECT COUNT(*) FROM api_permit")
    row = cursor.fetchone()
    print(f"Total Permit Types in old 'melmac': {row[0]}")
