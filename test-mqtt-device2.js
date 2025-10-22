const mqtt = require('mqtt');

// MQTT Simulator for Device 2
// This simulates a second StromWater device sending data

const MQTT_BROKER = 'mqtt://localhost:1883';
const DEVICE_ID = 'StromWater_Device_2';  // Change this to match your device ID
const DEVICE_LOCATION = 'Sharjah Industrial Area';  // Change this to match your location
const TOPIC = `devices/${DEVICE_ID}/data`;

console.log('===========================================');
console.log('StromWater MQTT Simulator - Device 2');
console.log('===========================================');
console.log(`Device ID: ${DEVICE_ID}`);
console.log(`Location: ${DEVICE_LOCATION}`);
console.log(`Topic: ${TOPIC}`);
console.log(`Broker: ${MQTT_BROKER}`);
console.log('===========================================\n');

// Connect to MQTT broker
const client = mqtt.connect(MQTT_BROKER);

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');
  console.log('📡 Publishing data every 5 seconds...\n');

  // Publish data every 5 seconds
  setInterval(() => {
    const data = {
      deviceId: DEVICE_ID,
      location: DEVICE_LOCATION,
      timestamp: new Date().toISOString(),
      data: {
        // Water level (varies between 40-80)
        Hydrostatic_Value: 40 + Math.random() * 40,

        // Alerts
        DryRunAlert: Math.random() > 0.95 ? 1 : 0,
        HighLevelFloatAlert: Math.random() > 0.90 ? 1 : 0,

        // Pump 1 - Mostly AUTO mode
        Pump_1_Manual: 0,
        Pump_1_Auto: 1,
        Pump_1_Protection: 0,
        Pump_1_Contactor_Feedback: Math.random() > 0.3 ? 1 : 0, // 70% ON

        // Pump 2 - Backup pump, less active
        Pump_2_Manual: 0,
        Pump_2_Auto: 1,
        Pump_2_Protection: 0,
        Pump_2_Contactor_Feedback: Math.random() > 0.7 ? 1 : 0, // 30% ON

        // Pump 1 Electrical Parameters (slightly different from Device 1)
        POWER_1_R: 95 + Math.random() * 15,
        POWER_1_Y: 97 + Math.random() * 15,
        POWER_1_B: 96 + Math.random() * 15,

        IRMS_1_R: 4.8 + Math.random() * 1.0,
        IRMS_1_Y: 4.9 + Math.random() * 1.0,
        IRMS_1_B: 5.0 + Math.random() * 1.0,

        VRMS_1_R: 228 + Math.random() * 6,
        VRMS_1_Y: 229 + Math.random() * 6,
        VRMS_1_B: 230 + Math.random() * 6,

        VAHR_1_R: Math.floor(Math.random() * 100),
        VAHR_1_Y: Math.floor(Math.random() * 100),
        VAHR_1_B: Math.floor(Math.random() * 100),

        FREQ_1_R: 49.8 + Math.random() * 0.4,
        FREQ_1_Y: 49.9 + Math.random() * 0.4,
        FREQ_1_B: 50.0 + Math.random() * 0.4,

        // Pump 2 Electrical Parameters
        POWER_2_R: 92 + Math.random() * 15,
        POWER_2_Y: 94 + Math.random() * 15,
        POWER_2_B: 93 + Math.random() * 15,

        IRMS_2_R: 4.6 + Math.random() * 1.0,
        IRMS_2_Y: 4.7 + Math.random() * 1.0,
        IRMS_2_B: 4.8 + Math.random() * 1.0,

        VRMS_2_R: 227 + Math.random() * 6,
        VRMS_2_Y: 228 + Math.random() * 6,
        VRMS_2_B: 229 + Math.random() * 6,

        VAHR_2_R: Math.floor(Math.random() * 100),
        VAHR_2_Y: Math.floor(Math.random() * 100),
        VAHR_2_B: Math.floor(Math.random() * 100),

        FREQ_2_R: 49.9 + Math.random() * 0.4,
        FREQ_2_Y: 50.0 + Math.random() * 0.4,
        FREQ_2_B: 50.1 + Math.random() * 0.4,

        RHS_1: Math.floor(Math.random() * 10),
        RHS_2: Math.floor(Math.random() * 10)
      }
    };

    client.publish(TOPIC, JSON.stringify(data), (err) => {
      if (err) {
        console.error('❌ Publish error:', err);
      } else {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] 📤 Published data - Level: ${data.data.Hydrostatic_Value.toFixed(1)}, P1: ${data.data.Pump_1_Contactor_Feedback ? 'ON' : 'OFF'}, P2: ${data.data.Pump_2_Contactor_Feedback ? 'ON' : 'OFF'}`);
      }
    });
  }, 5000);
});

client.on('error', (error) => {
  console.error('❌ MQTT Error:', error);
});

client.on('close', () => {
  console.log('⚠️  Disconnected from MQTT broker');
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping simulator...');
  client.end();
  process.exit();
});
