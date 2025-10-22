# Windows Local Testing Setup Guide

## Prerequisites Installation

### 1. PostgreSQL (Database)

**Download & Install:**
1. Go to: https://www.postgresql.org/download/windows/
2. Download PostgreSQL 15 or 16 (Windows x86-64)
3. Run the installer
4. During installation:
   - **Password**: Set password as `postgres` (or remember what you set)
   - **Port**: Leave as `5432`
   - **Locale**: Default
   - Install Stack Builder: **Skip** (not needed)

**Verify Installation:**
```cmd
# Open Command Prompt
psql --version
```

If not found, add to PATH:
- Default install: `C:\Program Files\PostgreSQL\15\bin`
- Or `C:\Program Files\PostgreSQL\16\bin`

### 2. Mosquitto (MQTT Broker)

**Download & Install:**
1. Go to: https://mosquitto.org/download/
2. Download "mosquitto-2.x.x-install-windows-x64.exe"
3. Run installer (default settings)
4. Install location: `C:\Program Files\mosquitto`

**Important:** Mosquitto installs as a Windows Service and starts automatically.

### 3. Verify Node.js (Already Installed ✅)

You have Node.js v24.5.0 - Perfect!

## Database Setup

Open **Command Prompt as Administrator** and run:

```cmd
# Connect to PostgreSQL (will ask for password you set during install)
psql -U postgres

# In PostgreSQL prompt, run these commands:
CREATE DATABASE stromwater_db;
CREATE USER stromwater_user WITH ENCRYPTED PASSWORD 'stromwater123';
GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;
ALTER DATABASE stromwater_db OWNER TO stromwater_user;
\q
```

## MQTT Broker Setup

### Configure Mosquitto:

1. **Create password file:**
```cmd
cd "C:\Program Files\mosquitto"
mosquitto_passwd -c passwd stromwater_mqtt
# When prompted, enter password: mqtt123
```

2. **Edit configuration:**
Open `C:\Program Files\mosquitto\mosquitto.conf` in Notepad (as Administrator)

Add these lines at the **end** of the file:
```
listener 1883
allow_anonymous false
password_file "C:\Program Files\mosquitto\passwd"
log_dest file C:\Program Files\mosquitto\mosquitto.log
```

3. **Restart Mosquitto Service:**
```cmd
# Open Command Prompt as Administrator
net stop mosquitto
net start mosquitto
```

Or use Windows Services:
- Press `Win + R`, type `services.msc`
- Find "Mosquitto Broker"
- Right-click → Restart

## Backend Setup

```cmd
# Navigate to backend folder
cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ\backend

# Install dependencies
npm install

# Create .env file
copy .env.example .env
```

**Edit `.env` file** (use Notepad or VS Code):

Update these values:
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

JWT_SECRET=my_dev_secret_key_12345
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=my_dev_refresh_secret_12345
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000

ENABLE_EMAIL_ALERTS=false
ENABLE_TELEGRAM_ALERTS=false
```

**Initialize Database:**
```cmd
npm run init-db
```

You should see:
```
Database initialized successfully!
Default admin credentials:
  Username: admin
  Password: admin123
```

## Frontend Setup

Open a **new Command Prompt** window:

```cmd
# Navigate to frontend folder
cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ\frontend

# Install dependencies
npm install

# Create .env file
echo VITE_API_URL=http://localhost:5000/api > .env
echo VITE_WS_URL=ws://localhost:5000 >> .env
```

## Running the Application

### Terminal 1 - Backend:
```cmd
cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ\backend
npm run dev
```

Wait for:
```
Server running on http://0.0.0.0:5000
Database connected successfully
Connected to MQTT broker successfully
WebSocket server initialized
```

### Terminal 2 - Frontend:
```cmd
cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ\frontend
npm run dev
```

Wait for:
```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:3000/
```

### Terminal 3 - MQTT Simulator:
```cmd
cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ
npm install
npm run test:mqtt
```

## Access the Dashboard

1. **Open browser:** http://localhost:3000
2. **Login:**
   - Username: `admin`
   - Password: `admin123`

You should see:
- Real-time water tank level
- Two pump status cards
- Charts updating live
- Device location on map

## Troubleshooting

### PostgreSQL Connection Error

**Issue:** "Database connection error"

**Solution:**
```cmd
# Test connection
psql -h localhost -U stromwater_user -d stromwater_db
# Enter password: stromwater123

# If fails, recreate database:
psql -U postgres
DROP DATABASE IF EXISTS stromwater_db;
DROP USER IF EXISTS stromwater_user;
# Then run CREATE commands again
```

### MQTT Connection Error

**Issue:** "MQTT connection error"

**Solution:**
```cmd
# Check if Mosquitto is running
net start mosquitto

# Test MQTT connection
cd "C:\Program Files\mosquitto"
mosquitto_sub -h localhost -t test -u stromwater_mqtt -P mqtt123

# In another terminal, publish:
mosquitto_pub -h localhost -t test -m "hello" -u stromwater_mqtt -P mqtt123
```

### Port Already in Use

**Issue:** "Port 5000 is already in use"

**Solution:**
```cmd
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Or change port in backend/.env to 5001
# Then update frontend/.env: VITE_API_URL=http://localhost:5001/api
```

### Frontend Build Errors

**Issue:** npm install fails in frontend

**Solution:**
```cmd
# Clear cache and reinstall
cd frontend
rmdir /s /q node_modules
del package-lock.json
npm cache clean --force
npm install
```

## Quick Test Checklist

- [ ] PostgreSQL service is running
- [ ] Mosquitto service is running
- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:3000
- [ ] Can login with admin/admin123
- [ ] MQTT simulator sends data
- [ ] Dashboard shows real-time updates
- [ ] Charts display data
- [ ] Map shows device location
- [ ] Alerts page works
- [ ] Can change theme (dark/light)

## What to Test

1. **Dashboard:**
   - Water level animates
   - Pump status shows ON/OFF
   - Electrical values display
   - Live timestamp updates

2. **Device Detail:**
   - Click device name
   - View charts
   - Export CSV/PDF
   - Map shows location

3. **Alerts:**
   - Go to Alerts page
   - Should see alerts from simulator
   - Acknowledge an alert

4. **Users (Admin only):**
   - Go to Users page
   - Create a new user
   - Delete test user

5. **Settings:**
   - Change password
   - Switch theme

## Next Steps After Testing

Once everything works locally:

1. **Backup your configuration:**
   - Save your `.env` files
   - Note any customizations

2. **Prepare for deployment:**
   - Get Ubuntu VPS
   - Point domain to VPS
   - Follow deployment guide

3. **Connect real devices:**
   - Configure devices to use MQTT credentials
   - Topic: `devices/{deviceId}/data`
   - JSON format from test-mqtt.js

## Need Help?

- Check backend logs: `backend/logs/combined.log`
- Check browser console: Press F12
- Check backend terminal for errors
- All services running: Check Windows Services

---

**Ready to test!** Follow the steps above and let me know if you hit any issues.
