import psycopg2
try:
    psycopg2.connect("dbname=melmac_pre user=postgres password=admin123 host=127.0.0.1 port=5432")
    print("SUCCESS")
except Exception as e:
    print("FAILED")
    print(repr(e))
    for a in e.args:
        if isinstance(a, bytes):
            print(a.decode('cp1252', 'ignore'))
