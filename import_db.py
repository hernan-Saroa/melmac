import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import subprocess

try:
    conn = psycopg2.connect(dbname='postgres', user='postgres', password='admin123', host='127.0.0.1', port='5432')
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    
    cur.execute("SELECT 1 FROM pg_database WHERE datname = 'melmac_pre';")
    if not cur.fetchone():
        cur.execute('CREATE DATABASE melmac_pre;')
        print("Created database melmac_pre")
    else:
        print("Database melmac_pre already exists")
    
    cur.close()
    conn.close()
    
    print("Importing SQL dump into melmac_pre...")
    subprocess.run([r"C:\Program Files\PostgreSQL\17\bin\psql.exe", "-U", "postgres", "-d", "melmac_pre", "-f", "melmac-pre.sql"], env={"PGPASSWORD": "admin123"})
    print("Import completed!")
except Exception as e:
    print("Error:", e)
