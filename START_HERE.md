# 🚀 Start Here - Windows Testing

## Prerequisites to Install

Before running the setup, you need to install:

### 1. PostgreSQL
- Download: https://www.postgresql.org/download/windows/
- Install version 15 or 16
- During install, set password: `postgres` (remember this!)
- Default port: 5432

### 2. Mosquitto MQTT Broker
- Download: https://mosquitto.org/download/
- Get "mosquitto-2.x.x-install-windows-x64.exe"
- Install to default location
- Service starts automatically

### 3. Node.js ✅ Already Installed
You have Node.js v24.5.0 - Good to go!

---

## Quick Setup (Automated)

### Step 1: Run Setup Script

**Right-click `setup-windows.bat` → "Run as Administrator"**

This will:
- Check prerequisites
- Install all npm dependencies
- Create .env files
- Initialize database (if you choose)

### Step 2: Configure Services

#### PostgreSQL Database:
```cmd
# Open Command Prompt as Administrator
psql -U postgres

# Run these commands:
CREATE DATABASE stromwater_db;
CREATE USER stromwater_user WITH ENCRYPTED PASSWORD 'stromwater123';
GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;
ALTER DATABASE stromwater_db OWNER TO stromwater_user;
\q
```

#### Mosquitto MQTT:
```cmd
# Open Command Prompt as Administrator
cd "C:\Program Files\mosquitto"

# Create password file
mosquitto_passwd -c passwd stromwater_mqtt
# Password: mqtt123

# Restart service
net stop mosquitto
net start mosquitto
```

**Edit Mosquitto config:**
1. Open `C:\Program Files\mosquitto\mosquitto.conf` (as Administrator)
2. Add at the end:
```
listener 1883
allow_anonymous false
password_file "C:\Program Files\mosquitto\passwd"
```

### Step 3: Initialize Database

```cmd
cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ\backend
npm run init-db
```

You should see: "Database initialized successfully!"

### Step 4: Start Everything

**Open 3 Command Prompt windows:**

**Window 1 - Backend:**
```cmd
Double-click: start-backend.bat
```

**Window 2 - Frontend:**
```cmd
Double-click: start-frontend.bat
```

**Window 3 - Simulator:**
```cmd
Double-click: start-simulator.bat
```

### Step 5: Open Dashboard

Open browser: **http://localhost:3000**

Login:
- Username: `admin`
- Password: `admin123`

---

## Manual Setup

If you prefer manual setup, see [WINDOWS_SETUP.md](WINDOWS_SETUP.md)

---

## Verification Checklist

Check these services are running:

### PostgreSQL
```cmd
# Check status (in Services)
Win + R → services.msc → Look for "postgresql-x64-15"

# Or test connection
psql -h localhost -U stromwater_user -d stromwater_db
# Password: stromwater123
```

### Mosquitto
```cmd
# Check status (in Services)
Win + R → services.msc → Look for "Mosquitto Broker"

# Or test MQTT
cd "C:\Program Files\mosquitto"
mosquitto_sub -h localhost -t test -u stromwater_mqtt -P mqtt123
```

### Backend (Port 5000)
```cmd
# Visit in browser
http://localhost:5000/health

# Should return JSON: {"status":"OK",...}
```

### Frontend (Port 3000)
```cmd
# Visit in browser
http://localhost:3000

# Should show login page
```

---

## What You'll See

### Dashboard
- ✅ Animated water tank showing level
- ✅ Two pump status cards (Pump 1 & Pump 2)
- ✅ Real-time electrical parameters (Voltage, Current, Frequency)
- ✅ Live charts showing 24h trends
- ✅ Device location on map
- ✅ Real-time alerts
- ✅ Dark/Light theme toggle

### Data Flow
```
MQTT Simulator → Mosquitto Broker → Backend → PostgreSQL
                                    ↓
                                WebSocket
                                    ↓
                                Frontend
```

---

## Common Issues

### "PostgreSQL not found"
- Add to PATH: `C:\Program Files\PostgreSQL\15\bin`
- Or `C:\Program Files\PostgreSQL\16\bin`

### "Mosquitto not found"
- Add to PATH: `C:\Program Files\mosquitto`

### "Port 5000 already in use"
```cmd
# Find process
netstat -ano | findstr :5000

# Kill it
taskkill /PID <number> /F
```

### "Database connection error"
- Check PostgreSQL is running (Services)
- Verify password in backend/.env
- Test connection with psql

### "MQTT connection error"
- Check Mosquitto is running (Services)
- Verify password file created
- Check mosquitto.conf edited

---

## File Structure

```
SHARJ/
├── setup-windows.bat         ← Run this first
├── start-backend.bat         ← Start backend
├── start-frontend.bat        ← Start frontend
├── start-simulator.bat       ← Start MQTT simulator
├── WINDOWS_SETUP.md          ← Detailed setup guide
├── backend/                  ← Node.js backend
├── frontend/                 ← React dashboard
└── test-mqtt.js             ← Device simulator
```

---

## Testing Flow

1. **Install prerequisites** (PostgreSQL, Mosquitto)
2. **Run setup-windows.bat** (installs dependencies)
3. **Configure database** (create DB and user)
4. **Configure MQTT** (password file and config)
5. **Initialize database** (npm run init-db)
6. **Start backend** (start-backend.bat)
7. **Start frontend** (start-frontend.bat)
8. **Start simulator** (start-simulator.bat)
9. **Open browser** (http://localhost:3000)
10. **Login and test!** (admin/admin123)

---

## Need Help?

1. Check [WINDOWS_SETUP.md](WINDOWS_SETUP.md) for detailed guide
2. Check backend logs: `backend/logs/combined.log`
3. Check browser console: Press F12
4. All services: Win+R → `services.msc`

---

## After Testing Works

Once everything runs smoothly:

1. ✅ Test all features (dashboard, alerts, users, export)
2. ✅ Backup your configuration
3. 📦 Prepare for production deployment
4. 🚀 Deploy to Ubuntu VPS (see README.md)

---

**Ready? Start with step 1: Install PostgreSQL and Mosquitto!**
