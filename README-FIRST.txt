================================================================================
  STROMWATER IoT PLATFORM - WINDOWS INSTALLATION GUIDE
================================================================================

You are here: C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ

================================================================================
STEP 1: DOWNLOAD INSTALLERS (5-10 minutes)
================================================================================

Double-click this file:
  → DOWNLOAD-INSTALLERS.bat

This will download:
  ✓ PostgreSQL (database)
  ✓ Mosquitto (MQTT broker)

Files will be saved to:
  %USERPROFILE%\Downloads\StromWater-Installers

================================================================================
STEP 2: INSTALL POSTGRESQL (10 minutes)
================================================================================

1. Go to Downloads\StromWater-Installers folder
2. Double-click: postgresql-15.x-windows-x64.exe
3. Follow wizard:
   - Use all default settings
   - IMPORTANT: Set password to: postgres
   - Port: 5432
   - Uncheck Stack Builder at the end

4. Verify installation:
   - Open Command Prompt
   - Type: psql --version
   - Should show: psql (PostgreSQL) 15.x

================================================================================
STEP 3: INSTALL MOSQUITTO (2 minutes)
================================================================================

1. Go to Downloads\StromWater-Installers folder
2. Double-click: mosquitto-2.0.18-install-windows-x64.exe
3. Follow wizard:
   - Use all default settings
   - Install to: C:\Program Files\mosquitto

4. Verify installation:
   - Press Win+R, type: services.msc
   - Find: "Mosquitto Broker"
   - Status should be: Running

================================================================================
STEP 4: CONFIGURE DATABASE (5 minutes)
================================================================================

1. Open Command Prompt
2. Type: psql -U postgres
3. Password: postgres
4. Copy these commands one by one:

   CREATE DATABASE stromwater_db;
   CREATE USER stromwater_user WITH ENCRYPTED PASSWORD 'stromwater123';
   GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;
   ALTER DATABASE stromwater_db OWNER TO stromwater_user;
   \q

================================================================================
STEP 5: CONFIGURE MOSQUITTO (5 minutes)
================================================================================

1. Open Command Prompt as Administrator (Win+X → Terminal Admin)
2. Type: cd "C:\Program Files\mosquitto"
3. Type: mosquitto_passwd -c passwd stromwater_mqtt
4. Password: mqtt123 (enter twice)

5. Open Notepad as Administrator
6. Open: C:\Program Files\mosquitto\mosquitto.conf
7. Scroll to bottom and add:

   listener 1883
   allow_anonymous false
   password_file "C:\Program Files\mosquitto\passwd"
   log_dest file "C:\Program Files\mosquitto\mosquitto.log"

8. Save and close

9. Restart service (in admin Command Prompt):
   net stop mosquitto
   net start mosquitto

================================================================================
STEP 6: RUN SETUP SCRIPT (5 minutes)
================================================================================

1. Right-click: setup-windows.bat
2. Click: "Run as administrator"
3. Wait for dependencies to install
4. When asked "Initialize database?": Type y and press Enter
5. Wait for "Database initialized successfully!"
6. Press any key to close

================================================================================
STEP 7: START THE APPLICATION (2 minutes)
================================================================================

Open 3 windows:

Window 1 - Backend:
  → Double-click: start-backend.bat
  → Wait for: "Server running on http://0.0.0.0:5000"
  → Keep open!

Window 2 - Frontend:
  → Double-click: start-frontend.bat
  → Wait for: "Local: http://localhost:3000"
  → Keep open!

Window 3 - Simulator:
  → Double-click: start-simulator.bat
  → See: "Publishing data..."
  → Keep open!

================================================================================
STEP 8: OPEN DASHBOARD (1 minute)
================================================================================

1. Open browser
2. Go to: http://localhost:3000
3. Login:
   Username: admin
   Password: admin123

4. You should see:
   ✓ Water tank with animated level
   ✓ Pump 1 and Pump 2 status cards
   ✓ Real-time charts
   ✓ Device location on map
   ✓ Data updating every 5 seconds

================================================================================
WHAT YOU'LL SEE
================================================================================

Dashboard View:
┌─────────────────────────────────────────────────────────────┐
│  StromWater Dashboard                          [Dark/Light]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Water Tank  │  │   Pump 1     │  │   Pump 2     │      │
│  │   [#####]    │  │     ON       │  │     OFF      │      │
│  │   65.5 m     │  │   230V/2.1A  │  │   230V/0.0A  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │  Voltage Chart     │  │  Current Chart     │            │
│  │  [Line Graph]      │  │  [Line Graph]      │            │
│  └────────────────────┘  └────────────────────┘            │
│                                                               │
│  📍 Khusam, UAE                      🟢 Live Updates        │
│  [Map showing device location]                              │
└─────────────────────────────────────────────────────────────┘

================================================================================
CREDENTIALS SUMMARY
================================================================================

PostgreSQL:
  Database: stromwater_db
  Username: stromwater_user
  Password: stromwater123
  Port: 5432

Mosquitto:
  Username: stromwater_mqtt
  Password: mqtt123
  Port: 1883

Dashboard:
  URL: http://localhost:3000
  Username: admin
  Password: admin123

================================================================================
TROUBLESHOOTING
================================================================================

For detailed help, open these files:

  → INSTALL-NOW.md - Step-by-step guide with screenshots
  → install-prerequisites.md - Detailed installation instructions
  → CHECKLIST.md - Complete checklist with verification steps
  → WINDOWS_SETUP.md - Troubleshooting guide

Common Issues:

"psql is not recognized"
  → Add to PATH: C:\Program Files\PostgreSQL\15\bin

"mosquitto is not recognized"
  → Add to PATH: C:\Program Files\mosquitto

"Port 5000 already in use"
  → Run: netstat -ano | findstr :5000
  → Kill process: taskkill /PID <number> /F

"Database connection error"
  → Check PostgreSQL service is running (services.msc)

"MQTT connection error"
  → Check Mosquitto service is running (services.msc)

================================================================================
TOTAL TIME: 30-45 MINUTES
================================================================================

Questions? Check the documentation files in this folder.

Ready? Start with: DOWNLOAD-INSTALLERS.bat

================================================================================
