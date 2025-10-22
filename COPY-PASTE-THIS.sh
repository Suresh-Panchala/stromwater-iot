#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# StromWater IoT Platform - Complete Fresh Deployment
# Copy and paste this ENTIRE script into AWS EC2 Console terminal
# Time: 10-15 minutes
# ═══════════════════════════════════════════════════════════════

set -e
VPS_IP="43.205.194.142"

echo "╔════════════════════════════════════════════════════════╗"
echo "║   StromWater Fresh Deployment - Starting...           ║"
echo "╚════════════════════════════════════════════════════════╝"

# Clean old installation
echo "[1/8] Cleaning old installation..."
pm2 delete all 2>/dev/null || true
sudo rm -rf /var/www/stromwater
sudo mkdir -p /var/www/stromwater
sudo chown -R ubuntu:ubuntu /var/www/stromwater

# Setup PostgreSQL
echo "[2/8] Setting up PostgreSQL..."
sudo -u postgres psql << 'SQL'
DROP DATABASE IF EXISTS stromwater_db;
DROP USER IF EXISTS stromwater_user;
CREATE USER stromwater_user WITH PASSWORD 'stromwater_pass';
CREATE DATABASE stromwater_db OWNER stromwater_user;
GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;
\c stromwater_db
GRANT ALL ON SCHEMA public TO stromwater_user;
ALTER SCHEMA public OWNER TO stromwater_user;
SQL

# Configure Mosquitto
echo "[3/8] Configuring Mosquitto..."
sudo bash -c 'cat > /etc/mosquitto/mosquitto.conf << EOF
listener 1883 0.0.0.0
allow_anonymous false
password_file /etc/mosquitto/passwd
EOF'
sudo mosquitto_passwd -c -b /etc/mosquitto/passwd stromwater_mqtt mqtt123
sudo chown mosquitto:mosquitto /etc/mosquitto/passwd
sudo chmod 644 /etc/mosquitto/passwd
sudo systemctl restart mosquitto

# Create backend structure
echo "[4/8] Creating backend..."
cd /var/www/stromwater
mkdir -p backend/src/{routes,scripts}
cd backend

# package.json
cat > package.json << 'EOF'
{
  "name": "stromwater-backend",
  "version": "1.0.0",
  "main": "src/server.js",
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0",
    "mqtt": "^5.0.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^7.1.0"
  }
}
EOF

# .env
cat > .env << EOF
DATABASE_URL=postgresql://stromwater_user:stromwater_pass@localhost:5432/stromwater_db
JWT_SECRET=your-secret-key-change-this-in-production-$(date +%s)
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=stromwater_mqtt
MQTT_PASSWORD=mqtt123
PORT=5000
NODE_ENV=production
CORS_ORIGIN=http://${VPS_IP}
EOF

# Database init script
cat > src/scripts/initDatabase.js << 'EOFINIT'
require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function init() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS device_data (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(100) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        hydrostatic_value FLOAT, vrms_1_r FLOAT, vrms_1_y FLOAT, vrms_1_b FLOAT,
        irms_1_r FLOAT, irms_1_y FLOAT, irms_1_b FLOAT,
        vrms_2_r FLOAT, vrms_2_y FLOAT, vrms_2_b FLOAT,
        irms_2_r FLOAT, irms_2_y FLOAT, irms_2_b FLOAT,
        pump_1_status VARCHAR(10), pump_2_status VARCHAR(10),
        frequency FLOAT, temperature FLOAT,
        dry_run_alert INTEGER, high_level_float_alert INTEGER,
        pump_1_protection INTEGER, pump_2_protection INTEGER
      );
    `);

    const hash = await bcrypt.hash('admin123', 10);
    await pool.query("DELETE FROM users WHERE username='admin'");
    await pool.query(`INSERT INTO users (username, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5)`, ['admin', 'admin@stromwater.com', hash, 'admin', true]);

    await pool.query("DELETE FROM devices");
    await pool.query(`INSERT INTO devices (device_id, name, location) VALUES
      ('StromWater_Device_1', 'Dubai Pump Station', 'Dubai Industrial Area'),
      ('StromWater_Device_2', 'Sharjah Pump Station', 'Sharjah Industrial Area')`);

    console.log('✓ Database initialized');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}
init();
EOFINIT

# Server file
cat > src/server.js << 'EOFSERVER'
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const mqtt = require('mqtt');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

let mqttConnected = false;
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD
});

mqttClient.on('connect', () => {
  console.log('✓ MQTT connected');
  mqttConnected = true;
  mqttClient.subscribe('devices/+/data', { qos: 1 });
});

mqttClient.on('message', async (topic, message) => {
  try {
    const d = JSON.parse(message.toString());
    await pool.query(`
      INSERT INTO device_data (device_id, hydrostatic_value,
        vrms_1_r, vrms_1_y, vrms_1_b, irms_1_r, irms_1_y, irms_1_b,
        vrms_2_r, vrms_2_y, vrms_2_b, irms_2_r, irms_2_y, irms_2_b,
        pump_1_status, pump_2_status, frequency, temperature,
        dry_run_alert, high_level_float_alert, pump_1_protection, pump_2_protection)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
    `, [d.device_id, d.hydrostatic_value, d.vrms_1_r, d.vrms_1_y, d.vrms_1_b,
        d.irms_1_r, d.irms_1_y, d.irms_1_b, d.vrms_2_r, d.vrms_2_y, d.vrms_2_b,
        d.irms_2_r, d.irms_2_y, d.irms_2_b, d.pump_1_status, d.pump_2_status,
        d.frequency, d.temperature, d.dry_run_alert||0, d.high_level_float_alert||0,
        d.pump_1_protection||0, d.pump_2_protection||0]);
  } catch (err) {
    console.error('MQTT error:', err.message);
  }
});

mqttClient.on('error', () => { mqttConnected = false; });

function auth(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Login failed' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Login failed' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/devices', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM devices WHERE is_active = true ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/devices/:deviceId/data', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM device_data WHERE device_id = $1 ORDER BY timestamp DESC LIMIT 100',
      [req.params.deviceId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), mqtt: { connected: mqttConnected } });
});

app.listen(process.env.PORT, () => console.log(`✓ Server on port ${process.env.PORT}`));
EOFSERVER

# Install and start backend
echo "[5/8] Installing backend dependencies..."
npm install --production

echo "[6/8] Initializing database..."
node src/scripts/initDatabase.js

echo "[7/8] Starting backend..."
pm2 delete stromwater-backend 2>/dev/null || true
pm2 start src/server.js --name stromwater-backend

# Configure Nginx
echo "[8/8] Configuring Nginx..."
sudo bash -c "cat > /etc/nginx/sites-available/stromwater << 'EOF'
server {
    listen 80 default_server;
    server_name _;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
    }
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF"

sudo ln -sf /etc/nginx/sites-available/stromwater /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Firewall
sudo ufw allow 80/tcp
sudo ufw allow 1883/tcp
sudo ufw allow 1883/udp
sudo ufw --force enable
sudo ufw reload

pm2 save

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   ✓ BACKEND DEPLOYMENT COMPLETE!                      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Testing login..."
sleep 2
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

echo ""
echo ""
echo "Health check..."
curl http://localhost:5000/health

echo ""
echo ""
echo "══════════════════════════════════════════════════════"
echo "  ✓ Backend is ready!"
echo "  ✓ Login: admin / admin123"
echo "  ✓ MQTT: stromwater_mqtt / mqtt123"
echo ""
echo "  Next: Deploy frontend (see FRONTEND-DEPLOY.sh)"
echo "══════════════════════════════════════════════════════"
