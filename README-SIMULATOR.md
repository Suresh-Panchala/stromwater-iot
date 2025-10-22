# StromWater IoT - Multi-Device MQTT Simulator

Send test data from your Windows computer to the VPS production server.

---

## 🚀 Quick Start

### Method 1: Double-click to Run
1. Double-click: **`START-SIMULATOR-BOTH-DEVICES.bat`**
2. The simulator will start publishing data every 5 seconds
3. Press **Ctrl+C** to stop

### Method 2: Command Line
```cmd
node test-mqtt-both-devices.js
```

---

## ⚙️ Configuration

Edit `test-mqtt-both-devices.js` to change settings:

```javascript
// Your VPS IP address
const MQTT_CONFIG = {
  broker: 'mqtt://43.205.194.142:1883',  // Change if needed
  username: 'stromwater_mqtt',
  password: 'mqtt123',
  // ...
};

// Devices to simulate
const DEVICES = [
  {
    id: 'StromWater_Device_1',
    name: 'Dubai Pump Station',
    location: 'Dubai Industrial Area'
  },
  {
    id: 'StromWater_Device_2',
    name: 'Sharjah Pump Station',
    location: 'Sharjah Industrial Area'
  }
];

// Publish interval (milliseconds)
const PUBLISH_INTERVAL = 5000; // 5 seconds
```

---

## 📊 What It Simulates

The simulator publishes realistic data for:

### Water Monitoring:
- **Water Level:** 3-8 meters with random variation
- **High Level Alerts:** Triggered above 7.5m

### Electrical Parameters (3-Phase):
- **Voltage:** 400-430V AC (Phase R, Y, B)
- **Current:** 20-35A (Phase R, Y, B)
- **Frequency:** 50Hz

### Pump Status:
- **Pump 1 & 2:** Automatically ON/OFF based on water level
- **Protection Status:** Simulated alerts

### Additional Data:
- **Temperature:** 25-35°C
- **Timestamp:** Current time (ISO format)
- **Location:** GPS coordinates

---

## 🖥️ Expected Output

```
╔════════════════════════════════════════════════════════╗
║   StromWater IoT - Multi-Device MQTT Simulator        ║
╚════════════════════════════════════════════════════════╝

Connecting to MQTT broker...
Broker: mqtt://43.205.194.142:1883
Username: stromwater_mqtt
Devices: 2

✓ Connected to MQTT broker successfully!

Publishing data every 5 seconds...
Press Ctrl+C to stop

────────────────────────────────────────────────────────

[8:15:23 PM] Publish #1
────────────────────────────────────────────────────────

📍 Dubai Pump Station (StromWater_Device_1)
   Water Level: 5.23m
   Voltage: R=415.2V Y=418.7V B=416.1V
   Current: R=25.3A Y=26.8A B=25.1A
   Pump 1: ON  |  Pump 2: OFF
   ✓ Published to topic: devices/StromWater_Device_1/data

📍 Sharjah Pump Station (StromWater_Device_2)
   Water Level: 6.45m
   Voltage: R=410.5V Y=412.3V B=411.8V
   Current: R=22.7A Y=23.1A B=22.9A
   Pump 1: ON  |  Pump 2: ON
   ✓ Published to topic: devices/StromWater_Device_2/data

────────────────────────────────────────────────────────
```

---

## ✅ Verify It's Working

### 1. Check Simulator Output
You should see `✓ Published to topic` messages every 5 seconds.

### 2. Check VPS Backend Logs
On your VPS:
```bash
pm2 logs stromwater-backend --lines 20
```

Should show:
```
Device data stored successfully for: StromWater_Device_1
Device data stored successfully for: StromWater_Device_2
```

### 3. Check Dashboard
1. Open browser: `http://43.205.194.142`
2. Login: `admin` / `admin123`
3. Look for **device selector dropdown** at top
4. Switch between devices
5. Watch data update in real-time!

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'mqtt'"
**Solution:**
```cmd
npm install mqtt
```

