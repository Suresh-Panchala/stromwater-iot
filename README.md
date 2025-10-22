# StromWater IoT Monitoring Platform

A modern, secure, and scalable IoT monitoring platform for StromWater devices with real-time data visualization, alerts, and user management.

## Features

### Backend
- **MQTT Integration**: Secure connection to Mosquitto broker with SSL/TLS
- **PostgreSQL Database**: Efficient data storage with indexing on deviceId and timestamp
- **REST API**: Complete API for device data, alerts, and user management
- **WebSocket Support**: Real-time updates without page refresh
- **JWT Authentication**: Secure user authentication with refresh tokens
- **Alert System**: Threshold-based alerts via Email and Telegram
- **Data Export**: CSV and PDF export functionality
- **Auto-restart**: PM2 process management

### Frontend
- **React.js + Vite**: Fast development and optimized builds
- **Tailwind CSS**: Modern, responsive UI
- **Recharts**: Beautiful real-time data visualization
- **Framer Motion**: Smooth animations
- **Leaflet Maps**: Device location display
- **Dark/Light Mode**: User preference theme switching
- **Real-time Updates**: WebSocket integration for live data

### Security
- **Username/Password Authentication** for MQTT
- **SSL/TLS Encryption** for MQTT broker
- **JWT Tokens** for API authentication
- **Helmet.js** for HTTP header security
- **Rate Limiting** to prevent abuse
- **Role-based Access Control** (Admin/User)

## Project Structure

```
SHARJ/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # API controllers
│   │   ├── middleware/      # Authentication middleware
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   ├── services/        # MQTT, WebSocket, Alert services
│   │   ├── utils/           # Logger and utilities
│   │   ├── scripts/         # Database initialization
│   │   └── server.js        # Express server
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API and WebSocket services
│   │   ├── context/         # React Context (Auth, Theme)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── mqtt-config/
│   ├── mosquitto.conf       # MQTT broker configuration
│   └── setup-mosquitto.sh   # MQTT setup script
│
└── deployment/
    ├── deploy.sh            # Main deployment script
    ├── nginx.conf           # Nginx configuration
    ├── setup-ssl.sh         # SSL certificate setup
    └── ecosystem.config.js  # PM2 configuration
```

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Mosquitto MQTT Broker
- Ubuntu VPS (for production deployment)

### Local Development

#### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
nano .env  # Edit with your configuration

# Initialize database
npm run init-db

# Start development server
npm run dev
```

Default admin credentials:
- Username: `admin`
- Password: `admin123`

#### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env
echo "VITE_WS_URL=ws://localhost:5000" >> .env

# Start development server
npm run dev
```

Access the dashboard at: http://localhost:3000

### MQTT Broker Setup (Local)

```bash
# Install Mosquitto
sudo apt install mosquitto mosquitto-clients

# Create password file
sudo mosquitto_passwd -c /etc/mosquitto/passwd stromwater_mqtt

# Start Mosquitto
sudo systemctl start mosquitto
sudo systemctl enable mosquitto
```

### Test MQTT Publishing

```bash
# Subscribe to all device topics
mosquitto_sub -h localhost -t "devices/#" -u stromwater_mqtt -P yourpassword

# Publish test data (in another terminal)
mosquitto_pub -h localhost -t "devices/StromWater_Device_1/data" \
  -u stromwater_mqtt -P yourpassword \
  -m '{
    "deviceId": "StromWater_Device_1",
    "location": "khusam",
    "timestamp": "2025-10-20T10:30:00Z",
    "data": {
      "Hydrostatic_Value": 45.7,
      "DryRunAlert": 0,
      "HighLevelFloatAlert": 0,
      "Pump_1_Manual": 1,
      "Pump_2_Manual": 0,
      "Pump_1_Auto": 1,
      "Pump_2_Auto": 0,
      "Pump_1_Protection": 0,
      "Pump_2_Protection": 0,
      "Pump_1_Contactor_Feedback": 1,
      "Pump_2_Contactor_Feedback": 0,
      "POWER_1_R": 230,
      "POWER_1_Y": 228,
      "POWER_1_B": 229,
      "IRMS_1_R": 2.1,
      "IRMS_1_Y": 2.2,
      "IRMS_1_B": 2.0,
      "POWER_2_R": 230,
      "POWER_2_Y": 229,
      "POWER_2_B": 228,
      "IRMS_2_R": 0,
      "IRMS_2_Y": 0,
      "IRMS_2_B": 0,
      "VRMS_1_R": 230,
      "VRMS_1_Y": 229,
      "VRMS_1_B": 231,
      "VRMS_2_R": 230,
      "VRMS_2_Y": 229,
      "VRMS_2_B": 228,
      "VAHR_1_R": 1234,
      "VAHR_1_Y": 1240,
      "VAHR_1_B": 1220,
      "VAHR_2_R": 1300,
      "VAHR_2_Y": 1320,
      "VAHR_2_B": 1290,
      "FREQ_1_R": 50,
      "FREQ_1_Y": 50,
      "FREQ_1_B": 50,
      "FREQ_2_R": 50,
      "FREQ_2_Y": 50,
      "FREQ_2_B": 50,
      "RHS_1": 1,
      "RHS_2": 0
    }
  }'
```

