@echo off
ECHO ========================================
ECHO StromWater Device 2 Simulator
ECHO ========================================
ECHO.
ECHO Starting MQTT simulator for Device 2...
ECHO Device ID: StromWater_Device_2
ECHO Location: Sharjah Industrial Area
ECHO.
ECHO Press Ctrl+C to stop
ECHO.

cd /d "%~dp0"
node test-mqtt-device2.js

pause
