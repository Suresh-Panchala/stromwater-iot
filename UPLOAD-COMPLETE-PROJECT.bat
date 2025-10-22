@echo off
title Upload Complete StromWater Project
color 0A

echo ============================================
echo   Upload COMPLETE StromWater Project
echo ============================================
echo.
echo This will upload:
echo  - Frontend (src, public, package.json, etc.)
echo  - Backend (src, package.json, .env, etc.)
echo.
echo Then rebuild everything on the VPS properly.
echo.
pause

cd "%~dp0"

echo.
echo [1/4] Creating frontend archive...
cd frontend
tar -czf ..\frontend.tar.gz src public package.json package-lock.json vite.config.js tailwind.config.js postcss.config.js index.html .env 2>nul
cd ..
echo     Done: frontend.tar.gz

echo.
echo [2/4] Creating backend archive...
cd backend
tar -czf ..\backend.tar.gz src package.json package-lock.json .env 2>nul
cd ..
echo     Done: backend.tar.gz

echo.
echo [3/4] Uploading frontend to transfer.sh...
curl --upload-file frontend.tar.gz https://transfer.sh/frontend.tar.gz > frontend_url.txt
set /p FRONTEND_URL=<frontend_url.txt
echo     Frontend URL: %FRONTEND_URL%

echo.
echo [4/4] Uploading backend to transfer.sh...
curl --upload-file backend.tar.gz https://transfer.sh/backend.tar.gz > backend_url.txt
set /p BACKEND_URL=<backend_url.txt
echo     Backend URL: %BACKEND_URL%

echo.
echo ============================================
echo   Upload Complete!
echo ============================================
echo.
echo Frontend URL: %FRONTEND_URL%
echo Backend URL:  %BACKEND_URL%
echo.
echo ============================================
echo   COPY AND PASTE THIS IN AWS CONSOLE:
echo ============================================
echo.
echo cd /var/www/stromwater ^&^& rm -rf frontend backend ^&^& wget "%FRONTEND_URL%" -O frontend.tar.gz ^&^& wget "%BACKEND_URL%" -O backend.tar.gz ^&^& mkdir -p frontend backend ^&^& tar -xzf frontend.tar.gz -C frontend ^&^& tar -xzf backend.tar.gz -C backend ^&^& cd backend ^&^& npm install ^&^& pm2 restart stromwater-backend ^&^& cd ../frontend ^&^& npm install ^&^& npm run build ^&^& pm2 restart stromwater-frontend ^&^& cd .. ^&^& pm2 save ^&^& pm2 status
echo.
echo ============================================

echo.
echo Cleaning up...
del frontend.tar.gz backend.tar.gz frontend_url.txt backend_url.txt

echo.
echo Press any key to exit...
pause >nul
