@echo off
ECHO ========================================
ECHO Creating StromWater Database
ECHO ========================================
ECHO.
ECHO PostgreSQL password: root
ECHO.

SET PGPASSWORD=root

ECHO Creating database stromwater_db...
psql -U postgres -c "CREATE DATABASE stromwater_db;" 2>nul
if %errorLevel% equ 0 (
    ECHO [OK] Database created
) else (
    ECHO [INFO] Database may already exist
)

ECHO Creating user stromwater_user...
psql -U postgres -c "CREATE USER stromwater_user WITH ENCRYPTED PASSWORD 'stromwater123';" 2>nul
if %errorLevel% equ 0 (
    ECHO [OK] User created
) else (
    ECHO [INFO] User may already exist
)

ECHO Granting privileges...
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;"
psql -U postgres -c "ALTER DATABASE stromwater_db OWNER TO stromwater_user;"

ECHO.
ECHO Testing connection...
SET PGPASSWORD=stromwater123
psql -h localhost -U stromwater_user -d stromwater_db -c "SELECT 'Database ready!' as status;"

if %errorLevel% equ 0 (
    ECHO.
    ECHO ========================================
    ECHO [SUCCESS] Database is ready!
    ECHO ========================================
) else (
    ECHO.
    ECHO ========================================
    ECHO [ERROR] Database setup failed
    ECHO ========================================
)

ECHO.
pause
