#!/bin/bash
# Deploy the ACTUAL React frontend (not the simple HTML version)
# This deploys the complete StromWater dashboard with charts and all features

set -e
VPS_IP="43.205.194.142"

echo "╔════════════════════════════════════════════════════════╗"
echo "║   Deploy REAL StromWater React Frontend               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  You need to upload the built frontend files first!"
echo ""
echo "The frontend is already built on Windows at:"
echo "  C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ\frontend\dist\"
echo ""
echo "Option 1: Upload via file sharing"
echo "  1. Zip the 'dist' folder on Windows"
echo "  2. Upload to Google Drive/Dropbox"
echo "  3. Get download link and use wget below"
echo ""
echo "Option 2: Rebuild on VPS (if source files are uploaded)"
echo ""
read -p "Do you have the dist.zip uploaded? (y/n): " answer

if [ "$answer" = "y" ]; then
    read -p "Enter the download URL: " download_url

    echo "Downloading frontend build..."
    cd /var/www/stromwater
    rm -rf frontend
    mkdir -p frontend
    cd frontend

    wget "$download_url" -O dist.zip
    unzip -o dist.zip

    # If files are in dist/ subdirectory, move them up
    if [ -d "dist" ]; then
        mv dist/* .
        rmdir dist
    fi

    # Start with serve
    sudo npm install -g serve
    pm2 delete stromwater-frontend 2>/dev/null || true
    pm2 start "serve -s . -l 3000" --name stromwater-frontend
    pm2 save

    echo ""
    echo "✓ Real frontend deployed!"
    echo ""
else
    echo ""
    echo "Please follow these steps:"
    echo ""
    echo "ON WINDOWS:"
    echo "1. Navigate to: C:\Users\UniqueEmbedded\Desktop\IIOT\SHARJ\frontend"
    echo "2. Right-click 'dist' folder → Send to → Compressed folder"
    echo "3. Upload dist.zip to Google Drive or Dropbox"
    echo "4. Get shareable download link"
    echo "5. Run this script again with the link"
    echo ""
fi

pm2 status
