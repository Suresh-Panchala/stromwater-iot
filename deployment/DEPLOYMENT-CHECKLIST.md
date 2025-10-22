# StromWater IoT Platform - Deployment Checklist

Use this checklist to ensure proper deployment to Ubuntu VPS.

---

## Pre-Deployment Checklist

### VPS Requirements
- [ ] Ubuntu 20.04 LTS or 22.04 LTS installed
- [ ] Minimum 2GB RAM, 2 CPU cores, 20GB storage
- [ ] Root or sudo access configured
- [ ] SSH access working
- [ ] VPS IP address noted: `___________________`
- [ ] Domain name (if using SSL): `___________________`

### Local Preparation
- [ ] All code tested and working on Windows
- [ ] Database backup created
- [ ] Environment variables documented
- [ ] MQTT credentials prepared
- [ ] SSL certificate plan (Let's Encrypt or custom)

---

## Deployment Steps

### 1. System Setup
- [ ] Connected to VPS via SSH
- [ ] System packages updated (`sudo apt update && upgrade`)
- [ ] Essential tools installed (curl, git, build-essential)

### 2. Software Installation
- [ ] Node.js 18.x installed and verified
- [ ] PostgreSQL installed and running
- [ ] Mosquitto MQTT broker installed and running
- [ ] Nginx installed and running
- [ ] PM2 installed globally
- [ ] PM2 startup configured

### 3. Database Configuration
- [ ] PostgreSQL database `stromwater_db` created
- [ ] User `stromwater_user` created with strong password
- [ ] Permissions granted to user
- [ ] Password documented securely: `___________________`

### 4. MQTT Configuration
- [ ] Mosquitto configured for authentication
- [ ] MQTT user `stromwater` created
- [ ] MQTT password set and documented: `___________________`
- [ ] Mosquitto restarted with new config

### 5. Project Deployment
- [ ] Project files uploaded/cloned to `/var/www/stromwater`
- [ ] Backend `.env` file created with production values
- [ ] Frontend `.env` file created with API URL
- [ ] Backend dependencies installed (`npm install --production`)
- [ ] Frontend dependencies installed and built (`npm run build`)

### 6. Environment Configuration
- [ ] `backend/.env` configured with:
  - [ ] Database credentials
  - [ ] JWT secrets (random, secure)
  - [ ] MQTT credentials
  - [ ] Email settings (if using)
  - [ ] Telegram settings (if using)
- [ ] `frontend/.env` configured with:
  - [ ] Production API URL

### 7. Database Initialization
- [ ] Database initialized (`node src/scripts/initDatabase.js`)
- [ ] Admin user created
- [ ] Sample device added (optional)
- [ ] Default admin password changed immediately

### 8. PM2 Configuration
- [ ] Log directory created (`/var/log/stromwater`)
- [ ] Ecosystem config copied to project root
- [ ] Backend started with PM2
- [ ] Frontend started with PM2
- [ ] PM2 configuration saved (`pm2 save`)
- [ ] Both apps showing as "online" in `pm2 status`

### 9. Nginx Configuration
- [ ] Nginx site config created at `/etc/nginx/sites-available/stromwater`
- [ ] Symbolic link created in `/etc/nginx/sites-enabled/`
- [ ] Nginx configuration tested (`sudo nginx -t`)
- [ ] Nginx restarted
- [ ] Can access site via VPS IP

### 10. Firewall Configuration
- [ ] UFW installed
- [ ] SSH allowed (Port 22)
- [ ] HTTP allowed (Port 80)
- [ ] HTTPS allowed (Port 443)
- [ ] MQTT allowed (Port 1883)
- [ ] UFW enabled
- [ ] Firewall status verified

### 11. SSL Certificate (if using domain)
- [ ] Domain DNS pointing to VPS IP
- [ ] Certbot installed
- [ ] SSL certificate obtained
- [ ] Nginx auto-configured for SSL
- [ ] HTTPS working
- [ ] HTTP redirecting to HTTPS
- [ ] Auto-renewal configured

### 12. Testing
- [ ] Can access login page via domain/IP
- [ ] Can log in with admin credentials
- [ ] Dashboard loads successfully
- [ ] Backend API responding (`curl http://localhost:5000/api/health`)
- [ ] WebSocket connection working
- [ ] PostgreSQL accepting connections
- [ ] Mosquitto accepting connections
- [ ] Can publish MQTT test message
- [ ] Test data appears in dashboard

### 13. IoT Device Configuration
- [ ] Device(s) configured with production MQTT broker
- [ ] MQTT credentials updated on device(s)
- [ ] Device(s) publishing to correct topic
- [ ] Data appearing in dashboard
- [ ] Real-time updates working

### 14. Security Hardening
- [ ] Default admin password changed
- [ ] Strong passwords for all services
- [ ] SSH key authentication configured (optional)
- [ ] Password SSH login disabled (optional)
- [ ] Fail2ban installed (optional)
- [ ] Automatic security updates enabled

### 15. Monitoring & Maintenance
- [ ] PM2 logs accessible (`pm2 logs`)
- [ ] Nginx logs accessible (`/var/log/nginx/`)
- [ ] Database backup script created
- [ ] Backup schedule configured (cron)
- [ ] Monitoring dashboard bookmarked
- [ ] Alert email/Telegram configured (optional)

---

## Post-Deployment Verification

### Functional Tests
- [ ] Login/Logout works
- [ ] Device selection works (if multiple devices)
- [ ] Dashboard shows live data
- [ ] Charts update in real-time
- [ ] Map shows device location
- [ ] Pump ON/OFF trends display
- [ ] Electrical parameter cards show data
- [ ] PDF export works
- [ ] CSV export works
- [ ] User management works (admin only)
- [ ] Settings page works

### Performance Tests
- [ ] Page loads in < 3 seconds
- [ ] API responses in < 500ms
- [ ] WebSocket reconnects automatically
- [ ] No memory leaks (`pm2 monit`)
- [ ] Database queries fast

### Security Tests
- [ ] HTTPS enforced (if using SSL)
- [ ] Unauthorized API access blocked
- [ ] SQL injection protected
- [ ] XSS protection active
- [ ] CSRF protection active
- [ ] Rate limiting works

---

## Troubleshooting Reference

### Backend won't start
```bash
pm2 logs stromwater-backend
# Check database connection in .env
# Check if port 5000 is available
```

### Frontend shows blank page
```bash
# Check API URL in frontend/.env
# Rebuild: cd frontend && npm run build
# Check browser console for errors
```

### Can't connect via domain
```bash
# Check DNS: dig your-domain.com
# Check Nginx: sudo nginx -t
# Check firewall: sudo ufw status
```

### MQTT not connecting
```bash
# Check Mosquitto: sudo systemctl status mosquitto
# Test locally: mosquitto_sub -h localhost -t test -u stromwater -P password
```

### Database connection failed
```bash
# Check PostgreSQL: sudo systemctl status postgresql
# Verify credentials in backend/.env
# Check user permissions
```

---

## Maintenance Commands

```bash
# View application status
pm2 status

# View logs
pm2 logs
pm2 logs stromwater-backend
pm2 logs stromwater-frontend

# Restart applications
pm2 restart all
pm2 restart stromwater-backend

# Update application
cd /var/www/stromwater
git pull
cd backend && npm install --production
cd ../frontend && npm install && npm run build
pm2 restart all

# Database backup
pg_dump -U stromwater_user stromwater_db > backup_$(date +%Y%m%d).sql

# Check system resources
pm2 monit
htop

# View Nginx logs
sudo tail -f /var/log/nginx/stromwater-access.log
sudo tail -f /var/log/nginx/stromwater-error.log
```

---

## Emergency Contacts

- [ ] VPS Provider Support: `___________________`
- [ ] Domain Registrar: `___________________`
- [ ] Team Lead: `___________________`
- [ ] Developer Contact: `___________________`

---

## Credentials (Store Securely!)

**NEVER commit this information to Git!**

- VPS IP: `___________________`
- SSH User: `___________________`
- PostgreSQL Password: `___________________`
- MQTT Password: `___________________`
- JWT Secret: `___________________`
- Admin Dashboard Password: `___________________`

---

## Deployment Complete!

- [ ] All checklist items completed
- [ ] All tests passed
- [ ] Documentation updated
- [ ] Team notified
- [ ] Monitoring configured
- [ ] Success! 🎉

**Deployment Date:** `___________________`
**Deployed By:** `___________________`
**Production URL:** `___________________`

---

## Next Steps

1. Monitor for 24 hours
2. Add more devices as needed
3. Configure email/Telegram alerts
4. Set up automated backups
5. Plan regular maintenance schedule
6. Document any custom configurations
7. Train users on the system

