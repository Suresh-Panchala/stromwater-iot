# Windows Testing Checklist

## ☑️ Before You Start

- [ ] I have Windows 10/11
- [ ] I have internet connection
- [ ] I have administrator access

---

## 📥 Step 1: Install Prerequisites (15-20 minutes)

### PostgreSQL Database

- [ ] Download from https://www.postgresql.org/download/windows/
- [ ] Run installer (postgresql-15.x-windows-x64.exe or 16.x)
- [ ] Set password: `postgres` (write it down!)
- [ ] Port: `5432` (default)
- [ ] Click through rest of installation
- [ ] Skip Stack Builder
- [ ] **Verify:** Open cmd, type `psql --version`

### Mosquitto MQTT Broker

- [ ] Download from https://mosquitto.org/download/
- [ ] Run installer (mosquitto-2.x.x-install-windows-x64.exe)
- [ ] Install to: `C:\Program Files\mosquitto` (default)
- [ ] Finish installation
- [ ] **Verify:** Open Services (Win+R, `services.msc`), find "Mosquitto Broker" - should be Running

### Node.js ✅

- [x] Already installed (v24.5.0) - You're good!

---

## 🔧 Step 2: Configure Database (5 minutes)

- [ ] Open Command Prompt **as Administrator**
- [ ] Type: `psql -U postgres`
- [ ] Enter password you set during PostgreSQL installation
- [ ] Copy and paste these commands one by one:

```sql
CREATE DATABASE stromwater_db;
CREATE USER stromwater_user WITH ENCRYPTED PASSWORD 'stromwater123';
GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;
ALTER DATABASE stromwater_db OWNER TO stromwater_user;
\q
```

- [ ] See "CREATE DATABASE", "CREATE ROLE", "GRANT" messages
- [ ] Type `\q` to exit

**Verify:**
```cmd
psql -h localhost -U stromwater_user -d stromwater_db
# Password: stromwater123
# Should connect successfully
\q
```

---

## 🔧 Step 3: Configure Mosquitto (5 minutes)

### Create Password File

- [ ] Open Command Prompt **as Administrator**
- [ ] Type: `cd "C:\Program Files\mosquitto"`
- [ ] Type: `mosquitto_passwd -c passwd stromwater_mqtt`
- [ ] Enter password: `mqtt123`
- [ ] Confirm password: `mqtt123`
- [ ] See "passwd" file created

### Edit Configuration

- [ ] Open Notepad **as Administrator**
- [ ] Open: `C:\Program Files\mosquitto\mosquitto.conf`
- [ ] Scroll to the bottom
- [ ] Add these lines:

```
listener 1883
allow_anonymous false
password_file "C:\Program Files\mosquitto\passwd"
log_dest file "C:\Program Files\mosquitto\mosquitto.log"
```

- [ ] Save and close

### Restart Mosquitto

- [ ] Open Command Prompt **as Administrator**
- [ ] Type: `net stop mosquitto`
- [ ] Type: `net start mosquitto`
- [ ] See "service started successfully"

**Verify:**
```cmd
cd "C:\Program Files\mosquitto"
mosquitto_sub -h localhost -t test -u stromwater_mqtt -P mqtt123
# Should connect without errors (will wait for messages)
# Press Ctrl+C to stop
```

---

## 🚀 Step 4: Setup Project (10 minutes)

### Run Setup Script

- [ ] Navigate to: `C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ`
- [ ] Right-click `setup-windows.bat`
- [ ] Click "Run as Administrator"
- [ ] Wait for dependencies to install (5-10 minutes)
- [ ] When asked "Initialize database now?", type `y` and press Enter
- [ ] See "Database initialized successfully!"
- [ ] See default admin credentials displayed
- [ ] Press any key to close

---

## 📝 Step 5: Verify Configuration

### Backend .env

- [ ] Open: `C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ\backend\.env`
- [ ] Verify these values:

```env
DB_PASSWORD=stromwater123
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=stromwater_mqtt
MQTT_PASSWORD=mqtt123
JWT_SECRET=my_dev_secret_key_12345
```

### Frontend .env

- [ ] Open: `C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ\frontend\.env`
- [ ] Verify these values:

