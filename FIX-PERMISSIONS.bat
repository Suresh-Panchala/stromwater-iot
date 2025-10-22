@echo off
ECHO ========================================
ECHO Fixing Database Permissions
ECHO ========================================
ECHO.
ECHO This will grant stromwater_user full access
ECHO to all tables in the database.
ECHO.

SET PGPASSWORD=root
psql -U postgres -d stromwater_db -f fix-permissions.sql

if %errorLevel% equ 0 (
    ECHO.
    ECHO ========================================
    ECHO [SUCCESS] Permissions Fixed!
    ECHO ========================================
    ECHO.
    ECHO Now restart the backend:
    ECHO   1. Stop backend (Ctrl+C)
    ECHO   2. Run: start-backend.bat
    ECHO.
) else (
    ECHO.
    ECHO [ERROR] Failed to fix permissions
)

ECHO.
pause
