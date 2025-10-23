# MQTT Simulator Guide - PC & Hardware

## 🎯 What is the MQTT Simulator?

The MQTT simulator sends fake IoT sensor data to your MQTT broker, mimicking real hardware devices. This is useful for:
- Testing the system without physical hardware
- Development and debugging
- Demonstrating features

---

## 📂 Files You Have

1. **test-mqtt-both-devices.js** - Simulator for 2 devices (Dubai & Sharjah)
2. **Backend MQTT listener** - Receives and stores data in database

---

## 🖥️ **Option 1: Run Simulator on YOUR PC (Windows)**

### **What It Does:**
Publishes data to VPS MQTT broker at `43.205.194.142:1883`

### **How to Run:**

```cmd
cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ
node test-mqtt-both-devices.js
```

### **What You Should See:**
```
✓ Connected to MQTT broker successfully!
Publishing data every 5 seconds...

[12:53:44 pm] Publish #1
📍 Dubai Pump Station (StromWater_Device_1)
   Water Level: 5.46m
   Voltage: R=406.8V Y=423.7V B=413.8V
   Current: R=22.2A Y=21.4A B=23.9A
   Pump 1: OFF  |  Pump 2: OFF
   ✓ Published to topic: devices/StromWater_Device_1/data
```

### **Configuration:**

Open `test-mqtt-both-devices.js` and check these lines:

```javascript
// MQTT Broker Configuration
const BROKER_URL = 'mqtt://43.205.194.142:1883';  // VPS IP
const USERNAME = 'stromwater_mqtt';
const PASSWORD = 'mqtt123';

// Publishing interval (milliseconds)
const PUBLISH_INTERVAL = 5000;  // 5 seconds
```

---

## 🌐 **Option 2: Run Simulator on VPS**

### **Why:**
- Always running, even when your PC is off
- Continuous data flow
- Lower latency

### **How to Run:**

```bash
# Connect to VPS
ssh ubuntu@43.205.194.142

# Navigate to project
cd /var/www/stromwater

# Check if file exists
ls -la test-mqtt-both-devices.js

# Run in background
nohup node test-mqtt-both-devices.js > mqtt-simulator.log 2>&1 &

# Check if running
ps aux | grep "test-mqtt"

# View logs
tail -f mqtt-simulator.log
```

### **Stop Simulator on VPS:**

```bash
# Find process ID
ps aux | grep "test-mqtt"

# Kill it
kill <PID>
```

---

## 🔌 **Option 3: Real Hardware Integration**

### **Hardware Setup:**

You need:
1. **IoT Device** (ESP32, Arduino, Raspberry Pi, etc.)
2. **Sensors:**
   - Water level sensor (ultrasonic/pressure)
   - Voltage sensor
   - Current sensor
   - Temperature sensor
3. **MQTT Client Library** on device

### **Device Configuration:**

**Arduino/ESP32 Example:**

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker
const char* mqtt_server = "43.205.194.142";
const int mqtt_port = 1883;
const char* mqtt_user = "stromwater_mqtt";
const char* mqtt_pass = "mqtt123";

// Device ID
const char* device_id = "StromWater_Device_1";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  // Connect to MQTT
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Read sensor data
  float waterLevel = readWaterLevel();
  float voltage_r = readVoltage(1);
  float current_r = readCurrent(1);

  // Create JSON payload
  String topic = "devices/" + String(device_id) + "/data";
  String payload = createPayload(waterLevel, voltage_r, current_r);

  // Publish to MQTT
  client.publish(topic.c_str(), payload.c_str());

  delay(5000);  // Publish every 5 seconds
}

