# Deploy StromWater IoT to VPS

## VPS Information
- **IP Address:** 43.205.194.142
- **OS:** Ubuntu Linux
- **Services:** PostgreSQL, Mosquitto MQTT, Nginx

---

## Pre-Deployment Checklist

### ✅ Local Testing Complete
- [x] All code fixes pushed to GitHub
- [x] Devices page working (no errors)
- [x] Charts components fixed
- [x] Device management (CRUD) working
- [x] Login page redesigned

### 📦 What's Been Fixed/Added
1. **Device Management** - Admin can add/edit/delete devices
2. **Chart Components** - PowerChart and PumpTrendChart fixed
3. **Error Handling** - Better error messages and safe data handling
4. **Login Page** - New split-screen design
5. **Navigation** - Devices link added to admin menu

---

## Deployment Steps

### Step 1: Connect to VPS

```bash
ssh ubuntu@43.205.194.142
```

Or if using a key file:
```bash
ssh -i your-key.pem ubuntu@43.205.194.142
```

---

### Step 2: Navigate to Project Directory

```bash
cd ~/stromwater-iot
```

---

### Step 3: Pull Latest Code from GitHub

```bash
# Stash any local changes (if any)
git stash

# Pull latest code
git pull origin main

# Check what's new
git log --oneline -5
```

Expected latest commits:
- `bacce26` - Add local MQTT setup documentation
- `586354b` - Fix Devices page and chart components errors
- Previous commits...

---

### Step 4: Update Backend

```bash
cd ~/stromwater-iot/backend

# Install any new dependencies
npm install

# Check if backend .env is configured correctly
cat .env
```

**Verify these settings in backend/.env:**
```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database (VPS PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stromwater_db
DB_USER=postgres
DB_PASSWORD=root

# MQTT (VPS Mosquitto)
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=stromwater_mqtt
MQTT_PASSWORD=StromWater@MQTT2024
MQTT_CLIENT_ID=stromwater_backend
MQTT_TOPIC=devices/+/data

# JWT Secrets (should be secure in production)
JWT_SECRET=your_secure_secret_here
JWT_REFRESH_SECRET=your_secure_refresh_secret_here

# CORS (allow frontend)
CORS_ORIGIN=http://43.205.194.142:3000
```

**Restart backend:**
```bash
# Stop existing backend (find process)
pm2 stop backend
# Or
ps aux | grep node
kill -9 <PID>

# Start backend with PM2
pm2 start src/index.js --name backend
pm2 save
```

---

### Step 5: Update Database Schema

Check if the database has the alerts table (we added this earlier):

```bash
psql -U postgres -d stromwater_db -c "\dt"
```

If alerts table is missing, create it:
```bash
psql -U postgres -d stromwater_db -f ~/stromwater-iot/backend/create-alerts-table.sql
```

---

### Step 6: Build and Deploy Frontend

```bash
cd ~/stromwater-iot/frontend

# Install dependencies
npm install

# Build production bundle
npm run build
```

This creates an optimized production build in `frontend/dist/`

**Configure Nginx to serve the built files:**

```bash
sudo nano /etc/nginx/sites-available/stromwater
```

Update the configuration:
```nginx
server {
    listen 80;
    server_name 43.205.194.142;

    # Frontend
    location / {
        root /home/ubuntu/stromwater-iot/frontend/dist;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Test and reload Nginx:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 7: Verify Services are Running

```bash
# Check backend
pm2 status
pm2 logs backend --lines 20

# Check PostgreSQL
sudo systemctl status postgresql

# Check Mosquitto
sudo systemctl status mosquitto

# Check Nginx
sudo systemctl status nginx

# Check if ports are listening
netstat -tlnp | grep -E ':(5000|5432|1883|80)'
```

Expected output:
- Port 5000 - Backend (Node.js)
- Port 5432 - PostgreSQL
- Port 1883 - Mosquitto MQTT
- Port 80 - Nginx (HTTP)

---

### Step 8: Test MQTT Data Flow

```bash
# Check backend logs for MQTT messages
pm2 logs backend --lines 50 | grep -i mqtt

