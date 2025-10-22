@echo off
echo ========================================
echo   Mosquitto MQTT Broker Setup (Local)
echo ========================================
echo.

echo Step 1: Download Mosquitto installer
echo Downloading from: https://mosquitto.org/files/binary/win64/mosquitto-2.0.18-install-windows-x64.exe
echo.

powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://mosquitto.org/files/binary/win64/mosquitto-2.0.18-install-windows-x64.exe' -OutFile 'mosquitto-installer.exe'}"

echo.
echo Download complete!
echo.
echo Step 2: Run the installer
echo IMPORTANT: Install to default location: C:\Program Files\mosquitto
echo.
pause
start /wait mosquitto-installer.exe

echo.
echo Step 3: Create Mosquitto configuration
echo.

set MOSQUITTO_CONF="C:\Program Files\mosquitto\mosquitto.conf"

echo # Mosquitto Configuration for StromWater IoT > %MOSQUITTO_CONF%
echo. >> %MOSQUITTO_CONF%
echo # Listen on all interfaces >> %MOSQUITTO_CONF%
echo listener 1883 >> %MOSQUITTO_CONF%
echo. >> %MOSQUITTO_CONF%
echo # Allow anonymous connections (for local testing) >> %MOSQUITTO_CONF%
echo allow_anonymous true >> %MOSQUITTO_CONF%
echo. >> %MOSQUITTO_CONF%
echo # Persistence >> %MOSQUITTO_CONF%
echo persistence true >> %MOSQUITTO_CONF%
echo persistence_location C:/Program Files/mosquitto/data/ >> %MOSQUITTO_CONF%
echo. >> %MOSQUITTO_CONF%
echo # Logging >> %MOSQUITTO_CONF%
echo log_dest file C:/Program Files/mosquitto/mosquitto.log >> %MOSQUITTO_CONF%
echo log_type all >> %MOSQUITTO_CONF%

echo Configuration file created!
echo.
echo Step 4: Install Mosquitto as Windows Service
echo.
cd "C:\Program Files\mosquitto"
mosquitto install

echo.
echo Step 5: Start Mosquitto service
echo.
net start mosquitto

echo.
echo ========================================
echo   Mosquitto Setup Complete!
echo ========================================
echo.
echo Mosquitto MQTT broker is now running on localhost:1883
echo.
echo Next steps:
echo 1. Update backend .env file to use localhost MQTT broker
echo 2. Update MQTT simulator to publish to localhost
echo 3. Restart backend server to subscribe to local broker
echo.
pause