```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

---

## ▶️ Step 6: Start the Application (2 minutes)

### Terminal 1 - Backend

- [ ] Double-click: `start-backend.bat`
- [ ] Wait for:
  - "Server running on http://0.0.0.0:5000"
  - "Database connected successfully"
  - "Connected to MQTT broker successfully"
  - "WebSocket server initialized"
- [ ] Leave this window open!

### Terminal 2 - Frontend

- [ ] Double-click: `start-frontend.bat`
- [ ] Wait for:
  - "VITE v5.x.x ready in xxx ms"
  - "Local: http://localhost:3000/"
- [ ] Leave this window open!

### Terminal 3 - Simulator (Optional)

- [ ] Double-click: `start-simulator.bat`
- [ ] See:
  - "Connected to MQTT broker"
  - "Publishing data..."
  - Data publishing every 5 seconds
- [ ] Leave this window open!

---

## 🌐 Step 7: Test the Dashboard (5 minutes)

### Open Dashboard

- [ ] Open browser
- [ ] Go to: http://localhost:3000
- [ ] See login page

### Login

- [ ] Username: `admin`
- [ ] Password: `admin123`
- [ ] Click "Login"
- [ ] Dashboard loads successfully

### Check Real-time Features

- [ ] Water tank animation displays
- [ ] Water level shows a number (e.g., 45.7)
- [ ] Pump 1 card shows status
- [ ] Pump 2 card shows status
- [ ] Electrical values display (voltage, current, frequency)
- [ ] Charts show data
- [ ] "Live" indicator with green dot
- [ ] Data updates every 5 seconds (if simulator running)

### Test Navigation

- [ ] Click device name to see details
- [ ] See device detail page with charts
- [ ] Click "Alerts" in sidebar
- [ ] See alerts (may be empty initially)
- [ ] Click "Settings" in sidebar
- [ ] See your profile info
- [ ] Click "StromWater" logo to return to dashboard

### Test Features

- [ ] Toggle dark/light mode (moon/sun icon in sidebar)
- [ ] Theme changes
- [ ] Export CSV (on device detail page)
- [ ] CSV downloads
- [ ] Export PDF
- [ ] PDF downloads

### Test Admin Features (if admin)

- [ ] Click "Users" in sidebar
- [ ] See user list
- [ ] Click "Create User"
- [ ] Fill in test user details
- [ ] User created successfully
- [ ] Delete test user

---

## ✅ Success Criteria

You should see:

- ✅ Dashboard loads without errors
- ✅ Real-time data updates every 5 seconds
- ✅ Water tank animates with level changes
- ✅ Pump status changes (ON/OFF)
- ✅ Charts display trend data
- ✅ Map shows device location
- ✅ Alerts appear when triggered
- ✅ Can export data (CSV/PDF)
- ✅ Can manage users (admin)
- ✅ Can change theme
- ✅ No console errors (F12 in browser)

---

## 🐛 Troubleshooting

### Backend won't start

**"Database connection error"**
- [ ] Check PostgreSQL is running (Services)
- [ ] Verify DB_PASSWORD in backend/.env
- [ ] Try: `psql -h localhost -U stromwater_user -d stromwater_db`

**"MQTT connection error"**
- [ ] Check Mosquitto is running (Services)
- [ ] Verify mosquitto.conf edited correctly
- [ ] Try: `mosquitto_sub -h localhost -t test -u stromwater_mqtt -P mqtt123`

**"Port 5000 already in use"**
- [ ] Find process: `netstat -ano | findstr :5000`
- [ ] Kill it: `taskkill /PID <number> /F`

### Frontend won't start

**"Port 3000 already in use"**
- [ ] Find process: `netstat -ano | findstr :3000`
- [ ] Kill it: `taskkill /PID <number> /F`

**"Cannot connect to backend"**
- [ ] Check backend is running
- [ ] Verify backend shows "Server running..."
- [ ] Check VITE_API_URL in frontend/.env

### Dashboard issues

**"Login fails"**
- [ ] Check backend is running
- [ ] Verify database initialized (should have admin user)
- [ ] Try reinitializing: `cd backend && npm run init-db`

**"No data showing"**
- [ ] Check simulator is running
- [ ] Check backend logs for "Received message from topic..."
- [ ] Try publishing manually with mosquitto_pub

**"WebSocket not connected"**
- [ ] Check backend shows "WebSocket server initialized"
- [ ] Check browser console (F12) for errors
- [ ] Verify VITE_WS_URL in frontend/.env

---

## 📊 What to Test

### Basic Features (5 min)
- [ ] Login/logout works
- [ ] Dashboard shows data
- [ ] Real-time updates work
- [ ] Charts display correctly
- [ ] Theme toggle works

### Advanced Features (10 min)
- [ ] Device detail page loads
- [ ] Export CSV works
- [ ] Export PDF works
- [ ] Map shows location
- [ ] Alerts display
- [ ] Acknowledge alerts

### Admin Features (5 min)
- [ ] Users page accessible
- [ ] Create user works
- [ ] Delete user works
- [ ] Change password works

---

## 🎉 Completion

Once all checkboxes are checked:

- ✅ Platform is fully functional locally
- ✅ Ready to test with real devices
- ✅ Ready to customize for your needs
- ✅ Ready to deploy to production

---

## 📝 Notes & Issues

Write down any issues you encountered:

**Issue:**
_______________________________________

**Solution:**
_______________________________________

---

## 🚀 Next Steps

After successful local testing:

1. **Customize:**
   - [ ] Change default passwords
   - [ ] Update branding/colors
   - [ ] Configure email alerts
   - [ ] Add your devices

2. **Deploy to Production:**
   - [ ] Get Ubuntu VPS
   - [ ] Point domain to VPS
   - [ ] Follow deployment guide
   - [ ] Configure SSL/HTTPS

3. **Connect Real Devices:**
   - [ ] Configure device MQTT settings
   - [ ] Test data publishing
   - [ ] Monitor in dashboard

---

**Total estimated time: 30-45 minutes**

Good luck! 🚀
