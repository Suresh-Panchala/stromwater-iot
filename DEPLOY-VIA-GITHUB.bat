@echo off
title Deploy via GitHub
color 0A

echo ============================================
echo   StromWater - Deploy via GitHub
echo ============================================
echo.
echo Step 1: Push to GitHub (from Windows)
echo Step 2: Clone on VPS (via AWS Console)
echo.
pause

cd "%~dp0"

echo.
echo Creating .gitignore...
(
echo node_modules
echo dist
echo .env
echo *.log
echo .DS_Store
) > .gitignore

echo.
echo Initializing Git repository...
git init

echo.
echo Adding all files...
git add .

echo.
echo Creating commit...
git commit -m "Complete StromWater IoT Platform"

echo.
echo ============================================
echo   Now create a GitHub repository:
echo ============================================
echo.
echo 1. Go to: https://github.com/new
echo 2. Repository name: stromwater-iot
echo 3. Make it PUBLIC (easier for deployment)
echo 4. DO NOT initialize with README
echo 5. Click "Create repository"
echo.
pause

echo.
echo Enter your GitHub username:
set /p GITHUB_USER=
echo.
echo Enter repository name (default: stromwater-iot):
set /p REPO_NAME=
if "%REPO_NAME%"=="" set REPO_NAME=stromwater-iot

echo.
echo Adding remote and pushing...
git remote add origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git
git branch -M main
git push -u origin main

echo.
echo ============================================
echo   ✓ Pushed to GitHub!
echo ============================================
echo.
echo Repository: https://github.com/%GITHUB_USER%/%REPO_NAME%
echo.
echo ============================================
echo   NOW COPY THIS AND PASTE IN AWS CONSOLE:
echo ============================================
echo.
echo cd /var/www ^&^& sudo rm -rf stromwater ^&^& git clone https://github.com/%GITHUB_USER%/%REPO_NAME%.git stromwater ^&^& sudo chown -R ubuntu:ubuntu stromwater ^&^& cd stromwater/backend ^&^& cat ^> .env ^<^< 'EOF'
echo DATABASE_URL=postgresql://stromwater_user:stromwater_pass@localhost:5432/stromwater_db
echo JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
echo MQTT_BROKER_URL=mqtt://localhost:1883
echo MQTT_USERNAME=stromwater_mqtt
echo MQTT_PASSWORD=mqtt123
echo PORT=5000
echo NODE_ENV=production
echo CORS_ORIGIN=http://43.205.194.142
echo EOF
echo npm install ^&^& node src/scripts/initDatabase.js ^&^& pm2 delete stromwater-backend ^|^| true ^&^& pm2 start src/server.js --name stromwater-backend ^&^& cd ../frontend ^&^& cat ^> .env ^<^< 'EOF'
echo VITE_API_URL=http://43.205.194.142/api
echo VITE_WS_URL=ws://43.205.194.142/ws
echo EOF
echo npm install ^&^& npm run build ^&^& sudo npm install -g serve ^&^& pm2 delete stromwater-frontend ^|^| true ^&^& pm2 start "serve -s dist -l 3000" --name stromwater-frontend ^&^& pm2 save ^&^& pm2 status
echo.
echo ============================================

pause
