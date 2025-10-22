#!/bin/bash

# PM2 Setup Script for StromWater IoT Backend
# Run this on your VPS to set up PM2 properly

set -e

echo "=========================================="
echo "  PM2 Setup for StromWater IoT"
echo "=========================================="
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found. Installing PM2 globally..."
    sudo npm install -g pm2
    echo "✓ PM2 installed"
else
    echo "✓ PM2 already installed ($(pm2 --version))"
fi
echo ""

# Navigate to backend directory
echo "Navigating to backend directory..."
cd ~/stromwater-iot/backend
echo "✓ In directory: $(pwd)"
echo ""

# Check if backend process exists in PM2
if pm2 describe backend > /dev/null 2>&1; then
    echo "Backend process already exists in PM2. Restarting..."
    pm2 restart backend
    echo "✓ Backend restarted"
else
    echo "Starting backend with PM2 for the first time..."
    pm2 start src/index.js --name backend
    echo "✓ Backend started"
fi
echo ""

# Save PM2 process list
echo "Saving PM2 process list..."
pm2 save
echo "✓ Process list saved"
echo ""

# Setup startup script
echo "Setting up PM2 startup script..."
echo "This ensures backend starts automatically on server reboot."
echo ""

# Generate startup command
STARTUP_CMD=$(pm2 startup | grep "sudo" | tail -1)

if [ -n "$STARTUP_CMD" ]; then
    echo "Running startup command..."
    eval $STARTUP_CMD
    pm2 save
    echo "✓ Startup script configured"
else
    echo "⚠ Startup script may already be configured"
fi
echo ""

# Display status
echo "=========================================="
echo "  PM2 Status"
echo "=========================================="
pm2 status
echo ""

# Display logs
echo "=========================================="
echo "  Recent Backend Logs (last 15 lines)"
echo "=========================================="
pm2 logs backend --lines 15 --nostream
echo ""

# Success message
echo "=========================================="
echo "  ✓ PM2 Setup Complete!"
echo "=========================================="
echo ""
echo "Backend is now managed by PM2 and will:"
echo "  • Auto-restart if it crashes"
echo "  • Auto-start on server reboot"
echo "  • Keep logs for debugging"
echo ""
echo "Useful PM2 commands:"
echo "  pm2 status          - View all processes"
echo "  pm2 logs backend    - View real-time logs"
echo "  pm2 restart backend - Restart backend"
echo "  pm2 stop backend    - Stop backend"
echo "  pm2 monit           - Monitor CPU & memory"
echo ""
