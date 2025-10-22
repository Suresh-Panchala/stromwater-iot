# StromWater IoT Platform - Fresh Deployment

## ⚡ QUICK START (15 minutes to working system)

### Step 1: Deploy Backend (10 minutes)

1. **Login to AWS Console**: https://console.aws.amazon.com/
2. **Go to EC2** → Find instance with IP `43.205.194.142`
3. **Click "Connect"** → Choose "EC2 Instance Connect"
4. **Copy the entire contents of `COPY-PASTE-THIS.sh`** and paste into the terminal
5. **Press Enter** and wait ~10 minutes

**Look for**: "✓ BACKEND DEPLOYMENT COMPLETE!" and a JWT token

---

### Step 2: Deploy Frontend (5 minutes)

In the same AWS Console terminal:

1. **Copy the entire contents of `FRONTEND-DEPLOY.sh`** and paste
2. **Press Enter** and wait ~3 minutes

**Look for**: "✓ FRONTEND DEPLOYMENT COMPLETE!"

---

### Step 3: Test (2 minutes)

1. **Open browser**: http://43.205.194.142
2. **Login**:
   - Username: `admin`
   - Password: `admin123`
3. **Start simulator** (Windows):
   ```
   cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ
   node test-mqtt-both-devices.js
   ```
4. **Verify**: Dashboard shows devices and real-time data updates!

---

## 📁 Files You Need

| File | Purpose |
|------|---------|
| `COPY-PASTE-THIS.sh` | Backend deployment (paste in AWS Console) |
| `FRONTEND-DEPLOY.sh` | Frontend deployment (paste in AWS Console) |
| `test-mqtt-both-devices.js` | Windows MQTT simulator |

---

## ✅ What This Does

### Backend Deployment (`COPY-PASTE-THIS.sh`):
1. Cleans old installation
2. Sets up PostgreSQL database
3. Configures Mosquitto MQTT broker
4. Creates backend API with:
   - User authentication (JWT)
   - Device management
   - Data storage
5. Configures Nginx reverse proxy
6. Sets up firewall
7. Starts backend with PM2

### Frontend Deployment (`FRONTEND-DEPLOY.sh`):
1. Creates a simple HTML dashboard
2. Implements login page
3. Device selector
4. Real-time data display
5. Auto-refresh every 5 seconds
6. Starts frontend server with PM2

---

## 🔑 Credentials

**Dashboard**:
- URL: http://43.205.194.142
- Username: `admin`
- Password: `admin123`

**MQTT** (for ESP32 devices):
- Broker: `43.205.194.142:1883`
- Username: `stromwater_mqtt`
- Password: `mqtt123`
- Topic: `devices/{DEVICE_ID}/data`

**Database** (if needed):
- Host: `localhost` (VPS only)
- Database: `stromwater_db`
- User: `stromwater_user`
- Password: `stromwater_pass`

---

## 🚀 After Deployment

### Verify Everything is Running

On VPS (AWS Console):
```bash
pm2 status
```

Should show:
- `stromwater-backend` - ✓ online
- `stromwater-frontend` - ✓ online

### Test Backend
```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "status": "OK",
  "mqtt": { "connected": true }
}
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Should return a JWT token.

---

## 📱 Devices Registered

| Device ID | Name | Location |
|-----------|------|----------|
| StromWater_Device_1 | Dubai Pump Station | Dubai Industrial Area |
| StromWater_Device_2 | Sharjah Pump Station | Sharjah Industrial Area |

---

## 🔧 Troubleshooting

### Backend not starting?
```bash
pm2 logs stromwater-backend
pm2 restart stromwater-backend
```

### Frontend not loading?
```bash
pm2 logs stromwater-frontend
pm2 restart stromwater-frontend
```

### MQTT not connecting?
```bash
sudo systemctl status mosquitto
mosquitto_pub -h localhost -t test -m "hello" -u stromwater_mqtt -P mqtt123
```

### Database errors?
```bash
sudo -u postgres psql -d stromwater_db -c "\dt"
```

### Check all services?
```bash
pm2 status
sudo systemctl status nginx mosquitto postgresql
```

---

## 🎯 Architecture

```
┌─────────────────────────────────────────────────┐
│           VPS: 43.205.194.142                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Nginx (Port 80)                                │
│    ├─> / → Frontend (Port 3000)                │
│    ├─> /api → Backend (Port 5000)              │
│    └─> /ws → WebSocket (Port 5001)             │
│                                                 │
│  Backend (Node.js + Express)                    │
│    ├─> PostgreSQL (Port 5432)                  │
│    └─> Mosquitto MQTT (Port 1883)              │
│                                                 │
│  Frontend (Static HTML + JavaScript)            │
│                                                 │
└─────────────────────────────────────────────────┘
                     ▲
                     │
              ┌──────┴──────┐
              │ MQTT Clients │
              ├─────────────┤
              │ ESP32 Devices│
              │ Simulator    │
              └──────────────┘
```

---

## 📊 Data Flow

1. **ESP32/Simulator** → Publishes data to MQTT (port 1883)
2. **Mosquitto** → Receives MQTT messages
3. **Backend** → Subscribes to MQTT, stores in PostgreSQL
4. **Frontend** → Fetches data from backend API
5. **Dashboard** → Displays real-time data (auto-refresh)

---

## ⏱️ Timeline

- **0:00** - Start backend deployment
- **0:10** - Backend complete, start frontend
- **0:13** - Frontend complete, test login
- **0:15** - Start simulator, verify data flow
- **0:17** - ✅ System fully operational!

---

## 🎓 For Your Submission

Your system includes:

1. ✅ **IoT Platform**: Complete MQTT-based IoT monitoring system
2. ✅ **Real-time Dashboard**: Web interface with live data
3. ✅ **Database**: PostgreSQL for persistent storage
4. ✅ **Security**: JWT authentication, bcrypt passwords
5. ✅ **Scalable**: Supports multiple devices
6. ✅ **Production-ready**: PM2 process management, Nginx, firewall
7. ✅ **ESP32 Compatible**: Ready for hardware devices

**Deployment**: Cloud-based (AWS EC2)
**URL**: http://43.205.194.142
**Status**: Production-ready

---

## 🚨 Important Notes

1. **First time only**: The deployment takes ~15 minutes
2. **No SSH needed**: Everything runs through AWS Console
3. **Automatic restart**: PM2 ensures services stay running
4. **Data persistence**: All data saved to PostgreSQL
5. **Real-time**: Dashboard updates every 5 seconds
6. **Mobile-ready**: Responsive design works on all devices

---

**Ready to deploy? Open AWS Console and run `COPY-PASTE-THIS.sh`!** 🚀

Your system will be ready for submission in 15 minutes!
