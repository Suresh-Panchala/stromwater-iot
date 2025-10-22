# Setup PM2 on VPS - Complete Guide

## What is PM2?

PM2 is a production process manager for Node.js applications. It allows you to:
- Keep your Node.js app running forever
- Auto-restart on crashes
- Start app automatically on system reboot
- Monitor app performance
- View logs easily

---

## Step 1: Install PM2 Globally

```bash
# Connect to VPS
ssh ubuntu@43.205.194.142

# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

---

## Step 2: Start Backend with PM2

```bash
# Navigate to backend directory
cd ~/stromwater-iot/backend

# Start the backend application
pm2 start src/index.js --name backend

# Save PM2 process list (so it persists across reboots)
pm2 save

# View status
pm2 status
```

Expected output:
```
┌─────┬──────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name     │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼──────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ backend  │ default     │ 1.0.0   │ fork    │ 12345    │ 2s     │ 0    │ online    │ 0%       │ 45.0mb   │ ubuntu   │ disabled │
└─────┴──────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## Step 3: Setup PM2 Startup Script (Auto-start on Reboot)

This ensures your backend starts automatically when the VPS reboots.

```bash
# Generate startup script
pm2 startup

# This will output a command like:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Copy and run the exact command shown in the output
# Example (your command may be slightly different):
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Save current PM2 process list
pm2 save

# Freeze process list for automatic resurrection
sudo systemctl enable pm2-ubuntu
```

---

## Step 4: Configure PM2 with Ecosystem File (Optional but Recommended)

Create a PM2 ecosystem configuration file for better management:

```bash
cd ~/stromwater-iot/backend

# Create ecosystem file
nano ecosystem.config.js
```

Paste this configuration:

```javascript
module.exports = {
  apps: [{
    name: 'backend',
    script: './src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

Now start using the ecosystem file:

```bash
# Create logs directory
mkdir -p logs

# Stop any existing PM2 processes
pm2 stop all
pm2 delete all

# Start using ecosystem file
pm2 start ecosystem.config.js

# Save
pm2 save
```

---

## Step 5: PM2 Useful Commands

### **Viewing Status:**
```bash
# List all processes
pm2 list
# or
pm2 status

# Detailed info about backend
pm2 show backend

# Monitor in real-time (CPU, memory)
pm2 monit
```

### **Viewing Logs:**
```bash
# View all logs (real-time)
pm2 logs

# View logs for specific app
pm2 logs backend

# View last 50 lines
pm2 logs backend --lines 50

# View logs without streaming (static)
pm2 logs backend --nostream --lines 20

# Clear logs
pm2 flush
```

### **Restarting/Stopping:**
```bash
# Restart backend
pm2 restart backend

# Stop backend
pm2 stop backend

# Delete backend from PM2
pm2 delete backend

# Restart all processes
pm2 restart all

# Stop all processes
pm2 stop all
```

### **Updating Application:**
```bash
# After pulling new code from git
cd ~/stromwater-iot/backend
npm install --production
pm2 restart backend

# Or with zero-downtime reload (for cluster mode)
pm2 reload backend
```

---

## Step 6: Verify PM2 Setup

```bash
# Check if PM2 is managing backend
pm2 status

# Check if startup script is enabled
systemctl status pm2-ubuntu

# Simulate reboot test
pm2 kill  # Stop PM2 daemon
pm2 resurrect  # Restore saved processes

# Or actually reboot and check
sudo reboot
# Wait for server to come back online, then:
ssh ubuntu@43.205.194.142
pm2 status
```

---

## Step 7: Setup PM2 Web Dashboard (Optional)

PM2 Plus is a web-based monitoring dashboard (free for 1 server):

```bash
# Register at: https://app.pm2.io/

# Link your server (you'll get a command like this)
pm2 link YOUR_SECRET_KEY YOUR_PUBLIC_KEY backend

# Now you can monitor from web browser
```

---

## Complete PM2 Setup Script

Save this as a script on your VPS:

```bash
#!/bin/bash
# setup-pm2.sh

echo "Installing PM2..."
sudo npm install -g pm2

