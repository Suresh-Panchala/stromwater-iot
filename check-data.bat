@echo off
ECHO ========================================
ECHO Checking Database Data
ECHO ========================================
ECHO.

SET PGPASSWORD=root

ECHO Recent device data entries:
psql -U postgres -d stromwater_db -c "SELECT id, device_id, location, timestamp, hydrostatic_value, pump_1_auto, pump_2_auto FROM device_data ORDER BY timestamp DESC LIMIT 5;"

ECHO.
ECHO Total records:
psql -U postgres -d stromwater_db -c "SELECT COUNT(*) as total_records FROM device_data;"

ECHO.
ECHO Registered devices:
psql -U postgres -d stromwater_db -c "SELECT device_id, device_name, location, last_seen FROM devices;"

ECHO.
pause
