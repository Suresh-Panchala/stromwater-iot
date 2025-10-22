/*
 * Configuration Header for ESP32 + A7670C StromWater IoT
 *
 * IMPORTANT: Update these values before uploading!
 */

#ifndef CONFIG_H
#define CONFIG_H

// ==================== MQTT BROKER SETTINGS ====================
// Your VPS IP address or domain name
#define MQTT_BROKER       "43.205.194.142"
#define MQTT_PORT         "1883"
#define MQTT_USERNAME     "stromwater"
#define MQTT_PASSWORD     "your_mqtt_password_here"  // ⚠️ CHANGE THIS!

// Device identification
#define MQTT_CLIENT_ID    "ESP32_Device_1"
#define MQTT_TOPIC        "devices/StromWater_Device_1/data"

// ==================== DEVICE INFO ====================
#define DEVICE_ID         "StromWater_Device_1"
#define DEVICE_NAME       "Dubai Pump Station Alpha"
#define DEVICE_LOCATION   "Dubai Industrial Area Zone 1"
#define DEVICE_LATITUDE   25.2048
#define DEVICE_LONGITUDE  55.2708

// ==================== SIM CARD APN SETTINGS ====================
// Common APN settings for different carriers:

// India:
// - Airtel: "airtel"
// - Jio: "jionet"
// - Vodafone: "www"
// - BSNL: "bsnlnet"

// UAE:
// - Etisalat: "etisalat"
// - Du: "du"

// USA:
// - AT&T: "phone"
// - T-Mobile: "fast.t-mobile.com"
// - Verizon: "vzwinternet"

#define APN_NAME          "internet"  // ⚠️ CHANGE based on your SIM carrier
#define APN_USERNAME      ""          // Usually empty
#define APN_PASSWORD      ""          // Usually empty

// ==================== HARDWARE PIN CONFIGURATION ====================

// A7670C UART Pins
#define A7670C_RX_PIN     16    // ESP32 GPIO16 -> A7670C TX
#define A7670C_TX_PIN     17    // ESP32 GPIO17 -> A7670C RX
#define A7670C_PWR_PIN    4     // Power key pin (optional)
#define A7670C_BAUD       115200

// Analog Sensor Pins (12-bit ADC: 0-4095)
#define HYDROSTATIC_PIN   34    // Water level sensor (0-10m)
#define VOLTAGE_R_PIN     35    // 3-Phase Voltage R
#define VOLTAGE_Y_PIN     32    // 3-Phase Voltage Y
#define VOLTAGE_B_PIN     33    // 3-Phase Voltage B
#define CURRENT_R_PIN     25    // 3-Phase Current R
#define CURRENT_Y_PIN     26    // 3-Phase Current Y
#define CURRENT_B_PIN     27    // 3-Phase Current B
#define TEMP_SENSOR_PIN   36    // Temperature sensor (optional)

// Digital Output Pins (Pump Control)
#define PUMP1_RELAY_PIN   18    // Pump 1 control relay
#define PUMP2_RELAY_PIN   19    // Pump 2 control relay

// Status LED Pins (Optional)
#define LED_NETWORK_PIN   2     // Network status LED
#define LED_MQTT_PIN      15    // MQTT status LED
#define LED_ERROR_PIN     13    // Error status LED

// ==================== SENSOR CALIBRATION ====================

// Water level sensor calibration
#define HYDRO_MIN_VOLTAGE  0.0    // Minimum voltage (0m)
#define HYDRO_MAX_VOLTAGE  5.0    // Maximum voltage (10m)
#define HYDRO_MIN_LEVEL    0.0    // Minimum water level (meters)
#define HYDRO_MAX_LEVEL    10.0   // Maximum water level (meters)

// Voltage sensor calibration (AC RMS)
#define VOLTAGE_MIN        0.0    // Minimum voltage
#define VOLTAGE_MAX        440.0  // Maximum voltage (440V AC)
#define VOLTAGE_SCALE      133.33 // Voltage scaling factor

// Current sensor calibration (AC RMS)
#define CURRENT_MIN        0.0    // Minimum current
#define CURRENT_MAX        100.0  // Maximum current (100A)
#define CURRENT_SCALE      30.30  // Current scaling factor

// Temperature sensor (if using)
#define TEMP_OFFSET        0.0    // Temperature offset calibration
#define TEMP_SCALE         1.0    // Temperature scale factor

// ==================== TIMING CONFIGURATION ====================

#define PUBLISH_INTERVAL_MS    5000    // Publish data every 5 seconds
#define SENSOR_READ_INTERVAL   1000    // Read sensors every 1 second
#define RECONNECT_DELAY_MS     10000   // Retry connection every 10 seconds
#define HEARTBEAT_INTERVAL     30000   // Send heartbeat every 30 seconds
#define WATCHDOG_TIMEOUT       60000   // Watchdog timeout (1 minute)

// ==================== NETWORK SETTINGS ====================

#define MAX_RECONNECT_ATTEMPTS  5      // Max reconnection attempts
#define NETWORK_TIMEOUT_MS      30000  // Network registration timeout
#define MQTT_KEEPALIVE          60     // MQTT keep-alive (seconds)
#define MQTT_QOS                1      // MQTT Quality of Service (0, 1, or 2)

// ==================== DATA FILTERING ====================

#define ENABLE_DATA_FILTERING   true   // Enable outlier filtering
#define FILTER_WINDOW_SIZE      5      // Moving average window
#define MAX_VOLTAGE_CHANGE      50.0   // Max voltage change per reading
#define MAX_CURRENT_CHANGE      10.0   // Max current change per reading

// ==================== ALERT THRESHOLDS ====================

// Water level alerts
#define WATER_LEVEL_LOW        2.0     // Low water level (meters)
#define WATER_LEVEL_HIGH       8.0     // High water level (meters)
#define WATER_LEVEL_CRITICAL   9.5     // Critical high level (meters)

// Voltage alerts
#define VOLTAGE_LOW_THRESHOLD  380.0   // Low voltage threshold (V)
#define VOLTAGE_HIGH_THRESHOLD 450.0   // High voltage threshold (V)

// Current alerts
#define CURRENT_OVERLOAD       80.0    // Overload current threshold (A)
#define CURRENT_IMBALANCE_PCT  15.0    // Phase imbalance percentage

// ==================== DEBUG SETTINGS ====================

#define ENABLE_SERIAL_DEBUG    true    // Enable Serial debug output
#define DEBUG_BAUD_RATE        115200  // Serial baud rate
#define PRINT_RAW_SENSOR_DATA  false   // Print raw ADC values
#define PRINT_AT_COMMANDS      true    // Print AT commands
#define PRINT_MQTT_PAYLOAD     true    // Print MQTT JSON payload

// ==================== FEATURES ====================

#define ENABLE_OTA_UPDATE      false   // Over-the-air firmware update
#define ENABLE_LOCAL_STORAGE   false   // Store data locally if offline
#define ENABLE_AUTO_PUMP       true    // Automatic pump control
#define ENABLE_MANUAL_OVERRIDE false   // Manual pump override via MQTT

#endif // CONFIG_H
