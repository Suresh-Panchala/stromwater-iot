@echo off
ECHO ========================================
ECHO Configuring Mosquitto MQTT Broker
ECHO ========================================
ECHO.

REM Check if running as admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    ECHO ERROR: This script must be run as Administrator
    ECHO Right-click and select "Run as administrator"
    ECHO.
    pause
    exit /b 1
)

ECHO Step 1: Creating password file...
cd "C:\Program Files\mosquitto"

ECHO stromwater_mqtt:mqtt123 | mosquitto_passwd -c -b passwd stromwater_mqtt mqtt123 2>nul
if %errorLevel% neq 0 (
    ECHO Creating password file...
    echo mqtt123 > temp_pwd.txt
    echo mqtt123 >> temp_pwd.txt
    mosquitto_passwd -c passwd stromwater_mqtt < temp_pwd.txt
    del temp_pwd.txt
)

ECHO [OK] Password file created

ECHO.
ECHO Step 2: Backing up original config...
if not exist mosquitto.conf.backup (
    copy mosquitto.conf mosquitto.conf.backup >nul
    ECHO [OK] Backup created
) else (
    ECHO [OK] Backup already exists
)

ECHO.
ECHO Step 3: Updating configuration...
(
echo.
echo # StromWater MQTT Configuration
echo listener 1883
echo allow_anonymous false
echo password_file "C:\Program Files\mosquitto\passwd"
echo log_dest file "C:\Program Files\mosquitto\mosquitto.log"
) >> mosquitto.conf

ECHO [OK] Configuration updated

ECHO.
ECHO Step 4: Restarting Mosquitto service...
net stop mosquitto >nul 2>&1
timeout /t 2 /nobreak >nul
net start mosquitto >nul 2>&1

if %errorLevel% equ 0 (
    ECHO [OK] Mosquitto service restarted
) else (
    ECHO [WARNING] Could not restart service
    ECHO Please restart manually: services.msc
)

ECHO.
ECHO ========================================
ECHO Testing MQTT Connection...
ECHO ========================================
ECHO.

ECHO Testing authentication...
mosquitto_pub -h localhost -t test -m "StromWater Test" -u stromwater_mqtt -P mqtt123 2>nul

if %errorLevel% equ 0 (
    ECHO [OK] MQTT broker is configured and working!
) else (
    ECHO [WARNING] Test failed - check service status
)

ECHO.
ECHO ========================================
ECHO Configuration Complete!
ECHO ========================================
ECHO.
ECHO MQTT Credentials:
ECHO   Host: localhost
ECHO   Port: 1883
ECHO   Username: stromwater_mqtt
ECHO   Password: mqtt123
ECHO.
pause
