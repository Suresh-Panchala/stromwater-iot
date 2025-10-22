# Installation & Setup Guide

## Complete Installation Checklist

### Prerequisites Installation

#### For Windows Development

1. **Node.js**
   - Download from https://nodejs.org/ (LTS version 20+)
   - Verify: `node --version` and `npm --version`

2. **PostgreSQL**
   - Download from https://www.postgresql.org/download/windows/
   - During installation, set password for postgres user
   - Add to PATH if not automatically added

3. **Mosquitto**
   - Download from https://mosquitto.org/download/
   - Install to default location
   - Service will auto-start

#### For Ubuntu/Linux Development or Production

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Mosquitto
sudo apt install -y mosquitto mosquitto-clients

# Install Git (if not installed)
sudo apt install -y git
```

## Step-by-Step Installation

### Step 1: Clone or Download Project

```bash
# If using Git
git clone <repository-url>
cd SHARJ

# Or extract the ZIP file to C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ
```

### Step 2: Database Setup

**Windows:**
```cmd
# Open pgAdmin or SQL Shell (psql)
# Run these commands:

CREATE DATABASE stromwater_db;
CREATE USER stromwater_user WITH ENCRYPTED PASSWORD 'stromwater123';
GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;
ALTER DATABASE stromwater_db OWNER TO stromwater_user;
```

**Linux:**
```bash
sudo -u postgres psql <<EOF
CREATE DATABASE stromwater_db;
CREATE USER stromwater_user WITH ENCRYPTED PASSWORD 'stromwater123';
GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;
ALTER DATABASE stromwater_db OWNER TO stromwater_user;
\q
EOF
```

### Step 3: MQTT Broker Setup

**Windows:**
1. Open `C:\Program Files\mosquitto\mosquitto.conf` in text editor (as Administrator)
2. Add these lines at the end:
   ```
   listener 1883
   allow_anonymous false
   password_file C:\Program Files\mosquitto\passwd
   ```
3. Open Command Prompt as Administrator:
   ```cmd
   cd "C:\Program Files\mosquitto"
   mosquitto_passwd -c passwd stromwater_mqtt
   # Enter password: mqtt123
   ```
4. Restart Mosquitto service:
   - Open Services (Win+R, type `services.msc`)
   - Find "Mosquitto Broker"
   - Right-click → Restart

**Linux:**
```bash
# Create password file
sudo mosquitto_passwd -c /etc/mosquitto/passwd stromwater_mqtt
# Enter password: mqtt123

# Create config
sudo tee /etc/mosquitto/conf.d/local.conf <<EOF
listener 1883
allow_anonymous false
password_file /etc/mosquitto/passwd
EOF

# Restart
sudo systemctl restart mosquitto
sudo systemctl enable mosquitto
```

### Step 4: Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file from example
# Windows:
copy .env.example .env

# Linux:
cp .env.example .env

# Edit .env file with your settings
# At minimum, update these:
# DB_PASSWORD=stromwater123
# MQTT_BROKER_URL=mqtt://localhost:1883
# MQTT_USERNAME=stromwater_mqtt
# MQTT_PASSWORD=mqtt123
# JWT_SECRET=your_random_secret_key_here
```

**Edit .env file:** (Use notepad, nano, or your favorite editor)

**Minimal .env for local development:**
```env
NODE_ENV=development
PORT=5000
HOST=0.0.0.0

DB_HOST=localhost
DB_PORT=5432
DB_NAME=stromwater_db
DB_USER=stromwater_user
DB_PASSWORD=stromwater123

MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=stromwater_mqtt
MQTT_PASSWORD=mqtt123
MQTT_CLIENT_ID=stromwater_backend
MQTT_TOPIC=devices/+/data

JWT_SECRET=my_very_secure_jwt_secret_change_this_in_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=my_very_secure_refresh_secret_change_this
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000

ENABLE_EMAIL_ALERTS=false
ENABLE_TELEGRAM_ALERTS=false
```

```bash
# Initialize database (creates tables and admin user)
npm run init-db

# You should see:
# Database initialized successfully!
# Default admin credentials:
#   Username: admin
#   Password: admin123
```

### Step 5: Frontend Setup

```bash
# Navigate to frontend folder (open new terminal/cmd)
cd frontend

# Install dependencies
npm install

# Create .env file
# Windows:
echo VITE_API_URL=http://localhost:5000/api > .env
echo VITE_WS_URL=ws://localhost:5000 >> .env

# Linux:
cat > .env <<EOF
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
EOF
```

### Step 6: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
Server running on http://0.0.0.0:5000
Environment: development
Database connected successfully
Connected to MQTT broker successfully
Subscribed to topic: devices/+/data
WebSocket server initialized
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

