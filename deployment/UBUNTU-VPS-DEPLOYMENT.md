# StromWater IoT Platform - Ubuntu VPS Deployment Guide

Complete guide for deploying the StromWater IoT monitoring platform to Ubuntu VPS.

---

## Prerequisites

- Ubuntu Server 20.04 LTS or 22.04 LTS
- Root or sudo access
- VPS with minimum 2GB RAM, 2 CPU cores, 20GB storage
- Domain name (optional, for SSL)
- SSH access to the server

---

## Deployment Overview

```
┌─────────────────────────────────────────────┐
│          Internet (Port 80/443)             │
└────────────────┬────────────────────────────┘
                 │
         ┌───────▼────────┐
         │     Nginx      │ (Reverse Proxy + SSL)
         │   Port 80/443  │
         └───────┬────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
┌─────▼──────┐      ┌──────▼──────┐
│  Frontend  │      │   Backend   │
│ (Vite Build)│     │  (Node.js)  │
│  Port 3000  │      │  Port 5000  │
└────────────┘      └──────┬───────┘
                           │
                 ┌─────────┴─────────┐
                 │                   │
          ┌──────▼──────┐    ┌──────▼──────┐
          │  PostgreSQL │    │  Mosquitto  │
          │  Port 5432  │    │  Port 1883  │
          └─────────────┘    └─────────────┘
```

---

## Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip
# or
ssh username@your-vps-ip
```

---

## Step 2: System Update

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl git build-essential wget
```

---

## Step 3: Install Node.js (v18 LTS)

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show v9.x.x or higher
```

---

## Step 4: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo systemctl status postgresql
```

### Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL shell, run:
CREATE DATABASE stromwater_db;
CREATE USER stromwater_user WITH PASSWORD 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;
\q
```

---

## Step 5: Install Mosquitto MQTT Broker

```bash
# Install Mosquitto
sudo apt install -y mosquitto mosquitto-clients

# Start Mosquitto service
sudo systemctl start mosquitto
sudo systemctl enable mosquitto

# Verify installation
sudo systemctl status mosquitto
```

### Configure Mosquitto

```bash
# Edit Mosquitto config
sudo nano /etc/mosquitto/mosquitto.conf
```

Add these lines:

```conf
listener 1883
allow_anonymous false
password_file /etc/mosquitto/passwd
```

Create MQTT user:

```bash
# Create password file
sudo mosquitto_passwd -c /etc/mosquitto/passwd stromwater

# Restart Mosquitto
sudo systemctl restart mosquitto
```

---

## Step 6: Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installation
sudo systemctl status nginx
```

---

## Step 7: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs (copy and run it)
```

---

## Step 8: Clone/Upload Your Project

**Option A: From Git (Recommended)**

```bash
# Navigate to web directory
cd /var/www

# Clone your repository
sudo git clone https://github.com/yourusername/stromwater-iot.git stromwater
cd stromwater
```

**Option B: Upload via SCP (from Windows)**

On Windows:
```cmd
scp -r C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ username@your-vps-ip:/var/www/stromwater
```

---

## Step 9: Configure Environment Variables

```bash
cd /var/www/stromwater

# Create production .env for backend
nano backend/.env
```

**Backend `.env` file:**

```env
# Server
NODE_ENV=production
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stromwater_db
DB_USER=stromwater_user
DB_PASSWORD=YOUR_STRONG_PASSWORD

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# MQTT
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=stromwater
MQTT_PASSWORD=your_mqtt_password

# WebSocket
WS_PORT=5001

# Email (Optional - Configure later)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Telegram (Optional - Configure later)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id
```

Save and exit (Ctrl+X, Y, Enter)

---

## Step 10: Install Dependencies & Build

```bash
cd /var/www/stromwater

# Install backend dependencies
cd backend
npm install --production
cd ..

# Install frontend dependencies and build
cd frontend
npm install
npm run build
cd ..
```

---

## Step 11: Initialize Database

```bash
cd /var/www/stromwater/backend

# Run database initialization
node src/scripts/initDatabase.js
```

You should see:
```
Database initialized successfully!
Default admin credentials:
  Username: admin
  Password: admin123
