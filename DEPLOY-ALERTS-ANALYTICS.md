# Deploy Alerts and Analytics Pages - VPS Guide

## Problem
- **Alerts page** displays but shows no data (alerts table doesn't exist)
- **Analytics page** displays but shows no data (either no device_data or API issues)

## Solution Steps

### Step 1: Connect to Your VPS via AWS Console

1. Log in to AWS Console
2. Go to EC2 → Instances
3. Select your instance (IP: 43.205.194.142)
4. Click "Connect" → "Session Manager" or use SSH client

---

### Step 2: Verify Current Database Status

```bash
# Connect to PostgreSQL
sudo -u postgres psql -d stromwater_db

# Run the verification queries (paste one by one)
```

```sql
-- Check if alerts table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'alerts';

-- Check device_data count
SELECT COUNT(*) FROM device_data;

-- Exit psql
\q
```

**Expected Results:**
- If alerts table doesn't exist: You'll see 0 rows
- If device_data is empty: COUNT will be 0 or 2 (only test data)

---

### Step 3: Create Alerts Table

```bash
# Still in VPS, run:
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
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);

-- Insert sample alerts for testing
INSERT INTO alerts (device_id, alert_type, alert_message, severity, timestamp, acknowledged)
VALUES
  ('StromWater_Device_1', 'High Level Alert', 'Water level exceeded threshold', 'warning', NOW() - INTERVAL '2 hours', false),
  ('StromWater_Device_1', 'Pump Protection', 'Pump 1 protection triggered', 'critical', NOW() - INTERVAL '1 hour', false),
  ('StromWater_Device_2', 'Dry Run Alert', 'Dry run condition detected', 'warning', NOW() - INTERVAL '30 minutes', false);

-- Verify
SELECT COUNT(*) as total_alerts FROM alerts;

EOF
```

You should see: `total_alerts | 3`

---

### Step 4: Pull Latest Frontend Code from GitHub

```bash
# Navigate to project directory
cd /var/www/stromwater

# Pull latest changes (includes Analytics page)
git pull origin main

# Should show:
# - frontend/src/pages/Analytics.jsx (new file)
# - frontend/src/App.jsx (updated)
# - frontend/src/components/Layout.jsx (updated)
```

---

### Step 5: Rebuild and Deploy Frontend

```bash
# Navigate to frontend directory
cd /var/www/stromwater/frontend

# Rebuild the frontend
npm run build

# Restart the frontend service
pm2 restart stromwater-frontend

# Check status
pm2 status

# View logs to ensure no errors
pm2 logs stromwater-frontend --lines 30
```

---

### Step 6: Restart Backend (if needed)

```bash
# Restart backend to ensure alert routes are loaded
pm2 restart stromwater-backend

# Check backend logs
pm2 logs stromwater-backend --lines 30
```

---

### Step 7: Test the Pages

#### Test Alerts Page:
1. Open browser: http://43.205.194.142/alerts
2. You should see:
   - Total Alerts: 3
   - Unacknowledged: 3
   - Acknowledged: 0
   - 3 alert cards displayed

#### Test Analytics Page:
1. Open browser: http://43.205.194.142/analytics
2. You should see:
   - Device selector (Dubai and Sharjah)
   - Date range selector (24h, 7days, 30days)
   - Analytics cards showing data

**If Analytics shows "No data available":**
- The device_data table is empty or has very few records
- The MQTT simulator needs to run longer to collect data
- Check backend logs: `pm2 logs stromwater-backend | grep "MQTT"`

---

### Step 8: Verify MQTT Data Flow (If Analytics has no data)

```bash
# Check device_data count
sudo -u postgres psql -d stromwater_db -c "SELECT COUNT(*) FROM device_data;"

# If count is 0 or very low, check backend logs
pm2 logs stromwater-backend --lines 50 | grep -i "mqtt\|device"

# Check if backend is receiving MQTT messages
pm2 logs stromwater-backend --lines 100 | grep "Received message"
```

**If backend is receiving MQTT but not saving:**
- This is the ongoing issue from the previous session
- Check error logs: `pm2 logs stromwater-backend | grep -i error`

---

## Troubleshooting

### Issue: Alerts Page Shows "Failed to load alerts"

**Solution:**
```bash
# Check backend API is running
curl http://localhost:5000/api/alerts

# Check backend logs
pm2 logs stromwater-backend --lines 50
```

### Issue: Analytics Page Shows "No data available"

**Possible causes:**
1. **No device_data in database** - Run MQTT simulator for longer
2. **API error** - Check browser console (F12) for errors
3. **Backend error** - Check `pm2 logs stromwater-backend`

**Quick fix - Add more test data:**
```bash
sudo -u postgres psql -d stromwater_db << 'EOF'
INSERT INTO device_data (device_id, hydrostatic_value, vrms_1_r, vrms_1_y, vrms_1_b, irms_1_r, irms_1_y, irms_1_b, vrms_2_r, vrms_2_y, vrms_2_b, irms_2_r, irms_2_y, irms_2_b, timestamp)
SELECT
  'StromWater_Device_' || (random() * 2 + 1)::int,
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

SELECT COUNT(*) FROM device_data;
EOF
```

This will insert 100 random test records for the last 7 days.

---

## Expected Final State

✅ **Alerts Page** (http://43.205.194.142/alerts)
- Shows 3 sample alerts
- Can acknowledge alerts
- Filter works (All/Unacknowledged/Acknowledged)

✅ **Analytics Page** (http://43.205.194.142/analytics)
- Shows device selector
- Displays metrics: Total readings, Avg water level, Avg voltage, Avg current
- Shows pump uptime statistics
- Date range filter works

✅ **Navigation**
- Sidebar shows: Dashboard → Alerts → Analytics → Users (admin) → Settings
- All links clickable and working

---

## Quick Commands Reference

```bash
# Check database tables
sudo -u postgres psql -d stromwater_db -c "\dt"

# Check alerts count
sudo -u postgres psql -d stromwater_db -c "SELECT COUNT(*) FROM alerts;"

# Check device_data count
sudo -u postgres psql -d stromwater_db -c "SELECT COUNT(*) FROM device_data;"

# Check PM2 status
pm2 status

# View backend logs
pm2 logs stromwater-backend --lines 50

# View frontend logs
pm2 logs stromwater-frontend --lines 50

# Restart all services
pm2 restart all
```

---

## Need Help?

If you encounter any issues:
1. Check browser console (F12) for frontend errors
2. Check backend logs: `pm2 logs stromwater-backend`
3. Check database connection: `sudo -u postgres psql -d stromwater_db -c "SELECT version();"`
4. Verify nginx: `sudo systemctl status nginx`
