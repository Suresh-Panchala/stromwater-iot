#!/bin/bash

echo "=========================================="
echo "  StromWater Login Diagnosis & Fix"
echo "=========================================="
echo ""

# Step 1: Check if users table exists and what's in it
echo "Step 1: Checking users table..."
sudo -u postgres psql -d stromwater_db -c "SELECT id, username, email, role, is_active FROM users;" 2>&1

# Step 2: Check backend logs for authentication errors
echo ""
echo "Step 2: Recent backend logs (last 30 lines)..."
pm2 logs stromwater-backend --lines 30 --nostream 2>&1 | tail -30

# Step 3: Test database connection from backend
echo ""
echo "Step 3: Testing database connection..."
cd /var/www/stromwater/backend
node -e "
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT COUNT(*) FROM users')
  .then(res => console.log('DB Connection: OK, Users count:', res.rows[0].count))
  .catch(err => console.error('DB Connection Error:', err.message))
  .finally(() => pool.end());
" 2>&1

# Step 4: Reinitialize database with admin user
echo ""
echo "Step 4: Reinitializing database..."
cd /var/www/stromwater/backend
node src/scripts/initDatabase.js 2>&1

# Step 5: Verify admin user was created
echo ""
echo "Step 5: Verifying admin user..."
sudo -u postgres psql -d stromwater_db -c "SELECT id, username, email, role, is_active FROM users WHERE username='admin';" 2>&1

# Step 6: Test password hash
echo ""
echo "Step 6: Checking password hash exists..."
sudo -u postgres psql -d stromwater_db -c "SELECT username, LENGTH(password_hash) as hash_length FROM users WHERE username='admin';" 2>&1

# Step 7: Restart backend
echo ""
echo "Step 7: Restarting backend..."
pm2 restart stromwater-backend
sleep 3

# Step 8: Test login endpoint
echo ""
echo "Step 8: Testing login endpoint..."
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  2>&1

echo ""
echo ""
echo "=========================================="
echo "  Diagnosis Complete"
echo "=========================================="
