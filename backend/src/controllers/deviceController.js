const pool = require('../config/database');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

exports.getDevices = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*,
             dd.timestamp as last_data_timestamp,
             dd.hydrostatic_value as last_hydrostatic_value
      FROM devices d
      LEFT JOIN LATERAL (
        SELECT timestamp, hydrostatic_value
        FROM device_data
        WHERE device_id = d.device_id
        ORDER BY timestamp DESC
        LIMIT 1
      ) dd ON true
      WHERE d.is_active = true
      ORDER BY d.device_id
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
};

exports.getDeviceById = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const result = await pool.query(
      'SELECT * FROM devices WHERE device_id = $1',
      [deviceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({ error: 'Failed to fetch device' });
  }
};

exports.getDeviceData = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate, limit = 100, offset = 0 } = req.query;

    let query = 'SELECT * FROM device_data WHERE device_id = $1';
    const values = [deviceId];
    let paramCount = 2;

    if (startDate) {
      query += ` AND timestamp >= $${paramCount}`;
      values.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND timestamp <= $${paramCount}`;
      values.push(endDate);
      paramCount++;
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, values);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM device_data WHERE device_id = $1',
      [deviceId]
    );

    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Get device data error:', error);
    res.status(500).json({ error: 'Failed to fetch device data' });
  }
};

exports.getLatestData = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const result = await pool.query(
      `SELECT * FROM device_data
       WHERE device_id = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [deviceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No data found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get latest data error:', error);
    res.status(500).json({ error: 'Failed to fetch latest data' });
  }
};

exports.getHistoricalData = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { hours = 24 } = req.query;

    const result = await pool.query(
      `SELECT
         timestamp,
         hydrostatic_value,
         pump_1_status,
         pump_2_status,
         power_1_r, power_1_y, power_1_b,
         power_2_r, power_2_y, power_2_b,
         vrms_1_r, vrms_1_y, vrms_1_b,
         vrms_2_r, vrms_2_y, vrms_2_b,
         irms_1_r, irms_1_y, irms_1_b,
         irms_2_r, irms_2_y, irms_2_b,
         frequency
       FROM device_data
       WHERE device_id = $1
       AND timestamp > NOW() - INTERVAL '${parseInt(hours)} hours'
       ORDER BY timestamp ASC`,
      [deviceId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get historical data error:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
};

exports.exportDataCSV = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate } = req.query;

    let query = 'SELECT * FROM device_data WHERE device_id = $1';
    const values = [deviceId];

    if (startDate && endDate) {
      query += ' AND timestamp BETWEEN $2 AND $3';
      values.push(startDate, endDate);
    }

    query += ' ORDER BY timestamp DESC LIMIT 10000';

    const result = await pool.query(query, values);

    const parser = new Parser();
    const csv = parser.parse(result.rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${deviceId}_data.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
};

