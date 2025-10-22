# Fresh Deployment - Complete Reinstall

**Time Required**: 20-30 minutes
**Target VPS**: 43.205.194.142

---

## Step 1: Clean VPS (Via AWS Console)

1. **Login to AWS Console**: https://console.aws.amazon.com/
2. **Go to EC2** → Find instance (43.205.194.142)
3. **Click "Connect"** → "EC2 Instance Connect"
4. **Run cleanup commands**:

```bash
# Stop all PM2 processes
pm2 delete all

# Remove old installation
sudo rm -rf /var/www/stromwater

# Clean Nginx config
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/stromwater
sudo rm -f /etc/nginx/sites-available/stromwater

# Reset PostgreSQL
sudo -u postgres psql -c "DROP DATABASE IF EXISTS stromwater_db;"
sudo -u postgres psql -c "DROP USER IF EXISTS stromwater_user;"

# Reset Mosquitto
sudo systemctl stop mosquitto
sudo rm -f /etc/mosquitto/mosquitto.conf
sudo rm -f /etc/mosquitto/passwd

# Clear PM2 logs
pm2 flush

echo "✓ VPS Cleaned!"
```

---

## Step 2: Create Project Structure

```bash
# Create directories
sudo mkdir -p /var/www/stromwater
sudo chown -R ubuntu:ubuntu /var/www/stromwater
cd /var/www/stromwater

echo "✓ Directories created!"
```

---

## Step 3: Upload Project Files

**From Windows**, you'll need to ZIP and upload the project. Since SSH isn't working, we'll use an alternative method.

### Option A: Use Git (Recommended)

**On Windows**:
```bash
cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ

# Initialize git if not already
git init
git add .
git commit -m "Initial commit"

# Push to GitHub (create a repo first)
git remote add origin https://github.com/YOUR_USERNAME/stromwater.git
git push -u origin main
```

**On VPS (AWS Console)**:
```bash
cd /var/www/stromwater
git clone https://github.com/YOUR_USERNAME/stromwater.git .
```

### Option B: Manual Upload via Web

1. Zip the entire project on Windows: `backend/`, `frontend/`
2. Use a file transfer service (e.g., upload to Google Drive)
3. Download on VPS:
```bash
cd /var/www/stromwater
wget "YOUR_DOWNLOAD_LINK" -O project.zip
unzip project.zip
```

---

## Step 4: Install Backend

**On VPS (AWS Console)**:

```bash
cd /var/www/stromwater/backend

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://stromwater_user:stromwater_pass@localhost:5432/stromwater_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345

# MQTT
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=stromwater_mqtt
MQTT_PASSWORD=mqtt123

# Server
PORT=5000
NODE_ENV=production
CORS_ORIGIN=http://43.205.194.142
EOF

# Create PostgreSQL database and user
sudo -u postgres psql << 'SQL'
CREATE USER stromwater_user WITH PASSWORD 'stromwater_pass';
CREATE DATABASE stromwater_db OWNER stromwater_user;
GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;
\c stromwater_db
GRANT ALL ON SCHEMA public TO stromwater_user;
ALTER SCHEMA public OWNER TO stromwater_user;
SQL

# Initialize database schema
node src/scripts/initDatabase.js

# Start backend with PM2
pm2 start src/server.js --name stromwater-backend
pm2 save

echo "✓ Backend installed!"
```

---

## Step 5: Install Frontend

```bash
cd /var/www/stromwater/frontend

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
VITE_API_URL=http://43.205.194.142/api
VITE_WS_URL=ws://43.205.194.142/ws
EOF

# Build for production
npm run build

# Start frontend with PM2
pm2 start npm --name "stromwater-frontend" -- run preview -- --host 0.0.0.0 --port 3000
pm2 save

echo "✓ Frontend installed!"
```

---

## Step 6: Configure Mosquitto MQTT

```bash
# Create Mosquitto config
sudo bash -c 'cat > /etc/mosquitto/mosquitto.conf << EOF
listener 1883 0.0.0.0
allow_anonymous false
password_file /etc/mosquitto/passwd
EOF'

# Create MQTT user
sudo mosquitto_passwd -c -b /etc/mosquitto/passwd stromwater_mqtt mqtt123

# Set permissions
sudo chown mosquitto:mosquitto /etc/mosquitto/passwd
sudo chmod 644 /etc/mosquitto/passwd

# Restart Mosquitto
sudo systemctl restart mosquitto
sudo systemctl enable mosquitto

# Test
mosquitto_pub -h localhost -t test -m "hello" -u stromwater_mqtt -P mqtt123

echo "✓ Mosquitto configured!"
```

