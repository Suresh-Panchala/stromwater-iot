@echo off
title Direct Login Fix
color 0C

echo ============================================
echo   StromWater - Direct Login Fix
echo ============================================
echo.
echo This will completely recreate the admin user
echo with a fresh bcrypt password hash.
echo.
pause

echo Uploading script...
scp direct-login-fix.sh ubuntu@43.205.194.142:~/

echo.
echo Running fix on VPS...
ssh ubuntu@43.205.194.142 "chmod +x ~/direct-login-fix.sh && ~/direct-login-fix.sh"

echo.
echo ============================================
echo   Testing login from Windows...
echo ============================================
echo.

curl -X POST http://43.205.194.142/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}"

echo.
echo.
echo ============================================
echo   If you see a "token" above, login works!
echo ============================================
echo.
pause