```

---

## Step 12: Configure PM2

Create PM2 ecosystem file:

```bash
nano /var/www/stromwater/ecosystem.config.js
```

Paste this configuration:

```javascript
module.exports = {
  apps: [
    {
      name: 'stromwater-backend',
      cwd: '/var/www/stromwater/backend',
      script: 'src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/stromwater/backend-error.log',
      out_file: '/var/log/stromwater/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'stromwater-frontend',
      cwd: '/var/www/stromwater/frontend',
      script: 'npx',
      args: 'vite preview --port 3000 --host',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/stromwater/frontend-error.log',
      out_file: '/var/log/stromwater/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
```

Create log directory:

```bash
sudo mkdir -p /var/log/stromwater
sudo chown -R $USER:$USER /var/log/stromwater
```

---

## Step 13: Start Application with PM2

```bash
cd /var/www/stromwater

# Start all applications
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs

# Save PM2 configuration
pm2 save
```

You should see both apps running:
```
┌─────┬───────────────────────┬─────────┬─────────┐
│ id  │ name                  │ status  │ restart │
├─────┼───────────────────────┼─────────┼─────────┤
│ 0   │ stromwater-backend    │ online  │ 0       │
│ 1   │ stromwater-frontend   │ online  │ 0       │
└─────┴───────────────────────┴─────────┴─────────┘
```

---

## Step 14: Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/stromwater
```

**Basic Configuration (HTTP only):**

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    # Or use: server_name your-vps-ip;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/stromwater-access.log;
    error_log /var/log/nginx/stromwater-error.log;
}
```

Enable the site:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/stromwater /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Step 15: Configure Firewall

```bash
# Install UFW if not installed
sudo apt install -y ufw

# Allow SSH (IMPORTANT!)
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Allow MQTT (for external devices)
sudo ufw allow 1883/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 16: Install SSL Certificate (Optional but Recommended)

If you have a domain name:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts
# Certbot will automatically update Nginx configuration
```

Certbot will add SSL configuration and auto-renew certificates.

---

## Step 17: Update Frontend API URL

```bash
nano /var/www/stromwater/frontend/.env
```

Update to production URL:

```env
VITE_API_URL=https://your-domain.com/api
# Or without SSL: VITE_API_URL=http://your-vps-ip/api
```

Rebuild frontend:

```bash
cd /var/www/stromwater/frontend
npm run build

# Restart frontend
pm2 restart stromwater-frontend
```

---

## Step 18: Test Deployment

### Test Backend API

```bash
# Test health endpoint (no authentication required)
curl http://localhost:5000/health
# Should return: {"status":"OK","timestamp":"...","mqtt":{...}}

# Test API endpoint (will return error - that's expected!)
curl http://localhost:5000/api/auth/login
# Should return error (proves API is working)
```

### Test Frontend

```bash
curl http://localhost:3000
# Should return HTML
```

### Test from Browser

```
http://your-domain.com
# or
http://your-vps-ip
```

You should see the login page!

---

## Step 19: Configure IoT Devices

Update your IoT devices to publish to:

**MQTT Broker:** `your-vps-ip:1883` (or domain)
**Username:** `stromwater`
**Password:** `your_mqtt_password`
**Topic:** `devices/StromWater_Device_1/data`

---

## Monitoring & Maintenance

### View Application Logs

```bash
# View all logs
pm2 logs

# View specific app
pm2 logs stromwater-backend
pm2 logs stromwater-frontend

# View Nginx logs
sudo tail -f /var/log/nginx/stromwater-access.log
sudo tail -f /var/log/nginx/stromwater-error.log
```

### Restart Applications

```bash
# Restart all
pm2 restart all

# Restart specific app
pm2 restart stromwater-backend
pm2 restart stromwater-frontend
```

### Update Application

```bash
cd /var/www/stromwater

# Pull latest code (if using Git)
git pull

# Update backend
cd backend
npm install --production
pm2 restart stromwater-backend

# Update frontend
cd ../frontend
npm install
npm run build
pm2 restart stromwater-frontend
```

### Database Backup

```bash
# Create backup
pg_dump -U stromwater_user stromwater_db > /var/backups/stromwater_$(date +%Y%m%d).sql

# Restore backup
psql -U stromwater_user stromwater_db < /var/backups/stromwater_20251021.sql
```

---

## Troubleshooting

### Backend not starting?

```bash
# Check logs
pm2 logs stromwater-backend

# Common issues:
# 1. Database connection - check .env credentials
# 2. Port already in use - check: sudo lsof -i :5000
# 3. Missing dependencies - run: npm install
```

### Frontend showing blank page?

```bash
# Check if API URL is correct in frontend/.env
# Rebuild: npm run build
# Check browser console for errors
```

### MQTT not connecting?

```bash
# Check Mosquitto status
sudo systemctl status mosquitto

# Test MQTT locally
mosquitto_sub -h localhost -t devices/# -u stromwater -P your_mqtt_password

# Check firewall
sudo ufw status
```

### Cannot access from browser?

```bash
# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Check firewall
sudo ufw status

# Check if apps are running
pm2 status
```

---

## Security Checklist

- [ ] Changed default admin password
- [ ] Strong PostgreSQL password
- [ ] Firewall (UFW) enabled
- [ ] SSL certificate installed
- [ ] MQTT authentication enabled
- [ ] Regular backups configured
- [ ] SSH key authentication (disable password login)
- [ ] Fail2ban installed (optional)
- [ ] Automatic security updates enabled

---

## Performance Optimization

### Enable Gzip in Nginx

Edit `/etc/nginx/nginx.conf`:

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### PostgreSQL Tuning

Edit `/etc/postgresql/[version]/main/postgresql.conf`:

```conf
shared_buffers = 256MB
effective_cache_size = 1GB
max_connections = 100
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

---

## Quick Command Reference

```bash
# PM2
pm2 status                    # Check app status
pm2 logs                      # View logs
pm2 restart all               # Restart all apps
pm2 monit                     # Monitor resources

# Nginx
sudo systemctl restart nginx  # Restart Nginx
sudo nginx -t                 # Test configuration
sudo tail -f /var/log/nginx/  # View logs

# PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql

# Mosquitto
sudo systemctl status mosquitto
sudo systemctl restart mosquitto
```

---

## Next Steps After Deployment

1. **Change admin password** immediately
2. **Set up email alerts** (configure nodemailer)
3. **Set up Telegram notifications** (optional)
4. **Configure automatic backups** (cron job)
5. **Monitor system resources** (htop, pm2 monit)
6. **Add more devices** as needed

---

**Deployment complete! Your StromWater IoT platform is now running in production!** 🎉
