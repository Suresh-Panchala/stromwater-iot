@echo off
title Quick Fix Login
color 0A

echo ============================================
echo   Quick Fix: Reset Admin User
echo ============================================
echo.

REM Reset admin user directly in database
echo Resetting admin user in database...
ssh ubuntu@43.205.194.142 "cd /var/www/stromwater/backend && node src/scripts/initDatabase.js && pm2 restart stromwater-backend"

echo.
echo Waiting 5 seconds for backend to restart...
timeout /t 5 /nobreak >nul

echo.
echo Testing login...
curl -X POST http://43.205.194.142/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}"

echo.
echo.
echo ============================================
echo   Done!
echo ============================================
echo.
echo Try logging in at: http://43.205.194.142
echo   Username: admin
echo   Password: admin123
echo.
pause
