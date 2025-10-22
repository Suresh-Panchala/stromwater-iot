# 🚀 Install PostgreSQL and Mosquitto - Step by Step

## Option 1: Automatic Download (Recommended)

### Step 1: Download Installers

1. **Go to your project folder:**
   - Navigate to: `C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ`

2. **Double-click:** `DOWNLOAD-INSTALLERS.bat`
   - This will download both installers
   - They'll be saved to: `%USERPROFILE%\Downloads\StromWater-Installers`
   - Takes 5-10 minutes (depending on internet speed)

3. **Wait for download to complete**

---

## Option 2: Manual Download

If automatic download doesn't work:

### PostgreSQL:
1. Go to: https://www.postgresql.org/download/windows/
2. Click "Download the installer"
3. Download PostgreSQL 15.x for Windows x86-64
4. Save to Downloads folder

### Mosquitto:
1. Go to: https://mosquitto.org/download/
2. Scroll to Windows section
3. Download "mosquitto-2.0.18-install-windows-x64.exe"
4. Save to Downloads folder

---

## Install PostgreSQL

### Step 1: Run Installer

1. **Find the installer:**
   - Go to Downloads folder
   - Find: `postgresql-15.x-windows-x64.exe`
   - **Double-click** to run

2. **Click through wizard:**

   | Screen | What to do |
   |--------|-----------|
   | Welcome | Click "Next" |
   | Installation Directory | Leave default, click "Next" |
   | Select Components | Keep all checked, click "Next" |
   | Data Directory | Leave default, click "Next" |
   | **Password** | Enter: `postgres` (both fields) |
   | Port | Leave as `5432`, click "Next" |
   | Advanced Options | Leave default, click "Next" |
   | Pre Installation Summary | Click "Next" |
   | Ready to Install | Click "Next" |
   | Installing | Wait 5 minutes |
   | Completing | **UNCHECK** Stack Builder, click "Finish" |

### Step 2: Verify Installation

1. **Open Command Prompt** (Win+R, type `cmd`, Enter)

2. **Type:**
   ```cmd
   psql --version
   ```

3. **You should see:**
   ```
   psql (PostgreSQL) 15.x
   ```

✅ **If you see this, PostgreSQL is installed!**

❌ **If you see "psql is not recognized":**

1. Press `Win + X` → System
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "System variables", select "Path", click "Edit"
5. Click "New"
6. Add: `C:\Program Files\PostgreSQL\15\bin`
7. Click OK on all windows
8. **Close and reopen Command Prompt**
9. Try `psql --version` again

---

## Install Mosquitto

### Step 1: Run Installer

1. **Find the installer:**
   - Go to Downloads folder
   - Find: `mosquitto-2.0.18-install-windows-x64.exe`
   - **Double-click** to run

2. **Click through wizard:**

   | Screen | What to do |
   |--------|-----------|
   | License Agreement | Click "I Agree" |
   | Choose Components | Keep all checked, click "Next" |
   | Choose Install Location | Leave default, click "Install" |
   | Installation | Wait 20 seconds |
   | Completed | Click "Close" |

### Step 2: Verify Installation

1. **Check Service:**
   - Press `Win + R`
   - Type: `services.msc`
   - Press Enter
   - **Look for:** "Mosquitto Broker"
   - **Status:** Should be "Running"

✅ **If status is "Running", Mosquitto is installed!**

❌ **If not running:**
1. Right-click "Mosquitto Broker"
2. Click "Start"

---

## Configure PostgreSQL

Now let's create the database for StromWater:

### Step 1: Open PostgreSQL

1. **Open Command Prompt**

2. **Connect to PostgreSQL:**
   ```cmd
   psql -U postgres
   ```

3. **Enter password:** `postgres`

4. **You should see:**
   ```
   postgres=#
   ```

### Step 2: Create Database

**Copy these commands one at a time and press Enter after each:**

```sql
CREATE DATABASE stromwater_db;
```
(You should see: `CREATE DATABASE`)

```sql
CREATE USER stromwater_user WITH ENCRYPTED PASSWORD 'stromwater123';
```
(You should see: `CREATE ROLE`)

```sql
GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;
```
(You should see: `GRANT`)

```sql
ALTER DATABASE stromwater_db OWNER TO stromwater_user;
```
(You should see: `ALTER DATABASE`)

```sql
\q
```
(Exits PostgreSQL)

### Step 3: Test Connection

