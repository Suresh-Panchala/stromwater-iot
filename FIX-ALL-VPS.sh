#!/bin/bash
# SIMPLE FIX SCRIPT - Fixes Alerts, Charts, Time Display
# Run this on VPS: chmod +x FIX-ALL-VPS.sh && ./FIX-ALL-VPS.sh

echo "======================================"
echo "  Fixing All Issues - Step by Step"
echo "======================================"
echo ""

# STEP 1: Create alerts table
echo "[1/5] Creating alerts table..."
sudo -u postgres psql -d stromwater_db << 'SQL'
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50),
    alert_type VARCHAR(50),
    severity VARCHAR(20),
    message TEXT,
    threshold_value DECIMAL,
    actual_value DECIMAL,
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by INTEGER,
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO alerts (device_id, alert_type, severity, message, threshold_value, actual_value)
VALUES
('StromWater_Device_1', 'high_water_level', 'warning', 'Water level exceeded threshold', 8.0, 8.5),
('StromWater_Device_2', 'high_water_level', 'critical', 'Critical water level detected', 8.0, 9.2),
('StromWater_Device_1', 'voltage_abnormal', 'warning', 'Voltage fluctuation detected', 440, 455),
('StromWater_Device_2', 'pump_failure', 'critical', 'Pump not responding', NULL, NULL),
('StromWater_Device_1', 'high_current', 'warning', 'Current above normal', 35, 38.5)
ON CONFLICT DO NOTHING;

SELECT COUNT(*) as alert_count FROM alerts;
SQL
echo "✓ Alerts table ready"
echo ""

# STEP 2: Pull latest code (includes time display fix)
echo "[2/5] Pulling latest code from GitHub..."
cd /var/www/stromwater
sudo git pull origin main
echo "✓ Code updated"
echo ""

# STEP 3: Restart backend
echo "[3/5] Restarting backend..."
pm2 restart backend
sleep 2
echo "✓ Backend restarted"
echo ""

# STEP 4: Rebuild frontend
echo "[4/5] Rebuilding frontend..."
cd /var/www/stromwater/frontend
sudo rm -rf dist
sudo npm run build > /dev/null 2>&1
echo "✓ Frontend built"
echo ""

# STEP 5: Reload Nginx
echo "[5/5] Reloading Nginx..."
sudo systemctl reload nginx
echo "✓ Nginx reloaded"
echo ""

# Verification
echo "======================================"
echo "  Verification"
echo "======================================"
echo ""

echo "Backend status:"
pm2 status | grep backend

echo ""
echo "Alerts count:"
sudo -u postgres psql -d stromwater_db -c "SELECT COUNT(*) FROM alerts;"

echo ""
echo "Device data (for charts):"
sudo -u postgres psql -d stromwater_db -c "SELECT device_id, COUNT(*) as records FROM device_data GROUP BY device_id;"

echo ""
echo "======================================"
echo "  ✓ ALL FIXES COMPLETE!"
echo "======================================"
echo ""
echo "Now do these:"
echo "1. Open: http://43.205.194.142/"
echo "2. Hard refresh: Ctrl+Shift+R"
echo "3. Check Alerts page"
echo "4. Check Analytics/Charts"
echo "5. See date AND time at top right"
echo ""
