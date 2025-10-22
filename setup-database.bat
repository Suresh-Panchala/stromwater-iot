@echo off
ECHO ========================================
ECHO Creating StromWater Database
ECHO ========================================
ECHO.
ECHO This will create:
ECHO   - Database: stromwater_db
ECHO   - User: stromwater_user
ECHO   - Password: stromwater123
ECHO.
ECHO PostgreSQL password is: root
ECHO.

SET PGPASSWORD=root
psql -U postgres -f setup-database.sql

if %errorLevel% equ 0 (
    ECHO.
    ECHO ========================================
    ECHO Database Created Successfully!
    ECHO ========================================
    ECHO.
    ECHO Testing connection...
    SET PGPASSWORD=stromwater123
    psql -h localhost -U stromwater_user -d stromwater_db -c "SELECT 'Connection successful!' as status;"

    if %errorLevel% equ 0 (
        ECHO.
        ECHO [OK] Database is ready to use!
    )
) else (
    ECHO.
    ECHO [ERROR] Failed to create database
    ECHO Check if PostgreSQL is running
)

ECHO.
pause
