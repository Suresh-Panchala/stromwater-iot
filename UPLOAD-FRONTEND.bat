@echo off
title Upload Real Frontend to VPS
color 0E

echo ============================================
echo   Upload REAL StromWater React Frontend
echo ============================================
echo.
echo The actual project has:
echo  - React dashboard with charts
echo  - Real-time data visualization
echo  - All features you built
echo.
echo Current: Simple HTML version is deployed
echo Goal: Deploy the REAL React frontend
echo.
pause

cd "%~dp0frontend"

echo.
echo Creating dist.zip...
powershell -Command "Compress-Archive -Path dist -DestinationPath dist.zip -Force"

echo.
echo Uploading to transfer.sh...
echo.
curl --upload-file dist.zip https://transfer.sh/dist.zip > temp_url.txt

echo.
echo ============================================
set /p DOWNLOAD_URL=<temp_url.txt
echo Download URL: %DOWNLOAD_URL%
echo ============================================
echo.
echo COPY THIS URL!
echo.
echo Now run this command in AWS Console:
echo.
echo cd /var/www/stromwater ^&^& rm -rf frontend ^&^& mkdir frontend ^&^& cd frontend ^&^& wget "%DOWNLOAD_URL%" -O dist.zip ^&^& unzip -o dist.zip ^&^& mv dist/* . ^&^& rmdir dist ^&^& rm dist.zip ^&^& sudo npm install -g serve ^&^& pm2 delete stromwater-frontend ^&^& pm2 start "serve -s . -l 3000" --name stromwater-frontend ^&^& pm2 save ^&^& pm2 status
echo.
echo ============================================
echo.

del temp_url.txt

echo Press any key to exit...
pause >nul
