const mqtt = require('mqtt');
const fs = require('fs');
const pool = require('../config/database');
const alertService = require('./alertService');
const logger = require('../utils/logger');

class MQTTService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  connect() {
    const options = {
      clientId: process.env.MQTT_CLIENT_ID || 'stromwater_backend_' + Math.random().toString(16).substr(2, 8),
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
    };

    // Add SSL/TLS if configured
    if (process.env.MQTT_CA_CERT_PATH && fs.existsSync(process.env.MQTT_CA_CERT_PATH)) {
      options.ca = fs.readFileSync(process.env.MQTT_CA_CERT_PATH);

      if (process.env.MQTT_CLIENT_CERT_PATH && fs.existsSync(process.env.MQTT_CLIENT_CERT_PATH)) {
        options.cert = fs.readFileSync(process.env.MQTT_CLIENT_CERT_PATH);
      }

      if (process.env.MQTT_CLIENT_KEY_PATH && fs.existsSync(process.env.MQTT_CLIENT_KEY_PATH)) {
        options.key = fs.readFileSync(process.env.MQTT_CLIENT_KEY_PATH);
      }

      options.rejectUnauthorized = true;
    }

    logger.info('Connecting to MQTT broker:', process.env.MQTT_BROKER_URL);

    this.client = mqtt.connect(process.env.MQTT_BROKER_URL, options);

    this.client.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('Connected to MQTT broker successfully');

