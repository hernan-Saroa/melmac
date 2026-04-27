import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

missing_columns = [
    ("api_answer_form", "fill_out", "VARCHAR(255)"),
    ("api_digital_field", "answer_value", "TEXT"),
    ("api_enterprise", "main_title", "VARCHAR(255)"),
    ("api_env_digital_field", "assign_name_pdf", "VARCHAR(255)"),
    ("api_envelope_enterprise", "view_option", "VARCHAR(255)"),
    ("api_envelope_version", "alert_send", "BOOLEAN"),
    ("api_field_user", "share", "BOOLEAN"),
    ("api_massive_zip_pdf", "name", "VARCHAR(255)"),
    ("api_sms_token", "phone_ind", "VARCHAR(50)"),
    ("api_system_log", "extra", "TEXT"),
    ("api_type_identification", "acronym", "VARCHAR(50)")
]

try:
    conn = psycopg2.connect(dbname='melmac_pre', user='postgres', password='admin123', host='127.0.0.1', port='5432')
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    
    for table, column, datatype in missing_columns:
        print(f"Adding {column} to {table}...")
        try:
            cur.execute(f"ALTER TABLE public.{table} ADD COLUMN IF NOT EXISTS {column} {datatype} NULL;")
            print(f"Success: {table}.{column}")
        except Exception as e:
            print(f"Failed to alter {table}: {e}")
            
    print("Truncating native Django tables to prevent duplicate IDs...")
    cur.execute("TRUNCATE django_content_type RESTART IDENTITY CASCADE;")
    cur.execute("TRUNCATE auth_permission RESTART IDENTITY CASCADE;")
    cur.execute("TRUNCATE django_migrations RESTART IDENTITY CASCADE;")
    print("Truncation successful!")
            
    cur.close()
    conn.close()
    print("Database patched successfully!")
except Exception as e:
    print("Connection error:", e)
