@echo off
title StromWater IoT - Multi-Device Simulator
color 0A

echo.
echo ========================================================
echo    StromWater IoT Platform
echo    Multi-Device MQTT Simulator (Windows)
echo ========================================================
echo.
echo This simulator will publish data for multiple devices
echo to your VPS MQTT broker.
echo.
echo Target: 43.205.194.142:1883
echo Devices: StromWater_Device_1, StromWater_Device_2
echo.
echo Press Ctrl+C to stop the simulator
echo ========================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if mqtt package is installed
if not exist "node_modules\mqtt" (
    echo Installing required packages...
    echo.
    call npm install mqtt
    echo.
)

REM Run the simulator
echo Starting simulator...
echo.
node bothfiles.js

pause
