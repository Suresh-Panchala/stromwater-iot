# ESP32 + SIMCOM A7670C - StromWater IoT Device

Complete Arduino code for ESP32 with SIMCOM A7670C 4G/LTE module to send sensor data to the StromWater IoT platform via MQTT.

---

## 📋 Hardware Requirements

### Main Components
- **ESP32 Development Board** (ESP32-DevKitC or similar)
- **SIMCOM A7670C 4G/LTE Module** (or A7670E/A7670G)
- **4G SIM Card** with data plan
- **12V Power Supply** (for A7670C)
- **5V Power Supply** (for ESP32)

### Sensors (Based on your platform)
- **Hydrostatic Water Level Sensor** (4-20mA or 0-5V output)
- **3-Phase Voltage Sensor** (ZMPT101B or similar) x3
- **3-Phase Current Sensor** (ACS712 30A or SCT-013) x3
- **Temperature Sensor** (DS18B20 or DHT22) - Optional

### Additional Components
- Relay modules (2x) for pump control
- Voltage divider resistors for analog inputs
- Jumper wires
- Breadboard or custom PCB

---

## 🔌 Wiring Diagram

### ESP32 to A7670C Connection

```
ESP32          A7670C
-----          ------
GPIO 16 (RX) → TXD
GPIO 17 (TX) → RXD
GND          → GND
5V           → VCCIO (Logic level)

A7670C Power:
12V PSU (+)  → VBAT
12V PSU (-)  → GND
```

### Sensor Connections

**Water Level Sensor:**
```
Sensor (+)   → 5V
Sensor (-)   → GND
Sensor (OUT) → ESP32 GPIO 34 (via voltage divider if > 3.3V)
```

**3-Phase Voltage Sensors (ZMPT101B):**
```
ZMPT101B-R:
  VCC  → 5V
  GND  → GND
  OUT  → ESP32 GPIO 35

ZMPT101B-Y:
  VCC  → 5V
  GND  → GND
  OUT  → ESP32 GPIO 32

ZMPT101B-B:
  VCC  → 5V
  GND  → GND
  OUT  → ESP32 GPIO 33
```

**3-Phase Current Sensors (ACS712):**
```
ACS712-R:
  VCC  → 5V
  GND  → GND
  OUT  → ESP32 GPIO 25

ACS712-Y:
  VCC  → 5V
  GND  → GND
  OUT  → ESP32 GPIO 26

ACS712-B:
  VCC  → 5V
  GND  → GND
  OUT  → ESP32 GPIO 27
```

**Pump Control Relays:**
```
Relay 1:
  VCC  → 5V
  GND  → GND
  IN   → ESP32 GPIO 18

Relay 2:
  VCC  → 5V
  GND  → GND
  IN   → ESP32 GPIO 19
```

---

## 📚 Required Arduino Libraries

Install these libraries via Arduino IDE Library Manager:

1. **ArduinoJson** (by Benoit Blanchon)
   ```
   Tools → Manage Libraries → Search "ArduinoJson" → Install
   ```

2. **ESP32 Board Support**
   ```
   File → Preferences → Additional Board Manager URLs:
   https://dl.espressif.com/dl/package_esp32_index.json

   Tools → Board → Boards Manager → Search "ESP32" → Install
   ```

---

## ⚙️ Configuration

### 1. Update MQTT Settings

Edit `config.h` or the main `.ino` file:

```cpp
// Your VPS IP Address
#define MQTT_BROKER       "43.205.194.142"
#define MQTT_PORT         "1883"
#define MQTT_USERNAME     "stromwater"
#define MQTT_PASSWORD     "your_mqtt_password"  // ⚠️ CHANGE THIS!
```

### 2. Update SIM Card APN

Change based on your carrier:

```cpp
// Common APNs:
// India - Airtel: "airtel"
// India - Jio: "jionet"
// UAE - Etisalat: "etisalat"
// UAE - Du: "du"

#define APN_NAME          "internet"  // ⚠️ CHANGE THIS
```

