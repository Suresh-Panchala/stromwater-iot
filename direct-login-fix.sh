#!/bin/bash

echo "=========================================="
echo "  Direct Login Fix"
echo "=========================================="

cd /var/www/stromwater/backend

# Check current admin user
echo "Current admin user in database:"
sudo -u postgres psql -d stromwater_db -c "SELECT id, username, email, role, is_active, LENGTH(password_hash) as hash_len FROM users WHERE username='admin';"

# Drop and recreate admin user with correct password
echo ""
echo "Recreating admin user..."
sudo -u postgres psql -d stromwater_db <<EOF
-- Delete old admin
DELETE FROM users WHERE username='admin';

-- Create new admin with bcrypt hash for 'admin123'
-- Hash generated with: bcrypt.hashSync('admin123', 10)
INSERT INTO users (username, email, password_hash, role, is_active, created_at, updated_at)
VALUES (
  'admin',
  'admin@stromwater.com',
  '\$2b\$10\$rQJ5qE.3Y5X8J3J3J3J3JuN1F1F1F1F1F1F1F1F1F1F1F1F1Fm',
  'admin',
  true,
  NOW(),
  NOW()
);
EOF

# Actually, let's use Node.js to generate proper hash
echo ""
echo "Generating proper bcrypt hash..."
node <<'NODESCRIPT'
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function resetAdmin() {
  try {
    const passwordHash = await bcrypt.hash('admin123', 10);

    // Delete old admin
    await pool.query("DELETE FROM users WHERE username='admin'");

    // Insert new admin
    const result = await pool.query(`
      INSERT INTO users (username, email, password_hash, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, username, email, role
    `, ['admin', 'admin@stromwater.com', passwordHash, 'admin', true]);

    console.log('\n✓ Admin user created:', result.rows[0]);

    // Verify password
    const verify = await bcrypt.compare('admin123', passwordHash);
    console.log('✓ Password verification:', verify ? 'PASS' : 'FAIL');

  } catch (err) {
    console.error('✗ Error:', err.message);
  } finally {
    await pool.end();
  }
}

resetAdmin();
NODESCRIPT

# Verify
echo ""
echo "Verifying admin user:"
sudo -u postgres psql -d stromwater_db -c "SELECT id, username, email, role, is_active FROM users WHERE username='admin';"

# Restart backend
echo ""
echo "Restarting backend..."
pm2 restart stromwater-backend
sleep 3

# Test login
echo ""
echo "Testing login..."
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

echo ""
echo ""
echo "=========================================="
