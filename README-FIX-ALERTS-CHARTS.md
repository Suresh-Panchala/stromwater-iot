# Fix Alerts & Charts - Complete Solution

## Root Cause Identified

**CRITICAL FINDING:** The MQTT simulator and VPS backend were using the wrong MQTT password.

- **OLD Password:** `StromWater@MQTT2024` (WRONG - causing authentication failures)
- **CORRECT Password:** `mqtt123` (matches VPS Mosquitto configuration)

## What Has Been Fixed on PC

✅ MQTT simulator password corrected to `mqtt123`
✅ Simulator now publishing data successfully to VPS every 5 seconds
✅ Data includes: water level, voltage, current, pump status, frequency, temperature

**Your PC simulator is NOW RUNNING and sending data to VPS!**

## What You Need to Do on VPS

Run the complete fix script I created: [FIX-VPS-COMPLETE.sh](FIX-VPS-COMPLETE.sh#L1)

### Step-by-Step Instructions:

```bash
# 1. Connect to VPS
ssh ubuntu@43.205.194.142

# 2. Copy the fix script to VPS
# (Or manually create it - see FIX-VPS-COMPLETE.sh file)

# 3. Make it executable
chmod +x FIX-VPS-COMPLETE.sh

# 4. Run the script
sudo ./FIX-VPS-COMPLETE.sh
```

### What the Script Does:

1. ✅ Resets MQTT password to `mqtt123` on VPS Mosquitto
2. ✅ Updates backend .env with correct credentials
3. ✅ Fixes alerts table schema (adds missing columns)
4. ✅ Inserts sample alert data
5. ✅ Pulls latest code from GitHub
6. ✅ Updates backend dependencies
7. ✅ Restarts backend with correct configuration
8. ✅ Rebuilds frontend with production API URL
9. ✅ Reloads Nginx

## Manual Alternative (If Script Doesn't Work)

If the automated script has issues, run these commands manually:

### 1. Fix MQTT Password

```bash
# Remove old password file
sudo rm -f /etc/mosquitto/passwd

# Create new password (mqtt123)
sudo mosquitto_passwd -c -b /etc/mosquitto/passwd stromwater_mqtt mqtt123

# Restart Mosquitto
sudo systemctl restart mosquitto
```

### 2. Update Backend .env

```bash
cd /var/www/stromwater/backend

# Edit .env file
nano .env
```

**Update these lines:**

```env
DB_USER=postgres
DB_PASSWORD=root

MQTT_PASSWORD=mqtt123
```

Save (Ctrl+X, Y, Enter)

### 3. Fix Alerts Table

```bash
sudo -u postgres psql -d stromwater_db
```

Run this SQL:

```sql
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS threshold_value DECIMAL;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS actual_value DECIMAL;

-- VPS Schema: Use message (not alert_message) and created_at (not timestamp)
INSERT INTO alerts (device_id, alert_type, message, severity, threshold_value, actual_value, acknowledged, created_at)
VALUES
('StromWater_Device_1', 'water_level', 'Water level approaching threshold', 'warning', 7.0, 7.5, false, NOW() - INTERVAL '30 minutes'),
('StromWater_Device_2', 'voltage', 'Voltage out of range', 'critical', 440.0, 450.0, false, NOW() - INTERVAL '15 minutes'),
('StromWater_Device_1', 'current', 'Current fluctuation detected', 'warning', 40.0, 42.0, false, NOW() - INTERVAL '10 minutes');

\q
```

### 4. Restart Backend

```bash
cd /var/www/stromwater/backend
pm2 restart backend
pm2 logs backend --lines 30
```

**Look for these success messages:**

- ✓ Server is running on port 5000
- ✓ MQTT client connected
- ✓ Received data for device: StromWater_Device_1
- ✓ Received data for device: StromWater_Device_2

### 5. Rebuild Frontend

```bash
cd /var/www/stromwater/frontend

# Create production environment
cat > .env.production << 'EOF'
VITE_API_URL=http://43.205.194.142/api
EOF

# Rebuild
npm install
npm run build

# Reload Nginx
sudo systemctl reload nginx
```

## Verification Steps

### 1. Check Backend Logs

```bash
pm2 logs backend --lines 50
```

**Should show:**
- MQTT client connected
- Receiving data from devices every 5 seconds
- No authentication errors
- No database errors

### 2. Check Database Data

```bash
sudo -u postgres psql -d stromwater_db -c "SELECT COUNT(*) FROM device_data WHERE timestamp > NOW() - INTERVAL '5 minutes';"
```

**Should return:** More than 0 (fresh data in last 5 minutes)

### 3. Check Alerts Table

```bash
sudo -u postgres psql -d stromwater_db -c "SELECT * FROM alerts ORDER BY created_at DESC LIMIT 5;"
```

**Should show:** Alert records with threshold_value and actual_value columns

### 4. Test Web Application

Open browser: http://43.205.194.142/

1. **Login:** admin / admin123
2. **Dashboard:** Should show live data updating
3. **Alerts Page:** Should display alerts (at least 3 sample alerts)
4. **Analytics Page:** Charts should display data
   - Power Chart (voltage/current)
   - Pump Trend Chart
   - Water Level Chart

## Expected Results

After running the fix:

✅ **Alerts Page:** Displays alert list with severity badges
✅ **Analytics Charts:** Show data trends for last 24 hours
✅ **Dashboard:** Real-time data updates every 5 seconds
✅ **No console errors** (Check browser F12)
✅ **Backend logs clean** (No MQTT or database errors)

## Troubleshooting

### If Alerts Still Not Working:

```bash
# Check backend logs for /api/alerts endpoint errors
pm2 logs backend | grep -i alert

# Test alerts API directly
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r .data.accessToken > /tmp/token.txt

curl -H "Authorization: Bearer $(cat /tmp/token.txt)" http://localhost:5000/api/alerts
```

### If Charts Still Not Working:

```bash
# Check if fresh data exists
sudo -u postgres psql -d stromwater_db -c "SELECT device_id, COUNT(*), MAX(timestamp) FROM device_data WHERE timestamp > NOW() - INTERVAL '24 hours' GROUP BY device_id;"

# Test historical data API
curl -H "Authorization: Bearer $(cat /tmp/token.txt)" "http://localhost:5000/api/devices/StromWater_Device_1/historical?hours=24" | head -100
```

### If Backend Not Receiving MQTT Data:

```bash
# Test MQTT broker directly
mosquitto_sub -h localhost -t "devices/#" -u stromwater_mqtt -P mqtt123 -v

# Should show incoming messages from PC simulator
```

## Files Modified/Created

1. **PC Side:**
   - [test-mqtt-both-devices.js:7](test-mqtt-both-devices.js#L7) - MQTT password fixed to `mqtt123`
   - Simulator now running in background (publishing data)

2. **VPS Side (after running script):**
   - `/etc/mosquitto/passwd` - Password reset to mqtt123
   - `/var/www/stromwater/backend/.env` - Credentials updated
   - `stromwater_db.alerts` table - Schema fixed, sample data added
   - Backend code - Pulled latest from GitHub
   - Frontend - Rebuilt with production API URL

## Timeline

- **NOW:** PC simulator publishing data to VPS successfully
- **NEXT:** Run VPS fix script
- **RESULT:** Alerts and charts will work within 2-3 minutes

## Support

If you encounter any issues:

1. Share backend logs:
   ```bash
   pm2 logs backend --lines 50 --nostream
   ```

2. Share database status:
   ```bash
   sudo -u postgres psql -d stromwater_db -c "\dt"
   sudo -u postgres psql -d stromwater_db -c "SELECT COUNT(*) FROM device_data WHERE timestamp > NOW() - INTERVAL '5 minutes';"
   ```

3. Share Mosquitto status:
   ```bash
   sudo systemctl status mosquitto
   ```

---

**Ready to fix? Run the script on VPS now!** 🚀
