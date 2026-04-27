set PGPASSWORD=admin123
"C:\Program Files\PostgreSQL\17\bin\pg_restore.exe" -h 127.0.0.1 -U postgres -d melmac_pre "melmac-pre.sql" > import_restore.log 2> import_restore_err.log
echo Finished executing