## Production Deployment (Ubuntu VPS)

### 1. Prepare Your VPS

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Upload deployment scripts
scp -r mqtt-config deployment user@your-vps-ip:~/
```

### 2. Setup MQTT Broker

```bash
cd ~/mqtt-config
chmod +x setup-mosquitto.sh
sudo ./setup-mosquitto.sh
```

### 3. Deploy Application

```bash
cd ~/deployment
chmod +x deploy.sh setup-ssl.sh
sudo ./deploy.sh
```

### 4. Upload Application Code

```bash
# From your local machine
scp -r backend user@your-vps-ip:/opt/stromwater/
scp -r frontend user@your-vps-ip:/opt/stromwater/
```

### 5. Configure Backend

```bash
# On VPS
cd /opt/stromwater/backend
cp .env.example .env
nano .env  # Update with production settings

npm install --production
npm run init-db

# Start with PM2
pm2 start src/server.js --name stromwater-backend
pm2 save
pm2 startup
```

### 6. Build and Deploy Frontend

```bash
cd /opt/stromwater/frontend
npm install
npm run build

# Copy build to Nginx
sudo cp -r dist/* /var/www/html/
```

### 7. Configure Nginx

```bash
sudo cp ~/deployment/nginx.conf /etc/nginx/sites-available/stromwater
sudo ln -s /etc/nginx/sites-available/stromwater /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. Setup SSL Certificate

```bash
cd ~/deployment
sudo ./setup-ssl.sh
```

## Environment Variables

### Backend (.env)

```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

DB_HOST=localhost
DB_PORT=5432
DB_NAME=stromwater_db
DB_USER=stromwater_user
DB_PASSWORD=your_secure_password

MQTT_BROKER_URL=mqtts://your-vps-ip:8883
MQTT_USERNAME=stromwater_mqtt
MQTT_PASSWORD=your_mqtt_password
MQTT_CLIENT_ID=stromwater_backend
MQTT_TOPIC=devices/+/data

JWT_SECRET=your_very_secure_jwt_secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=https://your-domain.com

ENABLE_EMAIL_ALERTS=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ALERT_EMAIL_TO=admin@example.com

ENABLE_TELEGRAM_ALERTS=false
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### Frontend (.env)

```env
VITE_API_URL=https://your-domain.com/api
VITE_WS_URL=wss://your-domain.com
```

## API Documentation

### Authentication

**POST /api/auth/login**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**POST /api/auth/refresh**
```json
{
  "refreshToken": "your_refresh_token"
}
```

### Devices

**GET /api/devices** - Get all devices

**GET /api/devices/:deviceId** - Get device by ID

**GET /api/devices/:deviceId/latest** - Get latest data

**GET /api/devices/:deviceId/historical?hours=24** - Get historical data

**GET /api/devices/:deviceId/stats?hours=24** - Get device statistics

**GET /api/devices/:deviceId/export/csv** - Export data as CSV

**GET /api/devices/:deviceId/export/pdf** - Export data as PDF

### Alerts

**GET /api/alerts?deviceId=X&acknowledged=false** - Get alerts

**PUT /api/alerts/:alertId/acknowledge** - Acknowledge alert

### Users (Admin Only)

**GET /api/users** - Get all users

**POST /api/users** - Create user

**PUT /api/users/:userId** - Update user

**DELETE /api/users/:userId** - Delete user

## Monitoring & Maintenance

### Check Service Status

```bash
# Backend
pm2 status
pm2 logs stromwater-backend

# MQTT Broker
sudo systemctl status mosquitto
sudo tail -f /var/log/mosquitto/mosquitto.log

# Nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/stromwater-error.log

# Database
sudo -u postgres psql -d stromwater_db -c "SELECT COUNT(*) FROM device_data;"
```

### Backup Database

```bash
# Create backup
sudo -u postgres pg_dump stromwater_db > backup_$(date +%Y%m%d).sql

# Restore backup
sudo -u postgres psql stromwater_db < backup_20250120.sql
```

### Update Application

```bash
# Pull new code
cd /opt/stromwater/backend
git pull  # or upload new files

# Restart backend
pm2 restart stromwater-backend

# Rebuild frontend
cd /opt/stromwater/frontend
npm run build
sudo cp -r dist/* /var/www/html/
```

## Troubleshooting

### MQTT Connection Issues

```bash
# Test MQTT connection
mosquitto_sub -h your-vps-ip -p 8883 -u stromwater_mqtt -P password -t 'devices/#' --cafile /etc/mosquitto/certs/ca.crt

# Check firewall
sudo ufw status
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql -h localhost -U stromwater_user -d stromwater_db
```

### WebSocket Issues

```bash
# Check if WebSocket port is accessible
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:5000/ws
```

## License

MIT License

## Support

For issues and questions, please create an issue in the repository.

---

**Built with** Node.js, React, PostgreSQL, MQTT, and deployed on Ubuntu VPS
