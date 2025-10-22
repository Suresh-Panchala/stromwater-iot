# Troubleshooting White Page Issue

When you see a white/blank page at `http://YOUR_VPS_IP`, follow these steps.

---

## Quick Diagnostic Steps

### Step 1: Run Diagnostic Script

Upload the diagnostic script to your VPS and run it:

```bash
# On your VPS
cd /var/www/stromwater/deployment
chmod +x diagnose-deployment.sh
./diagnose-deployment.sh
```

This will show you exactly what's wrong.

---

## Common Causes & Fixes

### Issue 1: Frontend Not Built

**Symptom:** No `/var/www/stromwater/frontend/dist` directory

**Fix:**
```bash
cd /var/www/stromwater/frontend
npm run build
pm2 restart stromwater-frontend
```

---

### Issue 2: Frontend Not Running

**Symptom:** PM2 shows frontend as "stopped" or "errored"

**Fix:**
```bash
# Check logs first
pm2 logs stromwater-frontend --lines 50

# If it shows "vite: not found" or similar:
cd /var/www/stromwater/frontend
npm install
npm run build

# Restart
pm2 restart stromwater-frontend
pm2 logs stromwater-frontend
```

---

### Issue 3: Wrong API URL in Frontend

**Symptom:** Browser console shows CORS errors or "Failed to fetch"

**Fix:**
```bash
# Create/edit frontend .env
nano /var/www/stromwater/frontend/.env
```

Add (replace with your actual IP):
```env
VITE_API_URL=http://43.205.194.142/api
VITE_WS_URL=ws://43.205.194.142/ws
```

Then rebuild:
```bash
cd /var/www/stromwater/frontend
npm run build
pm2 restart stromwater-frontend
```

---

### Issue 4: CORS Not Configured

**Symptom:** Browser console shows "CORS policy" errors

**Fix:**
```bash
# Edit backend .env
nano /var/www/stromwater/backend/.env
```

Update CORS_ORIGIN:
```env
CORS_ORIGIN=http://43.205.194.142
# Or allow all (for testing):
CORS_ORIGIN=*
```

Restart backend:
```bash
pm2 restart stromwater-backend
```

---

### Issue 5: Nginx Not Routing Correctly

**Symptom:** curl works but browser shows white page

**Fix:**
```bash
# Check Nginx config
sudo nginx -t

# View current config
cat /etc/nginx/sites-available/stromwater

# If config is wrong, update it:
sudo nano /etc/nginx/sites-available/stromwater
```

Make sure it has:
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

Then:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

### Issue 6: Port 3000 Not Listening

**Symptom:** `netstat -tlnp | grep 3000` shows nothing

**Fix:**
```bash
# Check if frontend is running
pm2 status

# Check frontend logs
pm2 logs stromwater-frontend

# Common issue: Vite preview not starting
cd /var/www/stromwater/frontend

# Make sure build exists
npm run build

# Try starting manually to see error
npx vite preview --port 3000 --host

# If it works, press Ctrl+C and restart with PM2
pm2 restart stromwater-frontend
```

---

## Step-by-Step Checklist

Run these commands on your VPS in order:

```bash
# 1. Check PM2 status
pm2 status
# Both apps should show "online"

# 2. Check if ports are listening
sudo netstat -tlnp | grep -E '(3000|5000|80)'
# Should show all three ports

# 3. Test backend locally
curl http://localhost:5000/health
# Should return JSON with status OK

# 4. Test frontend locally
curl http://localhost:3000
# Should return HTML (not empty)

# 5. Test through Nginx
curl http://localhost
# Should return HTML

# 6. Check Nginx
sudo systemctl status nginx
sudo nginx -t

# 7. Check browser console
# Open http://YOUR_VPS_IP in browser
# Press F12 to open console
# Look for red errors
```

---

## Browser Console Errors

Open your browser, go to `http://43.205.194.142`, press **F12**, and check the **Console** tab.

### Error: "Failed to load resource"
**Cause:** Frontend build not found or not served correctly
**Fix:** Rebuild frontend and restart

### Error: "CORS policy: No 'Access-Control-Allow-Origin'"
**Cause:** Backend CORS not configured for your IP
**Fix:** Update `CORS_ORIGIN` in backend/.env

### Error: "Unexpected token '<'"
**Cause:** API requests returning HTML (Nginx config wrong)
**Fix:** Check Nginx routes `/api` to port 5000

### Error: "WebSocket connection failed"
**Cause:** WS_URL wrong or WebSocket not proxied
**Fix:** Add WebSocket proxy in Nginx, update frontend .env

---

## Complete Reset Procedure

If nothing works, try this complete reset:

```bash
# 1. Stop everything
pm2 stop all

# 2. Rebuild frontend
cd /var/www/stromwater/frontend
rm -rf dist node_modules
npm install
npm run build

# 3. Verify backend .env
nano /var/www/stromwater/backend/.env
# Ensure CORS_ORIGIN is set correctly

# 4. Create frontend .env
nano /var/www/stromwater/frontend/.env
# Add:
# VITE_API_URL=http://YOUR_VPS_IP/api
# VITE_WS_URL=ws://YOUR_VPS_IP/ws

# 5. Rebuild with new env
npm run build

# 6. Restart everything
pm2 restart all

# 7. Check logs
pm2 logs

# 8. Restart Nginx
sudo systemctl restart nginx

# 9. Test
curl http://localhost:3000
curl http://YOUR_VPS_IP
```

---

## Get Detailed Logs

```bash
# PM2 logs
pm2 logs --lines 100

# Nginx access log
sudo tail -f /var/log/nginx/access.log

# Nginx error log
sudo tail -f /var/log/nginx/stromwater-error.log

# Backend logs
pm2 logs stromwater-backend --lines 50

# Frontend logs
pm2 logs stromwater-frontend --lines 50
```

---

## Most Common Fix (90% of cases)

```bash
# This fixes most white page issues:

# 1. Create frontend .env with your IP
echo "VITE_API_URL=http://43.205.194.142/api" > /var/www/stromwater/frontend/.env
echo "VITE_WS_URL=ws://43.205.194.142/ws" >> /var/www/stromwater/frontend/.env

# 2. Update backend CORS
sed -i 's/CORS_ORIGIN=.*/CORS_ORIGIN=http:\/\/43.205.194.142/' /var/www/stromwater/backend/.env

# 3. Rebuild frontend
cd /var/www/stromwater/frontend
npm run build

# 4. Restart everything
pm2 restart all
sudo systemctl restart nginx

# 5. Wait 10 seconds then test
sleep 10
curl http://43.205.194.142
```

---

## Still Not Working?

**Share the output of:**

1. `pm2 logs --lines 50`
2. Browser console errors (F12)
3. `sudo tail -20 /var/log/nginx/stromwater-error.log`
4. `curl http://localhost:3000` (from VPS)
5. `curl http://43.205.194.142` (from VPS)

---

## Next Steps After Fix

Once you see the login page:

1. Login with: `admin` / `admin123`
2. Change admin password immediately
3. Start MQTT simulator to see live data
4. Test all features

---

**The white page is usually a simple fix - often just missing frontend .env or CORS configuration!**
