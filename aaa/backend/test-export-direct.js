const pool = require('./src/config/database');
const PDFDocument = require('pdfkit');
const fs = require('fs');

async function testExport() {
  try {
    console.log('Testing PDF export...');

    // Query data
    const result = await pool.query(
      'SELECT * FROM device_data WHERE device_id = $1 ORDER BY timestamp DESC LIMIT 10',
      ['StromWater_Device_1']
    );

    console.log('Found', result.rows.length, 'records');

    if (result.rows.length === 0) {
      console.log('No data found');
      process.exit(1);
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const output = fs.createWriteStream('test-export.pdf');

    doc.pipe(output);

    // Title
    doc.fontSize(16).text('Test PDF Export', { align: 'center' });
    doc.moveDown();

    // Simple table
    const startY = doc.y;
    let y = startY;

    // Header
    doc.fontSize(8).fillColor('white');
    doc.rect(40, y, 500, 20).fill('#2563EB');
    doc.text('Time', 45, y + 5);
    doc.text('Level', 110, y + 5);
    doc.text('Pump 1', 180, y + 5);
    doc.text('Pump 2', 250, y + 5);

    y += 20;

    // Data
    doc.fillColor('black');
    result.rows.forEach((row, i) => {
      if (i % 2 === 0) {
        doc.rect(40, y, 500, 20).fill('#F3F4F6');
      }

      const time = new Date(row.timestamp).toLocaleTimeString();
      const level = Number(row.hydrostatic_value || 0).toFixed(1);
      const p1 = row.pump_1_contactor_feedback ? 'ON' : 'OFF';
      const p2 = row.pump_2_contactor_feedback ? 'ON' : 'OFF';

      doc.fontSize(7).fillColor('black');
      doc.text(time, 45, y + 5);
      doc.text(level, 110, y + 5);
      doc.text(p1, 180, y + 5);
      doc.text(p2, 250, y + 5);

      y += 20;
    });

    doc.end();

    output.on('finish', () => {
      console.log('✅ PDF created: test-export.pdf');
      process.exit(0);
    });

    output.on('error', (err) => {
      console.error('❌ Error:', err);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testExport();