### Error: "ECONNREFUSED" or "Connection refused"
**Cause:** Can't connect to VPS MQTT broker

**Solutions:**
1. Verify VPS IP is correct (43.205.194.142)
2. Check VPS firewall allows port 1883:
   ```bash
   sudo ufw status
   sudo ufw allow 1883/tcp
   ```
3. Verify Mosquitto is running:
   ```bash
   sudo systemctl status mosquitto
   ```

### Error: "Connection refused: Not authorized"
**Cause:** Wrong MQTT username or password

**Solutions:**
1. Check credentials in `test-mqtt-both-devices.js`
2. Verify MQTT user exists on VPS:
   ```bash
   sudo cat /etc/mosquitto/passwd
   ```
3. Recreate MQTT user:
   ```bash
   sudo mosquitto_passwd -c /etc/mosquitto/passwd stromwater_mqtt
   # Enter password: mqtt123
   sudo systemctl restart mosquitto
   ```

### Data not showing in dashboard
**Solutions:**
1. Check backend is running:
   ```bash
   pm2 status
   ```
2. Check MQTT is connected:
   ```bash
   curl http://43.205.194.142/health
   ```
   Should show `"mqtt": {"connected": true}`

3. Verify devices exist in database:
   ```bash
   sudo -u postgres psql -d stromwater_db -c "SELECT device_id FROM devices;"
   ```

---

## 🎯 Add More Devices

To simulate additional devices, edit `test-mqtt-both-devices.js`:

```javascript
const DEVICES = [
  {
    id: 'StromWater_Device_1',
    name: 'Dubai Pump Station',
    location: 'Dubai Industrial Area'
  },
  {
    id: 'StromWater_Device_2',
    name: 'Sharjah Pump Station',
    location: 'Sharjah Industrial Area'
  },
  {
    id: 'StromWater_Device_3',  // NEW
    name: 'Ajman Pump Station',
    location: 'Ajman Industrial Zone'
  }
];
```

Don't forget to add the device to database first:
```bash
sudo -u postgres psql -d stromwater_db -c "INSERT INTO devices VALUES ('StromWater_Device_3', 'Ajman Station', 'Ajman', 25.4052, 55.5136, true, NOW(), NOW(), NULL);"
```

---

## 🔄 Continuous Running

### Run in Background (Optional)
Use **PM2** to run simulator in background on Windows:

```cmd
npm install -g pm2
pm2 start test-mqtt-both-devices.js --name stromwater-simulator
pm2 logs stromwater-simulator
pm2 stop stromwater-simulator
```

---

## 📝 Data Format

The simulator publishes JSON in this format:

```json
{
  "device_id": "StromWater_Device_1",
  "device_name": "Dubai Pump Station",
  "location": "Dubai Industrial Area",
  "timestamp": "2025-10-21T20:15:23.456Z",
  "hydrostatic_value": 5.23,
  "vrms_1_r": 415.2,
  "vrms_1_y": 418.7,
  "vrms_1_b": 416.1,
  "irms_1_r": 25.3,
  "irms_1_y": 26.8,
  "irms_1_b": 25.1,
  "vrms_2_r": 415.2,
  "vrms_2_y": 418.7,
  "vrms_2_b": 416.1,
  "irms_2_r": 25.3,
  "irms_2_y": 26.8,
  "irms_2_b": 25.1,
  "pump_1_status": "ON",
  "pump_2_status": "OFF",
  "frequency": 50.0,
  "temperature": 28.5,
  "dry_run_alert": 0,
  "high_level_float_alert": 0,
  "pump_1_protection": 0,
  "pump_2_protection": 0
}
```

---

## 🎉 Success!

Once running, you should see:
- ✅ Simulator publishing data every 5 seconds
- ✅ VPS backend storing data in database
- ✅ Dashboard showing live data for all devices
- ✅ Device selector dropdown working
- ✅ Real-time charts updating

---

**Your StromWater IoT Platform is now fully operational with multiple devices!** 🚀💧
