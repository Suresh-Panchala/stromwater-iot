const pool = require('../config/database');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

// Simple CSV Export
exports.exportCSV = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate } = req.query;

    console.log('[CSV Export] Starting for device:', deviceId);

    let query = 'SELECT * FROM device_data WHERE device_id = $1';
    const values = [deviceId];

    if (startDate && endDate) {
      query += ' AND timestamp BETWEEN $2 AND $3';
      values.push(startDate, endDate);
    }

    query += ' ORDER BY timestamp DESC LIMIT 1000';

    const result = await pool.query(query, values);
    console.log('[CSV Export] Found', result.rows.length, 'records');

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No data found' });
    }

    const fields = [
      'timestamp',
      'hydrostatic_value',
      'pump_1_status',
      'pump_2_status',
      'vrms_1_r',
      'vrms_1_y',
      'vrms_1_b',
      'irms_1_r',
      'irms_1_y',
      'irms_1_b',
      'frequency'
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(result.rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${deviceId}_export.csv"`);
    res.send(csv);

    console.log('[CSV Export] Success');
  } catch (error) {
    console.error('[CSV Export] Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'CSV export failed', details: error.message });
    }
  }
};

// Simple PDF Export with Table
exports.exportPDF = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate } = req.query;

    console.log('[PDF Export] Starting for device:', deviceId);

    let query = 'SELECT * FROM device_data WHERE device_id = $1';
    const values = [deviceId];

    if (startDate && endDate) {
      query += ' AND timestamp BETWEEN $2 AND $3';
      values.push(startDate, endDate);
    }

    query += ' ORDER BY timestamp DESC LIMIT 50';

    const result = await pool.query(query, values);
    console.log('[PDF Export] Found', result.rows.length, 'records');

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No data found' });
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${deviceId}_report.pdf"`);

    doc.pipe(res);

    // Title
    doc.fontSize(16).text('StromWater Device Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Device: ${deviceId}`, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.text(`Records: ${result.rows.length}`, { align: 'center' });
    doc.moveDown(2);

    // Table header
    const startY = doc.y;
    const rowHeight = 20;
    let currentY = startY;

    // Draw header row
    doc.fontSize(8).fillColor('white');
    doc.rect(40, currentY, 515, rowHeight).fill('#2563EB');

    doc.text('Time', 45, currentY + 5, { width: 60 });
    doc.text('Level', 110, currentY + 5, { width: 40 });
    doc.text('P1', 155, currentY + 5, { width: 25 });
    doc.text('P2', 185, currentY + 5, { width: 25 });
    doc.text('Voltage', 215, currentY + 5, { width: 80 });
    doc.text('Current', 300, currentY + 5, { width: 80 });
    doc.text('Freq', 385, currentY + 5, { width: 40 });

    currentY += rowHeight;

    // Data rows
    doc.fillColor('black');
    result.rows.forEach((row, index) => {
      // Check if need new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      // Alternating background
      if (index % 2 === 0) {
        doc.rect(40, currentY, 515, rowHeight).fill('#F3F4F6');
      }

      const time = new Date(row.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const level = Number(row.hydrostatic_value || 0).toFixed(1);
      const p1 = row.pump_1_status === 'ON' ? 'ON' : 'OFF';
      const p2 = row.pump_2_status === 'ON' ? 'ON' : 'OFF';
      const voltage = `${Math.round(Number(row.vrms_1_r) || 0)}/${Math.round(Number(row.vrms_1_y) || 0)}/${Math.round(Number(row.vrms_1_b) || 0)}`;
      const current = `${Number(row.irms_1_r || 0).toFixed(1)}/${Number(row.irms_1_y || 0).toFixed(1)}/${Number(row.irms_1_b || 0).toFixed(1)}`;
      const freq = Number(row.frequency || 0).toFixed(1);

      doc.fontSize(7).fillColor('black');
      doc.text(time, 45, currentY + 5, { width: 60 });
      doc.text(level, 110, currentY + 5, { width: 40 });
      doc.text(p1, 155, currentY + 5, { width: 25 });
      doc.text(p2, 185, currentY + 5, { width: 25 });
      doc.text(voltage, 215, currentY + 5, { width: 80 });
      doc.text(current, 300, currentY + 5, { width: 80 });
      doc.text(freq, 385, currentY + 5, { width: 40 });

      currentY += rowHeight;
    });

    // Border
    doc.rect(40, startY, 515, currentY - startY).stroke();

    // Footer
    doc.fontSize(8).fillColor('gray');
    doc.text(
      `Page 1 | StromWater IoT Platform`,
      0,
      doc.page.height - 50,
      { align: 'center' }
    );

    doc.end();
    console.log('[PDF Export] Success');

  } catch (error) {
    console.error('[PDF Export] Error:', error);
    console.error('[PDF Export] Stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: 'PDF export failed', details: error.message });
    }
  }
};