String createPayload(float water, float volt, float curr) {
  return "{\"hydrostatic_value\":" + String(water) +
         ",\"vrms_1_r\":" + String(volt) +
         ",\"irms_1_r\":" + String(curr) + "}";
}
```

### **MQTT Topic Format:**

```
devices/{DEVICE_ID}/data
```

Examples:
- `devices/StromWater_Device_1/data`
- `devices/StromWater_Device_2/data`

### **Payload Format (JSON):**

```json
{
  "hydrostatic_value": 5.46,
  "vrms_1_r": 406.8,
  "vrms_1_y": 423.7,
  "vrms_1_b": 413.8,
  "vrms_2_r": 408.5,
  "vrms_2_y": 425.2,
  "vrms_2_b": 411.3,
  "irms_1_r": 22.2,
  "irms_1_y": 21.4,
  "irms_1_b": 23.9,
  "irms_2_r": 21.8,
  "irms_2_y": 22.6,
  "irms_2_b": 24.1,
  "pump_1_status": "ON",
  "pump_2_status": "OFF",
  "frequency": 50.0,
  "temperature": 28.5
}
```

---

## 🔍 **Verify Data Flow**

### **1. Check MQTT Broker (VPS):**

```bash
# Subscribe to all device topics
mosquitto_sub -h localhost -t "devices/#" -u stromwater_mqtt -P mqtt123
```

You should see incoming messages!

### **2. Check Backend Logs:**

```bash
pm2 logs backend | grep -i "received data"
```

Should show: `Received data for device: StromWater_Device_1`

### **3. Check Database:**

```bash
sudo -u postgres psql -d stromwater_db -c "SELECT device_id, COUNT(*), MAX(timestamp) FROM device_data GROUP BY device_id;"
```

Should show increasing count and recent timestamp!

---

## 📊 **Simulator Features**

The current simulator (`test-mqtt-both-devices.js`) simulates:

✅ 2 Devices (Dubai & Sharjah)
✅ Water level (3-8 meters, realistic fluctuation)
✅ 3-phase voltage (400-440V per phase)
✅ 3-phase current (20-40A per phase)
✅ Pump status (random ON/OFF)
✅ Frequency (50Hz)
✅ Temperature (25-35°C)
✅ Publishes every 5 seconds

---

## 🛠️ **Customize Simulator**

Edit `test-mqtt-both-devices.js`:

```javascript
// Change publishing interval
const PUBLISH_INTERVAL = 10000;  // 10 seconds instead of 5

// Add more devices
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
    id: 'StromWater_Device_3',  // NEW DEVICE
    name: 'Abu Dhabi Station',
    location: 'Abu Dhabi'
  }
];

// Adjust sensor value ranges
const waterLevel = 4.0 + Math.random() * 5.0;  // 4-9 meters
```

---

## 🎯 **Quick Start Checklist**

**For PC Simulator:**
- [ ] Install Node.js
- [ ] Run `node test-mqtt-both-devices.js`
- [ ] Should see "✓ Connected to MQTT broker"
- [ ] Should see publishing messages every 5 seconds

**For VPS Backend:**
- [ ] Mosquitto running: `sudo systemctl status mosquitto`
- [ ] Backend running: `pm2 status backend`
- [ ] Backend logs show: "MQTT client connected"
- [ ] Database receiving data

**For Hardware:**
- [ ] Configure WiFi on device
- [ ] Set MQTT broker IP: `43.205.194.142`
- [ ] Set credentials: `stromwater_mqtt` / `mqtt123`
- [ ] Publish to topic: `devices/{DEVICE_ID}/data`
- [ ] Send JSON payload with sensor values

---

## 🆘 **Troubleshooting**

### **Simulator can't connect:**
```
Error: connect ECONNREFUSED
```
**Fix:** Check if Mosquitto is running on VPS:
```bash
sudo systemctl status mosquitto
```

### **Data not in database:**
**Fix:** Check backend is subscribed:
```bash
pm2 logs backend | grep MQTT
```

### **Wrong credentials:**
```
Connection refused: Not authorized
```
**Fix:** Check username/password in simulator matches VPS Mosquitto config

---

## 📞 **Support**

**Check simulator status:**
```bash
# On PC
# Look for console output with "✓ Published"

# On VPS
tail -f mqtt-simulator.log
```

**Check data arrival:**
```bash
# Database query
sudo -u postgres psql -d stromwater_db -c "SELECT COUNT(*) FROM device_data WHERE timestamp > NOW() - INTERVAL '1 minute';"
```

Should be > 0 if simulator is working!

---

**Your MQTT simulator is ALREADY running on your PC!** Check the console window to see if it's publishing data. 🚀
