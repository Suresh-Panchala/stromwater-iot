const mqtt = require('mqtt');

// ==================== CONFIGURATION ====================
const MQTT_CONFIG = {
  broker: 'mqtt://43.205.194.142:1883',
  username: 'stromwater_mqtt',
  password: 'mqtt123',
  clientId: 'Windows_Simulator_' + Math.random().toString(16).substr(2, 8)
};

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

const PUBLISH_INTERVAL = 5000;

// ==================== MQTT CLIENT ====================
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║   StromWater IoT - Unified MQTT Simulator             ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log(`Broker: ${MQTT_CONFIG.broker}`);
console.log(`Username: ${MQTT_CONFIG.username}`);
console.log(`Devices: ${DEVICES.length}\n`);

const client = mqtt.connect(MQTT_CONFIG.broker, {
  username: MQTT_CONFIG.username,
  password: MQTT_CONFIG.password,
  clientId: MQTT_CONFIG.clientId,
  clean: true,
  reconnectPeriod: 5000
});

// ==================== DATA GENERATION ====================
function generateDevice1Data(device, index) {
  const baseVoltage = 400 + (index * 10);
  const baseCurrent = 20 + (index * 5);
  const baseWaterLevel = 3 + (index * 2);

  return {
    device_id: device.id,
    device_name: device.name,
    location: device.location,
    timestamp: new Date().toISOString(),
    hydrostatic_value: Number((baseWaterLevel + Math.random() * 3).toFixed(2)),
    vrms_1_r: Number((baseVoltage + Math.random() * 30).toFixed(1)),
    vrms_1_y: Number((baseVoltage + Math.random() * 30).toFixed(1)),
    vrms_1_b: Number((baseVoltage + Math.random() * 30).toFixed(1)),
    irms_1_r: Number((baseCurrent + Math.random() * 15).toFixed(1)),
    irms_1_y: Number((baseCurrent + Math.random() * 15).toFixed(1)),
    irms_1_b: Number((baseCurrent + Math.random() * 15).toFixed(1)),
    vrms_2_r: Number((baseVoltage + Math.random() * 30).toFixed(1)),
    vrms_2_y: Number((baseVoltage + Math.random() * 30).toFixed(1)),
    vrms_2_b: Number((baseVoltage + Math.random() * 30).toFixed(1)),
    irms_2_r: Number((baseCurrent + Math.random() * 15).toFixed(1)),
    irms_2_y: Number((baseCurrent + Math.random() * 15).toFixed(1)),
    irms_2_b: Number((baseCurrent + Math.random() * 15).toFixed(1)),
    pump_1_status: baseWaterLevel + Math.random() * 3 > 5 ? 'ON' : 'OFF',
    pump_2_status: baseWaterLevel + Math.random() * 3 > 6 ? 'ON' : 'OFF',
    frequency: 50.0,
    temperature: Number((25 + Math.random() * 10).toFixed(1)),
    dry_run_alert: 0,
    high_level_float_alert: baseWaterLevel + Math.random() * 3 > 7.5 ? 1 : 0,
    pump_1_protection: 0,
    pump_2_protection: 0
  };
}

function generateDevice2Data(device) {
  return {
    deviceId: device.id,
    location: device.location,
    timestamp: new Date().toISOString(),
    data: {
      Hydrostatic_Value: 40 + Math.random() * 40,
      DryRunAlert: Math.random() > 0.95 ? 1 : 0,
      HighLevelFloatAlert: Math.random() > 0.90 ? 1 : 0,
      Pump_1_Manual: 0,
      Pump_1_Auto: 1,
      Pump_1_Protection: 0,
      Pump_1_Contactor_Feedback: Math.random() > 0.3 ? 1 : 0,
      Pump_2_Manual: 0,
      Pump_2_Auto: 1,
      Pump_2_Protection: 0,
      Pump_2_Contactor_Feedback: Math.random() > 0.7 ? 1 : 0,
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
}

// ==================== MQTT EVENTS ====================
client.on('connect', () => {
  console.log('✓ Connected to MQTT broker\nPublishing every', PUBLISH_INTERVAL / 1000, 'seconds...\n');

  setInterval(() => {
    DEVICES.forEach((device, index) => {
      const topic = `devices/${device.id}/data`;
      const payload = device.id === 'StromWater_Device_2'
        ? generateDevice2Data(device)
        : generateDevice1Data(device, index);

      client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
        if (err) {
          console.error(`✗ Failed to publish for ${device.name}:`, err.message);
        } else {
          console.log(`✓ Published for ${device.name} to topic ${topic}`);
        }
      });
    });
  }, PUBLISH_INTERVAL);
});

// ==================== ERROR HANDLING ====================
client.on('error', err => console.error('✗ MQTT Error:', err.message));
client.on('reconnect', () => console.log('⟳ Reconnecting...'));
client.on('offline', () => console.log('⚠ Offline'));
client.on('close', () => console.log('✗ Connection closed'));

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  client.end(false, () => {
    console.log('✓ Disconnected');
    process.exit(0);
  });
});