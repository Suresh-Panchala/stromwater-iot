const pool = require('../config/database');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class AlertService {
  constructor() {
    this.emailTransporter = null;
    this.initEmailTransporter();
  }

  initEmailTransporter() {
    if (process.env.ENABLE_EMAIL_ALERTS === 'true') {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT == 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    }
  }

  async createAlert(alertData) {
    const client = await pool.connect();

    try {
      // Check if similar alert exists in last 5 minutes (prevent spam)
      const existingAlert = await client.query(
        `SELECT id FROM alerts
         WHERE device_id = $1
         AND alert_type = $2
         AND timestamp > NOW() - INTERVAL '5 minutes'
         LIMIT 1`,
        [alertData.device_id, alertData.alert_type]
      );

      if (existingAlert.rows.length > 0) {
        logger.info(`Alert already exists for ${alertData.device_id} - ${alertData.alert_type}`);
        return null;
      }

      // Insert new alert
      const result = await client.query(
        `INSERT INTO alerts (device_id, alert_type, alert_message, severity, timestamp)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          alertData.device_id,
          alertData.alert_type,
          alertData.alert_message,
          alertData.severity,
          alertData.timestamp
        ]
      );

      const alert = result.rows[0];
      logger.info(`Alert created: ${alert.alert_type} for device ${alert.device_id}`);

      // Send notifications
      await this.sendNotifications(alert);

      return alert;
    } catch (error) {
      logger.error('Error creating alert:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async sendNotifications(alert) {
    // Send email notification
    if (this.emailTransporter && process.env.ALERT_EMAIL_TO) {
      try {
        await this.emailTransporter.sendMail({
          from: process.env.SMTP_USER,
          to: process.env.ALERT_EMAIL_TO,
          subject: `StromWater Alert: ${alert.alert_type} - ${alert.severity.toUpperCase()}`,
          html: `
            <h2>StromWater Alert Notification</h2>
            <p><strong>Device:</strong> ${alert.device_id}</p>
            <p><strong>Alert Type:</strong> ${alert.alert_type}</p>
            <p><strong>Severity:</strong> ${alert.severity}</p>
            <p><strong>Message:</strong> ${alert.alert_message}</p>
            <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
          `
        });
        logger.info('Email alert sent successfully');
      } catch (error) {
        logger.error('Failed to send email alert:', error);
      }
    }

    // Send Telegram notification
    if (process.env.ENABLE_TELEGRAM_ALERTS === 'true') {
      try {
        const message = `
🚨 *StromWater Alert*

*Device:* ${alert.device_id}
*Type:* ${alert.alert_type}
*Severity:* ${alert.severity}
*Message:* ${alert.alert_message}
*Time:* ${new Date(alert.timestamp).toLocaleString()}
        `;

        const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
          })
        });

        if (response.ok) {
          logger.info('Telegram alert sent successfully');
        }
      } catch (error) {
        logger.error('Failed to send Telegram alert:', error);
      }
    }
  }

  async getAlerts(filters = {}) {
    const { deviceId, severity, acknowledged, limit = 100, offset = 0 } = filters;

    let query = 'SELECT * FROM alerts WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (deviceId) {
      query += ` AND device_id = $${paramCount}`;
      values.push(deviceId);
      paramCount++;
    }

    if (severity) {
      query += ` AND severity = $${paramCount}`;
      values.push(severity);
      paramCount++;
    }

    if (acknowledged !== undefined) {
      query += ` AND acknowledged = $${paramCount}`;
      values.push(acknowledged);
      paramCount++;
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  async acknowledgeAlert(alertId, userId) {
    const result = await pool.query(
      `UPDATE alerts
       SET acknowledged = true,
           acknowledged_by = $1,
           acknowledged_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [userId, alertId]
    );

    return result.rows[0];
  }
}

module.exports = new AlertService();
