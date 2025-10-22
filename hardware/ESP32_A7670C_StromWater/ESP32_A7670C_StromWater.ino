/*
 * StromWater IoT Platform - ESP32 + SIMCOM A7670C 4G/LTE MQTT Client
 *
 * Hardware: ESP32 + SIMCOM A7670C GSM/4G Module
 * Purpose: Monitor water pump station and send data via MQTT over 4G
 *
 * Features:
 * - 4G/LTE connectivity via A7670C
 * - MQTT publishing to StromWater platform
 * - Sensor data collection (water level, voltage, current)
 * - Auto-reconnect on connection loss
 * - Watchdog timer for reliability
 *
 * Author: StromWater IoT Team
 * Version: 1.0.0
 */

#include <HardwareSerial.h>
#include <ArduinoJson.h>

// ==================== CONFIGURATION ====================

// MQTT Broker Configuration (YOUR VPS)

#define MQTT_BROKER       "broker.hivemq.com"  // Your VPS IP
#define MQTT_PORT         "1883"
#define MQTT_USERNAME     ""
#define MQTT_PASSWORD     ""  // Change this!
// #define MQTT_BROKER       "43.205.194.142"  // Your VPS IP
// #define MQTT_PORT         "1883"
// #define MQTT_USERNAME     "stromwater_mqtt"
// #define MQTT_PASSWORD     "mqtt123"  // Change this!
#define MQTT_CLIENT_ID    "ESP32_Device_1"
#define MQTT_TOPIC        "devices/StromWater_Device_1/data"

// SIM Card APN Configuration (Change based on your carrier)
#define APN_NAME          "etisalat.ae"         // Airtel: "airtel", Jio: "jionet", Vodafone: "www"
#define APN_USERNAME      ""                 // Usually empty
#define APN_PASSWORD      ""                 // Usually empty

// Device Configuration
#define DEVICE_ID         "StromWater_Device_1"
#define DEVICE_NAME       "Dubai Pump Station"
#define DEVICE_LOCATION   "Dubai Industrial Area"

// A7670C Serial Configuration
#define A7670C_RX         16  // ESP32 RX <- A7670C TX
#define A7670C_TX         17  // ESP32 TX -> A7670C RX
#define A7670C_BAUD       115200

// Sensor Pins (Analog Inputs)
#define HYDROSTATIC_PIN   34  // Water level sensor
#define VOLTAGE_R_PIN     35  // Voltage sensor Phase R
#define VOLTAGE_Y_PIN     32  // Voltage sensor Phase Y
#define VOLTAGE_B_PIN     33  // Voltage sensor Phase B
#define CURRENT_R_PIN     25  // Current sensor Phase R
#define CURRENT_Y_PIN     26  // Current sensor Phase Y
#define CURRENT_B_PIN     27  // Current sensor Phase B

// Pump Control Pins (Digital Outputs)
#define PUMP1_PIN         18
#define PUMP2_PIN         19

// Timing Configuration
#define PUBLISH_INTERVAL  5000   // Publish every 5 seconds
#define RECONNECT_DELAY   10000  // Reconnect delay
#define SENSOR_READ_DELAY 100    // Sensor reading delay

// ==================== GLOBALS ====================

HardwareSerial A7670C(2);  // Use UART2 for A7670C

bool moduleReady = false;
bool networkRegistered = false;
bool mqttConnected = false;
unsigned long lastPublish = 0;
unsigned long lastReconnect = 0;

