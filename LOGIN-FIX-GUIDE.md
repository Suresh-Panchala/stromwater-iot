# StromWater Login Fix Guide

## Current Status ✅

Good news! Your system is mostly working:
- ✅ MQTT is connected: `{"connected": true}`
- ✅ Backend is running
- ✅ Frontend is loading
- ❌ Admin login is failing

---

## Quick Fix (Recommended)

### Method 1: Run the Batch File

**Double-click**: `QUICK-FIX-LOGIN.bat`

This will:
1. Reset the admin user in the database
2. Restart the backend
3. Test the login

---

### Method 2: Manual Fix on VPS

Connect to your VPS and run these commands:

```bash
# Step 1: Reset admin user
cd /var/www/stromwater/backend
node src/scripts/initDatabase.js

# Step 2: Restart backend
pm2 restart stromwater-backend

# Step 3: Check if admin user exists
ssh ubuntu@43.205.194.142 "sudo -u postgres psql -d stromwater_db -c \"SELECT id, username, email, role, is_active FROM users;\""
```

Expected output:
```
 id |       username        | email                | role  | is_active
----+-----------------------+----------------------+-------+-----------
  1 | admin                 | admin@stromwater.com | admin | t
```

---

## Test Login

After running the fix, test login:

```bash
curl -X POST http://43.205.194.142/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Expected Success Response**:
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@stromwater.com",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**If you see this**, login is working! ✅

---

## Verify on Dashboard

1. Open browser: http://43.205.194.142
2. Login with:
   - **Username**: `admin`
   - **Password**: `admin123`
3. You should see the dashboard with device selector

---

## Start Simulator to See Data

Once logged in, start sending data:

**On Windows**:
```
Double-click: START-SIMULATOR-BOTH-DEVICES.bat
```

This will publish data for:
- StromWater_Device_1 (Dubai Pump Station)
- StromWater_Device_2 (Sharjah Pump Station)

You should see:
- Device selector dropdown at top of dashboard
- Real-time data updating every 5 seconds
- Charts and metrics for selected device

---

## Troubleshooting

### Login still failing?

**Check backend logs**:
```bash
ssh ubuntu@43.205.194.142 "pm2 logs stromwater-backend --lines 50"
```

Look for errors related to:
- Database connection
- Password hashing
- JWT token generation

### "No token provided" error?

This means the frontend can't reach the backend API.

**Check**:
1. Backend is running: `pm2 status`
2. Nginx is proxying: `sudo nginx -t && sudo systemctl status nginx`
3. CORS is configured: Check `.env` has `CORS_ORIGIN=http://43.205.194.142`

### Blank page after login?

**Check frontend build**:
```bash
ssh ubuntu@43.205.194.142 "ls -la /var/www/stromwater/frontend/dist/"
```

Should show `index.html`, `assets/` directory with JS/CSS files.

### Database connection error?

**Test database connection**:
```bash
ssh ubuntu@43.205.194.142 "sudo -u postgres psql -d stromwater_db -c 'SELECT COUNT(*) FROM users;'"
```

Should return a count (at least 1 for admin user).

---

## Next Steps After Login Works

1. ✅ Login to dashboard
2. ✅ Start MQTT simulator
3. ✅ Verify data is showing in dashboard
4. ✅ Test device selector dropdown
5. ✅ Verify charts are updating in real-time
6. ✅ Test ESP32 hardware device connection
7. ✅ Configure AWS Security Group to allow port 1883 for external MQTT

---

## Default Credentials

**Dashboard Login**:
- Username: `admin`
- Password: `admin123`

**MQTT Broker** (for ESP32 devices):
- Broker: `43.205.194.142:1883`
- Username: `stromwater_mqtt`
- Password: `mqtt123`

**PostgreSQL** (if needed):
- Database: `stromwater_db`
- User: `stromwater_user`
- Password: `stromwater_pass`

---

## System Health Check

Run this to check everything:

```bash
# Health check
curl http://43.205.194.142/health

# Should show:
# {
#   "status": "OK",
#   "mqtt": {
#     "connected": true,
#     "reconnectAttempts": 0
#   }
# }
```

---

**Your system is 90% working! Just need to fix the admin login and you're ready to go!** 🚀
