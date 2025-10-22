@echo off
setlocal enabledelayedexpansion

echo ========================================================================
echo  StromWater IoT Platform - Local Environment Setup
echo ========================================================================
echo.

set PGPASSWORD=rakaz

echo [1/6] Checking PostgreSQL connection...
echo.
psql -U postgres -c "SELECT version();" 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to PostgreSQL!
    echo Please ensure PostgreSQL is running and password is correct.
    pause
    exit /b 1
)
echo SUCCESS: PostgreSQL connected!
echo.

echo [2/6] Creating database...
echo.
psql -U postgres -c "DROP DATABASE IF EXISTS stromwater_db;"
psql -U postgres -c "CREATE DATABASE stromwater_db;"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create database!
    pause
    exit /b 1
)
echo SUCCESS: Database created!
echo.

echo [3/6] Granting permissions...
echo.
psql -U postgres -d stromwater_db -c "GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO postgres;"
psql -U postgres -d stromwater_db -c "GRANT ALL ON SCHEMA public TO postgres;"
echo SUCCESS: Permissions granted!
echo.

echo [4/6] Installing backend dependencies...
echo.
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies!
    pause
    exit /b 1
)
echo SUCCESS: Backend dependencies installed!
echo.

echo [5/6] Initializing database schema...
echo.
node src/scripts/initDatabase.js
if %errorlevel% neq 0 (
    echo ERROR: Failed to initialize database!
    pause
    exit /b 1
)
echo SUCCESS: Database schema created!
echo.

echo [6/6] Setup complete!
echo.
echo ========================================================================
echo  SETUP SUCCESSFUL!
echo ========================================================================
echo.
echo Database: stromwater_db
echo User: postgres
echo Password: rakaz
echo.
echo Default Admin Login:
echo   Username: admin
echo   Password: admin123
echo.
echo Next Steps:
echo   1. Start backend:  npm start (in backend folder)
echo   2. Frontend is already running at http://localhost:3000
echo   3. Login with admin/admin123
echo.
echo ========================================================================
pause
