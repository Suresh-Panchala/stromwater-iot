-- First, check the actual alerts table structure
\d alerts

-- VPS alerts table schema:
-- Columns: id, device_id, alert_type, severity, message, acknowledged, created_at, threshold_value, actual_value

-- Insert alerts with CORRECT VPS column names
INSERT INTO alerts (device_id, alert_type, message, severity, threshold_value, actual_value, acknowledged, created_at)
VALUES
('StromWater_Device_1', 'water_level', 'Water level approaching threshold', 'warning', 7.0, 7.5, false, NOW() - INTERVAL '30 minutes'),
('StromWater_Device_2', 'voltage', 'Voltage out of range', 'critical', 440.0, 450.0, false, NOW() - INTERVAL '15 minutes'),
('StromWater_Device_1', 'current', 'Current fluctuation detected', 'warning', 40.0, 42.0, false, NOW() - INTERVAL '10 minutes')
ON CONFLICT DO NOTHING;

-- Verify the data
SELECT id, device_id, alert_type, severity, message, threshold_value, actual_value, created_at
FROM alerts
ORDER BY created_at DESC
LIMIT 5;
