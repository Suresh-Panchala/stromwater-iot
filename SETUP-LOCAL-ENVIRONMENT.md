# 🚀 Local Environment Setup Guide - StromWater IoT Platform

## ✅ What's Been Done:

1. ✅ **New Login Page** - Split screen with left animation, right form (fully responsive)
2. ✅ **Frontend running** on http://localhost:3000
3. ✅ **MQTT Simulator running** - Publishing data for 2 devices

## 🔧 What We Need To Do:

### Step 1: Set Up PostgreSQL Database

Since you have PostgreSQL installed, we need to create the database and initialize it.

**Run these commands in Command Prompt or PowerShell:**

```cmd
# Connect to PostgreSQL (you'll be prompted for postgres password)
psql -U postgres

# Then run these SQL commands:
CREATE DATABASE stromwater_db;
CREATE USER stromwater_user WITH PASSWORD 'stromwater123';
GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;
\c stromwater_db
GRANT ALL ON SCHEMA public TO stromwater_user;
\q
```

###Step 2: Initialize Database Schema

```cmd
cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ\backend
node src/scripts/initDatabase.js
```

This will create:
- ✅ users table (with admin user)
- ✅ devices table
- ✅ device_data table
- ✅ alerts table
- ✅ refresh_tokens table

### Step 3: Install Backend Dependencies (if not done)

```cmd
cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ\backend
npm install
```

### Step 4: Start Backend

```cmd
cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ\backend
node src/server.js
```

**Expected output:**
```
Server running on http://0.0.0.0:5000
Environment: development
MQTT connecting to mqtt://localhost:1883
WebSocket server initialized
```

###Step 5: Install Mosquitto MQTT Broker (if not installed)

**Option A - Using Chocolatey:**
```cmd
choco install mosquitto
```

**Option B - Manual Download:**
1. Download from: https://mosquitto.org/download/
2. Install for Windows
3. Start service: `net start mosquitto`

**Option C - Using Docker (if you have Docker):**
```cmd
docker run -d -p 1883:1883 --name mosquitto eclipse-mosquitto
```

### Step 6: Configure Mosquitto for Username/Password

Create file: `C:\Program Files\mosquitto\mosquitto.conf`

```
listener 1883
allow_anonymous true
```

Restart Mosquitto service.

---

## 🎯 Testing Locally

Once all services are running, test these URLs:

### 1. Frontend
http://localhost:3000

### 2. Backend Health Check
http://localhost:5000/health

### 3. Login
- URL: http://localhost:3000
- Username: `admin`
- Password: `admin123`

### 4. Features to Test:

✅ **Dashboard** - Should show devices from database
✅ **Alerts** - Should show alerts
✅ **Analytics** - Should show device statistics
✅ **Device Management** - Admin can add/edit/delete devices
✅ **User Management** - Admin can manage users
✅ **Real-time MQTT** - Data updates live from simulator
✅ **CSV Export** - Download device data
✅ **PDF Export** - Generate PDF reports

---

## 📝 What I Need From You:

**Please provide:**

1. **PostgreSQL Password**
   - What's your postgres user password?
   - This is needed to create the database

2. **MQTT Broker Status**
   - Do you have Mosquitto installed?
   - Run: `where mosquitto` and tell me the result

Once you provide these, I'll create automated scripts to:
1. Set up the database
2. Insert sample data (devices, alerts, device_data)
3. Start all services
4. Test everything

---

## 🐛 Common Issues & Fixes:

### Issue: "psql: command not found"
**Fix:** Add PostgreSQL to PATH:
```
C:\Program Files\PostgreSQL\16\bin
```

### Issue: Backend can't connect to database
**Fix:** Check PostgreSQL is running:
```cmd
pg_isready -U postgres
```

### Issue: MQTT simulator not connecting
**Fix:** Start Mosquitto:
```cmd
net start mosquitto
```

### Issue: Frontend can't reach backend
**Fix:** Check backend is running on port 5000:
```cmd
netstat -ano | findstr :5000
```

---

## 📦 Complete Stack:

```
┌─────────────────────────────────────────┐
│  Frontend (React + Vite)                │
│  http://localhost:3000                  │
│  ✅ RUNNING                             │
└─────────────────────────────────────────┘
              │ HTTP/WebSocket
              ↓
┌─────────────────────────────────────────┐
│  Backend (Node.js + Express)            │
│  http://localhost:5000                  │
│  ⏳ NEEDS TO START                      │
└─────────────────────────────────────────┘
              │ SQL                │ MQTT
              ↓                    ↓
┌──────────────────┐     ┌────────────────┐
│  PostgreSQL      │     │  Mosquitto     │
│  localhost:5432  │     │  localhost:1883│
│  ⏳ NEEDS SETUP  │     │  ⏳ NEEDS CHECK│
└──────────────────┘     └────────────────┘
```

---

## Next Steps:

**Tell me:**
1. Your PostgreSQL postgres password
2. Result of: `where mosquitto`
3. Result of: `psql --version`

Then I'll create automated setup scripts for you!