exports.exportDataPDF = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { startDate, endDate } = req.query;

    let query = 'SELECT * FROM device_data WHERE device_id = $1';
    const values = [deviceId];

    if (startDate && endDate) {
      query += ' AND timestamp BETWEEN $2 AND $3';
      values.push(startDate, endDate);
    }

    query += ' ORDER BY timestamp DESC LIMIT 100';

    const result = await pool.query(query, values);

    const doc = new PDFDocument({
      margin: 30,
      size: 'A4',
      bufferPages: true
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${deviceId}_report.pdf"`);

    doc.pipe(res);

    // Header
    doc.fontSize(18).fillColor('#2563EB').text('StromWater Device Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#6B7280').text(`Device ID: ${deviceId} | Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1);

    // Helper function to draw table
    const drawTable = (doc, data, startY) => {
      const tableTop = startY;
      const itemHeight = 18;
      const margin = doc.page.margins.left;
      const pageWidth = doc.page.width - margin - doc.page.margins.right;

      // Simple column layout
      const colWidth = pageWidth / 9;
      const cols = [
        { x: margin, width: colWidth, label: 'Time' },
        { x: margin + colWidth, width: colWidth, label: 'Level' },
        { x: margin + colWidth * 2, width: colWidth, label: 'P1' },
        { x: margin + colWidth * 3, width: colWidth, label: 'P2' },
        { x: margin + colWidth * 4, width: colWidth, label: 'V1' },
        { x: margin + colWidth * 5, width: colWidth, label: 'V2' },
        { x: margin + colWidth * 6, width: colWidth, label: 'I1' },
        { x: margin + colWidth * 7, width: colWidth, label: 'I2' },
        { x: margin + colWidth * 8, width: colWidth, label: 'Freq' }
      ];

      // Draw header
      doc.fontSize(7).fillColor('#FFFFFF');
      doc.rect(margin, tableTop, pageWidth, itemHeight).fill('#2563EB');

      cols.forEach(col => {
        doc.text(col.label, col.x + 2, tableTop + 5, { width: col.width - 4, align: 'center' });
      });

      // Draw data rows
      let y = tableTop + itemHeight;

      data.forEach((row, i) => {
        // Check for new page
        if (y > doc.page.height - 80) {
          doc.addPage();
          y = 50;
          // Redraw header
          doc.fontSize(7).fillColor('#FFFFFF');
          doc.rect(margin, y, pageWidth, itemHeight).fill('#2563EB');
          cols.forEach(col => {
            doc.text(col.label, col.x + 2, y + 5, { width: col.width - 4, align: 'center' });
          });
          y += itemHeight;
        }

        // Alternating row background
        const bg = i % 2 === 0 ? '#F9FAFB' : '#FFFFFF';
        doc.rect(margin, y, pageWidth, itemHeight).fill(bg);

        // Prepare data
        const time = new Date(row.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const level = (row.hydrostatic_value || 0).toFixed(1);
        const p1 = row.pump_1_status === 'ON' ? 'ON' : 'OFF';
        const p2 = row.pump_2_status === 'ON' ? 'ON' : 'OFF';
        const v1 = `${Math.round(row.vrms_1_r || 0)}/${Math.round(row.vrms_1_y || 0)}/${Math.round(row.vrms_1_b || 0)}`;
        const v2 = `${Math.round(row.vrms_2_r || 0)}/${Math.round(row.vrms_2_y || 0)}/${Math.round(row.vrms_2_b || 0)}`;
        const i1 = `${(row.irms_1_r || 0).toFixed(1)}/${(row.irms_1_y || 0).toFixed(1)}/${(row.irms_1_b || 0).toFixed(1)}`;
        const i2 = `${(row.irms_2_r || 0).toFixed(1)}/${(row.irms_2_y || 0).toFixed(1)}/${(row.irms_2_b || 0).toFixed(1)}`;
        const freq = (row.frequency || 0).toFixed(1);

        const rowData = [time, level, p1, p2, v1, v2, i1, i2, freq];

        // Draw cell data
        doc.fontSize(6).fillColor('#1F2937');
        rowData.forEach((val, idx) => {
          doc.text(val, cols[idx].x + 2, y + 5, { width: cols[idx].width - 4, align: 'center' });
        });

        y += itemHeight;
      });

      // Draw table border
      doc.rect(margin, tableTop, pageWidth, y - tableTop).stroke('#D1D5DB');

      return y;
    };

    // Generate table
    if (result.rows.length > 0) {
      drawTable(doc, result.rows, doc.y);
    } else {
      doc.fontSize(10).fillColor('#6B7280').text('No data available for the selected period', { align: 'center' });
    }

    // Add footer with page numbers
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#9CA3AF');
      doc.text(
        `Page ${i + 1} of ${range.count} | StromWater IoT Platform`,
        30,
        doc.page.height - 50,
        { align: 'center', width: doc.page.width - 60 }
      );
    }

    // Handle doc events
    doc.on('error', (err) => {
      console.error('PDF Document error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'PDF generation failed', details: err.message });
      }
    });

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    console.error('Error stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to export PDF', details: error.message });
    }
  }
};

exports.getDeviceStats = async (req, res) => {
  try {
    const { deviceId} = req.params;
    const { hours = 24 } = req.query;

    const result = await pool.query(
      `SELECT
         COUNT(*) as total_records,
         AVG(hydrostatic_value) as avg_hydrostatic,
         MAX(hydrostatic_value) as max_hydrostatic,
         MIN(hydrostatic_value) as min_hydrostatic,
         AVG(vrms_1_r) as avg_voltage,
         SUM(CASE WHEN pump_1_status = 'ON' THEN 1 ELSE 0 END) as pump_1_on_count,
         SUM(CASE WHEN pump_2_status = 'ON' THEN 1 ELSE 0 END) as pump_2_on_count,
         SUM(CASE WHEN dry_run_alert = 1 THEN 1 ELSE 0 END) as dry_run_count,
         SUM(CASE WHEN high_level_float_alert = 1 THEN 1 ELSE 0 END) as high_level_count
       FROM device_data
       WHERE device_id = $1
       AND timestamp > NOW() - INTERVAL '${parseInt(hours)} hours'`,
      [deviceId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get device stats error:', error);
    res.status(500).json({ error: 'Failed to fetch device stats' });
  }
};

// Create new device
exports.createDevice = async (req, res) => {
  try {
    const { device_id, device_name, location, latitude, longitude } = req.body;

    // Validate required fields
    if (!device_id || !device_name) {
      return res.status(400).json({ error: 'Device ID and name are required' });
    }

    // Check if device already exists
    const existing = await pool.query(
      'SELECT id FROM devices WHERE device_id = $1',
      [device_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Device ID already exists' });
    }

    // Insert new device
    const result = await pool.query(
      `INSERT INTO devices (device_id, device_name, location, latitude, longitude, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW())
       RETURNING *`,
      [device_id, device_name, location, latitude || null, longitude || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create device error:', error);
    res.status(500).json({ error: 'Failed to create device' });
  }
};

// Update device
exports.updateDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { device_name, location, latitude, longitude, is_active } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (device_name !== undefined) {
      updates.push(`device_name = $${paramCount}`);
      values.push(device_name);
      paramCount++;
    }

    if (location !== undefined) {
      updates.push(`location = $${paramCount}`);
      values.push(location);
      paramCount++;
    }

    if (latitude !== undefined) {
      updates.push(`latitude = $${paramCount}`);
      values.push(latitude);
      paramCount++;
    }

    if (longitude !== undefined) {
      updates.push(`longitude = $${paramCount}`);
      values.push(longitude);
      paramCount++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(deviceId);

    const result = await pool.query(
      `UPDATE devices
       SET ${updates.join(', ')}
       WHERE device_id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({ error: 'Failed to update device' });
  }
};

// Delete device (soft delete)
exports.deleteDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const result = await pool.query(
      `UPDATE devices
       SET is_active = false
       WHERE device_id = $1
       RETURNING *`,
      [deviceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({ message: 'Device deleted successfully', device: result.rows[0] });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
};

// Get all devices including inactive (admin only)
exports.getAllDevices = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*,
             dd.timestamp as last_data_timestamp,
             dd.hydrostatic_value as last_hydrostatic_value,
             (SELECT COUNT(*) FROM device_data WHERE device_id = d.device_id) as total_data_count
      FROM devices d
      LEFT JOIN LATERAL (
        SELECT timestamp, hydrostatic_value
        FROM device_data
        WHERE device_id = d.device_id
        ORDER BY timestamp DESC
        LIMIT 1
      ) dd ON true
      ORDER BY d.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get all devices error:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
};
