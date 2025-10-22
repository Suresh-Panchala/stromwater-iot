#!/bin/bash
# Quick fix for login - reinitialize admin user

echo "Fixing login..."

cd /var/www/stromwater/backend

# Reinitialize database
node src/scripts/initDatabase.js

# Restart backend
pm2 restart stromwater-backend

echo ""
echo "Waiting 3 seconds..."
sleep 3

echo ""
echo "Testing login..."
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

echo ""
echo ""
echo "If you see a token above, login is fixed!"
echo "Open http://43.205.194.142 and login with: admin / admin123"
