set PGPASSWORD=admin123
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -h 127.0.0.1 -U postgres -d melmac_pre -f melmac-pre.sql > import.log 2> import_err.log
echo Finished executing