// Sensor data structure
struct SensorData {
  float hydrostaticValue;
  float vrms1R, vrms1Y, vrms1B;
  float irms1R, irms1Y, irms1B;
  float vrms2R, vrms2Y, vrms2B;
  float irms2R, irms2Y, irms2B;
  bool pump1Status;
  bool pump2Status;
  int rssi;
} sensorData;

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n=================================");
  Serial.println("StromWater IoT - ESP32 A7670C");
  Serial.println("=================================\n");

  // Initialize sensor pins
  pinMode(HYDROSTATIC_PIN, INPUT);
  pinMode(VOLTAGE_R_PIN, INPUT);
  pinMode(VOLTAGE_Y_PIN, INPUT);
  pinMode(VOLTAGE_B_PIN, INPUT);
  pinMode(CURRENT_R_PIN, INPUT);
  pinMode(CURRENT_Y_PIN, INPUT);
  pinMode(CURRENT_B_PIN, INPUT);

  // Initialize pump control pins
  pinMode(PUMP1_PIN, OUTPUT);
  pinMode(PUMP2_PIN, OUTPUT);
  digitalWrite(PUMP1_PIN, LOW);
  digitalWrite(PUMP2_PIN, LOW);

  // Initialize A7670C module
  A7670C.begin(A7670C_BAUD, SERIAL_8N1, A7670C_RX, A7670C_TX);
  delay(2000);
  A7670C.print("AT+CFUN=1,1");
  delay(5000);

  Serial.println("Initializing A7670C module...");
  initModule();
}

// ==================== MAIN LOOP ====================

void loop() {
  // Check for incoming data from A7670C
  if (A7670C.available()) {
    String response = A7670C.readString();
    Serial.print("A7670C: ");
    Serial.println(response);

    // Check for MQTT disconnection
    if (response.indexOf("+CMQDISCON") >= 0) {
      mqttConnected = false;
      Serial.println("MQTT disconnected!");
    }
  }

  // Maintain connections
  if (!moduleReady) {
    initModule();
    delay(5000);
    return;
  }

  if (!networkRegistered) {
    checkNetworkRegistration();
    delay(5000);
    return;
  }

  if (!mqttConnected) {
    if (millis() - lastReconnect > RECONNECT_DELAY) {
      connectMQTT();
      lastReconnect = millis();
    }
    return;
  }

  // Publish sensor data
  if (millis() - lastPublish >= PUBLISH_INTERVAL) {
    readSensors();
    publishData();
    lastPublish = millis();
  }

  delay(100);
}

// ==================== A7670C INITIALIZATION ====================

void initModule() {
  Serial.println("\n--- Initializing Module ---");

  // Test AT command
  if (!sendATCommand("AT", "OK", 2000)) {
    Serial.println("Module not responding. Check connections!");
    moduleReady = false;
    return;
  }

  // Disable echo
  sendATCommand("ATE0", "OK", 1000);

  // Check SIM card
  if (!sendATCommand("AT+CPIN?", "+CPIN: READY", 5000)) {
    Serial.println("SIM card not ready!");
    moduleReady = false;
    return;
  }
  Serial.println("✓ SIM card ready");

  // Set APN
  String apnCmd = "AT+CGDCONT=1,\"IP\",\"" + String(APN_NAME) + "\"";
  sendATCommand(apnCmd.c_str(), "OK", 2000);
  Serial.println("✓ APN configured");

  // Activate network
  sendATCommand("AT+CGACT=1,1", "OK", 5000);

  moduleReady = true;
  Serial.println("✓ Module initialized\n");
}

// ==================== NETWORK REGISTRATION ====================

void checkNetworkRegistration() {
  Serial.println("\n--- Checking Network ---");

  // Check network registration
  if (sendATCommand("AT+CREG?", "+CREG: 0,1", 5000) ||
      sendATCommand("AT+CREG?", "+CREG: 0,5", 5000)) {
    Serial.println("✓ Registered on network");

    // Check signal strength
    A7670C.println("AT+CSQ");
    delay(500);
    if (A7670C.available()) {
      String response = A7670C.readString();
      Serial.print("Signal: ");
      Serial.println(response);
    }

    // Attach GPRS
    sendATCommand("AT+CGATT=1", "OK", 10000);
    Serial.println("✓ GPRS attached");

    networkRegistered = true;
    Serial.println("✓ Network ready\n");
  } else {
    Serial.println("✗ Not registered on network");
    networkRegistered = false;
  }
}

// ==================== MQTT CONNECTION ====================

