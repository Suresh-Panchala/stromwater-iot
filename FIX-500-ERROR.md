# Fix 500 Internal Server Error - VPS Troubleshooting

## 🔴 Error: 500 Internal Server Error

This error means your backend is either crashed, not running, or returning errors.

---

## 🔍 Step 1: Check if Backend is Running

Run these commands on your VPS:

```bash
# Check PM2 status
pm2 status

# Expected: backend should show "online"
# If it shows "stopped" or "errored", the backend crashed
```

**Possible outputs:**

### ✅ Backend is "online"
If status shows "online", the backend is running but returning errors.
→ **Go to Step 2**

### ❌ Backend is "stopped" or "errored"
If status shows anything other than "online", backend crashed.
→ **Go to Step 3**

### ❌ Backend not in list
If you don't see "backend" in the list at all.
→ **Go to Step 4**

---

## 🔍 Step 2: Backend Running But Returning Errors

If `pm2 status` shows backend is "online":

```bash
# View recent logs
pm2 logs backend --lines 50

# Look for ERROR messages
pm2 logs backend --lines 100 | grep -i error
```

**Common errors and fixes:**

### Error: "Cannot connect to database"
```bash
# Fix: Check database is running
sudo systemctl status postgresql

# If not running, start it
sudo systemctl start postgresql

# Restart backend
pm2 restart backend
```

### Error: "EADDRINUSE: address already in use :::5000"
```bash
# Fix: Port 5000 is already taken
# Find what's using it
sudo lsof -i :5000

# Kill the process
sudo kill -9 <PID>

# Or use a different port in .env
nano ~/stromwater-iot/backend/.env
# Change PORT=5000 to PORT=5001

# Restart backend
pm2 restart backend
```

### Error: "MODULE_NOT_FOUND"
```bash
# Fix: Dependencies not installed
cd ~/stromwater-iot/backend
npm install --production
pm2 restart backend
```

### Error: ".env file not found" or database connection issues
```bash
# Fix: Check .env file exists
cat ~/stromwater-iot/backend/.env

# If missing, create it
nano ~/stromwater-iot/backend/.env
```

Paste this:
```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

DB_HOST=localhost
DB_PORT=5432
DB_NAME=stromwater_db
DB_USER=postgres
DB_PASSWORD=root

MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=stromwater_mqtt
MQTT_PASSWORD=StromWater@MQTT2024
MQTT_CLIENT_ID=stromwater_backend
MQTT_TOPIC=devices/+/data

JWT_SECRET=your_secure_secret_key_change_this_in_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_secure_refresh_secret_change_this_in_production
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://43.205.194.142
```

Save and restart:
```bash
pm2 restart backend
```

---

## 🔍 Step 3: Backend Crashed (Status: stopped/errored)

If backend is not running:

```bash
# Check why it crashed
pm2 logs backend --lines 50 --err

# Try to restart it
pm2 restart backend

# If restart fails, view logs again
pm2 logs backend --lines 50
```

**If backend keeps crashing:**

```bash
# Delete from PM2 and start fresh
pm2 delete backend

# Start manually first to see errors
cd ~/stromwater-iot/backend
node src/index.js

# This will show you the exact error
# Fix the error, then Ctrl+C to stop

# Once fixed, start with PM2
pm2 start src/index.js --name backend
pm2 save
```

---

## 🔍 Step 4: Backend Not in PM2 List

If `pm2 status` doesn't show backend:

```bash
# Start backend
cd ~/stromwater-iot/backend
pm2 start src/index.js --name backend
pm2 save

# Check status
pm2 status

# View logs
pm2 logs backend
```

---

## 🔍 Step 5: Check Nginx Configuration

If backend is running but you still get 500 error:

```bash
# Test Nginx config
sudo nginx -t

# If errors, view config
sudo nano /etc/nginx/sites-available/stromwater
```

**Verify proxy_pass is correct:**
```nginx
location /api/ {
    proxy_pass http://localhost:5000/api/;
    # Rest of config...
}
```

If you changed backend port, update proxy_pass accordingly.

```bash
# Reload Nginx after changes
sudo systemctl reload nginx
```

---

## 🔍 Step 6: Check Nginx Error Logs

```bash
# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# In another terminal, try accessing the site
# curl http://43.205.194.142/

# Check what errors appear in the log
```

**Common Nginx errors:**

### "connect() failed (111: Connection refused)"
→ Backend is not running or not listening on port 5000
```bash
pm2 restart backend
sudo netstat -tlnp | grep 5000
```

