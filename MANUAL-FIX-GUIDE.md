# Manual Fix Guide - SSH Access Issue

## Problem
SSH connection is failing with "Permission denied (publickey)". This means we can't run automated scripts on the VPS.

---

## Solution: Fix Admin Login Manually

Since SSH isn't working from Windows, you need to access your VPS through **AWS EC2 Console**.

### Step 1: Access VPS via AWS Console

1. **Login to AWS Console**: https://console.aws.amazon.com/
2. **Go to EC2**: Services → EC2
3. **Find your instance**: IP `43.205.194.142`
4. **Connect**: Click "Connect" button → Choose "EC2 Instance Connect" or "Session Manager"

This will open a terminal in your browser directly connected to the VPS.

---

### Step 2: Run These Commands

Once you're in the terminal, copy and paste these commands **one by one**:

```bash
# Go to backend directory
cd /var/www/stromwater/backend

# Reinitialize database with admin user
node src/scripts/initDatabase.js

# Restart backend
pm2 restart stromwater-backend

# Wait 3 seconds
sleep 3

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

### Step 3: Verify Login Works

After running the commands, you should see a response like:

```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@stromwater.com",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

✅ **If you see this** → Login is working! Go to http://43.205.194.142 and login.

❌ **If you see `{"error":"Login failed"}`** → Continue to troubleshooting below.

---

## Troubleshooting

### If `initDatabase.js` shows errors:

**Check if file exists:**
```bash
ls -la /var/www/stromwater/backend/src/scripts/initDatabase.js
```

**If missing**, create it:
```bash
cat > /var/www/stromwater/backend/src/scripts/initDatabase.js << 'EOF'
require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function initDatabase() {
  try {
    console.log('Initializing database...');

    // Hash password
    const passwordHash = await bcrypt.hash('admin123', 10);

    // Delete existing admin
    await pool.query("DELETE FROM users WHERE username='admin'");
    console.log('Deleted old admin user');

    // Create new admin
    const result = await pool.query(`
      INSERT INTO users (username, email, password_hash, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, username, email, role
    `, ['admin', 'admin@stromwater.com', passwordHash, 'admin', true]);

    console.log('✓ Admin user created:', result.rows[0]);

    // Verify password
    const verify = await bcrypt.compare('admin123', passwordHash);
    console.log('✓ Password verification:', verify ? 'PASS' : 'FAIL');

  } catch (err) {
    console.error('✗ Error:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

initDatabase();
EOF

# Make it executable
chmod +x /var/www/stromwater/backend/src/scripts/initDatabase.js

# Run it
node /var/www/stromwater/backend/src/scripts/initDatabase.js
```

---

### If Database Connection Fails:

**Check PostgreSQL is running:**
```bash
sudo systemctl status postgresql
```

**Test database connection:**
```bash
sudo -u postgres psql -d stromwater_db -c "SELECT COUNT(*) FROM users;"
```

**Check .env file:**
```bash
cat /var/www/stromwater/backend/.env | grep DATABASE_URL
```

Should show:
```
DATABASE_URL=postgresql://stromwater_user:stromwater_pass@localhost:5432/stromwater_db
```

---

### If PM2 Restart Fails:

**Check PM2 status:**
```bash
pm2 status
```

**View backend logs:**
```bash
pm2 logs stromwater-backend --lines 50
```

**If backend not running, start it:**
```bash
cd /var/www/stromwater/backend
pm2 start src/server.js --name stromwater-backend
```

---

## Alternative: Fix SSH Access (For Future)

To fix SSH so automated scripts work:

### Option 1: Use PEM file (if you have it)

When you created the EC2 instance, AWS gave you a `.pem` file. Use it:

```batch
ssh -i "path\to\your-key.pem" ubuntu@43.205.194.142
```

Update all `.bat` files to use:
```batch
ssh -i "path\to\your-key.pem" ubuntu@43.205.194.142 "command"
scp -i "path\to\your-key.pem" file.sh ubuntu@43.205.194.142:~/
```

### Option 2: Set up password authentication

On VPS (via AWS Console):
```bash
sudo nano /etc/ssh/sshd_config
```

Change:
```
PasswordAuthentication yes
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

Set password for ubuntu user:
```bash
sudo passwd ubuntu
```

**Note**: This is less secure than key-based auth.

---

## After Login is Fixed

1. ✅ **Login to dashboard**: http://43.205.194.142
2. ✅ **Fix MQTT port**: Run commands in [FIX-MQTT-PORT.md](FIX-MQTT-PORT.md)
3. ✅ **Start simulator**: Run [START-SIMULATOR-BOTH-DEVICES.bat](START-SIMULATOR-BOTH-DEVICES.bat)
4. ✅ **Verify data flow**: Check dashboard shows real-time data

---

## Quick Command Summary

**To run on VPS (via AWS Console terminal)**:

```bash
cd /var/www/stromwater/backend && \
node src/scripts/initDatabase.js && \
pm2 restart stromwater-backend && \
sleep 3 && \
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Copy this entire block and paste it into AWS Console terminal.

---

**Need Help?**
- Check backend logs: `pm2 logs stromwater-backend`
- Check database: `sudo -u postgres psql -d stromwater_db`
- Check services: `pm2 status && sudo systemctl status postgresql mosquitto nginx`
