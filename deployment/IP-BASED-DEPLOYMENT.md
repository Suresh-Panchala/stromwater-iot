# StromWater IoT - IP-Based Deployment (No Domain Required)

Complete guide for deploying using only your VPS IP address (without domain name).

---

## What's Different?

When using IP address instead of domain:
- ✅ No SSL/HTTPS (HTTP only)
- ✅ Simpler Nginx configuration
- ✅ No domain DNS setup needed
- ✅ No SSL certificate needed
- ⚠️ Browser security warnings for HTTP
- ⚠️ Cannot use automatic SSL (Let's Encrypt requires domain)

---

## Prerequisites

- Ubuntu Server 20.04 or 22.04 LTS
- Root or sudo access
- VPS IP address (e.g., 123.45.67.89)
- Minimum 2GB RAM, 2 CPU cores, 20GB storage

---

## Quick Deployment Steps

Follow the main deployment guide **[UBUNTU-VPS-DEPLOYMENT.md](UBUNTU-VPS-DEPLOYMENT.md)** but with these changes:

---

## Changes for IP-Based Deployment

### 1. Nginx Configuration (Step 14)

Instead of the domain-based configuration, use this:

```bash
sudo nano /etc/nginx/sites-available/stromwater
```

**Paste this IP-based configuration:**

```nginx
server {
    listen 80;
    server_name _;  # Accept any hostname/IP

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/stromwater-access.log;
    error_log /var/log/nginx/stromwater-error.log;

    # Frontend (Vite Preview via PM2 on port 3000)
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

    # API Proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeout for large exports
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # WebSocket Proxy
    location /ws {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000;
        access_log off;
    }

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/stromwater /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

### 2. Frontend Environment (Step 17)

Update frontend to use your VPS IP:

```bash
nano /var/www/stromwater/frontend/.env
```

**Use your actual VPS IP address:**

```env
VITE_API_URL=http://YOUR_VPS_IP/api
VITE_WS_URL=ws://YOUR_VPS_IP/ws
```

**Example:**
```env
VITE_API_URL=http://123.45.67.89/api
VITE_WS_URL=ws://123.45.67.89/ws
```

Rebuild frontend:

```bash
cd /var/www/stromwater/frontend
npm run build
pm2 restart stromwater-frontend
```

---

### 3. Backend Environment Configuration

Update backend `.env` CORS settings:

```bash
nano /var/www/stromwater/backend/.env
```

Set CORS to allow your IP:

```env
CORS_ORIGIN=http://YOUR_VPS_IP
# Example: CORS_ORIGIN=http://123.45.67.89

# Or allow all (less secure, but easier for testing):
CORS_ORIGIN=*
```

Restart backend:

```bash
pm2 restart stromwater-backend
```

---

### 4. Skip SSL/Certificate Steps

**SKIP THESE STEPS from main guide:**
- ❌ Step 16: Install SSL Certificate - Not needed for IP-based
- ❌ HTTPS configuration - HTTP only
- ❌ Certbot installation - Not needed

---

### 5. Access Your Application

Open browser and navigate to:

```
http://YOUR_VPS_IP
```

**Example:**
```
http://123.45.67.89
```

**Login credentials:**
- Username: `admin`
- Password: `admin123`

---

### 6. Configure IoT Devices

Update your IoT device configuration:

**MQTT Broker:** `YOUR_VPS_IP:1883`
**Username:** `stromwater`
**Password:** `your_mqtt_password` (from .env)
**Topic:** `devices/StromWater_Device_1/data`

**Example MQTT Configuration:**
```javascript
const client = mqtt.connect('mqtt://123.45.67.89:1883', {
  username: 'stromwater',
  password: 'your_mqtt_password'
});
```

---

## Complete Step-by-Step Guide

### Follow these steps in order:

1. **Steps 1-13** from [UBUNTU-VPS-DEPLOYMENT.md](UBUNTU-VPS-DEPLOYMENT.md) - No changes
2. **Step 14**: Use **IP-based Nginx config** from above ⬆️
3. **Steps 15**: Firewall - No changes
4. **Step 16**: ❌ **SKIP** SSL certificate installation
5. **Step 17**: Use **IP-based frontend .env** from above ⬆️
6. **Step 18**: Test with `http://YOUR_VPS_IP`
7. **Step 19**: Configure devices with `YOUR_VPS_IP:1883`

---

## Testing Deployment

### 1. Test Backend API

```bash
# From VPS - Test health endpoint
curl http://localhost:5000/health

# From your computer - Test health endpoint
curl http://YOUR_VPS_IP/health

# Test login endpoint (should return error without credentials - this is good!)
curl http://YOUR_VPS_IP/api/auth/login
```

**Expected responses:**

✅ Health endpoint: `{"status":"OK","timestamp":"...","mqtt":{...}}`

✅ Login endpoint: `{"error":"Invalid credentials"}` or similar (proves API is working!)

### 2. Test Frontend

```bash
# From VPS
curl http://localhost:3000

# From your computer (browser)
http://YOUR_VPS_IP
```

Should show the login page.

### 3. Test MQTT Connection

From your local Windows machine:

```bash
# Test publishing
node test-mqtt-device1.js
```

Update the MQTT broker URL in `test-mqtt-device1.js`:

```javascript
const client = mqtt.connect('mqtt://YOUR_VPS_IP:1883', {
  username: 'stromwater',
  password: 'your_mqtt_password'
});
```

---

## Firewall Configuration

Make sure these ports are open:

```bash
sudo ufw status

# You should see:
# 22/tcp    ALLOW   (SSH)
# 80/tcp    ALLOW   (HTTP)
# 1883/tcp  ALLOW   (MQTT)
```

---

## Troubleshooting

### Cannot access from browser?

1. **Check VPS firewall:**
   ```bash
   sudo ufw status
   sudo ufw allow 80/tcp
   ```

2. **Check cloud provider firewall:**
   - AWS: Security Groups
   - DigitalOcean: Firewall rules
   - Azure: Network Security Groups
   - Ensure ports 80 and 1883 are open

3. **Check Nginx:**
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```

4. **Check apps are running:**
   ```bash
   pm2 status
   # Both apps should show "online"
   ```

### MQTT not connecting from devices?

1. **Check Mosquitto:**
   ```bash
   sudo systemctl status mosquitto
   ```

2. **Test locally first:**
   ```bash
   mosquitto_sub -h localhost -t devices/# -u stromwater -P your_mqtt_password
   ```

3. **Check firewall:**
   ```bash
   sudo ufw allow 1883/tcp
   ```

4. **Check from external:**
   ```bash
   mosquitto_sub -h YOUR_VPS_IP -t devices/# -u stromwater -P your_mqtt_password
   ```

### Dashboard shows blank page?

1. **Check browser console** (F12)
2. **Verify API URL** in frontend/.env
3. **Check CORS** in backend/.env
4. **Rebuild frontend:**
   ```bash
   cd /var/www/stromwater/frontend
   npm run build
   pm2 restart stromwater-frontend
   ```

---

## Upgrading to Domain + SSL Later

When you get a domain name:

1. **Update DNS** records to point to your VPS IP
2. **Update Nginx** config with your domain
3. **Install SSL** certificate:
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```
4. **Update frontend .env** to use `https://your-domain.com/api`
5. **Update CORS** in backend to use domain
6. **Rebuild and restart** all services

---

## Quick Commands Reference

```bash
# Check all services
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status mosquitto

# View logs
pm2 logs
sudo tail -f /var/log/nginx/stromwater-error.log

# Restart services
pm2 restart all
sudo systemctl restart nginx

# Check which ports are in use
sudo netstat -tlnp | grep -E '(80|3000|5000|5001|1883|5432)'
```

---

## Example Full URLs

Replace `123.45.67.89` with your actual VPS IP:

**Web Interface:**
- http://123.45.67.89

**API Endpoints:**
- http://123.45.67.89/api/health
- http://123.45.67.89/api/auth/login
- http://123.45.67.89/api/devices

**WebSocket:**
- ws://123.45.67.89/ws

**MQTT Broker:**
- mqtt://123.45.67.89:1883

---

## Security Notes for IP-Based Deployment

⚠️ **Important Security Considerations:**

1. **No HTTPS encryption** - Data transmitted in plain text
2. **Not recommended for production** with sensitive data
3. **Use strong passwords** - Extra important without SSL
4. **Consider VPN** for accessing admin interface
5. **Change admin password** immediately after first login
6. **Keep system updated** regularly

**Recommended: Get a free domain**
- Use [FreeDNS](https://freedns.afraid.org/)
- Use [Duck DNS](https://www.duckdns.org/)
- Use [No-IP](https://www.noip.com/)
- Then add free SSL with Let's Encrypt

---

## Next Steps

1. ✅ Deploy using IP address
2. ✅ Test all functionality
3. ✅ Connect IoT devices
4. ⚠️ **Change admin password**
5. 🔒 Consider getting a domain for SSL
6. 📊 Monitor system performance
7. 💾 Set up automated backups

---

**Your platform is ready to deploy with just an IP address!** 🚀

Access it at: **http://YOUR_VPS_IP**
