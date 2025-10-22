# Fix Trends Not Displaying - Complete Guide

## Problem
The trends/charts are not showing because:
- MQTT Simulator is publishing to **VPS broker** (43.205.194.142)
- Local Backend is reading from **local database** (localhost)
- Local database only has old data from October 21st

## Solution: Set Up Local MQTT Broker

### Step 1: Install Mosquitto MQTT Broker

1. **Download Mosquitto:**
   - Visit: https://mosquitto.org/download/
   - Download: `mosquitto-2.0.18-install-windows-x64.exe`
   - Or run: `SETUP-MOSQUITTO-LOCAL.bat` (will download automatically)

2. **Install Mosquitto:**
   - Run the installer
   - Install to default location: `C:\Program Files\mosquitto`
   - Complete the installation wizard

3. **Start Mosquitto Service:**
   ```cmd
   cd "C:\Program Files\mosquitto"
   mosquitto install
   net start mosquitto
   ```

4. **Verify Mosquitto is Running:**
   ```cmd
   netstat -ano | findstr ":1883"
   ```
   You should see a line showing port 1883 is listening

---

### Step 2: Update Backend to Use Local MQTT Broker

1. **Open backend .env file:**
   ```
   backend/.env
   ```

2. **Change MQTT configuration:**
   ```env
   # Change FROM:
   MQTT_BROKER_URL=mqtt://43.205.194.142:1883

   # Change TO:
   MQTT_BROKER_URL=mqtt://localhost:1883
   ```

3. **Keep other settings:**
   ```env
   MQTT_USERNAME=stromwater_mqtt
   MQTT_PASSWORD=StromWater@MQTT2024
   ```

4. **Restart backend server:**
   - Stop the current backend (Ctrl+C in the terminal)
   - Start it again: `npm start`

---

### Step 3: Update MQTT Simulator to Publish Locally

1. **Open the MQTT simulator file:**
   ```
   test-mqtt-both-devices.js
   ```

2. **Change broker URL (around line 9-12):**
   ```javascript
   // Change FROM:
   const BROKER_URL = 'mqtt://43.205.194.142:1883';

   // Change TO:
   const BROKER_URL = 'mqtt://localhost:1883';
   ```

3. **Stop current simulator:**
   - Press `Ctrl+C` in the terminal running the simulator

4. **Restart simulator:**
   ```cmd
   cd "C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ"
   node test-mqtt-both-devices.js
   ```

---

### Step 4: Verify Data Flow

1. **Check MQTT simulator output:**
   - You should see: `✓ Connected to MQTT broker successfully!`
   - You should see: `✓ Published to topic: devices/StromWater_Device_1/data`

2. **Check backend logs:**
   - You should see: `MQTT client connected`
   - You should see: `Received data for device: StromWater_Device_1`
   - You should see: `Data stored successfully`

3. **Check database:**
   ```cmd
   psql -U postgres -d stromwater_db
   SELECT COUNT(*), MAX(timestamp) FROM device_data;
   ```
   - Count should be increasing
   - Timestamp should be recent (current time)

4. **Refresh browser:**
   - Go to Dashboard: http://localhost:3000/
   - You should see live data updating
   - Charts should display with real-time trends

---

## Quick Commands Reference

### Check if Mosquitto is running:
```cmd
net start | findstr mosquitto
netstat -ano | findstr ":1883"
```

### Start Mosquitto:
```cmd
net start mosquitto
```

### Stop Mosquitto:
```cmd
net stop mosquitto
```

### View Mosquitto logs:
```cmd
type "C:\Program Files\mosquitto\mosquitto.log"
```

### Check database data:
```cmd
set PGPASSWORD=root
psql -U postgres -d stromwater_db -c "SELECT device_id, COUNT(*), MAX(timestamp) FROM device_data GROUP BY device_id;"
```

---

## Troubleshooting

### Issue: Mosquitto won't start
**Solution:** Check if port 1883 is already in use:
```cmd
netstat -ano | findstr ":1883"
```
Kill the process if needed, then start Mosquitto again.

### Issue: Backend not receiving MQTT messages
**Solution:**
1. Check backend logs for connection errors
2. Verify MQTT_BROKER_URL in backend/.env is `mqtt://localhost:1883`
3. Restart backend server

### Issue: Simulator can't connect
**Solution:**
1. Verify Mosquitto is running: `net start | findstr mosquitto`
2. Check BROKER_URL in test-mqtt-both-devices.js is `mqtt://localhost:1883`
3. Restart simulator

### Issue: Data not appearing in database
**Solution:**
1. Check backend MQTT subscription logs
2. Verify database connection in backend
3. Check for errors in backend console

---

## Expected Result

After completing all steps:
✅ Mosquitto running on localhost:1883
✅ MQTT Simulator publishing to localhost
✅ Backend subscribing to localhost MQTT topics
✅ Data being stored in local database
✅ Dashboard showing live data and trends
✅ Charts updating in real-time

---

## Alternative: Quick Test Without Installing Mosquitto

If you want to see trends immediately without setting up Mosquitto:

1. **Use VPS database instead:**
   - Change backend database config to connect to VPS PostgreSQL
   - This will show data from the VPS (where MQTT is currently publishing)

2. **Or point backend to VPS MQTT:**
   - Keep backend using VPS MQTT broker (current setup)
   - But VPS backend is already subscribed, so you'd have duplicate subscriptions

**Recommended: Install Mosquitto locally for proper local testing**
