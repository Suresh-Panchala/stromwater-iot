#!/usr/bin/env python3
"""
StromWater IoT - MQTT Simulator (Python)
Publishes simulated sensor data for two pump stations to MQTT broker
"""

import json
import random
import time
from datetime import datetime
import paho.mqtt.client as mqtt

# ==================== CONFIGURATION ====================
MQTT_BROKER = "43.205.194.142"
MQTT_PORT = 1883
MQTT_USERNAME = "stromwater_mqtt"
MQTT_PASSWORD = "mqtt123"
PUBLISH_INTERVAL = 5  # seconds

DEVICES = [
    {
        "id": "StromWater_Device_1",
        "name": "Dubai Pump Station",
        "location": "Dubai Industrial Area"
    },
    {
        "id": "StromWater_Device_2",
        "name": "Sharjah Pump Station",
        "location": "Sharjah Industrial Area"
    }
]

# ==================== MQTT CALLBACKS ====================
def on_connect(client, userdata, flags, rc):
    """Callback when connected to MQTT broker"""
    if rc == 0:
        print("✓ Connected to MQTT broker successfully!")
        print(f"Publishing data every {PUBLISH_INTERVAL} seconds...")
        print("Press Ctrl+C to stop\n")
        print("=" * 80)
    else:
        print(f"✗ Connection failed with code {rc}")
        print("\nTroubleshooting:")
        print(f"1. Check VPS IP address: {MQTT_BROKER}")
        print(f"2. Verify MQTT credentials: {MQTT_USERNAME} / {MQTT_PASSWORD}")
        print("3. Ensure VPS firewall allows port 1883")
        print("4. Check Mosquitto is running: sudo systemctl status mosquitto")

def on_disconnect(client, userdata, rc):
    """Callback when disconnected from MQTT broker"""
    if rc != 0:
        print("\n⚠ Unexpected disconnection. Reconnecting...")

def on_publish(client, userdata, mid):
    """Callback when message is published"""
    pass  # Message published successfully

# ==================== DATA GENERATION ====================
def generate_sensor_data(device, index):
    """Generate simulated sensor data for a device"""
    base_voltage = 400 + (index * 10)
    base_current = 20 + (index * 5)
    base_water_level = 3 + (index * 2)

    # Random water level (3-8 meters)
    water_level = base_water_level + random.uniform(0, 3)

    data = {
        "device_id": device["id"],
        "device_name": device["name"],
        "location": device["location"],
        "timestamp": datetime.utcnow().isoformat() + "Z",

        # Water level (3-8 meters with random variation)
        "hydrostatic_value": round(water_level, 2),

        # Pump 1 - 3 Phase Voltage (400-430V)
        "vrms_1_r": round(base_voltage + random.uniform(0, 30), 1),
        "vrms_1_y": round(base_voltage + random.uniform(0, 30), 1),
        "vrms_1_b": round(base_voltage + random.uniform(0, 30), 1),

        # Pump 1 - 3 Phase Current (20-35A)
        "irms_1_r": round(base_current + random.uniform(0, 15), 1),
        "irms_1_y": round(base_current + random.uniform(0, 15), 1),
        "irms_1_b": round(base_current + random.uniform(0, 15), 1),

        # Pump 2 - 3 Phase Voltage
        "vrms_2_r": round(base_voltage + random.uniform(0, 30), 1),
        "vrms_2_y": round(base_voltage + random.uniform(0, 30), 1),
        "vrms_2_b": round(base_voltage + random.uniform(0, 30), 1),

        # Pump 2 - 3 Phase Current
        "irms_2_r": round(base_current + random.uniform(0, 15), 1),
        "irms_2_y": round(base_current + random.uniform(0, 15), 1),
        "irms_2_b": round(base_current + random.uniform(0, 15), 1),

        # Pump status (ON/OFF based on water level)
        "pump_1_status": "ON" if water_level > 5 else "OFF",
        "pump_2_status": "ON" if water_level > 6 else "OFF",

        # Additional parameters
        "frequency": 50.0,
        "temperature": round(25 + random.uniform(0, 10), 1),

        # Alert flags
        "dry_run_alert": 0,
        "high_level_float_alert": 1 if water_level > 7.5 else 0,
        "pump_1_protection": 0,
        "pump_2_protection": 0
    }

    return data

# ==================== DISPLAY FUNCTIONS ====================
def get_colored_status(status):
    """Return colored status text"""
    if status == "ON":
        return "\033[32mON\033[0m"  # Green
    else:
        return "\033[90mOFF\033[0m"  # Gray

def display_device_data(device, data):
    """Display published device data"""
    print(f"\n📍 {device['name']} ({device['id']})")
    print(f"   Water Level: {data['hydrostatic_value']:.2f}m")
    print(f"   Voltage: R={data['vrms_1_r']}V Y={data['vrms_1_y']}V B={data['vrms_1_b']}V")
    print(f"   Current: R={data['irms_1_r']}A Y={data['irms_1_y']}A B={data['irms_1_b']}A")
    print(f"   Pump 1: {get_colored_status(data['pump_1_status'])}  |  Pump 2: {get_colored_status(data['pump_2_status'])}")
    print(f"   ✓ Published to topic: devices/{device['id']}/data")

# ==================== MAIN ====================
def main():
    """Main function"""
    print("╔════════════════════════════════════════════════════════╗")
    print("║   StromWater IoT - MQTT Simulator (Python)            ║")
    print("╚════════════════════════════════════════════════════════╝\n")

    print(f"Connecting to MQTT broker...")
    print(f"Broker: {MQTT_BROKER}:{MQTT_PORT}")
    print(f"Username: {MQTT_USERNAME}")
    print(f"Devices: {len(DEVICES)}\n")

    # Create MQTT client
    client = mqtt.Client(client_id=f"Python_Simulator_{random.randint(1000, 9999)}")
    client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)

    # Set callbacks
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_publish = on_publish

    # Connect to broker
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()

        # Publish data loop
        publish_count = 0
        while True:
            publish_count += 1
            timestamp = datetime.now().strftime("%I:%M:%S %p")

            print(f"\n[{timestamp}] Publish #{publish_count}")
            print("─" * 80)

            # Publish data for each device
            for index, device in enumerate(DEVICES):
                data = generate_sensor_data(device, index)
                topic = f"devices/{device['id']}/data"

                # Publish to MQTT
                result = client.publish(topic, json.dumps(data), qos=1)

                if result.rc == mqtt.MQTT_ERR_SUCCESS:
                    display_device_data(device, data)
                else:
                    print(f"✗ Failed to publish for {device['name']}")

            print("\n" + "─" * 80)

            # Wait before next publish
            time.sleep(PUBLISH_INTERVAL)

    except KeyboardInterrupt:
        print("\n\n╔════════════════════════════════════════════════════════╗")
        print("║   Shutting down simulator...                          ║")
        print("╚════════════════════════════════════════════════════════╝\n")
        client.loop_stop()
        client.disconnect()
        print("✓ MQTT client disconnected")
        print("✓ Simulator stopped\n")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    main()
