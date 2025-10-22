# Installing PostgreSQL and Mosquitto on Windows

## Step 1: Install PostgreSQL

### Download PostgreSQL

1. **Open your browser** and go to:
   https://www.postgresql.org/download/windows/

2. Click on **"Download the installer"**

3. You'll be redirected to EDB's website. Download:
   - **PostgreSQL 15.x or 16.x** (recommended)
   - Windows x86-64 version
   - File size: ~300-400 MB

### Install PostgreSQL

1. **Run the installer** (postgresql-15.x-windows-x64.exe or similar)

2. **Installation Wizard:**
   - Click "Next" on welcome screen

3. **Installation Directory:**
   - Leave as default: `C:\Program Files\PostgreSQL\15` (or 16)
   - Click "Next"

4. **Select Components:**
   - ✅ PostgreSQL Server (checked)
   - ✅ pgAdmin 4 (checked - useful GUI tool)
   - ✅ Stack Builder (uncheck - not needed)
   - ✅ Command Line Tools (checked)
   - Click "Next"

5. **Data Directory:**
   - Leave as default: `C:\Program Files\PostgreSQL\15\data`
   - Click "Next"

6. **Password for postgres user:**
   - Enter: `postgres`
   - Confirm: `postgres`
   - **IMPORTANT:** Remember this password!
   - Click "Next"

7. **Port:**
   - Leave as default: `5432`
   - Click "Next"

8. **Locale:**
   - Leave as default: `[Default locale]`
   - Click "Next"

9. **Pre Installation Summary:**
   - Review settings
   - Click "Next"

10. **Installation:**
    - Wait 3-5 minutes for installation
    - Click "Next" when done

11. **Completing Setup:**
    - **UNCHECK** "Launch Stack Builder at exit"
    - Click "Finish"

### Verify PostgreSQL Installation

1. Open **Command Prompt**

2. Type:
   ```cmd
   psql --version
   ```

3. You should see:
   ```
   psql (PostgreSQL) 15.x
   ```

**If you see "psql is not recognized":**

1. Open System Environment Variables:
   - Press `Win + X` → System
   - Click "Advanced system settings"
   - Click "Environment Variables"

2. Under "System variables", find "Path", click "Edit"

3. Click "New" and add:
   ```
   C:\Program Files\PostgreSQL\15\bin
   ```
   (or 16 if you installed version 16)

4. Click "OK" on all dialogs

5. **Close and reopen Command Prompt** and try `psql --version` again

---

## Step 2: Install Mosquitto

### Download Mosquitto

1. **Open your browser** and go to:
   https://mosquitto.org/download/

2. Scroll down to **"Windows"** section

3. Click on:
   - **mosquitto-2.0.18-install-windows-x64.exe** (or latest version)
   - File size: ~3-4 MB

### Install Mosquitto

1. **Run the installer** (mosquitto-2.x.x-install-windows-x64.exe)

2. **Installation Wizard:**
   - Click "I Agree" on license

3. **Choose Components:**
   - ✅ Service (checked - installs as Windows service)
   - ✅ Files (checked)
   - Click "Next"

4. **Installation Directory:**
   - Leave as default: `C:\Program Files\mosquitto`
   - Click "Install"

5. **Installation:**
   - Wait 10-20 seconds
   - Click "Close"

### Verify Mosquitto Installation

1. **Check Service is Running:**
   - Press `Win + R`
   - Type: `services.msc`
   - Press Enter
   - Look for **"Mosquitto Broker"**
   - Status should be **"Running"**
   - Startup Type should be **"Automatic"**

2. **Verify Command Line:**
   - Open Command Prompt
   - Type:
     ```cmd
     mosquitto -h
     ```

   If you see "mosquitto is not recognized":

   - Add to PATH: `C:\Program Files\mosquitto`
   - Same process as PostgreSQL above
   - Close and reopen Command Prompt

---

## Step 3: Configure PostgreSQL Database

Now that PostgreSQL is installed, let's create the database:

1. Open **Command Prompt**

2. Connect to PostgreSQL:
   ```cmd
   psql -U postgres
   ```

3. When prompted for password, enter: `postgres`

4. You should see the PostgreSQL prompt:
   ```
   postgres=#
   ```

5. **Copy and paste these commands** one by one:

   ```sql
   CREATE DATABASE stromwater_db;
   ```
   (Should see: CREATE DATABASE)

   ```sql
   CREATE USER stromwater_user WITH ENCRYPTED PASSWORD 'stromwater123';
   ```
   (Should see: CREATE ROLE)

   ```sql
   GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;
   ```
   (Should see: GRANT)

   ```sql
   ALTER DATABASE stromwater_db OWNER TO stromwater_user;
   ```
   (Should see: ALTER DATABASE)

6. **Exit PostgreSQL:**
   ```sql
   \q
   ```

7. **Test the connection:**
   ```cmd
   psql -h localhost -U stromwater_user -d stromwater_db
   ```
   Password: `stromwater123`

   If it connects successfully, you'll see:
   ```
   stromwater_db=>
   ```

   Type `\q` to exit.

---

## Step 4: Configure Mosquitto MQTT Broker

Now let's set up Mosquitto with authentication:

### Create Password File

