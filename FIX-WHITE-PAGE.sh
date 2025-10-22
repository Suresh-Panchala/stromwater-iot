#!/bin/bash
# Fix white page - Frontend needs to be built and served correctly

set -e
VPS_IP="43.205.194.142"

echo "╔════════════════════════════════════════════════════════╗"
echo "║   Fix White Page - Rebuild Frontend                   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "[1/5] Stopping frontend..."
pm2 delete stromwater-frontend 2>/dev/null || true

echo "[2/5] Going to frontend directory..."
cd /var/www/stromwater/frontend

echo "[3/5] Checking .env file..."
cat > .env << EOF
VITE_API_URL=http://${VPS_IP}/api
VITE_WS_URL=ws://${VPS_IP}/ws
EOF
echo "✓ .env configured"

echo "[4/5] Building frontend..."
echo "This may take 2-3 minutes..."
npm run build

echo "[5/5] Starting frontend with built files..."
sudo npm install -g serve 2>/dev/null || true
pm2 start "serve -s dist -l 3000" --name stromwater-frontend
pm2 save

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   ✓ FRONTEND REBUILT!                                 ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Testing..."
curl -I http://localhost:3000

echo ""
echo "PM2 Status:"
pm2 status

echo ""
echo "Open http://${VPS_IP} in your browser"
echo "It should show the login page (not white page)"
echo ""
