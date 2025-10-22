# Quick Fresh Deployment Guide

**Time**: 15-20 minutes
**VPS**: 43.205.194.142

---

## Part 1: Deploy Backend (AWS Console)

### 1. Access VPS
- Login to AWS Console: https://console.aws.amazon.com/
- EC2 → Instances → Find 43.205.194.142
- Click "Connect" → "EC2 Instance Connect"

### 2. Download deployment script
```bash
cd ~
wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/deploy-complete.sh
# OR upload the script manually
```

### 3. Run backend deployment
```bash
chmod +x deploy-complete.sh
./deploy-complete.sh
```

This script will:
- Clean old installation
- Setup PostgreSQL database
- Configure Mosquitto MQTT
- Deploy backend code
- Configure Nginx
- Setup firewall

**Wait for**: "✓ Backend Deployment Complete!"

---

## Part 2: Deploy Frontend

### Option A: Upload via file transfer (Since SSH not working)

1. **Zip the frontend dist folder on Windows**:
   ```
   C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ\frontend\dist\
   ```
   Right-click → Send to → Compressed folder
   Name it: `frontend-dist.zip`

2. **Upload to a file sharing service** (Google Drive, Dropbox, etc.)

3. **Download on VPS** (in AWS Console terminal):
   ```bash
   cd /var/www/stromwater
   mkdir -p frontend
   cd frontend

   # Download your uploaded file
   wget "YOUR_DOWNLOAD_LINK" -O frontend-dist.zip

   # Extract
   unzip frontend-dist.zip
   mv dist/* .
   rmdir dist

   # Serve with a simple HTTP server
   npm install -g serve
   pm2 start "serve -s . -l 3000" --name stromwater-frontend
   pm2 save
   ```

### Option B: Rebuild on VPS (Faster if project is already there)

If you can get your project files to VPS somehow:

```bash
cd /var/www/stromwater/frontend

# Create .env
cat > .env << EOF
VITE_API_URL=http://43.205.194.142/api
VITE_WS_URL=ws://43.205.194.142/ws
EOF

# Install and build
npm install
npm run build

# Serve
npm install -g serve
pm2 delete stromwater-frontend 2>/dev/null || true
pm2 start "serve -s dist -l 3000" --name stromwater-frontend
pm2 save
```

---

## Part 3: Verify Installation

### On VPS (AWS Console):

```bash
# Check all services
pm2 status

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Should return a JWT token!
```

### From Windows:

1. **Open browser**: http://43.205.194.142
2. **Login**: admin / admin123
3. **Run simulator**:
   ```
   cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ
   node test-mqtt-both-devices.js
   ```
4. **Verify**: Dashboard shows devices and real-time data!

---

## Troubleshooting

### Backend not responding?
```bash
pm2 logs stromwater-backend
pm2 restart stromwater-backend
```

### Frontend not loading?
```bash
pm2 logs stromwater-frontend
pm2 restart stromwater-frontend
```

### MQTT not connecting?
```bash
sudo systemctl status mosquitto
mosquitto_pub -h localhost -t test -m "hello" -u stromwater_mqtt -P mqtt123
```

### Database errors?
```bash
sudo -u postgres psql -d stromwater_db -c "SELECT COUNT(*) FROM users;"
```

---

## Fastest Method (Recommended)

Since you need this done quickly and SSH isn't working, here's the ABSOLUTE FASTEST way:

### Step 1: Prepare files on Windows

Create a single ZIP file with everything:

```
stromwater-deploy.zip
├── backend/
│   ├── src/
│   ├── package.json
│   └── .env
└── frontend/
    └── dist/
```

### Step 2: Upload to Google Drive/Dropbox

Get a direct download link.

### Step 3: On VPS (one command)

```bash
cd ~ && \
wget "YOUR_DOWNLOAD_LINK" -O deploy.zip && \
unzip -o deploy.zip -d /var/www/stromwater && \
cd /var/www/stromwater && \
chmod +x deploy-complete.sh && \
./deploy-complete.sh
```

Done in 5 minutes!

---

## Credentials

**Dashboard Login**:
- URL: http://43.205.194.142
- Username: admin
- Password: admin123

**MQTT**:
- Broker: 43.205.194.142:1883
- Username: stromwater_mqtt
- Password: mqtt123

---

**You'll be ready to submit in 20 minutes!** 🚀
