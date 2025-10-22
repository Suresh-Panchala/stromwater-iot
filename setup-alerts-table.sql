-- SQL Script to create alerts table for StromWater IoT Platform
-- Run this on your VPS database

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(100) NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  alert_message TEXT,
  severity VARCHAR(20) DEFAULT 'warning',
  timestamp TIMESTAMP NOT NULL,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by INTEGER REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_alerts_device_id ON alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);

-- Insert some sample alerts for testing (optional)
INSERT INTO alerts (device_id, alert_type, alert_message, severity, timestamp, acknowledged)
VALUES
  ('StromWater_Device_1', 'High Level Alert', 'Water level exceeded threshold', 'warning', NOW() - INTERVAL '2 hours', false),
  ('StromWater_Device_1', 'Pump Protection', 'Pump 1 protection triggered', 'critical', NOW() - INTERVAL '1 hour', false),
  ('StromWater_Device_2', 'Dry Run Alert', 'Dry run condition detected', 'warning', NOW() - INTERVAL '30 minutes', false)
ON CONFLICT DO NOTHING;

-- Verify the table was created
SELECT 'Alerts table created successfully!' as message;
SELECT COUNT(*) as total_alerts FROM alerts;
