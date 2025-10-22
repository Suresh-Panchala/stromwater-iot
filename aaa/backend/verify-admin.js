const bcrypt = require('bcryptjs');
const pool = require('./src/config/database');

async function verifyAdmin() {
  try {
    console.log('Checking admin user...\n');

    // Get admin user from database
    const result = await pool.query(
      'SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = $1',
      ['admin']
    );

    if (result.rows.length === 0) {
      console.log('❌ Admin user NOT found in database!');
      console.log('Creating admin user now...\n');

      const hashedPassword = await bcrypt.hash('admin123', 10);
      const insertResult = await pool.query(
        `INSERT INTO users (username, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, username, email, role`,
        ['admin', 'admin@stromwater.com', hashedPassword, 'admin']
      );

      console.log('✅ Admin user created successfully!');
      console.log('User:', insertResult.rows[0]);
      console.log('\nCredentials:');
      console.log('  Username: admin');
      console.log('  Password: admin123');
    } else {
      const user = result.rows[0];
      console.log('✅ Admin user found!');
      console.log('Username:', user.username);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Active:', user.is_active);
      console.log('\nTesting password "admin123"...');

      // Test if password matches
      const isValid = await bcrypt.compare('admin123', user.password_hash);
      console.log('Password matches:', isValid ? '✅ YES' : '❌ NO');

      if (!isValid) {
        console.log('\n🔧 Password mismatch! Resetting password to "admin123"...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await pool.query(
          'UPDATE users SET password_hash = $1 WHERE username = $2',
          [hashedPassword, 'admin']
        );
        console.log('✅ Password reset successfully!');
      }
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyAdmin();
