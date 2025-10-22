@echo off
title Fix MQTT Port 1883
color 0A

echo ============================================
echo   Fix MQTT Port 1883 External Access
echo ============================================
echo.
echo This will:
echo  1. Configure UFW firewall to allow port 1883
echo  2. Verify Mosquitto is listening
echo  3. Test MQTT connection
echo.
pause

echo Uploading fix script...
scp fix-mqtt-port.sh ubuntu@43.205.194.142:~/

echo.
echo Running MQTT port fix on VPS...
echo.
ssh ubuntu@43.205.194.142 "chmod +x ~/fix-mqtt-port.sh && ~/fix-mqtt-port.sh"

echo.
echo Testing MQTT port from Windows...
powershell -Command "Test-NetConnection -ComputerName 43.205.194.142 -Port 1883"

echo.
echo ============================================
echo   MQTT Port Fix Complete!
echo ============================================
echo.
echo If TcpTestSucceeded = True, port 1883 is open!
echo.
pause
