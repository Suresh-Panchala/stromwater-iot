@echo off
ECHO ========================================
ECHO Downloading PostgreSQL and Mosquitto
ECHO ========================================
ECHO.
ECHO This will download the installers to:
ECHO %USERPROFILE%\Downloads\StromWater-Installers
ECHO.
ECHO Press any key to start download...
pause >nul

powershell -ExecutionPolicy Bypass -File "%~dp0download-installers.ps1"

ECHO.
ECHO Download complete!
ECHO Check your Downloads\StromWater-Installers folder
ECHO.
pause