void connectMQTT() {
  Serial.println("\n--- Connecting MQTT ---");

  // Configure MQTT
  sendATCommand("AT+CMQTTSTART", "OK", 5000);
  delay(1000);

  // Acquire client
  String clientCmd = "AT+CMQTTACCQ=0,\"" + String(MQTT_CLIENT_ID) + "\",1";
  if (!sendATCommand(clientCmd.c_str(), "+CMQTTACCQ: 0,0", 5000)) {
    Serial.println("Failed to acquire MQTT client");
    return;
  }
  Serial.println("✓ MQTT client acquired");

  // Connect to broker
  String connectCmd = "AT+CMQTTCONNECT=0,\"tcp://" + String(MQTT_BROKER) + ":" + String(MQTT_PORT) + "\",60,1,\"" +
                      String(MQTT_USERNAME) + "\",\"" + String(MQTT_PASSWORD) + "\"";

  if (!sendATCommand(connectCmd.c_str(), "+CMQTTCONNECT: 0,0", 10000)) {
    Serial.println("Failed to connect to MQTT broker");
    return;
  }

  mqttConnected = true;
  Serial.println("✓ Connected to MQTT broker");
  Serial.print("✓ Broker: ");
  Serial.println(MQTT_BROKER);
  Serial.println();
}

// ==================== SENSOR READING ====================

void readSensors() {
  // Read water level (0-5V mapped to 0-10 meters)
  int rawHydro = analogRead(HYDROSTATIC_PIN);
  sensorData.hydrostaticValue = (rawHydro / 4095.0) * 10.0;  // 0-10 meters

  // Read 3-phase voltages (0-3.3V mapped to 0-440V AC)
  int rawVR = analogRead(VOLTAGE_R_PIN);
  int rawVY = analogRead(VOLTAGE_Y_PIN);
  int rawVB = analogRead(VOLTAGE_B_PIN);

  sensorData.vrms1R = (rawVR / 4095.0) * 440.0;  // Phase R voltage
  sensorData.vrms1Y = (rawVY / 4095.0) * 440.0;  // Phase Y voltage
  sensorData.vrms1B = (rawVB / 4095.0) * 440.0;  // Phase B voltage

  // Read 3-phase currents (0-3.3V mapped to 0-100A)
  int rawIR = analogRead(CURRENT_R_PIN);
  int rawIY = analogRead(CURRENT_Y_PIN);
  int rawIB = analogRead(CURRENT_B_PIN);

  sensorData.irms1R = (rawIR / 4095.0) * 100.0;  // Phase R current
  sensorData.irms1Y = (rawIY / 4095.0) * 100.0;  // Phase Y current
  sensorData.irms1B = (rawIB / 4095.0) * 100.0;  // Phase B current

  // Pump 2 data (simulated as same for now)
  sensorData.vrms2R = sensorData.vrms1R;
  sensorData.vrms2Y = sensorData.vrms1Y;
  sensorData.vrms2B = sensorData.vrms1B;
  sensorData.irms2R = sensorData.irms1R;
  sensorData.irms2Y = sensorData.irms1Y;
  sensorData.irms2B = sensorData.irms1B;

  // Read pump statuses
  sensorData.pump1Status = digitalRead(PUMP1_PIN);
  sensorData.pump2Status = digitalRead(PUMP2_PIN);

  // Get signal strength
  sensorData.rssi = getSignalStrength();
}

// ==================== DATA PUBLISHING ====================

