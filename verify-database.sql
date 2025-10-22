-- SQL Script to verify database setup for both Alerts and Analytics pages

-- 1. Check if alerts table exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'alerts'
    ) THEN 'YES - Alerts table exists'
    ELSE 'NO - Alerts table missing! Run setup-alerts-table.sql'
  END as alerts_table_status;

-- 2. Check if device_data table has data for Analytics
SELECT
  COUNT(*) as total_device_data_records,
  COUNT(DISTINCT device_id) as unique_devices,
  MIN(timestamp) as oldest_record,
  MAX(timestamp) as latest_record
FROM device_data;

-- 3. Count alerts (if table exists)
SELECT
  COUNT(*) as total_alerts,
  COUNT(CASE WHEN acknowledged = false THEN 1 END) as unacknowledged_alerts,
  COUNT(CASE WHEN acknowledged = true THEN 1 END) as acknowledged_alerts
FROM alerts;

-- 4. List all tables in the database
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 5. Show recent device data for Analytics page
SELECT
  device_id,
  hydrostatic_value,
  vrms_1_r,
  irms_1_r,
  timestamp
FROM device_data
ORDER BY timestamp DESC
LIMIT 10;