# Check database for recent data
psql -U postgres -d stromwater_db -c "SELECT device_id, COUNT(*), MAX(timestamp) as latest FROM device_data GROUP BY device_id;"
```

You should see:
- Backend connected to MQTT broker
- Recent data being stored (timestamps from last few minutes)

---

### Step 9: Test Web Application

Open your browser and test:

1. **Frontend:** http://43.205.194.142/
   - Should load the new login page design

2. **Login:** admin / admin123
   - Should successfully authenticate

3. **Dashboard:** http://43.205.194.142/
   - Should show both devices
   - Should show live data
   - Charts should display

4. **Devices Page:** http://43.205.194.142/devices (admin only)
   - Should show device list
   - Should allow adding new device
   - Should allow editing/deleting devices

5. **Analytics:** http://43.205.194.142/analytics
   - Charts should display
   - Data should be visible

6. **Alerts:** http://43.205.194.142/alerts
   - Alerts page should load
   - Should show any alerts

---

### Step 10: Monitor for Issues

```bash
# Watch backend logs in real-time
pm2 logs backend --lines 100

# Watch Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Watch Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check for any errors
pm2 logs backend | grep -i error
```

---

## Troubleshooting

### Issue: Frontend shows old version

**Solution:**
```bash
# Clear browser cache
# Or hard refresh: Ctrl+Shift+R

# On VPS, rebuild frontend
cd ~/stromwater-iot/frontend
rm -rf dist
npm run build
sudo systemctl reload nginx
```

### Issue: Backend not connecting to database

**Solution:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U postgres -d stromwater_db -c "SELECT 1;"

# Check backend .env database settings
cat ~/stromwater-iot/backend/.env | grep DB_
```

### Issue: MQTT data not being received

**Solution:**
```bash
# Check Mosquitto is running
sudo systemctl status mosquitto

# Subscribe to MQTT topic manually
mosquitto_sub -h localhost -t "devices/#" -u stromwater_mqtt -P StromWater@MQTT2024

# Check backend MQTT connection
pm2 logs backend | grep -i mqtt
```

### Issue: 502 Bad Gateway

**Solution:**
```bash
# Backend is not running or crashed
pm2 status
pm2 restart backend

# Check backend logs
pm2 logs backend --lines 50
```

### Issue: Device Management not working

**Solution:**
```bash
# Check admin device routes in backend
curl -X GET http://localhost:5000/api/admin/devices \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check backend logs for errors
pm2 logs backend | grep -i admin
```

---

## Rollback Plan

If something goes wrong:

```bash
# Rollback to previous commit
cd ~/stromwater-iot
git log --oneline -5  # Find previous commit hash
git checkout <previous-commit-hash>

# Rebuild frontend
cd frontend
npm run build
sudo systemctl reload nginx

# Restart backend
pm2 restart backend
```

---

## Post-Deployment Verification

### ✅ Checklist

- [ ] Frontend loads at http://43.205.194.142/
- [ ] Login works (admin / admin123)
- [ ] Dashboard shows live data
- [ ] Device Management page accessible (admin only)
- [ ] Can add new device
- [ ] Can edit existing device
- [ ] Can delete device
- [ ] Charts display data
- [ ] Analytics page works
- [ ] Alerts page works
- [ ] No console errors in browser (F12)
- [ ] Backend logs show no errors
- [ ] MQTT data flowing correctly

---

## Quick Command Reference

```bash
# Connect to VPS
ssh ubuntu@43.205.194.142

# Pull latest code
cd ~/stromwater-iot && git pull origin main

# Rebuild frontend
cd ~/stromwater-iot/frontend && npm install && npm run build && sudo systemctl reload nginx

# Restart backend
pm2 restart backend && pm2 logs backend --lines 20

# Check all services
pm2 status && sudo systemctl status postgresql mosquitto nginx

# View logs
pm2 logs backend --lines 50
sudo tail -f /var/log/nginx/error.log

# Check database
psql -U postgres -d stromwater_db -c "SELECT device_id, COUNT(*) FROM device_data GROUP BY device_id;"
```

---

## Success Criteria

Deployment is successful when:
✅ All services running (backend, PostgreSQL, Mosquitto, Nginx)
✅ Frontend loads without errors
✅ Login successful
✅ Dashboard displays live data
✅ Device Management fully functional
✅ Charts displaying data
✅ No errors in browser console
✅ No errors in backend logs
✅ MQTT data flowing to database

---

## Next Steps After Deployment

1. **Test all features thoroughly**
2. **Monitor logs for 24 hours** to catch any issues
3. **Set up automated backups** for database
4. **Configure SSL certificate** (HTTPS) for production
5. **Set up monitoring/alerting** (optional)
6. **Document any VPS-specific configurations**

---

## Support

If you encounter issues during deployment:
1. Check the Troubleshooting section above
2. Review backend logs: `pm2 logs backend`
3. Review Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Check database connectivity
5. Verify MQTT broker is running
