const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const initDatabase = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      );
    `);

    // Create devices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(100) UNIQUE NOT NULL,
        device_name VARCHAR(100),
        location VARCHAR(200),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP
      );
    `);

    // Create device_data table with partitioning support
    await client.query(`
      CREATE TABLE IF NOT EXISTS device_data (
        id BIGSERIAL PRIMARY KEY,
        device_id VARCHAR(100) NOT NULL,
        location VARCHAR(200),
        timestamp TIMESTAMP NOT NULL,
        hydrostatic_value DECIMAL(10, 2),
        dry_run_alert INTEGER,
        high_level_float_alert INTEGER,
        pump_1_manual INTEGER,
        pump_2_manual INTEGER,
        pump_1_auto INTEGER,
        pump_2_auto INTEGER,
        pump_1_protection INTEGER,
        pump_2_protection INTEGER,
        pump_1_contactor_feedback INTEGER,
        pump_2_contactor_feedback INTEGER,
        power_1_r DECIMAL(10, 2),
        power_1_y DECIMAL(10, 2),
        power_1_b DECIMAL(10, 2),
        irms_1_r DECIMAL(10, 2),
        irms_1_y DECIMAL(10, 2),
        irms_1_b DECIMAL(10, 2),
        power_2_r DECIMAL(10, 2),
        power_2_y DECIMAL(10, 2),
        power_2_b DECIMAL(10, 2),
        irms_2_r DECIMAL(10, 2),
        irms_2_y DECIMAL(10, 2),
        irms_2_b DECIMAL(10, 2),
        vrms_1_r DECIMAL(10, 2),
        vrms_1_y DECIMAL(10, 2),
        vrms_1_b DECIMAL(10, 2),
        vrms_2_r DECIMAL(10, 2),
        vrms_2_y DECIMAL(10, 2),
        vrms_2_b DECIMAL(10, 2),
        vahr_1_r INTEGER,
        vahr_1_y INTEGER,
        vahr_1_b INTEGER,
        vahr_2_r INTEGER,
        vahr_2_y INTEGER,
        vahr_2_b INTEGER,
        freq_1_r DECIMAL(5, 2),
        freq_1_y DECIMAL(5, 2),
        freq_1_b DECIMAL(5, 2),
        freq_2_r DECIMAL(5, 2),
        freq_2_y DECIMAL(5, 2),
        freq_2_b DECIMAL(5, 2),
        rhs_1 INTEGER,
        rhs_2 INTEGER,
        raw_json JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create alerts table
    await client.query(`
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
    `);

    // Create refresh_tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for optimal query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_device_data_device_id
      ON device_data(device_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_device_data_timestamp
      ON device_data(timestamp DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_device_data_device_timestamp
      ON device_data(device_id, timestamp DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_alerts_device_id
      ON alerts(device_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_alerts_timestamp
      ON alerts(timestamp DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id
      ON refresh_tokens(user_id);
    `);

    // Create default admin user (username: admin, password: admin123)
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ('admin', 'admin@stromwater.com', $1, 'admin')
      ON CONFLICT (username) DO NOTHING;
    `, [hashedPassword]);

    // Insert sample device
    await client.query(`
      INSERT INTO devices (device_id, device_name, location, latitude, longitude)
      VALUES ('StromWater_Device_1', 'Khusam Pump Station', 'khusam', 25.276987, 55.296249)
      ON CONFLICT (device_id) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('Database initialized successfully!');
    console.log('Default admin credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('Please change the password after first login!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
};

initDatabase();
