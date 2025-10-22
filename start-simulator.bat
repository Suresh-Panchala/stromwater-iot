@echo off
ECHO ========================================
ECHO Starting StromWater Device Simulator
ECHO ========================================
ECHO.
ECHO This will simulate a StromWater device
ECHO publishing data to MQTT broker
ECHO.
ECHO Press Ctrl+C to stop
ECHO.

call npm run test:mqtt
