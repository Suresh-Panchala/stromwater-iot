# Troubleshooting - Blank Dashboard

## ✅ What's Working
- Backend is running (http://localhost:5000/health returns OK)
- MQTT is connected
- Frontend is running (http://localhost:3000 is accessible)
- All files exist

## ❓ Issue: Blank Page at localhost:3000

### Step 1: Check Browser Console

1. Open http://localhost:3000
2. Press **F12** (Developer Tools)
3. Click **Console** tab
4. Look for RED error messages

### Common Errors & Solutions:

#### Error: "Failed to fetch" or "Network Error"
**Cause:** Backend API not accessible
**Solution:**
- Make sure backend is running (start-backend.bat)
- Check http://localhost:5000/health in browser
- Should return: {"status":"OK",...}

#### Error: "Unexpected token" or "Cannot parse"
**Cause:** JavaScript syntax error
**Solution:**
- Note which file has the error
- Share the error message

#### Error: "Cannot find module 'react-router-dom'" (or any module)
**Cause:** Missing dependency
**Solution:**
```cmd
cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ\frontend
npm install
```

#### Error: "WebSocket connection failed"
**Cause:** Backend WebSocket not available
**Solution:**
- Make sure backend is running
- Backend should show "WebSocket server initialized"

#### Just a white/blank page, no errors
**Possible causes:**
1. **You should see the LOGIN page** (not blank)
   - If completely blank, there's a React error
   - Check console for errors

2. **Login page should have:**
   - Blue logo
   - Username field
   - Password field
   - Login button

### Step 2: Check Terminal Output

**Backend terminal should show:**
```
Server running on http://0.0.0.0:5000
Database connected successfully at: [timestamp]
Connected to MQTT broker successfully
Subscribed to topic: devices/+/data
WebSocket server initialized
```

**Frontend terminal should show:**
```
VITE v5.x.x ready in XXX ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### Step 3: Test Backend Directly

Open browser and visit these URLs:

1. **Health check:**
   http://localhost:5000/health

   Should return:
   ```json
   {"status":"OK","timestamp":"...","mqtt":{"connected":true}}
   ```

2. **CORS test:**
   The above should work without errors

### Step 4: Clear Cache and Reload

1. In browser, press **Ctrl + Shift + R** (hard reload)
2. Or press **Ctrl + Shift + Delete**
   - Check "Cached images and files"
   - Click "Clear data"
3. Reload http://localhost:3000

### Step 5: Check What You Should See

#### Login Page (if not logged in):
```
┌─────────────────────────────────────┐
│        [Blue Circle Icon]           │
│         StromWater                  │
│   IoT Monitoring Dashboard          │
│                                     │
│  Username: [_______________]        │
│  Password: [_______________]        │
│                                     │
│         [  Login  ]                 │
│                                     │
│  Default credentials:               │
│  admin / admin123                   │
└─────────────────────────────────────┘
```

#### Dashboard (after login):
```
┌─────────────────────────────────────────┐
│ StromWater Dashboard                    │
├─────────────────────────────────────────┤
│ [Water Tank] [Pump 1] [Pump 2]         │
│ [Voltage Chart] [Current Chart]        │
│ [Map showing location]                 │
└─────────────────────────────────────────┘
```

## Quick Diagnostic Commands

### Check if all services are running:

**PowerShell:**
```powershell
# Check backend
Test-NetConnection -ComputerName localhost -Port 5000

# Check frontend
Test-NetConnection -ComputerName localhost -Port 3000
```

**Command Prompt:**
```cmd
# Check ports
netstat -ano | findstr :5000
netstat -ano | findstr :3000
```

### Restart Everything

If nothing works, restart all services:

1. **Stop all** (press Ctrl+C in each terminal)
2. **Backend:**
   ```cmd
   cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ
   start-backend.bat
   ```
   Wait for "Server running..."

3. **Frontend:**
   ```cmd
   cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ
   start-frontend.bat
   ```
   Wait for "Local: http://localhost:3000"

4. **Open browser:**
   http://localhost:3000

## What to Report

If still having issues, please share:

1. **Browser console errors** (F12 → Console tab)
2. **Backend terminal output** (last 20 lines)
3. **Frontend terminal output** (last 20 lines)
4. **What you see** (blank page, error message, etc.)
5. **Browser you're using** (Chrome, Edge, Firefox)

---

## Most Likely Issue

Based on "no dashboard" comment, you're probably seeing:
- ✅ The page loads (not blank)
- ❌ But shows login page instead of dashboard

**Solution:** You need to login first!

1. Go to http://localhost:3000
2. Enter:
   - Username: `admin`
   - Password: `admin123`
3. Click "Login"
4. Dashboard should appear!

The dashboard is protected - you MUST login to see it.
