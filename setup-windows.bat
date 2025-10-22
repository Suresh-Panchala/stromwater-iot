@echo off
ECHO ========================================
ECHO StromWater Platform - Windows Setup
ECHO ========================================
ECHO.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo WARNING: Not running as Administrator
    echo Some operations may fail
    echo Right-click and "Run as Administrator" for full setup
    echo.
    pause
)

ECHO Step 1: Checking prerequisites...
ECHO.

REM Check Node.js
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Node.js not found
    echo Please install from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo [OK] Node.js found
)

REM Check PostgreSQL
psql --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] PostgreSQL not found in PATH
    echo Please install from https://www.postgresql.org/download/windows/
    echo Or add PostgreSQL bin folder to PATH
    set /p CONTINUE="Continue anyway? (y/n): "
    if /i not "%CONTINUE%"=="y" exit /b 1
) else (
    echo [OK] PostgreSQL found
)

REM Check Mosquitto
where mosquitto >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Mosquitto not found
    echo Please install from https://mosquitto.org/download/
    set /p CONTINUE="Continue anyway? (y/n): "
    if /i not "%CONTINUE%"=="y" exit /b 1
) else (
    echo [OK] Mosquitto found
)

ECHO.
ECHO ========================================
ECHO Step 2: Setting up Backend
ECHO ========================================
ECHO.

cd backend

ECHO Installing backend dependencies...
call npm install
if %errorLevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

ECHO.
ECHO Creating .env file...
if not exist .env (
    copy .env.example .env
    echo [OK] .env file created
    echo.
    echo IMPORTANT: Edit backend\.env and update:
    echo   - DB_PASSWORD (PostgreSQL password)
    echo   - MQTT_PASSWORD (MQTT password)
    echo   - JWT_SECRET (random string)
    echo.
) else (
    echo [OK] .env file already exists
)

ECHO.
set /p INIT_DB="Initialize database now? (requires PostgreSQL setup) (y/n): "
if /i "%INIT_DB%"=="y" (
    echo Running database initialization...
    call npm run init-db
    if %errorLevel% neq 0 (
        echo WARNING: Database initialization failed
        echo Make sure PostgreSQL is running and credentials are correct
        pause
    ) else (
        echo [OK] Database initialized successfully
    )
)

cd ..

ECHO.
ECHO ========================================
ECHO Step 3: Setting up Frontend
ECHO ========================================
ECHO.

cd frontend

ECHO Installing frontend dependencies...
call npm install
if %errorLevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)

ECHO.
ECHO Creating .env file...
if not exist .env (
    echo VITE_API_URL=http://localhost:5000/api > .env
    echo VITE_WS_URL=ws://localhost:5000 >> .env
    echo [OK] .env file created
) else (
    echo [OK] .env file already exists
)

cd ..

ECHO.
ECHO ========================================
ECHO Step 4: Installing test dependencies
ECHO ========================================
ECHO.

call npm install
echo [OK] MQTT simulator dependencies installed

ECHO.
ECHO ========================================
ECHO Setup Complete!
ECHO ========================================
ECHO.
ECHO Next steps:
ECHO.
ECHO 1. Make sure PostgreSQL is running
ECHO 2. Make sure Mosquitto is running
ECHO.
ECHO 3. Start Backend (in new terminal):
ECHO    cd backend
ECHO    npm run dev
ECHO.
ECHO 4. Start Frontend (in new terminal):
ECHO    cd frontend
ECHO    npm run dev
ECHO.
ECHO 5. Test with MQTT simulator (in new terminal):
ECHO    npm run test:mqtt
ECHO.
ECHO 6. Open browser: http://localhost:3000
ECHO    Login: admin / admin123
ECHO.
ECHO See WINDOWS_SETUP.md for detailed instructions
ECHO.
pause