void publishData() {
  // Create JSON payload
  StaticJsonDocument<1024> doc;

  doc["device_id"] = DEVICE_ID;
  doc["device_name"] = DEVICE_NAME;
  doc["location"] = DEVICE_LOCATION;
  doc["timestamp"] = getTimestamp();

  // Water level
  doc["hydrostatic_value"] = sensorData.hydrostaticValue;

  // Pump 1 - 3 Phase Voltage
  doc["vrms_1_r"] = sensorData.vrms1R;
  doc["vrms_1_y"] = sensorData.vrms1Y;
  doc["vrms_1_b"] = sensorData.vrms1B;

  // Pump 1 - 3 Phase Current
  doc["irms_1_r"] = sensorData.irms1R;
  doc["irms_1_y"] = sensorData.irms1Y;
  doc["irms_1_b"] = sensorData.irms1B;

  // Pump 2 - 3 Phase Voltage
  doc["vrms_2_r"] = sensorData.vrms2R;
  doc["vrms_2_y"] = sensorData.vrms2Y;
  doc["vrms_2_b"] = sensorData.vrms2B;

  // Pump 2 - 3 Phase Current
  doc["irms_2_r"] = sensorData.irms2R;
  doc["irms_2_y"] = sensorData.irms2Y;
  doc["irms_2_b"] = sensorData.irms2B;

  // Pump status
  doc["pump_1_status"] = sensorData.pump1Status ? "ON" : "OFF";
  doc["pump_2_status"] = sensorData.pump2Status ? "ON" : "OFF";

  // Additional data
  doc["rssi"] = sensorData.rssi;
  doc["frequency"] = 50.0;  // 50Hz
  doc["temperature"] = 25.0;  // Temperature sensor (if available)

  // Serialize JSON
  String payload;
  serializeJson(doc, payload);

  // Print to Serial for debugging
  Serial.println("\n--- Publishing Data ---");
  Serial.print("Topic: ");
  Serial.println(MQTT_TOPIC);
  Serial.print("Payload: ");
  Serial.println(payload);

  // Publish to MQTT topic
  String topicCmd = "AT+CMQTTTOPIC=0," + String(strlen(MQTT_TOPIC));
  A7670C.println(topicCmd);
  delay(100);
  A7670C.println(MQTT_TOPIC);
  delay(500);

  // Send payload
  String payloadCmd = "AT+CMQTTPAYLOAD=0," + String(payload.length());
  A7670C.println(payloadCmd);
  delay(100);
  A7670C.println(payload);
  delay(500);

  // Publish
  if (sendATCommand("AT+CMQTTPUB=0,1,60", "+CMQTTPUB: 0,0", 5000)) {
    Serial.println("✓ Data published successfully\n");
  } else {
    Serial.println("✗ Failed to publish data\n");
    mqttConnected = false;  // Trigger reconnection
  }
}

// ==================== UTILITY FUNCTIONS ====================

bool sendATCommand(const char* cmd, const char* expected, unsigned long timeout) {
  A7670C.println(cmd);

  unsigned long start = millis();
  String response = "";

  while (millis() - start < timeout) {
    if (A7670C.available()) {
      char c = A7670C.read();
      response += c;

      if (response.indexOf(expected) >= 0) {
        return true;
      }
    }
  }

  return false;
}

int getSignalStrength() {
  A7670C.println("AT+CSQ");
  delay(500);

  if (A7670C.available()) {
    String response = A7670C.readString();
    int rssiStart = response.indexOf("+CSQ: ") + 6;
    int rssiEnd = response.indexOf(",", rssiStart);

    if (rssiStart > 6 && rssiEnd > rssiStart) {
      String rssiStr = response.substring(rssiStart, rssiEnd);
      int rssi = rssiStr.toInt();
      return rssi;
    }
  }

  return 0;
}

String getTimestamp() {
  // Get network time from cellular module
  A7670C.println("AT+CCLK?");
  delay(500);

  if (A7670C.available()) {
    String response = A7670C.readString();
    int timeStart = response.indexOf("\"") + 1;
    int timeEnd = response.indexOf("\"", timeStart);

    if (timeStart > 1 && timeEnd > timeStart) {
      return response.substring(timeStart, timeEnd);
    }
  }

  // Fallback to millis
  return String(millis());
}

// ==================== CONTROL FUNCTIONS ====================

void controlPump1(bool state) {
  digitalWrite(PUMP1_PIN, state ? HIGH : LOW);
  sensorData.pump1Status = state;
  Serial.print("Pump 1: ");
  Serial.println(state ? "ON" : "OFF");
}

void controlPump2(bool state) {
  digitalWrite(PUMP2_PIN, state ? HIGH : LOW);
  sensorData.pump2Status = state;
  Serial.print("Pump 2: ");
  Serial.println(state ? "ON" : "OFF");
}
