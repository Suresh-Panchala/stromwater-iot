# StromWater IoT - Quick Deployment Guide

**5-Minute Deployment Reference** - For experienced users

---

## IMPORTANT: Choose Your Deployment Type

🔹 **Have a domain name?** → Follow steps below
🔹 **Only have IP address?** → See **[IP-BASED-DEPLOYMENT.md](IP-BASED-DEPLOYMENT.md)**

---

## Prerequisites Ready?

- ✅ Ubuntu VPS (2GB RAM, 2 CPU)
- ✅ Root/sudo access
- ✅ Domain name (optional)

---

## Copy-Paste Commands

### 1. Initial Setup (2 minutes)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs postgresql postgresql-contrib mosquitto mosquitto-clients nginx build-essential

# Install PM2
sudo npm install -g pm2
```

### 2. Configure Services (2 minutes)

```bash
# PostgreSQL
sudo -u postgres psql -c "CREATE DATABASE stromwater_db;"
sudo -u postgres psql -c "CREATE USER stromwater_user WITH PASSWORD 'YOUR_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;"

# Mosquitto
echo "listener 1883" | sudo tee -a /etc/mosquitto/mosquitto.conf
echo "allow_anonymous false" | sudo tee -a /etc/mosquitto/mosquitto.conf
echo "password_file /etc/mosquitto/passwd" | sudo tee -a /etc/mosquitto/mosquitto.conf
sudo mosquitto_passwd -c /etc/mosquitto/passwd stromwater
sudo systemctl restart mosquitto
```

### 3. Deploy Application (3 minutes)

```bash
# Create directory
sudo mkdir -p /var/www/stromwater
cd /var/www/stromwater

# Upload your files here (via SCP or Git)
# If using Git:
# sudo git clone YOUR_REPO_URL .

# Backend setup
cd backend
npm install --production
cp /path/to/.env.production .env  # Edit with your values
node src/scripts/initDatabase.js

# Frontend setup
cd ../frontend
npm install
npm run build

# Create logs
sudo mkdir -p /var/log/stromwater
sudo chown -R $USER:$USER /var/log/stromwater
```

### 4. Start with PM2 (1 minute)

```bash
cd /var/www/stromwater
pm2 start deployment/ecosystem.config.js
pm2 save
pm2 startup  # Follow the command it outputs
```

### 5. Configure Nginx (1 minute)

```bash
sudo cp deployment/nginx.conf /etc/nginx/sites-available/stromwater
# Edit the file and replace YOUR_DOMAIN
sudo nano /etc/nginx/sites-available/stromwater

sudo ln -s /etc/nginx/sites-available/stromwater /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Firewall (30 seconds)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 1883/tcp
sudo ufw --force enable
```

### 7. SSL (Optional, 2 minutes)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## Verify Deployment

```bash
# Check services
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status mosquitto

# Test
curl http://localhost:5000/api/health
# Should return: {"status":"ok"}

# View logs
pm2 logs
```

---

## Access Your Application

**HTTP:** `http://YOUR_VPS_IP`
**HTTPS:** `https://your-domain.com`

**Login:**
Username: `admin`
Password: `admin123` (Change immediately!)

---

## Common Issues

**Backend won't start?**
```bash
pm2 logs stromwater-backend
# Check database password in backend/.env
```

**Can't access website?**
```bash
sudo ufw status  # Check firewall
sudo nginx -t    # Check Nginx config
```

**MQTT not working?**
```bash
sudo systemctl status mosquitto
mosquitto_sub -h localhost -t test -u stromwater -P YOUR_PASSWORD
```

---

## Important Files

- **Backend .env:** `/var/www/stromwater/backend/.env`
- **PM2 Config:** `/var/www/stromwater/deployment/ecosystem.config.js`
- **Nginx Config:** `/etc/nginx/sites-available/stromwater`
- **Logs:** `/var/log/stromwater/`

---

## Maintenance Commands

```bash
# Restart all
pm2 restart all

# View logs
pm2 logs

# Update code
cd /var/www/stromwater
git pull
cd backend && npm install --production
cd ../frontend && npm install && npm run build
pm2 restart all

# Backup database
pg_dump -U stromwater_user stromwater_db > backup.sql
```

---

**Done!** Your StromWater IoT Platform is now running in production! 🚀

For detailed instructions, see: `UBUNTU-VPS-DEPLOYMENT.md`
For complete checklist, see: `DEPLOYMENT-CHECKLIST.md`