```cmd
psql -h localhost -U stromwater_user -d stromwater_db
```

**Enter password:** `stromwater123`

✅ **If you see `stromwater_db=>` you're connected!**

Type `\q` to exit.

---

## Configure Mosquitto

Now let's set up MQTT authentication:

### Step 1: Create Password File

1. **Open Command Prompt as Administrator:**
   - Press `Win + X`
   - Click "Command Prompt (Admin)" or "Terminal (Admin)"

2. **Navigate to Mosquitto folder:**
   ```cmd
   cd "C:\Program Files\mosquitto"
   ```

3. **Create password file:**
   ```cmd
   mosquitto_passwd -c passwd stromwater_mqtt
   ```

4. **When prompted:**
   - Password: `mqtt123`
   - Re-enter password: `mqtt123`

5. **You should see the passwd file created**

### Step 2: Edit Configuration

1. **Open Notepad as Administrator:**
   - Press `Win + S`
   - Type: "Notepad"
   - Right-click "Notepad"
   - Click "Run as administrator"

2. **Open config file:**
   - Click File → Open
   - Navigate to: `C:\Program Files\mosquitto`
   - Change file type to: "All Files (*.*)"
   - Select: `mosquitto.conf`
   - Click Open

3. **Scroll to the very bottom**

4. **Add these lines:**
   ```conf
   # StromWater MQTT Configuration
   listener 1883
   allow_anonymous false
   password_file "C:\Program Files\mosquitto\passwd"
   log_dest file "C:\Program Files\mosquitto\mosquitto.log"
   ```

5. **Save (Ctrl+S) and close**

### Step 3: Restart Mosquitto

1. **In Command Prompt (as Administrator):**
   ```cmd
   net stop mosquitto
   ```
   (Should see: "service was stopped successfully")

   ```cmd
   net start mosquitto
   ```
   (Should see: "service was started successfully")

### Step 4: Test MQTT

1. **Open Command Prompt** (normal, not admin)

2. **Navigate to Mosquitto:**
   ```cmd
   cd "C:\Program Files\mosquitto"
   ```

3. **Subscribe to test topic:**
   ```cmd
   mosquitto_sub -h localhost -t test -u stromwater_mqtt -P mqtt123
   ```

   - No errors = Good!
   - Window will wait for messages
   - **Keep this window open**

4. **Open ANOTHER Command Prompt**

5. **Navigate to Mosquitto:**
   ```cmd
   cd "C:\Program Files\mosquitto"
   ```

6. **Publish test message:**
   ```cmd
   mosquitto_pub -h localhost -t test -m "Hello StromWater!" -u stromwater_mqtt -P mqtt123
   ```

7. **Go back to first window**

✅ **You should see: `Hello StromWater!`**

8. Press `Ctrl+C` in both windows to close

---

## ✅ Installation Complete!

You now have:
- ✅ PostgreSQL installed
- ✅ Database `stromwater_db` created
- ✅ Mosquitto installed
- ✅ MQTT authentication configured

---

## 🚀 Next Steps

Now run the StromWater application:

### 1. Run Setup Script

- Navigate to: `C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ`
- Right-click: `setup-windows.bat`
- Click: "Run as administrator"
- When asked "Initialize database?": Type `y` and press Enter
- Wait for "Database initialized successfully!"

### 2. Start Backend

- Double-click: `start-backend.bat`
- Wait for "Server running on http://0.0.0.0:5000"
- **Keep window open**

### 3. Start Frontend

- Double-click: `start-frontend.bat`
- Wait for "Local: http://localhost:3000"
- **Keep window open**

### 4. Start Simulator

- Double-click: `start-simulator.bat`
- See data publishing every 5 seconds
- **Keep window open**

### 5. Open Dashboard

- Open browser
- Go to: http://localhost:3000
- Login: `admin` / `admin123`

---

## 🎉 Success!

You should now see:
- Water tank with animated level
- Two pump status cards
- Real-time charts
- Device location on map
- Live data updates every 5 seconds

---

## 📞 Need Help?

If you get stuck:
1. Check [install-prerequisites.md](install-prerequisites.md) for detailed troubleshooting
2. Check [CHECKLIST.md](CHECKLIST.md) for verification steps
3. Make sure both PostgreSQL and Mosquitto services are running

---

**Total Time: 30-45 minutes**

**Let's get started! Click DOWNLOAD-INSTALLERS.bat** 🚀
