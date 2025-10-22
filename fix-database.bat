@echo off
ECHO ========================================
ECHO Fixing Database Schema
ECHO ========================================
ECHO.
ECHO This will drop and recreate the database tables.
ECHO Your admin user will remain, but device data will be cleared.
ECHO.
pause

cd backend

ECHO.
ECHO Reinitializing database...
call npm run init-db

if %errorLevel% equ 0 (
    ECHO.
    ECHO ========================================
    ECHO [SUCCESS] Database fixed!
    ECHO ========================================
    ECHO.
    ECHO Default admin credentials:
    ECHO   Username: admin
    ECHO   Password: admin123
    ECHO.
    ECHO Now restart the backend server:
    ECHO   1. Close the current backend terminal (Ctrl+C)
    ECHO   2. Run: start-backend.bat
    ECHO   3. Run: start-simulator.bat
    ECHO.
) else (
    ECHO.
    ECHO [ERROR] Failed to reinitialize database
    ECHO Check the error messages above
)

ECHO.
pause
