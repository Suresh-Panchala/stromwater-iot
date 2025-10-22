#!/bin/bash

echo "==========================================="
echo "  Fix StromWater Login Issue"
echo "==========================================="
echo ""

# Step 1: Reinitialize database with admin user
echo "Step 1: Reinitializing database with admin user..."
cd /var/www/stromwater/backend
node src/scripts/initDatabase.js

# Step 2: Verify admin user exists
echo ""
echo "Step 2: Verifying admin user in database..."
sudo -u postgres psql -d stromwater_db -c "SELECT id, username, email, role, is_active FROM users;"

# Step 3: Restart backend to clear any cached sessions
echo ""
echo "Step 3: Restarting backend..."
pm2 restart stromwater-backend

# Step 4: Wait for backend to start
echo "Waiting 5 seconds for backend to initialize..."
sleep 5

# Step 5: Test login endpoint
echo ""
echo "Step 4: Testing login endpoint..."
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq .

# Step 6: Check health
echo ""
echo "Step 5: Checking system health..."
curl -s http://localhost:5000/health | jq .

echo ""
echo "==========================================="
echo "  Fix Complete!"
echo "==========================================="
echo ""
echo "Try logging in with:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "Dashboard: http://43.205.194.142"
echo ""
