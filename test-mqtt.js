// MQTT Test Script - Simulates StromWater Device
// Usage: node test-mqtt.js

const mqtt = require('mqtt');

// Configuration
const config = {
  broker: 'mqtt://localhost:1883',
  username: 'stromwater_mqtt',
  password: 'mqtt123',
  deviceId: 'StromWater_Device_1',
  location: 'khusam',
  publishInterval: 5000, // 5 seconds
};

console.log('StromWater Device Simulator');
console.log('============================');
console.log(`Broker: ${config.broker}`);
console.log(`Device ID: ${config.deviceId}`);
console.log(`Publish Interval: ${config.publishInterval}ms\n`);

// Connect to MQTT broker
const client = mqtt.connect(config.broker, {
  username: config.username,
  password: config.password,
  clientId: `simulator_${config.deviceId}`,
});

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  console.log('Publishing data...\n');

  // Publish data at intervals
  setInterval(() => {
    const data = generateDeviceData();
    const topic = `devices/${config.deviceId}/data`;

    client.publish(topic, JSON.stringify(data), (err) => {
      if (err) {
        console.error('Publish error:', err);
      } else {
        console.log(`Published to ${topic}`);
        console.log(`  Hydrostatic: ${data.data.Hydrostatic_Value}`);
        console.log(`  Pump 1: ${data.data.Pump_1_Contactor_Feedback ? 'ON' : 'OFF'}`);
        console.log(`  Pump 2: ${data.data.Pump_2_Contactor_Feedback ? 'ON' : 'OFF'}`);
        console.log(`  Alerts: DryRun=${data.data.DryRunAlert}, HighLevel=${data.data.HighLevelFloatAlert}\n`);
      }
    });
  }, config.publishInterval);
});

client.on('error', (err) => {
  console.error('MQTT Error:', err);
});

client.on('close', () => {
  console.log('Disconnected from MQTT broker');
});

// Generate realistic device data
function generateDeviceData() {
  const now = new Date().toISOString();

  // Simulate varying water level
  const hydrostaticValue = 30 + Math.random() * 40; // 30-70

  // Pump logic: turn on pump 1 if level > 60
  const pump1On = hydrostaticValue > 60 ? 1 : 0;
  const pump2On = hydrostaticValue > 75 ? 1 : 0;

  // Alerts
  const dryRunAlert = hydrostaticValue < 20 && (pump1On || pump2On) ? 1 : 0;
  const highLevelAlert = hydrostaticValue > 80 ? 1 : 0;

  // Voltage with small variations
  const baseVoltage = 230;
  const voltageVariation = () => baseVoltage + (Math.random() * 4 - 2);

  // Current varies based on pump status
  const currentWhenOn = 2.0 + Math.random() * 0.5;
  const current1 = pump1On ? currentWhenOn : 0;
  const current2 = pump2On ? currentWhenOn : 0;

  return {
    deviceId: config.deviceId,
    location: config.location,
    timestamp: now,
    data: {
      Hydrostatic_Value: parseFloat(hydrostaticValue.toFixed(2)),
      DryRunAlert: dryRunAlert,
      HighLevelFloatAlert: highLevelAlert,
      Pump_1_Manual: 0,
      Pump_2_Manual: 0,
      Pump_1_Auto: 1,
      Pump_2_Auto: 1,
      Pump_1_Protection: 0,
      Pump_2_Protection: 0,
      Pump_1_Contactor_Feedback: pump1On,
      Pump_2_Contactor_Feedback: pump2On,
      POWER_1_R: parseFloat(voltageVariation().toFixed(2)),
      POWER_1_Y: parseFloat(voltageVariation().toFixed(2)),
      POWER_1_B: parseFloat(voltageVariation().toFixed(2)),
      IRMS_1_R: parseFloat(current1.toFixed(2)),
      IRMS_1_Y: parseFloat(current1.toFixed(2)),
      IRMS_1_B: parseFloat(current1.toFixed(2)),
      POWER_2_R: parseFloat(voltageVariation().toFixed(2)),
      POWER_2_Y: parseFloat(voltageVariation().toFixed(2)),
      POWER_2_B: parseFloat(voltageVariation().toFixed(2)),
      IRMS_2_R: parseFloat(current2.toFixed(2)),
      IRMS_2_Y: parseFloat(current2.toFixed(2)),
      IRMS_2_B: parseFloat(current2.toFixed(2)),
      VRMS_1_R: parseFloat(voltageVariation().toFixed(2)),
      VRMS_1_Y: parseFloat(voltageVariation().toFixed(2)),
      VRMS_1_B: parseFloat(voltageVariation().toFixed(2)),
      VRMS_2_R: parseFloat(voltageVariation().toFixed(2)),
      VRMS_2_Y: parseFloat(voltageVariation().toFixed(2)),
      VRMS_2_B: parseFloat(voltageVariation().toFixed(2)),
      VAHR_1_R: 1234 + Math.floor(Math.random() * 100),
      VAHR_1_Y: 1240 + Math.floor(Math.random() * 100),
      VAHR_1_B: 1220 + Math.floor(Math.random() * 100),
      VAHR_2_R: 1300 + Math.floor(Math.random() * 100),
      VAHR_2_Y: 1320 + Math.floor(Math.random() * 100),
      VAHR_2_B: 1290 + Math.floor(Math.random() * 100),
      FREQ_1_R: 50,
      FREQ_1_Y: 50,
      FREQ_1_B: 50,
      FREQ_2_R: 50,
      FREQ_2_Y: 50,
      FREQ_2_B: 50,
      RHS_1: pump1On,
      RHS_2: pump2On,
    },
  };
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\nShutting down simulator...');
  client.end();
  process.exit(0);
});
