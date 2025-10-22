@echo off
COLOR 0A
ECHO.
ECHO ============================================================
ECHO    STROMWATER IoT PLATFORM - COMPLETE SETUP
ECHO ============================================================
ECHO.
ECHO This will configure everything you need:
ECHO   [1] PostgreSQL Database
ECHO   [2] Mosquitto MQTT Broker
ECHO   [3] Backend Dependencies
ECHO   [4] Frontend Dependencies
ECHO   [5] Initialize Database Schema
ECHO.
ECHO Prerequisites (already installed):
ECHO   [OK] PostgreSQL
ECHO   [OK] Mosquitto
ECHO   [OK] Node.js
ECHO.
ECHO ============================================================
ECHO.
pause

ECHO.
ECHO ============================================================
ECHO STEP 1: Configuring PostgreSQL Database
ECHO ============================================================
ECHO.
call setup-database.bat

ECHO.
ECHO ============================================================
ECHO STEP 2: Configuring Mosquitto MQTT Broker
ECHO ============================================================
ECHO.
ECHO This requires Administrator privileges...
ECHO.
set /p SETUP_MQTT="Continue with Mosquitto setup? (y/n): "
if /i "%SETUP_MQTT%"=="y" (
    ECHO.
    ECHO Please run setup-mosquitto.bat as Administrator
    ECHO Right-click setup-mosquitto.bat and select "Run as administrator"
    ECHO.
    ECHO Press any key after Mosquitto setup is complete...
    pause >nul
)

ECHO.
ECHO ============================================================
ECHO STEP 3: Installing Backend Dependencies
ECHO ============================================================
ECHO.
cd backend
ECHO Installing Node.js packages...
call npm install
if %errorLevel% neq 0 (
    ECHO [ERROR] Backend installation failed
    pause
    exit /b 1
)
ECHO [OK] Backend dependencies installed
cd ..

ECHO.
ECHO ============================================================
ECHO STEP 4: Installing Frontend Dependencies
ECHO ============================================================
ECHO.
cd frontend
ECHO Installing Node.js packages...
call npm install
if %errorLevel% neq 0 (
    ECHO [ERROR] Frontend installation failed
    pause
    exit /b 1
)
ECHO [OK] Frontend dependencies installed
cd ..

ECHO.
ECHO ============================================================
ECHO STEP 5: Creating Environment Files
ECHO ============================================================
ECHO.

REM Create backend .env
cd backend
if not exist .env (
    ECHO Creating backend .env file...
    (
echo NODE_ENV=development
echo PORT=5000
echo HOST=0.0.0.0
echo.
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_NAME=stromwater_db
echo DB_USER=stromwater_user
echo DB_PASSWORD=stromwater123
echo.
echo MQTT_BROKER_URL=mqtt://localhost:1883
echo MQTT_USERNAME=stromwater_mqtt
echo MQTT_PASSWORD=mqtt123
echo MQTT_CLIENT_ID=stromwater_backend
echo MQTT_TOPIC=devices/+/data
echo.
echo JWT_SECRET=my_dev_secret_key_12345
echo JWT_EXPIRES_IN=24h
echo JWT_REFRESH_SECRET=my_dev_refresh_secret_12345
echo JWT_REFRESH_EXPIRES_IN=7d
echo.
echo CORS_ORIGIN=http://localhost:3000
echo.
echo ENABLE_EMAIL_ALERTS=false
echo ENABLE_TELEGRAM_ALERTS=false
    ) > .env
    ECHO [OK] Backend .env created
) else (
    ECHO [OK] Backend .env already exists
)
cd ..

REM Create frontend .env
cd frontend
if not exist .env (
    ECHO Creating frontend .env file...
    (
echo VITE_API_URL=http://localhost:5000/api
echo VITE_WS_URL=ws://localhost:5000
    ) > .env
    ECHO [OK] Frontend .env created
) else (
    ECHO [OK] Frontend .env already exists
)
cd ..

ECHO.
ECHO ============================================================
ECHO STEP 6: Initializing Database Schema
ECHO ============================================================
ECHO.
cd backend
ECHO Creating tables and admin user...
call npm run init-db
if %errorLevel% neq 0 (
    ECHO [ERROR] Database initialization failed
    ECHO Make sure PostgreSQL is running and credentials are correct
    cd ..
    pause
    exit /b 1
)
ECHO [OK] Database initialized
cd ..

ECHO.
ECHO ============================================================
ECHO SETUP COMPLETE!
ECHO ============================================================
ECHO.
ECHO Default Credentials:
ECHO.
ECHO [PostgreSQL]
ECHO   Database: stromwater_db
ECHO   Username: stromwater_user
ECHO   Password: stromwater123
ECHO.
ECHO [MQTT Broker]
ECHO   Host: localhost:1883
ECHO   Username: stromwater_mqtt
ECHO   Password: mqtt123
ECHO.
ECHO [Dashboard]
ECHO   URL: http://localhost:3000
ECHO   Username: admin
ECHO   Password: admin123
ECHO.
ECHO ============================================================
ECHO Next Steps:
ECHO ============================================================
ECHO.
ECHO 1. Start Backend:    Double-click start-backend.bat
ECHO 2. Start Frontend:   Double-click start-frontend.bat
ECHO 3. Start Simulator:  Double-click start-simulator.bat
ECHO 4. Open Browser:     http://localhost:3000
ECHO.
ECHO All three services must be running!
ECHO.
ECHO ============================================================
pause
