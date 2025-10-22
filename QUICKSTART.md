# StromWater Platform - Quick Start Guide

## Get Running in 5 Minutes

### Step 1: Install Prerequisites

**Windows (Development):**
- Install [Node.js 20+](https://nodejs.org/)
- Install [PostgreSQL 15+](https://www.postgresql.org/download/windows/)
- Install [Mosquitto](https://mosquitto.org/download/)

**Linux (Development & Production):**
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Mosquitto
sudo apt install -y mosquitto mosquitto-clients
```

### Step 2: Setup Database

```bash
# Start PostgreSQL service
sudo systemctl start postgresql  # Linux
# or use pgAdmin on Windows

# Create database
sudo -u postgres psql
CREATE DATABASE stromwater_db;
CREATE USER stromwater_user WITH ENCRYPTED PASSWORD 'stromwater123';
GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;
\q
```

### Step 3: Setup MQTT Broker (Local)

**Linux:**
```bash
# Create password file
sudo mosquitto_passwd -c /etc/mosquitto/passwd stromwater_mqtt
# Enter password: mqtt123

# Create config file
sudo nano /etc/mosquitto/conf.d/local.conf

# Add these lines:
listener 1883
allow_anonymous false
password_file /etc/mosquitto/passwd

# Restart
sudo systemctl restart mosquitto
```

**Windows:**
```bash
# Edit C:\Program Files\mosquitto\mosquitto.conf
# Add:
listener 1883
allow_anonymous false
password_file C:\Program Files\mosquitto\passwd

# Create password file (in mosquitto folder)
mosquitto_passwd -c passwd stromwater_mqtt
# Enter password: mqtt123

# Restart Mosquitto service
```

### Step 4: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env (minimal config for local dev):
# DB_PASSWORD=stromwater123
# MQTT_BROKER_URL=mqtt://localhost:1883
# MQTT_USERNAME=stromwater_mqtt
# MQTT_PASSWORD=mqtt123
# JWT_SECRET=my_secret_key_change_in_production

# Initialize database (creates tables and admin user)
npm run init-db

# Start backend
npm run dev
```

Backend will run on http://localhost:5000

### Step 5: Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env
echo "VITE_WS_URL=ws://localhost:5000" >> .env

# Start frontend
npm run dev
```

Frontend will run on http://localhost:3000

### Step 6: Login & Test

1. Open http://localhost:3000
2. Login with default credentials:
   - Username: `admin`
   - Password: `admin123`

### Step 7: Simulate Device Data

Open a new terminal and run:

```bash
# Install mosquitto clients if not already installed
# Linux: sudo apt install mosquitto-clients
# Windows: Already included with Mosquitto

# Publish test data
mosquitto_pub -h localhost -p 1883 -u stromwater_mqtt -P mqtt123 \
  -t "devices/StromWater_Device_1/data" \
  -m '{
    "deviceId": "StromWater_Device_1",
    "location": "khusam",
    "timestamp": "2025-10-20T10:30:00Z",
    "data": {
      "Hydrostatic_Value": 65.5,
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

You should see the data appear in the dashboard immediately!

### Step 8: Test Alert System

Publish data with alerts:

```bash
mosquitto_pub -h localhost -p 1883 -u stromwater_mqtt -P mqtt123 \
  -t "devices/StromWater_Device_1/data" \
  -m '{
    "deviceId": "StromWater_Device_1",
    "location": "khusam",
    "timestamp": "2025-10-20T10:35:00Z",
    "data": {
      "Hydrostatic_Value": 85.5,
      "DryRunAlert": 1,
      "HighLevelFloatAlert": 1,
      "Pump_1_Manual": 0,
      "Pump_2_Manual": 0,
      "Pump_1_Auto": 1,
      "Pump_2_Auto": 1,
      "Pump_1_Protection": 0,
      "Pump_2_Protection": 0,
      "Pump_1_Contactor_Feedback": 1,
      "Pump_2_Contactor_Feedback": 1,
      "POWER_1_R": 230,
      "POWER_1_Y": 228,
      "POWER_1_B": 229,
      "IRMS_1_R": 2.1,
      "IRMS_1_Y": 2.2,
      "IRMS_1_B": 2.0,
      "POWER_2_R": 230,
      "POWER_2_Y": 229,
      "POWER_2_B": 228,
      "IRMS_2_R": 1.8,
      "IRMS_2_Y": 1.9,
      "IRMS_2_B": 1.7,
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
      "RHS_2": 1
    }
  }'
```

Alerts should appear on the dashboard and in the Alerts page!

## Common Issues & Solutions

### Database Connection Error
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -h localhost -U stromwater_user -d stromwater_db
```

### MQTT Connection Error
```bash
# Check if Mosquitto is running
sudo systemctl status mosquitto

# Test MQTT
mosquitto_sub -h localhost -t 'devices/#' -u stromwater_mqtt -P mqtt123
```

### Port Already in Use
```bash
# Check what's using the port
# Linux:
sudo lsof -i :5000
sudo lsof -i :3000

# Windows:
netstat -ano | findstr :5000
netstat -ano | findstr :3000
```

### Frontend Can't Connect to Backend
- Make sure backend is running on port 5000
- Check CORS settings in backend/.env
- Verify VITE_API_URL in frontend/.env

## Next Steps

1. **Change Default Password**: Go to Settings and change admin password
2. **Create Users**: If you're admin, go to Users page to create new users
3. **Configure Alerts**: Edit backend/.env to enable Email/Telegram alerts
4. **Add More Devices**: Devices are auto-created when they publish data
5. **Explore API**: Check README.md for complete API documentation

## Production Deployment

For production deployment on Ubuntu VPS, see [README.md](README.md) deployment section.

## Need Help?

- Check logs: `backend/logs/combined.log`
- Backend console: Check terminal where `npm run dev` is running
- Browser console: Press F12 to see frontend errors

---

**You're all set!** The platform should now be running with real-time monitoring, alerts, and beautiful visualizations.
