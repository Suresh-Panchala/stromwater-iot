#!/bin/bash

# ==============================================================================
# COMPLETE VPS FIX SCRIPT - Alerts & Charts
# ==============================================================================

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║         VPS Complete Fix - Alerts & Charts                             ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ==============================================================================
# Step 1: Check Current MQTT Password
# ==============================================================================
echo -e "${YELLOW}[1/7] Checking VPS MQTT Configuration...${NC}"
echo ""

if [ -f "/etc/mosquitto/passwd" ]; then
    echo "MQTT password file exists at /etc/mosquitto/passwd"
    echo "Current users:"
    sudo cat /etc/mosquitto/passwd
    echo ""
else
    echo -e "${RED}MQTT password file not found!${NC}"
    echo ""
fi

# ==============================================================================
# Step 2: Reset MQTT Password to mqtt123 (to match simulator)
# ==============================================================================
echo -e "${YELLOW}[2/7] Resetting MQTT Password to mqtt123...${NC}"

# Delete old password file
sudo rm -f /etc/mosquitto/passwd

# Create new password for user
echo "Creating user: stromwater_mqtt"
echo "Password: mqtt123"
sudo mosquitto_passwd -c -b /etc/mosquitto/passwd stromwater_mqtt mqtt123

# Restart Mosquitto
sudo systemctl restart mosquitto

echo -e "${GREEN}✓ MQTT password updated${NC}"
echo ""

# ==============================================================================
# Step 3: Update Backend .env File
# ==============================================================================
echo -e "${YELLOW}[3/7] Updating Backend .env File...${NC}"

# Navigate to backend
cd /var/www/stromwater/backend

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env 2>/dev/null || touch .env
fi

# Update .env with correct values
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

DB_HOST=localhost
DB_PORT=5432
DB_NAME=stromwater_db
DB_USER=postgres
DB_PASSWORD=root

MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=stromwater_mqtt
MQTT_PASSWORD=mqtt123
MQTT_CLIENT_ID=stromwater_backend
MQTT_TOPIC=devices/+/data

JWT_SECRET=your_secure_secret_key_change_this_in_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_secure_refresh_secret_change_this_in_production
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://43.205.194.142

ENABLE_EMAIL_ALERTS=false
ENABLE_TELEGRAM_ALERTS=false
EOF

echo -e "${GREEN}✓ Backend .env updated${NC}"
echo ""

# ==============================================================================
# Step 4: Fix Alerts Table Schema
# ==============================================================================
echo -e "${YELLOW}[4/7] Fixing Alerts Table Schema...${NC}"

sudo -u postgres psql -d stromwater_db << 'EOSQL'
-- Add missing columns if they don't exist
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS threshold_value DECIMAL;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS actual_value DECIMAL;

-- VPS Schema: device_id, alert_type, message, severity, threshold_value, actual_value, acknowledged, created_at
INSERT INTO alerts (device_id, alert_type, message, severity, threshold_value, actual_value, acknowledged, created_at)
VALUES
('StromWater_Device_1', 'water_level', 'Water level approaching threshold', 'warning', 7.0, 7.5, false, NOW() - INTERVAL '30 minutes'),
('StromWater_Device_2', 'voltage', 'Voltage out of range', 'critical', 440.0, 450.0, false, NOW() - INTERVAL '15 minutes'),
('StromWater_Device_1', 'current', 'Current fluctuation detected', 'warning', 40.0, 42.0, false, NOW() - INTERVAL '10 minutes')
ON CONFLICT DO NOTHING;

-- Show alerts count
SELECT COUNT(*) as alert_count FROM alerts;
EOSQL

echo -e "${GREEN}✓ Alerts table fixed${NC}"
echo ""

# ==============================================================================
# Step 5: Pull Latest Code & Update Dependencies
# ==============================================================================
echo -e "${YELLOW}[5/7] Pulling Latest Code from GitHub...${NC}"

cd /var/www/stromwater

# Pull latest code
git pull origin main

# Update backend dependencies
cd backend
npm install --production

echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# ==============================================================================
# Step 6: Restart Backend
# ==============================================================================
echo -e "${YELLOW}[6/7] Restarting Backend...${NC}"

pm2 restart backend
sleep 3

# Check backend status
pm2 status backend

echo ""
echo "Backend Logs (last 20 lines):"
pm2 logs backend --lines 20 --nostream

echo -e "${GREEN}✓ Backend restarted${NC}"
echo ""

# ==============================================================================
# Step 7: Rebuild Frontend
# ==============================================================================
echo -e "${YELLOW}[7/7] Rebuilding Frontend...${NC}"

cd /var/www/stromwater/frontend

# Create production environment file
cat > .env.production << 'EOF'
VITE_API_URL=http://43.205.194.142/api
EOF

# Rebuild frontend
npm install
npm run build

# Reload Nginx
sudo systemctl reload nginx

echo -e "${GREEN}✓ Frontend rebuilt${NC}"
echo ""

# ==============================================================================
# Verification
# ==============================================================================
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                        VERIFICATION                                    ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${YELLOW}1. Backend Status:${NC}"
pm2 status backend | grep backend

echo ""
echo -e "${YELLOW}2. Database Check:${NC}"
sudo -u postgres psql -d stromwater_db -c "SELECT COUNT(*) FROM alerts;"
sudo -u postgres psql -d stromwater_db -c "SELECT COUNT(*) FROM device_data WHERE timestamp > NOW() - INTERVAL '5 minutes';"

echo ""
echo -e "${YELLOW}3. Services Status:${NC}"
echo "PostgreSQL: $(sudo systemctl is-active postgresql)"
echo "Mosquitto: $(sudo systemctl is-active mosquitto)"
echo "Nginx: $(sudo systemctl is-active nginx)"

echo ""
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                          NEXT STEPS                                    ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "1. ON YOUR PC, restart MQTT simulator:"
echo "   - Stop current simulator (Ctrl+C)"
echo "   - Run: node test-mqtt-both-devices.js"
echo ""
echo "2. Wait 1-2 minutes for data to flow"
echo ""
echo "3. Open browser: http://43.205.194.142/"
echo "   - Login with admin/admin123"
echo "   - Check Alerts page"
echo "   - Check Analytics page (charts)"
echo ""
echo "4. If still not working, run:"
echo "   pm2 logs backend --lines 50"
echo ""

echo -e "${GREEN}✓ VPS Fix Complete!${NC}"
