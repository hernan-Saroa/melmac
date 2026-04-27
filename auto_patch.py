import subprocess
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import re
import os

# print("Extracting plaintext SQL from binary dump...")
# subprocess.run([r"C:\Program Files\PostgreSQL\17\bin\pg_restore.exe", "-f", "dump_plain.sql", "melmac-pre.sql"])

print("Connecting to postgres to fetch live schema...")
conn = psycopg2.connect(dbname='melmac_pre', user='postgres', password='admin123', host='127.0.0.1', port='5432')
conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
cur = conn.cursor()

def get_live_columns(table_name):
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = %s;", (table_name,))
    return {row[0] for row in cur.fetchall()}

print("Reading dump_plain.sql and diffing COPY statements...")
copy_regex = re.compile(r"^COPY public\.([a-zA_Z0-9_]+)\s*\((.*?)\)\s*FROM stdin;$")

missing_columns_total = 0

with open("dump_plain.sql", "r", encoding="utf-8", errors="ignore") as f:
    for line in f:
        match = copy_regex.match(line.strip())
        if match:
            table_name = match.group(1)
            dump_columns = [c.strip().strip('"') for c in match.group(2).split(",")]
            
            live_columns = get_live_columns(table_name)
            
            # If the table exists
            if live_columns:
                for col in dump_columns:
                    if col not in live_columns:
                        print(f"Missing column in {table_name}: {col}")
                        try:
                            cur.execute(f'ALTER TABLE public."{table_name}" ADD COLUMN "{col}" TEXT NULL;')
                            missing_columns_total += 1
                        except Exception as e:
                            print(f"Failed to add {col} to {table_name}: {e}")

print(f"Successfully patched {missing_columns_total} missing columns!")
cur.close()
conn.close()

