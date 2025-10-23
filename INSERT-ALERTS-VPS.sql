-- First, check the actual alerts table structure
\d alerts

-- Insert alerts with CORRECT column names (alert_type, alert_message, timestamp)
INSERT INTO alerts (device_id, alert_type, alert_message, severity, timestamp, threshold_value, actual_value, acknowledged)
VALUES
('StromWater_Device_1', 'water_level', 'Water level approaching threshold', 'warning', NOW() - INTERVAL '30 minutes', 7.0, 7.5, false),
('StromWater_Device_2', 'voltage', 'Voltage out of range', 'critical', NOW() - INTERVAL '15 minutes', 440.0, 450.0, false),
('StromWater_Device_1', 'current', 'Current fluctuation detected', 'warning', NOW() - INTERVAL '10 minutes', 40.0, 42.0, false)
ON CONFLICT DO NOTHING;

-- Verify the data
SELECT * FROM alerts ORDER BY timestamp DESC;
