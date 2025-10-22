@echo off
title Fix StromWater Login
color 0E

echo ============================================
echo   Fix StromWater Login Issue
echo ============================================
echo.
echo This script will:
echo  1. Upload fix script to VPS
echo  2. Reinitialize admin user
echo  3. Test login functionality
echo.
echo Target VPS: 43.205.194.142
echo.
pause

REM Upload the fix script
echo Uploading fix script to VPS...
scp fix-login.sh ubuntu@43.205.194.142:~/
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to upload script!
    pause
    exit /b 1
)

REM Make it executable and run it
echo.
echo Running fix script on VPS...
ssh ubuntu@43.205.194.142 "chmod +x ~/fix-login.sh && ~/fix-login.sh"

echo.
echo ============================================
echo   Fix Complete!
echo ============================================
echo.
echo Try logging in at: http://43.205.194.142
echo   Username: admin
echo   Password: admin123
echo.
pause
