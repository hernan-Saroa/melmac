$ErrorActionPreference = "Continue"
$env:PGPASSWORD="admin123"

Write-Host "Dropping DB..."
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h 127.0.0.1 -U postgres -c "DROP DATABASE IF EXISTS melmac_pre WITH (FORCE);"
Write-Host "Creating DB..."
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h 127.0.0.1 -U postgres -c "CREATE DATABASE melmac_pre;"

cd backend
Write-Host "Migrating..."
.\venv\Scripts\python.exe manage.py migrate
cd ..

Write-Host "Patching..."
.\backend\venv\Scripts\python.exe patch_db.py

Write-Host "Adding missing columns..."
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h 127.0.0.1 -U postgres -d melmac_pre -c "ALTER TABLE api_enterprise ADD COLUMN IF NOT EXISTS logo_login TEXT NULL, ADD COLUMN IF NOT EXISTS footer_view TEXT NULL, ADD COLUMN IF NOT EXISTS public_color_button TEXT NULL, ADD COLUMN IF NOT EXISTS public_color_button_text TEXT NULL, ADD COLUMN IF NOT EXISTS public_color_text_description TEXT NULL, ADD COLUMN IF NOT EXISTS public_color_text_footer TEXT NULL, ADD COLUMN IF NOT EXISTS logo_wh TEXT NULL;"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h 127.0.0.1 -U postgres -d melmac_pre -c "ALTER TABLE api_digital_field ALTER COLUMN form_field_id DROP NOT NULL;"

Write-Host "Truncating default data..."
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h 127.0.0.1 -U postgres -d melmac_pre -c "TRUNCATE api_home_items, api_option, api_parameter, api_parameter_validate, api_permit, api_region, api_role, api_theme, api_profile, api_profile_image, api_field_type, api_sms_token RESTART IDENTITY CASCADE;"

Write-Host "Restoring Data..."
& "C:\Program Files\PostgreSQL\17\bin\pg_restore.exe" -h 127.0.0.1 -U postgres -d melmac_pre -a --disable-triggers melmac-pre.sql > import_restore.log 2> import_restore_err.log

Write-Host "DONE"
