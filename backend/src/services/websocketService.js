const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const logger = require('../utils/logger');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map of authenticated clients
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws' });

    this.wss.on('connection', async (ws, req) => {
      logger.info('New WebSocket connection attempt');

      // Extract token from query string
      const urlParams = new URLSearchParams(req.url.split('?')[1]);
      const token = urlParams.get('token');

      if (!token) {
        ws.close(1008, 'No authentication token provided');
        return;
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const result = await pool.query(
          'SELECT id, username, role FROM users WHERE id = $1 AND is_active = true',
          [decoded.userId]
        );

        if (result.rows.length === 0) {
          ws.close(1008, 'Invalid user');
          return;
        }

        const user = result.rows[0];
        const clientId = `${user.id}_${Date.now()}`;

        this.clients.set(clientId, {
          ws,
          user,
          subscribedDevices: new Set(),
        });

        logger.info(`WebSocket client authenticated: ${user.username}`);

        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message);
            this.handleMessage(clientId, data);
          } catch (error) {
            logger.error('Error parsing WebSocket message:', error);
          }
        });

        ws.on('close', () => {
          this.clients.delete(clientId);
          logger.info(`WebSocket client disconnected: ${user.username}`);
        });

        ws.on('error', (error) => {
          logger.error('WebSocket error:', error);
        });

        // Send connection success message
        ws.send(JSON.stringify({
          type: 'connected',
          message: 'WebSocket connection established',
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
          },
        }));

      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        ws.close(1008, 'Authentication failed');
      }
    });

    logger.info('WebSocket server initialized');
  }

  handleMessage(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (data.type) {
      case 'subscribe':
        if (data.deviceId) {
          client.subscribedDevices.add(data.deviceId);
          logger.info(`Client ${client.user.username} subscribed to device ${data.deviceId}`);
          client.ws.send(JSON.stringify({
            type: 'subscribed',
            deviceId: data.deviceId,
          }));
        }
        break;

      case 'unsubscribe':
        if (data.deviceId) {
          client.subscribedDevices.delete(data.deviceId);
          logger.info(`Client ${client.user.username} unsubscribed from device ${data.deviceId}`);
          client.ws.send(JSON.stringify({
            type: 'unsubscribed',
            deviceId: data.deviceId,
          }));
        }
        break;

      case 'ping':
        client.ws.send(JSON.stringify({ type: 'pong' }));
        break;

      default:
        logger.warn(`Unknown message type: ${data.type}`);
    }
  }

  broadcastDeviceUpdate(deviceId, data) {
    this.clients.forEach((client) => {
      if (client.subscribedDevices.has(deviceId) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: 'device_update',
          deviceId,
          data,
        }));
      }
    });
  }

  broadcastAlert(alert) {
    this.clients.forEach((client) => {
      if (client.subscribedDevices.has(alert.device_id) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: 'alert',
          alert,
        }));
      }
    });
  }

  broadcastToAll(message) {
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }
}

module.exports = new WebSocketService();
