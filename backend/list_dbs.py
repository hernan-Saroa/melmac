import psycopg2
try:
    conn = psycopg2.connect(dbname='postgres', user='postgres', password='admin123', host='127.0.0.1', port='5432')
    cur = conn.cursor()
    cur.execute('SELECT datname FROM pg_database WHERE datistemplate = false;')
    print("Databases:", [row[0] for row in cur.fetchall()])
except Exception as e:
    print("Error connecting to postgres:", e)
