# VPS Deployment - Quick Start Guide

## 🎯 Goal
Deploy the latest StromWater IoT application to your VPS at **43.205.194.142**

---

## ✅ Prerequisites Checklist

Before starting, verify:
- [ ] You have SSH access to VPS: `ssh ubuntu@43.205.194.142`
- [ ] VPS has Git installed: `git --version`
- [ ] VPS has Node.js installed: `node --version`
- [ ] VPS has PostgreSQL running: `sudo systemctl status postgresql`
- [ ] VPS has Mosquitto MQTT running: `sudo systemctl status mosquitto`
- [ ] VPS has Nginx installed: `sudo systemctl status nginx`

---

## 🚀 Quick Deployment (3 Simple Steps)

### **Step 1: Connect to VPS**
```bash
ssh ubuntu@43.205.194.142
```

### **Step 2: Fix Permissions & Update Code**
```bash
# Fix ownership if needed
sudo chown -R ubuntu:ubuntu ~/stromwater-iot

# Navigate and update
cd ~/stromwater-iot
git pull origin main
```

**If directory doesn't exist:**
```bash
cd ~
git clone https://github.com/Suresh-Panchala/stromwater-iot.git
cd stromwater-iot
```

### **Step 3: Run Deployment**
```bash
# Make scripts executable
chmod +x setup-pm2-vps.sh deploy-vps.sh

# Setup PM2 (first time only)
./setup-pm2-vps.sh

# Deploy application
./deploy-vps.sh
```

**That's it!** 🎉

---

## 📋 Manual Deployment (If Scripts Don't Work)

### **1. Update Backend**
```bash
cd ~/stromwater-iot/backend
npm install --production
pm2 restart backend || pm2 start src/index.js --name backend
pm2 save
```

### **2. Build Frontend**
```bash
cd ~/stromwater-iot/frontend
npm install
npm run build
```

### **3. Reload Nginx**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### **4. Verify**
```bash
pm2 status
pm2 logs backend --lines 20
```

---

## 🔍 Verify Deployment Success

### **Check Services:**
```bash
pm2 status                          # Backend should be "online"
sudo systemctl status postgresql    # Should be "active (running)"
sudo systemctl status mosquitto     # Should be "active (running)"
sudo systemctl status nginx         # Should be "active (running)"
```

### **Check Database:**
```bash
psql -U postgres -d stromwater_db -c "SELECT device_id, COUNT(*), MAX(timestamp) FROM device_data GROUP BY device_id;"
```
Should show recent timestamps (within last few minutes).

### **Check Backend Logs:**
```bash
pm2 logs backend --lines 30
```
Should show:
- "Server is running on port 5000"
- "MQTT client connected"
- "Received data for device: StromWater_Device_X"

### **Test Web Application:**

Open browser: **http://43.205.194.142/**

✅ **Test Checklist:**
- [ ] Login page loads (new split-screen design)
- [ ] Login works (admin / admin123)
- [ ] Dashboard shows 2 devices
- [ ] Live data updates
- [ ] **Devices page works** (admin menu)
  - [ ] Shows device list
  - [ ] Can add new device
  - [ ] Can edit device
  - [ ] Can delete device
- [ ] Charts display data
- [ ] Analytics page works
- [ ] Alerts page works
- [ ] No console errors (F12)

---

## ⚠️ Common Issues & Fixes

### **Issue 1: Permission Denied**
```bash
sudo chown -R ubuntu:ubuntu ~/stromwater-iot
cd ~/stromwater-iot
git pull origin main
```

### **Issue 2: PM2 Not Found**
```bash
sudo npm install -g pm2
pm2 start ~/stromwater-iot/backend/src/index.js --name backend
pm2 save
```

### **Issue 3: Frontend Not Updating**
```bash
cd ~/stromwater-iot/frontend
rm -rf dist node_modules
npm install
npm run build
sudo systemctl reload nginx
```

### **Issue 4: Backend Not Connecting to Database**
```bash
# Check .env file
cat ~/stromwater-iot/backend/.env | grep DB_

# Test database connection
psql -U postgres -d stromwater_db -c "SELECT 1;"

# Restart backend
pm2 restart backend
```

### **Issue 5: MQTT Not Working**
```bash
# Restart Mosquitto
sudo systemctl restart mosquitto

# Restart backend
pm2 restart backend

# Check logs
pm2 logs backend | grep -i mqtt
```

### **Issue 6: 502 Bad Gateway**
```bash
# Backend crashed, restart it
pm2 restart backend
pm2 logs backend --lines 50
```

---

## 📚 Detailed Documentation

If you need more detailed information:

1. **[DEPLOY-TO-VPS.md](DEPLOY-TO-VPS.md)** - Complete deployment guide with troubleshooting
2. **[SETUP-PM2-VPS.md](SETUP-PM2-VPS.md)** - PM2 process manager setup
3. **[VPS-DEPLOYMENT-COMMANDS.txt](VPS-DEPLOYMENT-COMMANDS.txt)** - All commands in one file
4. **[FIX-TRENDS-GUIDE.md](FIX-TRENDS-GUIDE.md)** - Setting up local MQTT (for local dev)

---

## 🎉 Success Criteria

Deployment is successful when:

✅ All services running (check with `pm2 status` and `systemctl status`)
✅ Frontend loads at http://43.205.194.142/
✅ Login successful with admin/admin123
✅ Dashboard displays live data
✅ **Device Management page fully functional** (NEW!)
✅ Charts showing data trends
✅ No errors in browser console (F12)
✅ No errors in backend logs (`pm2 logs backend`)

---

## 🔄 Future Updates

When you make code changes and want to deploy:

```bash
ssh ubuntu@43.205.194.142
cd ~/stromwater-iot
git pull origin main
./deploy-vps.sh
```

---

## 📞 Need Help?

**Check logs:**
```bash
pm2 logs backend                     # Backend logs
sudo tail -f /var/log/nginx/error.log   # Nginx errors
```

**Check system resources:**
```bash
df -h           # Disk space
free -h         # Memory
pm2 monit       # PM2 monitoring
```

**Restart everything:**
```bash
pm2 restart backend
sudo systemctl restart mosquitto
sudo systemctl reload nginx
```

---

## 🎯 Quick Command Reference

```bash
# Deploy
ssh ubuntu@43.205.194.142
cd ~/stromwater-iot && git pull origin main && ./deploy-vps.sh

# Check status
pm2 status
sudo systemctl status postgresql mosquitto nginx

# View logs
pm2 logs backend
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart backend
sudo systemctl restart mosquitto
sudo systemctl reload nginx

# Check database
psql -U postgres -d stromwater_db -c "SELECT COUNT(*) FROM device_data;"
```

---

**Ready to deploy? Start with Step 1! 🚀**