echo "Starting backend with PM2..."
cd ~/stromwater-iot/backend
pm2 start src/index.js --name backend
pm2 save

echo "Setting up PM2 startup script..."
pm2 startup | tail -1 | bash
pm2 save

echo "PM2 setup complete!"
echo ""
echo "Useful commands:"
echo "  pm2 status          - View all processes"
echo "  pm2 logs backend    - View backend logs"
echo "  pm2 restart backend - Restart backend"
echo "  pm2 monit           - Monitor resources"
```

Make it executable and run:
```bash
chmod +x setup-pm2.sh
./setup-pm2.sh
```

---

## Troubleshooting

### Issue: PM2 command not found after installation

**Solution:**
```bash
# Check npm global bin path
npm config get prefix

# Should be /usr or /usr/local
# If not, set it:
npm config set prefix /usr/local

# Reinstall PM2
sudo npm install -g pm2
```

### Issue: Backend not starting with PM2

**Solution:**
```bash
# Check logs for errors
pm2 logs backend --lines 50

# Try starting manually to see errors
cd ~/stromwater-iot/backend
node src/index.js

# Check if .env file exists
ls -la .env

# Check if dependencies are installed
ls -la node_modules/
```

### Issue: PM2 doesn't start on reboot

**Solution:**
```bash
# Check if systemd service exists
systemctl status pm2-ubuntu

# If not, run startup again
pm2 startup
# Copy and run the command it shows

pm2 save

# Enable the service
sudo systemctl enable pm2-ubuntu
sudo systemctl start pm2-ubuntu
```

### Issue: Backend consuming too much memory

**Solution:**
```bash
# Monitor memory usage
pm2 monit

# Set memory limit in ecosystem.config.js:
# max_memory_restart: '500M'

# Restart with new config
pm2 restart backend
```

---

## PM2 Logs Location

When using ecosystem file with custom log paths:
- Error logs: `~/stromwater-iot/backend/logs/err.log`
- Output logs: `~/stromwater-iot/backend/logs/out.log`
- Combined: `~/stromwater-iot/backend/logs/combined.log`

Default PM2 logs location:
```bash
~/.pm2/logs/backend-out.log
~/.pm2/logs/backend-error.log
```

View logs:
```bash
# Using PM2 command (recommended)
pm2 logs backend

# Or directly view files
tail -f ~/.pm2/logs/backend-out.log
tail -f ~/.pm2/logs/backend-error.log
```

---

## Quick Reference Card

```bash
# Start
pm2 start src/index.js --name backend

# Status
pm2 status

# Logs
pm2 logs backend

# Restart
pm2 restart backend

# Stop
pm2 stop backend

# Delete
pm2 delete backend

# Monitor
pm2 monit

# Save config
pm2 save

# Startup on boot
pm2 startup
pm2 save
```

---

## Verification Checklist

After setup, verify:

- [ ] `pm2 status` shows backend as "online"
- [ ] Backend is accessible: `curl http://localhost:5000/api/health`
- [ ] Logs are visible: `pm2 logs backend --lines 10`
- [ ] Startup script enabled: `systemctl status pm2-ubuntu`
- [ ] After reboot, backend auto-starts
- [ ] Frontend can connect to backend API

---

## Integration with Deployment Script

Update your `deploy-vps.sh` to use PM2 properly:

```bash
# Instead of:
pm2 restart backend || pm2 start src/index.js --name backend

# Use:
cd ~/stromwater-iot/backend
if pm2 describe backend > /dev/null 2>&1; then
    echo "Restarting existing backend process..."
    pm2 restart backend
else
    echo "Starting new backend process..."
    pm2 start src/index.js --name backend
fi
pm2 save
```

This ensures PM2 either restarts an existing process or starts a new one if it doesn't exist.

---

## Success Criteria

PM2 is correctly set up when:
- ✅ `pm2 status` shows backend running
- ✅ Backend accessible on port 5000
- ✅ Logs visible with `pm2 logs`
- ✅ Auto-starts after VPS reboot
- ✅ Auto-restarts if backend crashes
- ✅ No manual intervention needed

---

**Your backend should now be production-ready with PM2!** 🚀
