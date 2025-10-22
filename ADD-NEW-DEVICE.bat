@echo off
ECHO ========================================
ECHO Add New StromWater Device
ECHO ========================================
ECHO.
ECHO This will help you add a new device to the system.
ECHO.
ECHO Before running this script, please edit the file:
ECHO   add-new-device.sql
ECHO.
ECHO Change these values:
ECHO   - device_id (must be unique, e.g., StromWater_Device_2)
ECHO   - device_name (e.g., "New Pump Station")
ECHO   - location (e.g., "Dubai Industrial Area")
ECHO   - latitude (GPS coordinate)
ECHO   - longitude (GPS coordinate)
ECHO.
pause
ECHO.
ECHO Running SQL script...
ECHO.

SET PGPASSWORD=root
psql -U postgres -d stromwater_db -f add-new-device.sql

ECHO.
ECHO ========================================
ECHO Device Added Successfully!
ECHO ========================================
ECHO.
ECHO Next Steps:
ECHO.
ECHO 1. Configure your MQTT device to publish to:
ECHO    Topic: devices/[YOUR_DEVICE_ID]/data
ECHO    Example: devices/StromWater_Device_2/data
ECHO.
ECHO 2. Restart the dashboard to see the new device
ECHO.
ECHO 3. The device will appear in the device selector
ECHO    on the dashboard once it starts sending data
ECHO.
pause