      const topic = process.env.MQTT_TOPIC || 'devices/+/data';
      this.client.subscribe(topic, (err) => {
        if (err) {
          logger.error('Failed to subscribe to topic:', topic, err);
        } else {
          logger.info('Subscribed to topic:', topic);
        }
      });
    });

    this.client.on('message', async (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        logger.info('Received message from topic:', topic);
        await this.handleDeviceData(data);
      } catch (error) {
        logger.error('Error processing MQTT message:', error);
      }
    });

    this.client.on('error', (error) => {
      logger.error('MQTT connection error:', error);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('MQTT connection closed');
    });

    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      logger.info(`Attempting to reconnect to MQTT broker (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.error('Max reconnect attempts reached. Stopping reconnection.');
        this.client.end();
      }
    });
  }

  async handleDeviceData(data) {
    const client = await pool.connect();

    try {
      // Update device last_seen
      await client.query(
        `INSERT INTO devices (device_id, location, last_seen)
         VALUES ($1, $2, NOW())
         ON CONFLICT (device_id)
         DO UPDATE SET location = $2, last_seen = NOW()`,
        [data.deviceId, data.location]
      );

      // Insert device data (created_at has DEFAULT so not included)
      const insertQuery = `
        INSERT INTO device_data (
          device_id, location, timestamp,
          hydrostatic_value, dry_run_alert, high_level_float_alert,
          pump_1_manual, pump_2_manual, pump_1_auto, pump_2_auto,
          pump_1_protection, pump_2_protection,
          pump_1_contactor_feedback, pump_2_contactor_feedback,
          power_1_r, power_1_y, power_1_b,
          irms_1_r, irms_1_y, irms_1_b,
          power_2_r, power_2_y, power_2_b,
          irms_2_r, irms_2_y, irms_2_b,
          vrms_1_r, vrms_1_y, vrms_1_b,
          vrms_2_r, vrms_2_y, vrms_2_b,
          vahr_1_r, vahr_1_y, vahr_1_b,
          vahr_2_r, vahr_2_y, vahr_2_b,
          freq_1_r, freq_1_y, freq_1_b,
          freq_2_r, freq_2_y, freq_2_b,
          rhs_1, rhs_2, raw_json
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
          $41, $42, $43, $44, $45, $46, $47
        ) RETURNING id
      `;

      const values = [
        data.deviceId,
        data.location,
        data.timestamp,
        data.data.Hydrostatic_Value,
        data.data.DryRunAlert,
        data.data.HighLevelFloatAlert,
        data.data.Pump_1_Manual,
        data.data.Pump_2_Manual,
        data.data.Pump_1_Auto,
        data.data.Pump_2_Auto,
        data.data.Pump_1_Protection,
        data.data.Pump_2_Protection,
        data.data.Pump_1_Contactor_Feedback,
        data.data.Pump_2_Contactor_Feedback,
        data.data.POWER_1_R,
        data.data.POWER_1_Y,
        data.data.POWER_1_B,
        data.data.IRMS_1_R,
        data.data.IRMS_1_Y,
        data.data.IRMS_1_B,
        data.data.POWER_2_R,
        data.data.POWER_2_Y,
        data.data.POWER_2_B,
        data.data.IRMS_2_R,
        data.data.IRMS_2_Y,
        data.data.IRMS_2_B,
        data.data.VRMS_1_R,
        data.data.VRMS_1_Y,
        data.data.VRMS_1_B,
        data.data.VRMS_2_R,
        data.data.VRMS_2_Y,
        data.data.VRMS_2_B,
        data.data.VAHR_1_R,
        data.data.VAHR_1_Y,
        data.data.VAHR_1_B,
        data.data.VAHR_2_R,
        data.data.VAHR_2_Y,
        data.data.VAHR_2_B,
        data.data.FREQ_1_R,
        data.data.FREQ_1_Y,
        data.data.FREQ_1_B,
        data.data.FREQ_2_R,
        data.data.FREQ_2_Y,
        data.data.FREQ_2_B,
        data.data.RHS_1,
        data.data.RHS_2,
        JSON.stringify(data)
      ];

      await client.query(insertQuery, values);

      // Check for alerts
      await this.checkAlerts(data);

      logger.info(`Data stored successfully for device: ${data.deviceId}`);
    } catch (error) {
      logger.error('Error storing device data:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async checkAlerts(data) {
    const alerts = [];

    // Check for Dry Run Alert
    if (data.data.DryRunAlert === 1) {
      alerts.push({
        device_id: data.deviceId,
        alert_type: 'DRY_RUN',
        alert_message: 'Dry run condition detected on pump',
        severity: 'critical',
        timestamp: data.timestamp
      });
    }

    // Check for High Level Float Alert
    if (data.data.HighLevelFloatAlert === 1) {
      alerts.push({
        device_id: data.deviceId,
        alert_type: 'HIGH_LEVEL',
        alert_message: 'High water level detected',
        severity: 'warning',
        timestamp: data.timestamp
      });
    }

    // Check for pump protection
    if (data.data.Pump_1_Protection === 1) {
      alerts.push({
        device_id: data.deviceId,
        alert_type: 'PUMP_PROTECTION',
        alert_message: 'Pump 1 protection activated',
        severity: 'critical',
        timestamp: data.timestamp
      });
    }

    if (data.data.Pump_2_Protection === 1) {
      alerts.push({
        device_id: data.deviceId,
        alert_type: 'PUMP_PROTECTION',
        alert_message: 'Pump 2 protection activated',
        severity: 'critical',
        timestamp: data.timestamp
      });
    }

    // Check voltage anomalies (±10% from 230V)
    const voltages = [
      data.data.VRMS_1_R, data.data.VRMS_1_Y, data.data.VRMS_1_B,
      data.data.VRMS_2_R, data.data.VRMS_2_Y, data.data.VRMS_2_B
    ];

    voltages.forEach((voltage, index) => {
      if (voltage < 207 || voltage > 253) {
        const pumpNum = index < 3 ? 1 : 2;
        const phase = ['R', 'Y', 'B'][index % 3];
        alerts.push({
          device_id: data.deviceId,
          alert_type: 'VOLTAGE_ANOMALY',
          alert_message: `Pump ${pumpNum} Phase ${phase}: Voltage out of range (${voltage}V)`,
          severity: 'warning',
          timestamp: data.timestamp
        });
      }
    });

    // Store alerts and send notifications
    for (const alert of alerts) {
      await alertService.createAlert(alert);
    }
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      logger.info('Disconnected from MQTT broker');
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

module.exports = new MQTTService();