---

## Step 7: Configure Nginx

```bash
# Create Nginx config
sudo bash -c 'cat > /etc/nginx/sites-available/stromwater << EOF
server {
    listen 80 default_server;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_read_timeout 86400s;
    }
}
EOF'

# Enable site
sudo ln -sf /etc/nginx/sites-available/stromwater /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "✓ Nginx configured!"
```

---

## Step 8: Configure Firewall

```bash
# Allow HTTP, MQTT, SSH
sudo ufw allow 80/tcp
sudo ufw allow 1883/tcp
sudo ufw allow 1883/udp
sudo ufw allow 22/tcp
sudo ufw reload

echo "✓ Firewall configured!"
```

---

## Step 9: Verify Installation

```bash
# Check all services
echo "=== PM2 Processes ==="
pm2 status

echo ""
echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager

echo ""
echo "=== PostgreSQL Status ==="
sudo systemctl status postgresql --no-pager

echo ""
echo "=== Mosquitto Status ==="
sudo systemctl status mosquitto --no-pager

echo ""
echo "=== Test Login ==="
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

echo ""
echo "=== Health Check ==="
curl http://localhost:5000/health

echo ""
echo "✓ Installation Complete!"
```

---

## Step 10: Test from Windows

1. **Test Login**:
   - Go to: http://43.205.194.142
   - Login: admin / admin123

2. **Test MQTT Simulator**:
   ```
   cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ
   node test-mqtt-both-devices.js
   ```

3. **Verify Dashboard**:
   - Should see device selector
   - Real-time data updating

---

## Quick All-in-One Script

Copy this ENTIRE script and paste into AWS Console terminal:

```bash
#!/bin/bash
set -e

echo "=========================================="
echo "  StromWater Fresh Deployment"
echo "=========================================="

# This assumes your project files are already on the VPS
# You need to upload them first using Git or file transfer

cd /var/www/stromwater/backend
npm install
cat > .env << 'EOF'
DATABASE_URL=postgresql://stromwater_user:stromwater_pass@localhost:5432/stromwater_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=stromwater_mqtt
MQTT_PASSWORD=mqtt123
PORT=5000
NODE_ENV=production
CORS_ORIGIN=http://43.205.194.142
EOF

sudo -u postgres psql << 'SQL'
DROP DATABASE IF EXISTS stromwater_db;
DROP USER IF EXISTS stromwater_user;
CREATE USER stromwater_user WITH PASSWORD 'stromwater_pass';
CREATE DATABASE stromwater_db OWNER stromwater_user;
GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;
\c stromwater_db
GRANT ALL ON SCHEMA public TO stromwater_user;
SQL

node src/scripts/initDatabase.js
pm2 delete stromwater-backend 2>/dev/null || true
pm2 start src/server.js --name stromwater-backend

cd /var/www/stromwater/frontend
npm install
cat > .env << 'EOF'
VITE_API_URL=http://43.205.194.142/api
VITE_WS_URL=ws://43.205.194.142/ws
EOF
npm run build
pm2 delete stromwater-frontend 2>/dev/null || true
pm2 start npm --name "stromwater-frontend" -- run preview -- --host 0.0.0.0 --port 3000

sudo bash -c 'cat > /etc/mosquitto/mosquitto.conf << EOF
listener 1883 0.0.0.0
allow_anonymous false
password_file /etc/mosquitto/passwd
EOF'
sudo mosquitto_passwd -c -b /etc/mosquitto/passwd stromwater_mqtt mqtt123
sudo chown mosquitto:mosquitto /etc/mosquitto/passwd
sudo chmod 644 /etc/mosquitto/passwd
sudo systemctl restart mosquitto

sudo ufw allow 80/tcp
sudo ufw allow 1883/tcp
sudo ufw allow 1883/udp
sudo ufw reload

pm2 save

echo ""
echo "=========================================="
echo "  ✓ Deployment Complete!"
echo "=========================================="
echo ""
echo "Test login:"
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'
echo ""
```

---

**Total Time**: ~20 minutes
**Result**: Clean, working installation ready for your submission! 🚀
