@echo off
ECHO ========================================
ECHO Fixing Database Permissions (V2)
ECHO ========================================
ECHO.
ECHO This will grant stromwater_user full access
ECHO to all tables in the database.
ECHO.

SET PGPASSWORD=root

ECHO Step 1: Granting privileges to stromwater_user...
psql -U postgres -d stromwater_db -c "GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;"
psql -U postgres -d stromwater_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO stromwater_user;"
psql -U postgres -d stromwater_db -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO stromwater_user;"

ECHO.
ECHO Step 2: Changing table ownership...
psql -U postgres -d stromwater_db -c "ALTER TABLE users OWNER TO stromwater_user;"
psql -U postgres -d stromwater_db -c "ALTER TABLE devices OWNER TO stromwater_user;"
psql -U postgres -d stromwater_db -c "ALTER TABLE device_data OWNER TO stromwater_user;"
psql -U postgres -d stromwater_db -c "ALTER TABLE alerts OWNER TO stromwater_user;"
psql -U postgres -d stromwater_db -c "ALTER TABLE refresh_tokens OWNER TO stromwater_user;"

ECHO.
ECHO Step 3: Setting default privileges...
psql -U postgres -d stromwater_db -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO stromwater_user;"
psql -U postgres -d stromwater_db -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO stromwater_user;"

ECHO.
ECHO Step 4: Verifying permissions...
psql -U postgres -d stromwater_db -c "SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public';"

ECHO.
ECHO ========================================
ECHO [SUCCESS] Permissions Fixed!
ECHO ========================================
ECHO.
ECHO Now restart the backend:
ECHO   1. Stop backend (Ctrl+C)
ECHO   2. Run: start-backend.bat
ECHO.
pause
