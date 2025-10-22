-- Test INSERT to verify column count
\c stromwater_db

-- Show table structure
\d device_data

-- Count columns (excluding id and created_at which have defaults)
SELECT COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'device_data'
AND column_default IS NULL;

-- Try a test insert with all required columns
INSERT INTO device_data (
  device_id, location, timestamp,
  hydrostatic_value, dry_run_alert, high_level_float_alert,
  pump_1_manual, pump_2_manual, pump_1_auto, pump_2_auto,
  pump_1_protection, pump_2_protection,
  pump_1_contactor_feedback, pump_2_contactor_feedback,
  power_1_r, power_1_y, power_1_b,
  irms_1_r, irms_1_y, irms_1_b,
  power_2_r, power_2_y, power_2_b,
  irms_2_r, irms_2_y, irms_2_b,
  vrms_1_r, vrms_1_y, vrms_1_b,
  vrms_2_r, vrms_2_y, vrms_2_b,
  vahr_1_r, vahr_1_y, vahr_1_b,
  vahr_2_r, vahr_2_y, vahr_2_b,
  freq_1_r, freq_1_y, freq_1_b,
  freq_2_r, freq_2_y, freq_2_b,
  rhs_1, rhs_2, raw_json
) VALUES (
  'TEST_DEVICE', 'Test Location', NOW(),
  50.5, 0, 0,
  0, 0, 1, 1,
  0, 0,
  1, 1,
  100.0, 100.0, 100.0,
  5.0, 5.0, 5.0,
  100.0, 100.0, 100.0,
  5.0, 5.0, 5.0,
  230.0, 230.0, 230.0,
  230.0, 230.0, 230.0,
  0, 0, 0,
  0, 0, 0,
  50.0, 50.0, 50.0,
  50.0, 50.0, 50.0,
  0, 0, '{"test": true}'::jsonb
);

SELECT 'Test insert successful!' as status;
