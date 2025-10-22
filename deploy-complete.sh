#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║   StromWater IoT Platform - Complete Fresh Deploy     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

VPS_IP="43.205.194.142"

echo -e "${YELLOW}Step 1: Cleaning old installation...${NC}"
pm2 delete all 2>/dev/null || true
sudo rm -rf /var/www/stromwater
sudo mkdir -p /var/www/stromwater
sudo chown -R ubuntu:ubuntu /var/www/stromwater
echo -e "${GREEN}✓ Cleaned${NC}"

echo ""
echo -e "${YELLOW}Step 2: Setting up PostgreSQL...${NC}"
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
echo -e "${GREEN}✓ PostgreSQL ready${NC}"

echo ""
echo -e "${YELLOW}Step 3: Configuring Mosquitto MQTT...${NC}"
sudo bash -c 'cat > /etc/mosquitto/mosquitto.conf << EOF
listener 1883 0.0.0.0
allow_anonymous false
password_file /etc/mosquitto/passwd
EOF'
sudo mosquitto_passwd -c -b /etc/mosquitto/passwd stromwater_mqtt mqtt123
sudo chown mosquitto:mosquitto /etc/mosquitto/passwd
sudo chmod 644 /etc/mosquitto/passwd
sudo systemctl restart mosquitto
echo -e "${GREEN}✓ Mosquitto configured${NC}"

echo ""
echo -e "${YELLOW}Step 4: Setting up backend...${NC}"
cd /var/www/stromwater
mkdir -p backend
cd backend

# Create package.json
cat > package.json << 'EOF'
{
  "name": "stromwater-backend",
  "version": "1.0.0",
  "description": "StromWater IoT Backend",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0",
    "mqtt": "^5.0.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^7.1.0",
    "ws": "^8.14.2"
  }
}
EOF

# Create .env
cat > .env << EOF
DATABASE_URL=postgresql://stromwater_user:stromwater_pass@localhost:5432/stromwater_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=stromwater_mqtt
MQTT_PASSWORD=mqtt123
PORT=5000
WS_PORT=5001
NODE_ENV=production
CORS_ORIGIN=http://${VPS_IP}
EOF

# Create directory structure
mkdir -p src/routes src/scripts

# Create database init script
cat > src/scripts/initDatabase.js << 'EOFINIT'
require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function initDatabase() {
  try {
    console.log('Creating database schema...');

    // Create users table
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

    // Create devices table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create device_data table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS device_data (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(100) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        hydrostatic_value FLOAT,
        vrms_1_r FLOAT,
        vrms_1_y FLOAT,
        vrms_1_b FLOAT,
        irms_1_r FLOAT,
        irms_1_y FLOAT,
        irms_1_b FLOAT,
        vrms_2_r FLOAT,
        vrms_2_y FLOAT,
        vrms_2_b FLOAT,
        irms_2_r FLOAT,
        irms_2_y FLOAT,
        irms_2_b FLOAT,
        pump_1_status VARCHAR(10),
        pump_2_status VARCHAR(10),
        frequency FLOAT,
        temperature FLOAT,
        dry_run_alert INTEGER,
        high_level_float_alert INTEGER,
        pump_1_protection INTEGER,
        pump_2_protection INTEGER
      );
    `);

    console.log('✓ Schema created');

    // Create admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    await pool.query("DELETE FROM users WHERE username='admin'");
    const result = await pool.query(`
      INSERT INTO users (username, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, role
    `, ['admin', 'admin@stromwater.com', passwordHash, 'admin', true]);

    console.log('✓ Admin user created:', result.rows[0]);

    // Insert sample devices
    await pool.query("DELETE FROM devices");
    await pool.query(`
      INSERT INTO devices (device_id, name, location) VALUES
      ('StromWater_Device_1', 'Dubai Pump Station', 'Dubai Industrial Area'),
      ('StromWater_Device_2', 'Sharjah Pump Station', 'Sharjah Industrial Area')
    `);

    console.log('✓ Sample devices created');

  } catch (err) {
    console.error('✗ Error:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

initDatabase();
EOFINIT

# Create main server file
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
const PORT = process.env.PORT || 5000;

// Trust proxy
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// MQTT Client
let mqttClient;
let mqttConnected = false;

function connectMQTT() {
  mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    reconnectPeriod: 5000
  });

  mqttClient.on('connect', () => {
    console.log('✓ MQTT connected');
    mqttConnected = true;
    mqttClient.subscribe('devices/+/data', { qos: 1 });
  });

  mqttClient.on('message', async (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      await pool.query(`
        INSERT INTO device_data (
          device_id, hydrostatic_value,
          vrms_1_r, vrms_1_y, vrms_1_b,
          irms_1_r, irms_1_y, irms_1_b,
          vrms_2_r, vrms_2_y, vrms_2_b,
          irms_2_r, irms_2_y, irms_2_b,
          pump_1_status, pump_2_status,
          frequency, temperature,
          dry_run_alert, high_level_float_alert,
          pump_1_protection, pump_2_protection
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      `, [
        data.device_id, data.hydrostatic_value,
        data.vrms_1_r, data.vrms_1_y, data.vrms_1_b,
        data.irms_1_r, data.irms_1_y, data.irms_1_b,
        data.vrms_2_r, data.vrms_2_y, data.vrms_2_b,
        data.irms_2_r, data.irms_2_y, data.irms_2_b,
        data.pump_1_status, data.pump_2_status,
        data.frequency, data.temperature,
        data.dry_run_alert || 0, data.high_level_float_alert || 0,
        data.pump_1_protection || 0, data.pump_2_protection || 0
      ]);
    } catch (err) {
      console.error('MQTT message error:', err.message);
    }
  });

  mqttClient.on('error', (err) => {
    console.error('MQTT error:', err.message);
    mqttConnected = false;
  });
}

connectMQTT();

// Auth middleware
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Login failed' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Login failed' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/devices', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM devices WHERE is_active = true ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/devices/:deviceId/data', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const result = await pool.query(
      'SELECT * FROM device_data WHERE device_id = $1 ORDER BY timestamp DESC LIMIT 100',
      [deviceId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mqtt: { connected: mqttConnected }
  });
});

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
});
EOFSERVER

# Install dependencies
npm install

# Initialize database
node src/scripts/initDatabase.js

# Start backend
pm2 delete stromwater-backend 2>/dev/null || true
pm2 start src/server.js --name stromwater-backend

echo -e "${GREEN}✓ Backend running${NC}"

echo ""
echo -e "${YELLOW}Step 5: Configuring Nginx...${NC}"
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
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    location /ws {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
EOF"

sudo ln -sf /etc/nginx/sites-available/stromwater /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
echo -e "${GREEN}✓ Nginx configured${NC}"

echo ""
echo -e "${YELLOW}Step 6: Configuring firewall...${NC}"
sudo ufw allow 80/tcp
sudo ufw allow 1883/tcp
sudo ufw allow 1883/udp
sudo ufw --force enable
sudo ufw reload
echo -e "${GREEN}✓ Firewall configured${NC}"

pm2 save

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   ✓ Backend Deployment Complete!                      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${YELLOW}Testing login...${NC}"
sleep 2
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

echo ""
echo ""
echo -e "${YELLOW}Health check...${NC}"
curl http://localhost:5000/health

echo ""
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Next: Upload frontend and run frontend deployment"
echo "═══════════════════════════════════════════════════════"