### "Permission denied"
→ SELinux or file permissions issue
```bash
sudo chown -R ubuntu:ubuntu ~/stromwater-iot
```

---

## 🔍 Step 7: Direct Backend Test

Test if backend responds directly (bypassing Nginx):

```bash
# On VPS, test backend directly
curl http://localhost:5000/api/health

# Or check if port 5000 is listening
sudo netstat -tlnp | grep 5000
```

**Expected response:**
```json
{"status":"ok","timestamp":"..."}
```

**If you get an error or no response:**
→ Backend is not running properly. Go back to Step 2 or 3.

---

## 🔄 Complete Reset (Nuclear Option)

If nothing works, do a complete reset:

```bash
# 1. Stop everything
pm2 stop all
pm2 delete all

# 2. Clean rebuild
cd ~/stromwater-iot/backend
rm -rf node_modules package-lock.json
npm install --production

# 3. Check .env exists and is correct
cat .env

# 4. Test database connection
psql -U postgres -d stromwater_db -c "SELECT 1;"

# 5. Start backend manually first
node src/index.js
# Press Ctrl+C after you see "Server is running"

# 6. Start with PM2
pm2 start src/index.js --name backend
pm2 save

# 7. Rebuild frontend
cd ~/stromwater-iot/frontend
rm -rf dist node_modules
npm install
npm run build

# 8. Reload Nginx
sudo nginx -t
sudo systemctl reload nginx

# 9. Test
curl http://43.205.194.142/
```

---

## ✅ Verification Steps

After fixing, verify everything works:

```bash
# 1. Backend running
pm2 status
# Should show: backend | online

# 2. Backend logs clean
pm2 logs backend --lines 20
# Should show: "Server is running on port 5000"
# Should show: "MQTT client connected"
# NO errors

# 3. Backend responds
curl http://localhost:5000/api/health
# Should return: {"status":"ok",...}

# 4. Database connected
psql -U postgres -d stromwater_db -c "SELECT COUNT(*) FROM device_data;"
# Should return a number

# 5. MQTT working
pm2 logs backend | grep -i mqtt
# Should show: "MQTT client connected"

# 6. Nginx working
sudo nginx -t
# Should show: "syntax is ok"

# 7. Web app works
curl -I http://43.205.194.142/
# Should show: "HTTP/1.1 200 OK"
```

---

## 📋 Quick Diagnostic Script

Run this to get a full diagnostic:

```bash
echo "=== Backend Status ==="
pm2 status

echo ""
echo "=== Backend Logs (last 20 lines) ==="
pm2 logs backend --lines 20 --nostream

echo ""
echo "=== Database Connection ==="
psql -U postgres -d stromwater_db -c "SELECT 1;" 2>&1

echo ""
echo "=== Backend Port ==="
sudo netstat -tlnp | grep 5000

echo ""
echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager | head -5

echo ""
echo "=== Nginx Config Test ==="
sudo nginx -t

echo ""
echo "=== Backend Direct Test ==="
curl -s http://localhost:5000/api/health || echo "Backend not responding"

echo ""
echo "=== Web App Test ==="
curl -I http://43.205.194.142/ 2>&1 | head -5
```

---

## 🆘 Still Not Working?

If you've tried everything above and it still doesn't work:

1. **Capture full diagnostic:**
   ```bash
   # Save all logs
   pm2 logs backend --lines 200 > ~/backend-logs.txt
   sudo tail -100 /var/log/nginx/error.log > ~/nginx-errors.txt
   pm2 status > ~/pm2-status.txt

   # Check all files
   cat ~/backend-logs.txt
   cat ~/nginx-errors.txt
   cat ~/pm2-status.txt
   ```

2. **Check environment:**
   ```bash
   cat ~/stromwater-iot/backend/.env
   cat ~/stromwater-iot/backend/package.json
   node --version
   npm --version
   ```

3. **Share the output** so I can help diagnose further

---

## 🎯 Most Common Cause

**90% of the time, 500 errors are caused by:**
1. Backend not running (pm2 status shows stopped)
2. Database not connected (missing .env or PostgreSQL not running)
3. Missing dependencies (forgot to run npm install)
4. Port conflict (something else using port 5000)

**Quick fix for most cases:**
```bash
cd ~/stromwater-iot/backend
npm install --production
pm2 restart backend
pm2 logs backend --lines 20
```

---

**Good luck! Follow the steps and the error will be fixed!** 🚀
