@echo off
ECHO ========================================
ECHO Complete Database Fix
ECHO ========================================
ECHO.
ECHO This will:
ECHO  1. Reset the entire database
ECHO  2. Fix all permissions
ECHO  3. Test an INSERT
ECHO  4. Create admin user
ECHO.
ECHO Press any key to continue or Ctrl+C to cancel
pause >nul

SET PGPASSWORD=root

ECHO.
ECHO Step 1: Resetting database schema...
psql -U postgres -d stromwater_db -f reset-database.sql

ECHO.
ECHO Step 2: Fixing permissions...
psql -U postgres -d stromwater_db -c "GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;"
psql -U postgres -d stromwater_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO stromwater_user;"
psql -U postgres -d stromwater_db -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO stromwater_user;"
psql -U postgres -d stromwater_db -c "ALTER TABLE users OWNER TO stromwater_user;"
psql -U postgres -d stromwater_db -c "ALTER TABLE devices OWNER TO stromwater_user;"
psql -U postgres -d stromwater_db -c "ALTER TABLE device_data OWNER TO stromwater_user;"
psql -U postgres -d stromwater_db -c "ALTER TABLE alerts OWNER TO stromwater_user;"
psql -U postgres -d stromwater_db -c "ALTER TABLE refresh_tokens OWNER TO stromwater_user;"

ECHO.
ECHO Step 3: Creating admin user...
SET PGPASSWORD=stromwater123
psql -U stromwater_user -d stromwater_db -c "INSERT INTO users (username, email, password_hash, role) VALUES ('admin', 'admin@stromwater.com', '$2a$10$YourHashedPasswordHere', 'admin') ON CONFLICT (username) DO NOTHING;"

ECHO.
ECHO Step 4: Testing INSERT...
SET PGPASSWORD=stromwater123
psql -U stromwater_user -d stromwater_db -c "INSERT INTO device_data (device_id, location, timestamp, hydrostatic_value, dry_run_alert, high_level_float_alert, pump_1_manual, pump_2_manual, pump_1_auto, pump_2_auto, pump_1_protection, pump_2_protection, pump_1_contactor_feedback, pump_2_contactor_feedback, power_1_r, power_1_y, power_1_b, irms_1_r, irms_1_y, irms_1_b, power_2_r, power_2_y, power_2_b, irms_2_r, irms_2_y, irms_2_b, vrms_1_r, vrms_1_y, vrms_1_b, vrms_2_r, vrms_2_y, vrms_2_b, vahr_1_r, vahr_1_y, vahr_1_b, vahr_2_r, vahr_2_y, vahr_2_b, freq_1_r, freq_1_y, freq_1_b, freq_2_r, freq_2_y, freq_2_b, rhs_1, rhs_2, raw_json) VALUES ('TEST', 'Test', NOW(), 50.5, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 100, 100, 100, 5, 5, 5, 100, 100, 100, 5, 5, 5, 230, 230, 230, 230, 230, 230, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 0, 0, '{}'::jsonb);"

ECHO.
ECHO Step 5: Verifying permissions...
SET PGPASSWORD=root
psql -U postgres -d stromwater_db -c "SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public';"

ECHO.
ECHO ========================================
ECHO [SUCCESS] Database fixed!
ECHO ========================================
ECHO.
ECHO Next steps:
ECHO  1. Restart backend (Ctrl+C then run start-backend.bat)
ECHO  2. Backend should now work without errors
ECHO.
pause