### 3. Update Device Information

```cpp
#define DEVICE_ID         "StromWater_Device_1"
#define DEVICE_NAME       "Your Pump Station Name"
#define DEVICE_LOCATION   "Your Location"
```

---

## 🚀 Upload Instructions

### Step 1: Connect ESP32 to Computer
- Connect ESP32 to your computer via USB
- Install CP210x or CH340 drivers if needed

### Step 2: Configure Arduino IDE
1. Open Arduino IDE
2. Select Board: `Tools → Board → ESP32 Dev Module`
3. Select Port: `Tools → Port → COM_X` (your ESP32 port)
4. Set upload speed: `Tools → Upload Speed → 115200`

### Step 3: Upload Code
1. Open `ESP32_A7670C_StromWater.ino`
2. Update configuration in `config.h`
3. Click **Upload** button
4. Wait for "Done uploading" message

### Step 4: Monitor Serial Output
1. Open Serial Monitor: `Tools → Serial Monitor`
2. Set baud rate to **115200**
3. You should see initialization messages

---

## 📊 Expected Serial Output

```
=================================
StromWater IoT - ESP32 A7670C
=================================

Initializing A7670C module...

--- Initializing Module ---
✓ SIM card ready
✓ APN configured
✓ Module initialized

--- Checking Network ---
Signal: +CSQ: 25,0
✓ Registered on network
✓ GPRS attached
✓ Network ready

--- Connecting MQTT ---
✓ MQTT client acquired
✓ Connected to MQTT broker
✓ Broker: 43.205.194.142

--- Publishing Data ---
Topic: devices/StromWater_Device_1/data
Payload: {"device_id":"StromWater_Device_1","hydrostatic_value":5.2,...}
✓ Data published successfully
```

---

## 🐛 Troubleshooting

### A7670C Not Responding
**Symptoms:** No response to AT commands

**Solutions:**
1. Check wiring (RX/TX pins correct?)
2. Check power supply (A7670C needs 12V, 2A minimum)
3. Verify baud rate (default 115200)
4. Press power key for 2 seconds to turn on module
5. Check SIM card is inserted correctly

### SIM Card Not Detected
**Symptoms:** "SIM card not ready" message

**Solutions:**
1. Remove and reinsert SIM card
2. Check SIM card has data plan activated
3. Verify PIN code is disabled on SIM
4. Wait 10-15 seconds after power-on

### Network Registration Failed
**Symptoms:** "Not registered on network"

**Solutions:**
1. Check signal strength (AT+CSQ) - should be >10
2. Verify APN settings for your carrier
3. Check antenna is connected
4. Move to area with better signal
5. Wait 30-60 seconds for registration

### MQTT Connection Failed
**Symptoms:** "Failed to connect to MQTT broker"

**Solutions:**
1. Verify MQTT broker IP is correct
2. Check MQTT credentials (username/password)
3. Ensure VPS firewall allows port 1883
4. Test with: `mosquitto_sub -h 43.205.194.142 -t test -u stromwater -P password`
5. Check network connectivity: ping your VPS

### Data Not Showing in Dashboard
**Symptoms:** MQTT publishes OK but no data in dashboard

**Solutions:**
1. Check device_id matches exactly (case-sensitive!)
2. Verify topic format: `devices/StromWater_Device_1/data`
3. Check backend logs on VPS: `pm2 logs stromwater-backend`
4. Verify database is receiving data: `psql -U stromwater_user -d stromwater_db -c "SELECT * FROM device_data ORDER BY timestamp DESC LIMIT 5;"`

---

## 📈 Sensor Calibration

### Water Level Sensor Calibration

```cpp
// Measure actual water level vs sensor voltage
// Example: 0m = 0.5V, 10m = 4.5V

float calibrateWaterLevel(int rawADC) {
  float voltage = (rawADC / 4095.0) * 3.3;
  float level = ((voltage - 0.5) / 4.0) * 10.0;
  return constrain(level, 0.0, 10.0);
}
```

