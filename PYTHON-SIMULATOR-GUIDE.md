# Python MQTT Simulator Guide

## Overview

This Python script simulates two pump stations sending sensor data to the StromWater IoT system via MQTT.

## Prerequisites

- Python 3.7 or higher
- pip (Python package manager)

## Installation

### Windows

```bash
# Install Python from python.org if not already installed

# Install required package
pip install paho-mqtt

# Or use requirements.txt
pip install -r requirements.txt
```

### Linux (Ubuntu/VPS)

```bash
# Install Python and pip
sudo apt update
sudo apt install python3 python3-pip -y

# Install required package
pip3 install paho-mqtt

# Or use requirements.txt
pip3 install -r requirements.txt
```

## Configuration

The simulator is pre-configured to connect to your VPS:

```python
MQTT_BROKER = "43.205.194.142"
MQTT_PORT = 1883
MQTT_USERNAME = "stromwater_mqtt"
MQTT_PASSWORD = "mqtt123"
PUBLISH_INTERVAL = 5  # seconds
```

To change these settings, edit [mqtt_simulator.py](mqtt_simulator.py#L13-L17)

## Usage

### On Windows PC

```bash
# Navigate to project directory
cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ

# Run the simulator
python mqtt_simulator.py
```

### On Linux/VPS

```bash
# Navigate to project directory
cd /var/www/stromwater

# Run the simulator
python3 mqtt_simulator.py

# Or run in background with nohup
nohup python3 mqtt_simulator.py > mqtt_simulator.log 2>&1 &

# View logs
tail -f mqtt_simulator.log
```

### Using systemd (VPS - Recommended for Production)

Create a systemd service for automatic startup:

```bash
sudo nano /etc/systemd/system/mqtt-simulator.service
```

Add this content:

```ini
[Unit]
Description=StromWater MQTT Simulator
After=network.target mosquitto.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/stromwater
ExecStart=/usr/bin/python3 /var/www/stromwater/mqtt_simulator.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mqtt-simulator
sudo systemctl start mqtt-simulator

# Check status
sudo systemctl status mqtt-simulator

# View logs
sudo journalctl -u mqtt-simulator -f
```

## Output

The simulator displays:

```
╔════════════════════════════════════════════════════════╗
║   StromWater IoT - MQTT Simulator (Python)            ║
╚════════════════════════════════════════════════════════╝

Connecting to MQTT broker...
Broker: 43.205.194.142:1883
Username: stromwater_mqtt
Devices: 2

✓ Connected to MQTT broker successfully!
Publishing data every 5 seconds...
Press Ctrl+C to stop

================================================================================

[12:30:45 PM] Publish #1
────────────────────────────────────────────────────────────────────────────────

📍 Dubai Pump Station (StromWater_Device_1)
   Water Level: 4.56m
   Voltage: R=415.3V Y=423.1V B=409.2V
   Current: R=25.4A Y=28.7A B=31.2A
   Pump 1: ON  |  Pump 2: OFF
   ✓ Published to topic: devices/StromWater_Device_1/data

📍 Sharjah Pump Station (StromWater_Device_2)
   Water Level: 6.89m
   Voltage: R=425.8V Y=432.4V B=418.9V
   Current: R=32.1A Y=35.6A B=29.8A
   Pump 1: ON  |  Pump 2: ON
   ✓ Published to topic: devices/StromWater_Device_2/data
```

## Data Format

Each device publishes JSON data to topic `devices/{DEVICE_ID}/data`:

```json
{
  "device_id": "StromWater_Device_1",
  "device_name": "Dubai Pump Station",
  "location": "Dubai Industrial Area",
  "timestamp": "2025-10-23T12:30:45.123Z",
  "hydrostatic_value": 4.56,
  "vrms_1_r": 415.3,
  "vrms_1_y": 423.1,
  "vrms_1_b": 409.2,
  "irms_1_r": 25.4,
  "irms_1_y": 28.7,
  "irms_1_b": 31.2,
  "vrms_2_r": 425.8,
  "vrms_2_y": 432.4,
  "vrms_2_b": 418.9,
  "irms_2_r": 32.1,
  "irms_2_y": 35.6,
  "irms_2_b": 29.8,
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

## Troubleshooting

### Connection Refused

```
✗ Connection failed with code 1
```

**Solutions:**
1. Check VPS Mosquitto is running: `sudo systemctl status mosquitto`
2. Check firewall allows port 1883: `sudo ufw status`
3. Verify VPS IP address is correct
4. Test MQTT broker: `mosquitto_sub -h 43.205.194.142 -t "devices/#" -u stromwater_mqtt -P mqtt123`

### Authentication Failed

```
✗ Connection failed with code 5
```

**Solutions:**
1. Verify MQTT username/password in script
2. Check VPS Mosquitto password file: `sudo cat /etc/mosquitto/passwd`
3. Reset password: `sudo mosquitto_passwd -b /etc/mosquitto/passwd stromwater_mqtt mqtt123`

### Module Not Found

```
ModuleNotFoundError: No module named 'paho'
```

**Solution:**
```bash
pip install paho-mqtt
# or on Linux
pip3 install paho-mqtt
```

## Stopping the Simulator

### Interactive Mode
Press `Ctrl+C` to stop

### Background Process
```bash
# Find process
ps aux | grep mqtt_simulator

# Kill by PID
kill <PID>
```

### Systemd Service
```bash
sudo systemctl stop mqtt-simulator
```

## Comparison with Node.js Simulator

| Feature | Python | Node.js |
|---------|--------|---------|
| Installation | pip install paho-mqtt | npm install mqtt |
| File | mqtt_simulator.py | test-mqtt-both-devices.js |
| Run | python3 mqtt_simulator.py | node test-mqtt-both-devices.js |
| Dependencies | 1 package | 1 package |
| Performance | Good | Excellent |
| Cross-platform | ✓ | ✓ |

Both simulators produce identical data and work equally well!

## Advantages of Python Simulator

1. **Pre-installed on Linux** - Most Linux systems have Python by default
2. **Simple syntax** - Easy to read and modify
3. **Wide support** - Works on all platforms
4. **Easy debugging** - Clear error messages
5. **Systemd friendly** - Easy to run as a service

## Next Steps

1. Run the simulator
2. Verify MQTT connection
3. Check backend logs: `pm2 logs backend`
4. Verify data in database:
   ```bash
   sudo -u postgres psql -d stromwater_db -c "SELECT device_id, COUNT(*), MAX(timestamp) FROM device_data WHERE timestamp > NOW() - INTERVAL '5 minutes' GROUP BY device_id;"
   ```
5. Open website and check Alerts & Analytics pages

---

**Created for StromWater IoT System**
📍 VPS: 43.205.194.142
🔌 MQTT Port: 1883
