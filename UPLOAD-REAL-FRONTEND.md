# Deploy Real React Frontend to VPS

The actual StromWater project has a complete React dashboard with:
- Real-time charts
- Device selector
- Data visualization
- Responsive design
- All the features you built

## Current Situation

✅ **Frontend is built**: `C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ\frontend\dist\`
✅ **Backend is deployed**: Working on VPS
❌ **Need to upload**: The actual React build to VPS

---

## FASTEST METHOD: Direct Upload via AWS Console

Since the frontend is already built, here's the fastest way:

### Step 1: Create a tar.gz on Windows

On Windows Command Prompt:
```bash
cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ\frontend
tar -czf dist.tar.gz dist/
```

This creates `dist.tar.gz` in the frontend folder.

### Step 2: Upload to VPS

Unfortunately, since SSH isn't working, we need to use an alternative method.

**Option A: Use a temporary file sharing service**

1. Upload `dist.tar.gz` to:
   - Google Drive (get shareable link)
   - Dropbox (get shareable link)
   - WeTransfer (free, no account needed)
   - transfer.sh (command line: `curl --upload-file dist.tar.gz https://transfer.sh/dist.tar.gz`)

2. Get the direct download URL

3. On VPS (AWS Console):
```bash
cd /var/www/stromwater
rm -rf frontend
mkdir -p frontend
cd frontend

# Download (replace with your URL)
wget "YOUR_DOWNLOAD_URL" -O dist.tar.gz

# Extract
tar -xzf dist.tar.gz
mv dist/* .
rmdir dist
rm dist.tar.gz

# Update .env for frontend
cat > .env << EOF
VITE_API_URL=http://43.205.194.142/api
VITE_WS_URL=ws://43.205.194.142/ws
EOF

# Start with serve
sudo npm install -g serve
pm2 delete stromwater-frontend 2>/dev/null || true
pm2 start "serve -s . -l 3000" --name stromwater-frontend
pm2 save
pm2 status
```

---

## ALTERNATIVE: Rebuild on VPS

If you can get the source files to VPS:

### Option 1: Via Git (Best if you have GitHub)

**On Windows:**
```bash
cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ
git init
git add .
git commit -m "StromWater project"
# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/stromwater.git
git push -u origin main
```

**On VPS (AWS Console):**
```bash
cd /var/www/stromwater
rm -rf frontend
git clone https://github.com/YOUR_USERNAME/stromwater.git temp
mv temp/frontend .
rm -rf temp

cd frontend

# Create .env
cat > .env << EOF
VITE_API_URL=http://43.205.194.142/api
VITE_WS_URL=ws://43.205.194.142/ws
EOF

# Build
npm install
npm run build

# Serve
sudo npm install -g serve
pm2 delete stromwater-frontend 2>/dev/null || true
pm2 start "serve -s dist -l 3000" --name stromwater-frontend
pm2 save
```

---

## SIMPLEST: Use the Pre-Built Dist

Since I already built your frontend earlier, the `dist/` folder is ready.

### Quick Commands:

**On Windows (PowerShell):**
```powershell
cd C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ\frontend

# Zip the dist folder
Compress-Archive -Path dist -DestinationPath dist.zip -Force

# Upload to transfer.sh (gets a temporary download link)
curl --upload-file dist.zip https://transfer.sh/dist.zip
```

This will give you a URL like: `https://transfer.sh/abc123/dist.zip`

**On VPS (AWS Console):**
```bash
cd /var/www/stromwater
rm -rf frontend
mkdir -p frontend
cd frontend

# Use the URL from transfer.sh
wget "https://transfer.sh/abc123/dist.zip" -O dist.zip
unzip -o dist.zip
mv dist/* .
rmdir dist
rm dist.zip

# Start frontend
sudo npm install -g serve
pm2 delete stromwater-frontend 2>/dev/null || true
pm2 start "serve -s . -l 3000" --name stromwater-frontend
pm2 save
```

---

## Verify It's the Real Frontend

After deployment, open http://43.205.194.142 and you should see:

✅ **Login page** with StromWater branding
✅ **Dashboard** with charts (Recharts library)
✅ **Device selector** dropdown
✅ **Real-time data** visualization
✅ **Responsive design**
✅ **All the React components** you built

NOT the simple HTML version!

---

## Current Status

Right now, the VPS is serving a **simple HTML dashboard** (the quick fix I created).

To deploy the **REAL React dashboard**, follow one of the methods above.

**Recommended**: Use transfer.sh method - fastest and doesn't require accounts.

---

Let me know which method you'd like to use, and I can provide the exact commands!