1. Open **Command Prompt as Administrator**
   - Press `Win + X`
   - Click "Command Prompt (Admin)" or "Terminal (Admin)"

2. Navigate to Mosquitto folder:
   ```cmd
   cd "C:\Program Files\mosquitto"
   ```

3. Create password file:
   ```cmd
   mosquitto_passwd -c passwd stromwater_mqtt
   ```

4. When prompted:
   - Password: `mqtt123`
   - Re-enter: `mqtt123`

5. Verify file created:
   ```cmd
   dir passwd
   ```
   (Should see the passwd file)

### Edit Mosquitto Configuration

1. **Open Notepad as Administrator:**
   - Press `Win + S`, type "Notepad"
   - Right-click "Notepad"
   - Click "Run as administrator"

2. **Open the config file:**
   - Click File → Open
   - Navigate to: `C:\Program Files\mosquitto`
   - Change file type dropdown to "All Files (*.*)"
   - Select: `mosquitto.conf`
   - Click "Open"

3. **Scroll to the bottom** of the file

4. **Add these lines** at the end:

   ```conf
   # StromWater Configuration
   listener 1883
   allow_anonymous false
   password_file "C:\Program Files\mosquitto\passwd"
   log_dest file "C:\Program Files\mosquitto\mosquitto.log"
   ```

5. **Save and close** (File → Save)

### Restart Mosquitto Service

1. Open **Command Prompt as Administrator**

2. Stop the service:
   ```cmd
   net stop mosquitto
   ```
   (Should see: "The Mosquitto Broker service was stopped successfully.")

3. Start the service:
   ```cmd
   net start mosquitto
   ```
   (Should see: "The Mosquitto Broker service was started successfully.")

### Test Mosquitto

1. Open **Command Prompt** (normal, not admin)

2. Navigate to Mosquitto:
   ```cmd
   cd "C:\Program Files\mosquitto"
   ```

3. **Subscribe to test topic:**
   ```cmd
   mosquitto_sub -h localhost -t test -u stromwater_mqtt -P mqtt123
   ```

   - No errors = Success!
   - Window will wait for messages
   - Don't close this window yet

4. Open **another Command Prompt** window

5. Navigate to Mosquitto:
   ```cmd
   cd "C:\Program Files\mosquitto"
   ```

6. **Publish test message:**
   ```cmd
   mosquitto_pub -h localhost -t test -m "Hello StromWater!" -u stromwater_mqtt -P mqtt123
   ```

7. **Go back to first window** - you should see:
   ```
   Hello StromWater!
   ```

8. Press `Ctrl+C` in both windows to stop

✅ **If you saw the message, Mosquitto is working perfectly!**

---

## ✅ Installation Complete!

You should now have:

- ✅ PostgreSQL installed and configured
- ✅ Database `stromwater_db` created
- ✅ User `stromwater_user` created with password `stromwater123`
- ✅ Mosquitto installed and configured
- ✅ MQTT user `stromwater_mqtt` created with password `mqtt123`
- ✅ Both services running

---

## 🎯 Next Steps

Now you're ready to run the application!

### Quick Setup:

1. **Run the setup script:**
   - Navigate to: `C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ`
   - Right-click `setup-windows.bat`
   - Click "Run as administrator"
   - When asked "Initialize database now?", type `y`

2. **Start the backend:**
   - Double-click `start-backend.bat`
   - Wait for "Server running..." message

3. **Start the frontend:**
   - Double-click `start-frontend.bat`
   - Wait for "Local: http://localhost:3000/" message

4. **Start the simulator:**
   - Double-click `start-simulator.bat`
   - See data publishing every 5 seconds

5. **Open the dashboard:**
   - Browser: http://localhost:3000
   - Login: admin / admin123

---

## 🆘 Troubleshooting

### PostgreSQL Issues

**"psql is not recognized"**
- Add `C:\Program Files\PostgreSQL\15\bin` to PATH
- Restart Command Prompt

**"Connection refused"**
- Check PostgreSQL service is running (services.msc)
- Verify port 5432 is not blocked by firewall

**"Password authentication failed"**
- Make sure you used the correct password during setup
- Try resetting: `psql -U postgres` then `ALTER USER postgres WITH PASSWORD 'postgres';`

### Mosquitto Issues

**"mosquitto is not recognized"**
- Add `C:\Program Files\mosquitto` to PATH
- Restart Command Prompt

**"Connection refused"**
- Check Mosquitto service is running (services.msc)
- Verify mosquitto.conf was edited correctly

**"Not authorized"**
- Make sure passwd file was created
- Verify mosquitto.conf points to correct passwd file path
- Restart Mosquitto service after config changes

---

## 📝 Summary of Credentials

Save these for reference:

**PostgreSQL:**
- Host: localhost
- Port: 5432
- Database: stromwater_db
- Username: stromwater_user
- Password: stromwater123
- Superuser: postgres
- Superuser Password: postgres

**Mosquitto:**
- Host: localhost
- Port: 1883
- Username: stromwater_mqtt
- Password: mqtt123

**Dashboard:**
- URL: http://localhost:3000
- Username: admin
- Password: admin123

---

**You're all set! Proceed to run setup-windows.bat** 🚀
