# 🚀 StromWater Installation - In Progress

## ✅ Step 1: Downloading Installers (STARTED)

The download script is running! It's downloading:

1. **PostgreSQL 15** (~300 MB) - Database
2. **Mosquitto 2.0.18** (~4 MB) - MQTT Broker

Files will be saved to:
```
%USERPROFILE%\Downloads\StromWater-Installers
```

⏱️ **Estimated time:** 5-10 minutes (depending on your internet speed)

### What to do while downloading:

You can continue with the next steps - I'll guide you through them!

---

## 📋 Next Steps (After Download Completes)

### Step 2: Install PostgreSQL (10 minutes)

1. Go to: `%USERPROFILE%\Downloads\StromWater-Installers`
2. Double-click: `postgresql-15.9-windows-x64.exe`
3. **Important settings:**
   - Password: `postgres` (type this twice)
   - Port: `5432` (default)
   - Skip Stack Builder at the end
4. Everything else: Use defaults

### Step 3: Install Mosquitto (2 minutes)

1. Same folder: `%USERPROFILE%\Downloads\StromWater-Installers`
2. Double-click: `mosquitto-2.0.18-install-windows-x64.exe`
3. Use all default settings
4. Install location: `C:\Program Files\mosquitto`

### Step 4: Configure PostgreSQL (5 minutes)

Open **Command Prompt** and run these commands:

```cmd
psql -U postgres
```
Password: `postgres`

Then copy/paste these one by one:
```sql
CREATE DATABASE stromwater_db;
CREATE USER stromwater_user WITH ENCRYPTED PASSWORD 'stromwater123';
GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;
ALTER DATABASE stromwater_db OWNER TO stromwater_user;
\q
```

### Step 5: Configure Mosquitto (5 minutes)

**A) Create password file** (Command Prompt as Admin):
```cmd
cd "C:\Program Files\mosquitto"
mosquitto_passwd -c passwd stromwater_mqtt
```
Password: `mqtt123` (enter twice)

**B) Edit config file:**
1. Open Notepad as Administrator
2. Open: `C:\Program Files\mosquitto\mosquitto.conf`
3. Add at the end:
```
listener 1883
allow_anonymous false
password_file "C:\Program Files\mosquitto\passwd"
log_dest file "C:\Program Files\mosquitto\mosquitto.log"
```
4. Save and close

**C) Restart service** (Command Prompt as Admin):
```cmd
net stop mosquitto
net start mosquitto
```

### Step 6: Run Setup Script (5 minutes)

1. Navigate to: `C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ`
2. Right-click: `setup-windows.bat`
3. Click: "Run as administrator"
4. When asked "Initialize database?": Type `y`
5. Wait for "Database initialized successfully!"

### Step 7: Start Application (2 minutes)

Open 3 separate Command Prompt windows:

**Window 1:**
```cmd
cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ
start-backend.bat
```

**Window 2:**
```cmd
cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ
start-frontend.bat
```

**Window 3:**
```cmd
cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ
start-simulator.bat
```

### Step 8: Open Dashboard

1. Open browser
2. Go to: http://localhost:3000
3. Login:
   - Username: `admin`
   - Password: `admin123`

---

## 🎯 Current Status

- [x] Project files created
- [x] Scripts prepared
- [ ] Installers downloading... ⏳
- [ ] PostgreSQL to install
- [ ] Mosquitto to install
- [ ] Database to configure
- [ ] MQTT to configure
- [ ] Dependencies to install
- [ ] Application to start
- [ ] Dashboard to test

---

## 📞 Need Help?

While waiting for downloads, you can:
- Read README-FIRST.txt for overview
- Check INSTALL-NOW.md for detailed steps
- Review CHECKLIST.md for verification steps

---

**I'll guide you through each step! Let me know when the download completes.**