### Voltage Sensor Calibration

```cpp
// For ZMPT101B: Measure known AC voltage
// Adjust VOLTAGE_SCALE factor

float calibrateVoltage(int rawADC) {
  float voltage = (rawADC / 4095.0) * 3.3;
  float acVoltage = voltage * VOLTAGE_SCALE;  // Adjust scale
  return acVoltage;
}
```

### Current Sensor Calibration

```cpp
// For ACS712: Zero current = 2.5V (midpoint)
// 100mV per Amp for 20A version

float calibrateCurrent(int rawADC) {
  float voltage = (rawADC / 4095.0) * 3.3;
  float current = (voltage - 2.5) / 0.1;  // 100mV/A
  return abs(current);
}
```

---

## 🔐 Security Best Practices

1. **Change Default Password**
   - Update MQTT password from default
   - Use strong, unique password

2. **Secure SIM Card**
   - Disable SIM PIN if not needed
   - Or securely store PIN in code

3. **Over-the-Air Updates**
   - Consider adding OTA update capability
   - Allows remote firmware updates

4. **Data Encryption**
   - For production, use MQTTS (TLS/SSL)
   - Update A7670C firmware for SSL support

---

## 📝 AT Commands Reference

Useful AT commands for debugging:

```
AT              - Test connection
AT+CSQ          - Check signal quality
AT+CREG?        - Check network registration
AT+CGATT?       - Check GPRS attachment
AT+CPIN?        - Check SIM status
AT+CMQTTSTART   - Start MQTT service
AT+CMQTTACCQ    - Acquire MQTT client
AT+CMQTTCONNECT - Connect to MQTT broker
AT+CMQTTPUB     - Publish MQTT message
AT+CMQTTDISC    - Disconnect MQTT
AT+CMQTTSTOP    - Stop MQTT service
```

---

## 🔄 Data Flow Diagram

```
┌─────────────┐
│   Sensors   │ (Water level, Voltage, Current)
└──────┬──────┘
       │ Analog signals
       ▼
┌─────────────┐
│    ESP32    │ ADC conversion, JSON formatting
└──────┬──────┘
       │ UART (AT commands)
       ▼
┌─────────────┐
│   A7670C    │ 4G/LTE connectivity
└──────┬──────┘
       │ MQTT over 4G
       ▼
┌─────────────┐
│  Internet   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   VPS (IP)  │ 43.205.194.142:1883
│   Mosquitto │
└──────┬──────┘
       │ MQTT subscribe
       ▼
┌─────────────┐
│   Backend   │ Node.js + PostgreSQL
│   Server    │
└──────┬──────┘
       │ WebSocket
       ▼
┌─────────────┐
│  Dashboard  │ Real-time display
└─────────────┘
```

---

## 📦 Project Files

```
ESP32_A7670C_StromWater/
├── ESP32_A7670C_StromWater.ino    # Main Arduino code
├── config.h                        # Configuration file
├── README.md                       # This file
├── wiring_diagram.png              # Hardware connections
└── libraries/                      # Required libraries
    ├── ArduinoJson
    └── ESP32
```

---

## 🆘 Support

If you encounter issues:

1. Check Serial Monitor output
2. Verify all connections
3. Test individual components
4. Check VPS MQTT broker is running
5. Review backend logs: `pm2 logs stromwater-backend`

---

## 📄 License

MIT License - Free to use and modify

---

## 🎯 Next Steps

After successful deployment:

1. ✅ Test data publishing to dashboard
2. ✅ Calibrate sensors for accurate readings
3. ✅ Set up alert thresholds in dashboard
4. ✅ Configure automatic pump control
5. ✅ Add more devices as needed

---

**Your ESP32 is now ready to send real-time water monitoring data to your StromWater IoT platform!** 🚀💧
