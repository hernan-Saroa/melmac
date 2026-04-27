import subprocess

try:
    print("Importing SQL dump into melmac_pre... (with explicit IPv4 host)")
    result = subprocess.run(
        [r"C:\Program Files\PostgreSQL\17\bin\psql.exe", "-h", "127.0.0.1", "-U", "postgres", "-d", "melmac_pre", "-f", "melmac-pre.sql"],
        env={"PGPASSWORD": "admin123"},
        capture_output=True,
        text=True
    )
    
    print("Import exit code:", result.returncode)
    print("STDOUT:", result.stdout[:500])
    print("STDERR:", result.stderr[:500])
except Exception as e:
    print("Error:", e)
