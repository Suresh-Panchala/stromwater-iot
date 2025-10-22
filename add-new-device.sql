-- Add New StromWater Device
-- This script adds a new device to the system

\c stromwater_db

-- Example: Add a new device
-- Replace the values below with your actual device information

INSERT INTO devices (
  device_id,
  device_name,
  location,
  latitude,
  longitude,
  is_active
) VALUES (
  'StromWater_Device_2',           -- Unique device ID (change this)
  'Sharjah Industrial Pump Station', -- Device name (change this)
  'Sharjah Industrial Area',        -- Location (change this)
  25.3463,                          -- Latitude (change this)
  55.4209,                          -- Longitude (change this)
  true                              -- Is active (true/false)
) ON CONFLICT (device_id) DO NOTHING;

-- Verify the device was added
SELECT * FROM devices ORDER BY created_at DESC LIMIT 5;

-- Show all active devices
SELECT device_id, device_name, location, is_active FROM devices WHERE is_active = true;
