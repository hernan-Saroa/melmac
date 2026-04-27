import os
import django
import psycopg2

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'melmac.settings')
django.setup()

from api.models import Permit, Permit_Enterprise

try:
    conn = psycopg2.connect(
        dbname="melmac",
        user="postgres",
        password="123",
        host="127.0.0.1",
        port="5432"
    )
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, view FROM api_permit")
    rows = cursor.fetchall()
    print(f"Total Permits in old 'melmac': {len(rows)}")
    
    if len(rows) > 0 and Permit.objects.count() == 0:
        for r in rows:
            # r[0]=id, r[1]=name, r[2]=view (or maybe code?)
            # I will just create the Permits.
            Permit.objects.get_or_create(id=r[0], name=r[1], view=r[2])
        print(f"Inserted {len(rows)} Permits")
    conn.close()
    
    # Now that we have Permits, recreate Permit_Enterprise for ent 11
    enterprise_admin = 11
    if Permit_Enterprise.objects.filter(enterprise_id=enterprise_admin).count() == 0:
        for pt in Permit.objects.all():
            Permit_Enterprise.objects.create(
                permit_type=pt,
                enterprise_id=enterprise_admin,
                name=pt.name,
                description=pt.name,
                status=False
            )
        print("Default Permit_Enterprises created successfully for ent 11!")
    
except Exception as e:
    print("Error:", e)
