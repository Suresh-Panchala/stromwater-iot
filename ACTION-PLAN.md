# StromWater Platform - Action Plan

**Status**: System is 90% working - Need to fix login and verify MQTT external access

---

## Current Situation

### ✅ Working:
- MQTT broker connected internally (`"connected": true`)
- Backend API running
- Frontend deployed
- Database configured
- Devices registered

### ❌ Issues:
1. **Login fails** - Returns `{"error":"Login failed"}`
2. **Port 1883 still blocked** - Even though AWS Security Group opened

---

## Fix Steps (In Order)

### Step 1: Fix Login Issue 🔴 PRIORITY

**Run**: Double-click [DIAGNOSE-AND-FIX.bat](DIAGNOSE-AND-FIX.bat)

This will:
- Check if admin user exists in database
- Review backend error logs
- Reinitialize admin user with correct password hash
- Test login endpoint
- Show detailed diagnostics

**Expected Result**: You'll see a JWT token in the output, confirming login works.

**What to look for**:
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@stromwater.com",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

If you see this ✅ **Login is fixed!**

---

### Step 2: Fix MQTT Port 1883 External Access

**Run**: Double-click [FIX-MQTT-PORT.bat](FIX-MQTT-PORT.bat)

This will:
- Configure UFW firewall on VPS to allow port 1883
- Verify Mosquitto is listening on 0.0.0.0:1883
- Test connection from Windows

**Expected Result**: `TcpTestSucceeded: True`

**Why this is needed**:
- AWS Security Group allows the port
- But UFW (Ubuntu firewall) may still be blocking it
- This script fixes UFW configuration

---

### Step 3: Test Complete System

Once Steps 1 & 2 are done:

1. **Login to Dashboard**
   - URL: http://43.205.194.142
   - Username: `admin`
   - Password: `admin123`

2. **Start MQTT Simulator**
   - Run: [START-SIMULATOR-BOTH-DEVICES.bat](START-SIMULATOR-BOTH-DEVICES.bat)
   - This publishes data every 5 seconds for Device_1 and Device_2

3. **Verify Dashboard**
   - Device selector dropdown should show both devices
   - Charts should update in real-time
   - Data should refresh every 5 seconds

---

## Troubleshooting

### If login still fails after Step 1:

Check the diagnostic output for:

**Database Issues**:
```
ERROR: relation "users" does not exist
```
→ Database schema not created, run: `node src/scripts/initDatabase.js`

**Password Hash Issues**:
```
hash_length |
-----------
           | (empty)
```
→ Password not hashed, check bcrypt is installed: `npm install bcrypt`

**Backend Errors**:
```
Error: JWT secret not configured
```
→ Check `.env` file has `JWT_SECRET=...`

---

### If MQTT port still blocked after Step 2:

**Check AWS Security Group**:
1. Go to AWS EC2 Console
2. Select your instance
3. Click "Security" tab
4. Click on Security Group name
5. Verify Inbound Rules include:
   ```
   Type: Custom TCP
   Port: 1883
   Source: 0.0.0.0/0
   ```

**Check Mosquitto binding**:
```bash
ssh ubuntu@43.205.194.142 "sudo netstat -tlnp | grep 1883"
```

Should show:
```
tcp  0  0.0.0.0:1883  0.0.0.0:*  LISTEN  1234/mosquitto
```

If it shows `127.0.0.1:1883` instead of `0.0.0.0:1883`, Mosquitto is only listening locally.

**Fix**: Update `/etc/mosquitto/mosquitto.conf`:
```
listener 1883 0.0.0.0
```

---

## Quick Commands Reference

### Test Login:
```bash
curl -X POST http://43.205.194.142/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Test MQTT Port:
```powershell
Test-NetConnection -ComputerName 43.205.194.142 -Port 1883
```

### Test MQTT Publish:
```bash
# From VPS
ssh ubuntu@43.205.194.142 "mosquitto_pub -h localhost -t test -m hello -u stromwater_mqtt -P mqtt123"

# From Windows (once port is open)
# Create test-mqtt.js:
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://43.205.194.142:1883', {
  username: 'stromwater_mqtt',
  password: 'mqtt123'
});
client.on('connect', () => {
  console.log('Connected!');
  client.publish('test', 'Hello from Windows');
  client.end();
});
```

### Check System Health:
```bash
curl http://43.205.194.142/health
```

### View Backend Logs:
```bash
ssh ubuntu@43.205.194.142 "pm2 logs stromwater-backend --lines 50"
```

---

## Success Criteria

✅ **System is fully operational when**:

1. Login works → Returns JWT token
2. MQTT port accessible → `TcpTestSucceeded: True`
3. Dashboard loads → Shows device selector
4. Data flows → Charts update in real-time
5. Device selector works → Can switch between devices
6. ESP32 can connect → External MQTT clients work

---

## Next Steps After System is Working

1. **Configure ESP32 Devices**:
   - Use code in [hardware/ESP32_A7670C_StromWater/](hardware/ESP32_A7670C_StromWater/)
   - Update with your MQTT credentials
   - Flash to ESP32

2. **Add More Devices**:
   - Run [ADD-NEW-DEVICE.bat](ADD-NEW-DEVICE.bat)
   - Follow prompts to add device details

3. **Production Hardening** (Optional):
   - Change default passwords
   - Set up SSL/TLS (requires domain)
   - Configure automated backups
   - Set up monitoring/alerting

---

## Files Created for You

| File | Purpose |
|------|---------|
| `DIAGNOSE-AND-FIX.bat` | Fix login issue |
| `FIX-MQTT-PORT.bat` | Fix MQTT external access |
| `START-SIMULATOR-BOTH-DEVICES.bat` | Test data publishing |
| `ADD-NEW-DEVICE.bat` | Add new devices |
| `QUICK-FIX-LOGIN.bat` | Quick admin password reset |
| `LOGIN-FIX-GUIDE.md` | Detailed login troubleshooting |
| `ACTION-PLAN.md` | This file |

---

## Summary

**Right now**:
1. Run `DIAGNOSE-AND-FIX.bat` → Fix login
2. Run `FIX-MQTT-PORT.bat` → Open MQTT port
3. Login and test → Verify everything works

**Total time**: ~10 minutes

Your platform will be 100% operational! 🚀
