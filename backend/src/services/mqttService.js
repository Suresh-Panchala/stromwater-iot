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
        logger.info('Received data for device:', data.device_id);
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
      // Update or create device record
      await client.query(
        `INSERT INTO devices (device_id, device_name, location, last_seen, is_active)
         VALUES ($1, $2, $3, NOW(), true)
         ON CONFLICT (device_id)
         DO UPDATE SET device_name = $2, location = $3, last_seen = NOW()`,
        [data.device_id, data.device_name || data.device_id, data.location || 'Unknown']
      );

      // Insert device data - matching VPS schema
      const insertQuery = `
        INSERT INTO device_data (
          device_id, timestamp,
          hydrostatic_value,
          vrms_1_r, vrms_1_y, vrms_1_b,
          vrms_2_r, vrms_2_y, vrms_2_b,
          irms_1_r, irms_1_y, irms_1_b,
          irms_2_r, irms_2_y, irms_2_b,
          pump_1_status,
          pump_2_status,
          frequency,
          temperature,
          dry_run_alert,
          high_level_float_alert,
          pump_1_protection,
          pump_2_protection
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23
        )
      `;

      const values = [
        data.device_id,
        data.timestamp || new Date().toISOString(),
        data.hydrostatic_value || 0,
        data.vrms_1_r || 0,
        data.vrms_1_y || 0,
        data.vrms_1_b || 0,
        data.vrms_2_r || 0,
        data.vrms_2_y || 0,
        data.vrms_2_b || 0,
        data.irms_1_r || 0,
        data.irms_1_y || 0,
        data.irms_1_b || 0,
        data.irms_2_r || 0,
        data.irms_2_y || 0,
        data.irms_2_b || 0,
        data.pump_1_status || 'OFF',
        data.pump_2_status || 'OFF',
        data.frequency || 50,
        data.temperature || 0,
        data.dry_run_alert || 0,
        data.high_level_float_alert || 0,
        data.pump_1_protection || 0,
        data.pump_2_protection || 0
      ];

      await client.query(insertQuery, values);

      // Check for alerts
      await this.checkAlerts(data);

      logger.info(`✓ Data stored successfully for device: ${data.device_id}`);
    } catch (error) {
      logger.error('Error storing device data:', error.message);
      logger.error('Error details:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async checkAlerts(data) {
    const alerts = [];

    // Check for Dry Run Alert
    if (data.dry_run_alert === 1) {
      alerts.push({
        device_id: data.device_id,
        alert_type: 'dry_run',
        message: 'Dry run condition detected on pump',
        severity: 'critical',
        timestamp: data.timestamp || new Date().toISOString()
      });
    }

    // Check for High Level Float Alert
    if (data.high_level_float_alert === 1) {
      alerts.push({
        device_id: data.device_id,
        alert_type: 'high_water_level',
        message: 'High water level detected',
        severity: 'warning',
        timestamp: data.timestamp || new Date().toISOString()
      });
    }

    // Check for pump protection
    if (data.pump_1_protection === 1) {
      alerts.push({
        device_id: data.device_id,
        alert_type: 'pump_protection',
        message: 'Pump 1 protection activated',
        severity: 'critical',
        timestamp: data.timestamp || new Date().toISOString()
      });
    }

    if (data.pump_2_protection === 1) {
      alerts.push({
        device_id: data.device_id,
        alert_type: 'pump_protection',
        message: 'Pump 2 protection activated',
        severity: 'critical',
        timestamp: data.timestamp || new Date().toISOString()
      });
    }

    // Check voltage anomalies (±10% from 400V for 3-phase)
    const voltages = [
      { val: data.vrms_1_r, pump: 1, phase: 'R' },
      { val: data.vrms_1_y, pump: 1, phase: 'Y' },
      { val: data.vrms_1_b, pump: 1, phase: 'B' },
      { val: data.vrms_2_r, pump: 2, phase: 'R' },
      { val: data.vrms_2_y, pump: 2, phase: 'Y' },
      { val: data.vrms_2_b, pump: 2, phase: 'B' }
    ];

    voltages.forEach(v => {
      if (v.val && (v.val < 360 || v.val > 440)) {
        alerts.push({
          device_id: data.device_id,
          alert_type: 'voltage_abnormal',
          message: `Pump ${v.pump} Phase ${v.phase}: Voltage out of range (${v.val}V)`,
          severity: 'warning',
          timestamp: data.timestamp || new Date().toISOString(),
          threshold_value: 400,
          actual_value: v.val
        });
      }
    });

    // Store alerts
    for (const alert of alerts) {
      try {
        await alertService.createAlert(alert);
      } catch (error) {
        logger.error('Error creating alert:', error.message);
      }
    }

    if (alerts.length > 0) {
      logger.info(`Generated ${alerts.length} alerts for device ${data.device_id}`);
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
