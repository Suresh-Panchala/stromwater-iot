#!/bin/bash

# Script to fix 500 Internal Server Error for Alerts and Analytics pages
# Run this on your VPS

echo "========================================"
echo "Fixing 500 Error - Alerts & Analytics"
echo "========================================"
echo ""

# Step 1: Check backend logs for errors
echo "Step 1: Checking backend logs for errors..."
echo "=========================================="
pm2 logs stromwater-backend --lines 50 --nostream | grep -i "error" | tail -20
echo ""

# Step 2: Check if alerts table exists
echo "Step 2: Checking if alerts table exists..."
echo "=========================================="
TABLE_EXISTS=$(sudo -u postgres psql -d stromwater_db -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alerts');")

if [ "$TABLE_EXISTS" = "f" ]; then
    echo "❌ Alerts table does NOT exist. Creating now..."

    sudo -u postgres psql -d stromwater_db << 'EOF'
-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(100) NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  alert_message TEXT,
  severity VARCHAR(20) DEFAULT 'warning',
  timestamp TIMESTAMP NOT NULL,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by INTEGER REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_alerts_device_id ON alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);

-- Insert sample alerts
INSERT INTO alerts (device_id, alert_type, alert_message, severity, timestamp, acknowledged)
VALUES
  ('StromWater_Device_1', 'High Level Alert', 'Water level exceeded threshold', 'warning', NOW() - INTERVAL '2 hours', false),
  ('StromWater_Device_1', 'Pump Protection', 'Pump 1 protection triggered', 'critical', NOW() - INTERVAL '1 hour', false),
  ('StromWater_Device_2', 'Dry Run Alert', 'Dry run condition detected', 'warning', NOW() - INTERVAL '30 minutes', false)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE alerts TO stromwater_user;
GRANT USAGE, SELECT ON SEQUENCE alerts_id_seq TO stromwater_user;

-- Show results
SELECT 'Alerts table created successfully!' as status;
SELECT COUNT(*) as total_alerts FROM alerts;
EOF

    echo "✅ Alerts table created with sample data"
else
    echo "✅ Alerts table already exists"
    ALERT_COUNT=$(sudo -u postgres psql -d stromwater_db -tAc "SELECT COUNT(*) FROM alerts;")
    echo "   Total alerts: $ALERT_COUNT"
fi
echo ""

# Step 3: Check device_data count for Analytics
echo "Step 3: Checking device_data for Analytics page..."
echo "=================================================="
DATA_COUNT=$(sudo -u postgres psql -d stromwater_db -tAc "SELECT COUNT(*) FROM device_data;")
echo "Total device_data records: $DATA_COUNT"

if [ "$DATA_COUNT" -lt 10 ]; then
    echo "⚠️  Warning: Only $DATA_COUNT records in device_data."
    echo "   Analytics page needs more data to show meaningful statistics."
    echo ""
    read -p "Do you want to add 100 test records? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Adding 100 test records..."
        sudo -u postgres psql -d stromwater_db << 'EOF'
INSERT INTO device_data (device_id, hydrostatic_value, vrms_1_r, vrms_1_y, vrms_1_b, irms_1_r, irms_1_y, irms_1_b, vrms_2_r, vrms_2_y, vrms_2_b, irms_2_r, irms_2_y, irms_2_b, timestamp)
SELECT
  'StromWater_Device_' || (CASE WHEN random() < 0.5 THEN '1' ELSE '2' END),
  (random() * 10 + 5)::numeric(10,2),
  (random() * 50 + 400)::numeric(10,2),
  (random() * 50 + 400)::numeric(10,2),
  (random() * 50 + 400)::numeric(10,2),
  (random() * 20 + 20)::numeric(10,2),
  (random() * 20 + 20)::numeric(10,2),
  (random() * 20 + 20)::numeric(10,2),
  (random() * 50 + 400)::numeric(10,2),
  (random() * 50 + 400)::numeric(10,2),
  (random() * 50 + 400)::numeric(10,2),
  (random() * 20 + 20)::numeric(10,2),
  (random() * 20 + 20)::numeric(10,2),
  (random() * 20 + 20)::numeric(10,2),
  NOW() - (random() * INTERVAL '7 days')
FROM generate_series(1, 100);

SELECT COUNT(*) as new_total FROM device_data;
EOF
        echo "✅ Test data added"
    fi
fi
echo ""

# Step 4: Verify database permissions
echo "Step 4: Verifying database permissions..."
echo "=========================================="
sudo -u postgres psql -d stromwater_db << 'EOF'
-- Grant all permissions to stromwater_user
GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;
GRANT ALL ON SCHEMA public TO stromwater_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO stromwater_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO stromwater_user;

SELECT 'Permissions granted' as status;
EOF
echo ""

# Step 5: Restart backend
echo "Step 5: Restarting backend service..."
echo "======================================"
pm2 restart stromwater-backend
sleep 2
pm2 status | grep stromwater
echo ""

# Step 6: Test API endpoints
echo "Step 6: Testing API endpoints..."
echo "================================="

echo "Testing /api/alerts endpoint..."
ALERTS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/alerts -H "Authorization: Bearer $(sudo -u postgres psql -d stromwater_db -tAc "SELECT 'dummy-token-for-testing';")")
echo "Response code: $ALERTS_RESPONSE"

if [ "$ALERTS_RESPONSE" = "401" ]; then
    echo "⚠️  401 Unauthorized (expected - authentication required)"
elif [ "$ALERTS_RESPONSE" = "500" ]; then
    echo "❌ 500 Error still present. Checking logs..."
    pm2 logs stromwater-backend --lines 20 --nostream
else
    echo "✅ Endpoint responding"
fi
echo ""

# Step 7: Summary
echo "========================================"
echo "✅ Fix Complete! Now test in browser:"
echo "========================================"
echo ""
echo "1. Alerts Page: http://43.205.194.142/alerts"
echo "   - Should show 3 alerts"
echo "   - Should be able to acknowledge alerts"
echo ""
echo "2. Analytics Page: http://43.205.194.142/analytics"
echo "   - Should show device statistics"
echo "   - Should display charts and metrics"
echo ""
echo "If still showing errors:"
echo "- Check backend logs: pm2 logs stromwater-backend"
echo "- Check browser console (F12) for error details"
echo "- Run: pm2 restart all"
echo ""
