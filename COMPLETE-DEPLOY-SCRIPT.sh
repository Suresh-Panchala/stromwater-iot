#!/bin/bash
# Complete deployment script for VPS
# Run this AFTER uploading frontend.tar.gz and backend.tar.gz

set -e
VPS_IP="43.205.194.142"

echo "╔════════════════════════════════════════════════════════╗"
echo "║   StromWater Complete Project Deployment              ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Get download URLs from user
read -p "Enter frontend download URL: " FRONTEND_URL
read -p "Enter backend download URL: " BACKEND_URL

echo ""
echo "[1/8] Stopping old services..."
pm2 delete stromwater-backend stromwater-frontend 2>/dev/null || true

echo "[2/8] Cleaning old installation..."
cd /var/www/stromwater
rm -rf frontend backend
rm -f *.tar.gz

echo "[3/8] Downloading frontend..."
wget "$FRONTEND_URL" -O frontend.tar.gz

echo "[4/8] Downloading backend..."
wget "$BACKEND_URL" -O backend.tar.gz

echo "[5/8] Extracting files..."
mkdir -p frontend backend
tar -xzf frontend.tar.gz -C frontend/
tar -xzf backend.tar.gz -C backend/

echo "[6/8] Setting up backend..."
cd backend

# Ensure .env exists with correct values
cat > .env << EOF
DATABASE_URL=postgresql://stromwater_user:stromwater_pass@localhost:5432/stromwater_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=stromwater_mqtt
MQTT_PASSWORD=mqtt123
PORT=5000
NODE_ENV=production
CORS_ORIGIN=http://${VPS_IP}
EOF

npm install --production
pm2 start src/server.js --name stromwater-backend

echo "[7/8] Setting up frontend..."
cd ../frontend

# Ensure .env exists with correct values
cat > .env << EOF
VITE_API_URL=http://${VPS_IP}/api
VITE_WS_URL=ws://${VPS_IP}/ws
EOF

npm install
npm run build

# Start frontend
sudo npm install -g serve
pm2 start "serve -s dist -l 3000" --name stromwater-frontend

echo "[8/8] Finalizing..."
pm2 save

# Cleanup
cd /var/www/stromwater
rm -f frontend.tar.gz backend.tar.gz

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   ✓ DEPLOYMENT COMPLETE!                              ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "PM2 Status:"
pm2 status

echo ""
echo "Testing backend..."
sleep 2
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

echo ""
echo ""
echo "Your dashboard: http://${VPS_IP}"
echo "Login: admin / admin123"
echo ""
