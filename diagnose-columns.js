// Count columns in INSERT query
const insertQuery = `
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
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
    $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
    $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
    $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
    $41, $42, $43, $44, $45, $46
  ) RETURNING id
`;

// Extract columns
const columnsMatch = insertQuery.match(/INSERT INTO device_data \(([\s\S]*?)\) VALUES/);
const columns = columnsMatch[1].split(',').map(c => c.trim()).filter(c => c);

// Extract placeholders
const valuesMatch = insertQuery.match(/VALUES \(([\s\S]*?)\) RETURNING/);
const placeholders = valuesMatch[1].split(',').map(p => p.trim()).filter(p => p);

console.log('Columns count:', columns.length);
console.log('Placeholders count:', placeholders.length);
console.log('\nColumns:', columns);
console.log('\nPlaceholders:', placeholders);

if (columns.length !== placeholders.length) {
  console.log('\n❌ MISMATCH! Columns:', columns.length, 'Placeholders:', placeholders.length);
} else {
  console.log('\n✅ Counts match!');
}
