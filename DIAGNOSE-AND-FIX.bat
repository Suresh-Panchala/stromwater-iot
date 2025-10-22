@echo off
title Diagnose and Fix Login
color 0E

echo ============================================
echo   StromWater Login Diagnosis and Fix
echo ============================================
echo.
echo This will:
echo  1. Check database users table
echo  2. Check backend logs for errors
echo  3. Reinitialize admin user
echo  4. Test login endpoint
echo.
pause

echo Uploading diagnostic script...
scp diagnose-and-fix.sh ubuntu@43.205.194.142:~/

echo.
echo Running diagnostics on VPS...
echo.
ssh ubuntu@43.205.194.142 "chmod +x ~/diagnose-and-fix.sh && ~/diagnose-and-fix.sh"

echo.
echo ============================================
echo   Diagnosis Complete!
echo ============================================
echo.
echo If you see a token in the output above, login is working!
echo.
echo Try logging in at: http://43.205.194.142
echo   Username: admin
echo   Password: admin123
echo.
pause
