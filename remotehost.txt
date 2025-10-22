const mqtt = require('mqtt');

// ==================== CONFIGURATION ====================
const MQTT_CONFIG = {
  broker: 'mqtt://43.205.194.142:1883',  // Your VPS IP
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

const PUBLISH_INTERVAL = 5000; // 5 seconds

// ==================== MQTT CLIENT ====================
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║   StromWater IoT - Multi-Device MQTT Simulator        ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log('Connecting to MQTT broker...');
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

// ==================== HELPER FUNCTIONS ====================

function generateSensorData(device, index) {
  const baseVoltage = 400 + (index * 10);
  const baseCurrent = 20 + (index * 5);
  const baseWaterLevel = 3 + (index * 2);

  return {
    device_id: device.id,
    device_name: device.name,
    location: device.location,
    timestamp: new Date().toISOString(),

    // Water level (3-8 meters with random variation)
    hydrostatic_value: Number((baseWaterLevel + Math.random() * 3).toFixed(2)),

    // Pump 1 - 3 Phase Voltage (400-430V with variation)
    vrms_1_r: Number((baseVoltage + Math.random() * 30).toFixed(1)),
    vrms_1_y: Number((baseVoltage + Math.random() * 30).toFixed(1)),
    vrms_1_b: Number((baseVoltage + Math.random() * 30).toFixed(1)),

    // Pump 1 - 3 Phase Current (20-35A with variation)
    irms_1_r: Number((baseCurrent + Math.random() * 15).toFixed(1)),
    irms_1_y: Number((baseCurrent + Math.random() * 15).toFixed(1)),
    irms_1_b: Number((baseCurrent + Math.random() * 15).toFixed(1)),

    // Pump 2 - 3 Phase Voltage
    vrms_2_r: Number((baseVoltage + Math.random() * 30).toFixed(1)),
    vrms_2_y: Number((baseVoltage + Math.random() * 30).toFixed(1)),
    vrms_2_b: Number((baseVoltage + Math.random() * 30).toFixed(1)),

    // Pump 2 - 3 Phase Current
    irms_2_r: Number((baseCurrent + Math.random() * 15).toFixed(1)),
    irms_2_y: Number((baseCurrent + Math.random() * 15).toFixed(1)),
    irms_2_b: Number((baseCurrent + Math.random() * 15).toFixed(1)),

    // Pump status (randomly ON/OFF based on water level)
    pump_1_status: baseWaterLevel + Math.random() * 3 > 5 ? 'ON' : 'OFF',
    pump_2_status: baseWaterLevel + Math.random() * 3 > 6 ? 'ON' : 'OFF',

    // Additional parameters
    frequency: 50.0,
    temperature: Number((25 + Math.random() * 10).toFixed(1)),

    // Optional fields for compatibility
    dry_run_alert: 0,
    high_level_float_alert: baseWaterLevel + Math.random() * 3 > 7.5 ? 1 : 0,
    pump_1_protection: 0,
    pump_2_protection: 0
  };
}

function getColoredStatus(status) {
  return status === 'ON' ? '\x1b[32mON\x1b[0m' : '\x1b[90mOFF\x1b[0m';
}

// ==================== MQTT EVENTS ====================

client.on('connect', () => {
  console.log('✓ Connected to MQTT broker successfully!\n');
  console.log('Publishing data every', PUBLISH_INTERVAL / 1000, 'seconds...');
  console.log('Press Ctrl+C to stop\n');
  console.log('─'.repeat(80));

  // Start publishing data
  let publishCount = 0;

  setInterval(() => {
    publishCount++;
    const timestamp = new Date().toLocaleTimeString();

    console.log(`\n[${timestamp}] Publish #${publishCount}`);
    console.log('─'.repeat(80));

    DEVICES.forEach((device, index) => {
      const data = generateSensorData(device, index);
      const topic = `devices/${device.id}/data`;

      // Publish to MQTT
      client.publish(topic, JSON.stringify(data), { qos: 1 }, (err) => {
        if (err) {
          console.error(`✗ Failed to publish for ${device.name}:`, err.message);
        } else {
          // Display formatted output
          console.log(`\n📍 ${device.name} (${device.id})`);
          console.log(`   Water Level: ${data.hydrostatic_value.toFixed(2)}m`);
          console.log(`   Voltage: R=${data.vrms_1_r}V Y=${data.vrms_1_y}V B=${data.vrms_1_b}V`);
          console.log(`   Current: R=${data.irms_1_r}A Y=${data.irms_1_y}A B=${data.irms_1_b}A`);
          console.log(`   Pump 1: ${getColoredStatus(data.pump_1_status)}  |  Pump 2: ${getColoredStatus(data.pump_2_status)}`);
          console.log(`   ✓ Published to topic: ${topic}`);
        }
      });
    });

    console.log('\n' + '─'.repeat(80));
  }, PUBLISH_INTERVAL);
});

client.on('error', (err) => {
  console.error('\n✗ MQTT Error:', err.message);
  console.error('\nTroubleshooting:');
  console.error('1. Check VPS IP address is correct:', MQTT_CONFIG.broker);
  console.error('2. Verify MQTT credentials (username/password)');
  console.error('3. Ensure VPS firewall allows port 1883');
  console.error('4. Check Mosquitto is running: sudo systemctl status mosquitto');
});

client.on('reconnect', () => {
  console.log('\n⟳ Reconnecting to MQTT broker...');
});

client.on('offline', () => {
  console.log('\n⚠ MQTT client is offline');
});

client.on('close', () => {
  console.log('\n✗ MQTT connection closed');
});

// ==================== GRACEFUL SHUTDOWN ====================

process.on('SIGINT', () => {
  console.log('\n\n╔════════════════════════════════════════════════════════╗');
  console.log('║   Shutting down simulator...                          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  client.end(false, () => {
    console.log('✓ MQTT client disconnected');
    console.log('✓ Simulator stopped\n');
    process.exit(0);
  });
});

// ==================== ERROR HANDLING ====================

process.on('uncaughtException', (err) => {
  console.error('\n✗ Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('\n✗ Unhandled Rejection:', err.message);
  console.error(err.stack);
  process.exit(1);
});
