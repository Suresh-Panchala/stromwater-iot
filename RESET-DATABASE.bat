@echo off
COLOR 0C
ECHO ========================================
ECHO WARNING: Database Reset
ECHO ========================================
ECHO.
ECHO This will:
ECHO   - DROP all existing tables
ECHO   - DELETE all data (devices, users, etc.)
ECHO   - Recreate tables with correct schema
ECHO   - Recreate admin user
ECHO.
ECHO PostgreSQL password: root
ECHO.
set /p CONFIRM="Are you sure? Type YES to continue: "

if /i not "%CONFIRM%"=="YES" (
    ECHO.
    ECHO Cancelled.
    pause
    exit /b 0
)

ECHO.
ECHO ========================================
ECHO Step 1: Resetting Database Schema
ECHO ========================================
ECHO.

SET PGPASSWORD=root
psql -U postgres -d stromwater_db -f reset-database.sql

if %errorLevel% neq 0 (
    ECHO [ERROR] Failed to reset schema
    pause
    exit /b 1
)

ECHO.
ECHO ========================================
ECHO Step 2: Creating Admin User
ECHO ========================================
ECHO.

cd backend
call npm run init-db

if %errorLevel% neq 0 (
    ECHO [ERROR] Failed to create admin user
    cd ..
    pause
    exit /b 1
)

cd ..

ECHO.
ECHO ========================================
ECHO SUCCESS! Database Reset Complete
ECHO ========================================
ECHO.
ECHO Default admin credentials:
ECHO   Username: admin
ECHO   Password: admin123
ECHO.
ECHO ========================================
ECHO Next Steps:
ECHO ========================================
ECHO.
ECHO 1. STOP the backend (Ctrl+C in backend terminal)
ECHO 2. Run: start-backend.bat
ECHO 3. Run: start-simulator.bat
ECHO 4. Refresh browser: http://localhost:3000
ECHO.
pause
