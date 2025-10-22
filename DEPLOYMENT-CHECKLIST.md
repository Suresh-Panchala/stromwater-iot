# StromWater IoT - Deployment Checklist

Use this checklist to ensure successful deployment.

---

## ☐ Pre-Deployment

- [ ] VPS is accessible (IP: 43.205.194.142)
- [ ] AWS Console login works
- [ ] Can connect to EC2 Instance via "EC2 Instance Connect"
- [ ] Node.js is installed on VPS (check: `node --version`)
- [ ] PostgreSQL is installed (check: `sudo systemctl status postgresql`)
- [ ] Mosquitto is installed (check: `sudo systemctl status mosquitto`)
- [ ] Nginx is installed (check: `sudo systemctl status nginx`)

---

## ☐ Step 1: Backend Deployment (10 minutes)

- [ ] Open AWS Console
- [ ] Navigate to EC2 → Instances → 43.205.194.142
- [ ] Click "Connect" → "EC2 Instance Connect"
- [ ] Copy entire `COPY-PASTE-THIS.sh` script
- [ ] Paste into terminal
- [ ] Press Enter and wait
- [ ] Verify output shows: "✓ BACKEND DEPLOYMENT COMPLETE!"
- [ ] Verify JWT token appears in test login response
- [ ] Check health shows `"mqtt": { "connected": true }`

**Expected output**:
```
✓ BACKEND DEPLOYMENT COMPLETE!
Testing login...
{"user":{...},"token":"eyJhbGc..."}
Health check...
{"status":"OK","mqtt":{"connected":true}}
```

---

## ☐ Step 2: Frontend Deployment (5 minutes)

- [ ] In same AWS Console terminal
- [ ] Copy entire `FRONTEND-DEPLOY.sh` script
- [ ] Paste into terminal
- [ ] Press Enter and wait
- [ ] Verify output shows: "✓ FRONTEND DEPLOYMENT COMPLETE!"
- [ ] Check PM2 status shows both services running

**Expected PM2 status**:
```
┌─────┬──────────────────────────┬──────────┬─────────┐
│ id  │ name                     │ status   │ restart │
├─────┼──────────────────────────┼──────────┼─────────┤
│ 0   │ stromwater-backend       │ online   │ 0       │
│ 1   │ stromwater-frontend      │ online   │ 0       │
└─────┴──────────────────────────┴──────────┴─────────┘
```

---

## ☐ Step 3: Test Login (2 minutes)

- [ ] Open browser
- [ ] Navigate to: http://43.205.194.142
- [ ] Login page loads
- [ ] Enter username: `admin`
- [ ] Enter password: `admin123`
- [ ] Click "Login"
- [ ] Dashboard loads successfully
- [ ] Device selector shows 2 devices
- [ ] System status shows "Status: OK"
- [ ] MQTT status shows "✓ Connected"

---

## ☐ Step 4: Test MQTT Data Flow (3 minutes)

- [ ] On Windows, open Command Prompt
- [ ] Navigate to: `C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ`
- [ ] Run: `node test-mqtt-both-devices.js`
- [ ] Verify output shows: "✓ Connected to MQTT broker successfully!"
- [ ] Data publishes every 5 seconds
- [ ] Switch back to browser dashboard
- [ ] Select "Dubai Pump Station" from dropdown
- [ ] Verify data table shows latest readings
- [ ] Wait 5 seconds and verify data updates
- [ ] Select "Sharjah Pump Station"
- [ ] Verify data table updates with different values

---

## ☐ Step 5: Verify System Health

### On VPS (AWS Console):

- [ ] Run: `pm2 status` - Both services show "online"
- [ ] Run: `pm2 logs stromwater-backend --lines 10` - No errors
- [ ] Run: `sudo systemctl status nginx` - Active (running)
- [ ] Run: `sudo systemctl status mosquitto` - Active (running)
- [ ] Run: `sudo systemctl status postgresql` - Active (running)
- [ ] Run: `sudo netstat -tlnp | grep -E "(80|1883|5000|3000|5432)"` - All ports listening

### From Windows:

- [ ] Test MQTT port: `powershell -Command "Test-NetConnection -ComputerName 43.205.194.142 -Port 1883"`
- [ ] Verify: `TcpTestSucceeded : True`
- [ ] Test HTTP: `curl http://43.205.194.142` - HTML response
- [ ] Test API: `curl http://43.205.194.142/api/devices` - Returns "No token provided"
- [ ] Test Health: `curl http://43.205.194.142/health` - Returns OK status

---

## ☐ Step 6: Data Verification

### Check Database:

On VPS:
```bash
sudo -u postgres psql -d stromwater_db -c "SELECT COUNT(*) FROM device_data;"
```

- [ ] Count increases as simulator runs
- [ ] Run again after 30 seconds
- [ ] Count should be higher (at least 12 new rows - 2 devices × 6 publishes)

### Check Dashboard:

- [ ] Latest data timestamp updates in real-time
- [ ] Water level values change
- [ ] Voltage values are realistic (400-430V)
- [ ] Current values are realistic (20-35A)
- [ ] Pump statuses toggle between ON/OFF
- [ ] Temperature shows (25-35°C)

---

## ☐ Final Checks

- [ ] Dashboard accessible from browser: http://43.205.194.142
- [ ] Login works with admin/admin123
- [ ] Both devices visible in dropdown
- [ ] Real-time data updates every 5 seconds
- [ ] MQTT simulator connects and publishes
- [ ] No errors in PM2 logs
- [ ] All system services running
- [ ] Firewall allows ports 80, 1883

---

## ☐ Submission Ready

- [ ] Screenshot of dashboard showing real-time data
- [ ] Screenshot of PM2 status (both services online)
- [ ] Screenshot of MQTT simulator running
- [ ] Document the IP address: 43.205.194.142
- [ ] Document login credentials: admin/admin123
- [ ] Document MQTT credentials: stromwater_mqtt/mqtt123
- [ ] Note features:
  - Real-time IoT monitoring
  - MQTT protocol
  - PostgreSQL database
  - JWT authentication
  - Multi-device support
  - Web dashboard
  - Cloud deployment (AWS)

---

## 🚨 Troubleshooting Checklist

If something doesn't work:

### Backend not responding:
- [ ] Run: `pm2 restart stromwater-backend`
- [ ] Check logs: `pm2 logs stromwater-backend`
- [ ] Verify database: `sudo -u postgres psql -d stromwater_db -c "\dt"`

### Frontend not loading:
- [ ] Run: `pm2 restart stromwater-frontend`
- [ ] Check Nginx: `sudo nginx -t && sudo systemctl restart nginx`
- [ ] Check logs: `pm2 logs stromwater-frontend`

### MQTT not connecting:
- [ ] Check Mosquitto: `sudo systemctl status mosquitto`
- [ ] Test credentials: `mosquitto_pub -h localhost -t test -m hello -u stromwater_mqtt -P mqtt123`
- [ ] Check password file: `sudo cat /etc/mosquitto/passwd`

### Login fails:
- [ ] Reset admin: `cd /var/www/stromwater/backend && node src/scripts/initDatabase.js`
- [ ] Restart backend: `pm2 restart stromwater-backend`

---

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ You can login to http://43.205.194.142
2. ✅ Dashboard shows 2 devices in dropdown
3. ✅ MQTT simulator connects without errors
4. ✅ Data updates in dashboard every 5 seconds
5. ✅ All PM2 services show "online"
6. ✅ Health check shows MQTT connected

---

**Estimated Total Time**: 15-20 minutes

**When complete, you have a fully functional IoT monitoring platform deployed to the cloud and ready for submission!** 🎉