You should see:
```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

### Step 7: Access the Dashboard

1. Open browser: http://localhost:3000
2. Login with:
   - Username: `admin`
   - Password: `admin123`

### Step 8: Test with Simulated Device Data

**Terminal 3 - MQTT Simulator:**
```bash
# Install mqtt package in root folder
cd SHARJ  # root project folder
npm install

# Run simulator
npm run test:mqtt
```

You should see device data being published every 5 seconds, and it will appear in the dashboard in real-time!

## Verification Checklist

- [ ] PostgreSQL is running
  - Windows: Check Services
  - Linux: `sudo systemctl status postgresql`

- [ ] Mosquitto is running
  - Windows: Check Services
  - Linux: `sudo systemctl status mosquitto`

- [ ] Backend is running on port 5000
  - Open http://localhost:5000/health
  - Should return: `{"status":"OK",...}`

- [ ] Frontend is running on port 3000
  - Open http://localhost:3000
  - Should show login page

- [ ] Can login to dashboard
  - Use admin/admin123

- [ ] MQTT simulator sends data
  - Run `npm run test:mqtt`
  - Check dashboard for real-time updates

- [ ] Alerts work
  - Simulator will trigger alerts randomly
  - Check Alerts page

- [ ] WebSocket is connected
  - Dashboard shows "Live" indicator with green dot

## Troubleshooting

### Backend won't start

**Error: "Database connection error"**
- Check PostgreSQL is running
- Verify credentials in `.env`
- Test connection: `psql -h localhost -U stromwater_user -d stromwater_db`

**Error: "MQTT connection error"**
- Check Mosquitto is running
- Verify MQTT credentials in `.env`
- Test: `mosquitto_sub -h localhost -t 'test' -u stromwater_mqtt -P mqtt123`

**Error: "Port 5000 already in use"**
- Change PORT in backend/.env to 5001
- Update VITE_API_URL in frontend/.env to http://localhost:5001/api

### Frontend won't start

**Error: "Port 3000 already in use"**
- Kill the process or change port in vite.config.js

**Error: "Cannot connect to backend"**
- Ensure backend is running
- Check VITE_API_URL in frontend/.env
- Clear browser cache

### MQTT issues

**Can't connect to MQTT broker**
```bash
# Test MQTT connection
mosquitto_sub -h localhost -t 'test' -u stromwater_mqtt -P mqtt123

# If fails, check:
# 1. Mosquitto is running
# 2. Password file exists
# 3. Config file is correct
```

**Device data not appearing**
```bash
# Check backend logs for MQTT messages
# Should see: "Received message from topic: devices/StromWater_Device_1/data"

# Test publishing manually:
mosquitto_pub -h localhost -t "devices/test/data" -u stromwater_mqtt -P mqtt123 -m '{"test":"data"}'
```

### Database issues

**Can't initialize database**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
# or check Services on Windows

# Test connection
psql -h localhost -U stromwater_user -d stromwater_db
# If password fails, recreate user in PostgreSQL
```

## Production Deployment

For production deployment on Ubuntu VPS:

1. Follow the Ubuntu prerequisites installation
2. Run: `cd mqtt-config && sudo ./setup-mosquitto.sh`
3. Run: `cd deployment && sudo ./deploy.sh`
4. Upload your code to `/opt/stromwater/`
5. Configure production `.env` files
6. Initialize database: `npm run init-db`
7. Build frontend: `npm run build`
8. Configure Nginx (see deployment/nginx.conf)
9. Setup SSL: `sudo ./deployment/setup-ssl.sh`
10. Start with PM2: `pm2 start ecosystem.config.js`

See [README.md](README.md) for detailed production deployment instructions.

## Next Steps

1. **Change Admin Password**
   - Login → Settings → Change Password

2. **Create Additional Users** (if admin)
   - Go to Users page → Create User

3. **Configure Email Alerts**
   - Edit backend/.env
   - Set ENABLE_EMAIL_ALERTS=true
   - Configure SMTP settings
   - Restart backend

4. **Configure Telegram Alerts**
   - Create Telegram bot via @BotFather
   - Get bot token and chat ID
   - Edit backend/.env
   - Restart backend

5. **Connect Real IoT Devices**
   - Configure devices to publish to: `devices/{deviceId}/data`
   - Use the same MQTT credentials
   - Follow the JSON format from test-mqtt.js

## Support

- Check [README.md](README.md) for complete documentation
- Check [QUICKSTART.md](QUICKSTART.md) for quick reference
- Check logs: `backend/logs/combined.log`

---

**Congratulations!** Your StromWater IoT Platform is now installed and running.
