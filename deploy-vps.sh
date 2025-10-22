#!/bin/bash

# StromWater IoT - VPS Deployment Script
# Run this script on the VPS to deploy the latest code

set -e  # Exit on error

echo "=========================================="
echo "  StromWater IoT - VPS Deployment"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="$HOME/stromwater-iot"

# Step 1: Navigate to project directory
echo -e "${YELLOW}[1/8] Navigating to project directory...${NC}"
cd "$PROJECT_DIR"
echo -e "${GREEN}✓ Current directory: $(pwd)${NC}"
echo ""

# Step 2: Stash any local changes
echo -e "${YELLOW}[2/8] Stashing local changes (if any)...${NC}"
git stash
echo -e "${GREEN}✓ Local changes stashed${NC}"
echo ""

# Step 3: Pull latest code
echo -e "${YELLOW}[3/8] Pulling latest code from GitHub...${NC}"
git pull origin main
echo ""
echo "Latest commits:"
git log --oneline -3
echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# Step 4: Update backend
echo -e "${YELLOW}[4/8] Updating backend...${NC}"
cd "$PROJECT_DIR/backend"
echo "Installing dependencies..."
npm install --production
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
echo ""

# Step 5: Restart backend service
echo -e "${YELLOW}[5/8] Restarting backend service...${NC}"
pm2 restart backend || pm2 start src/index.js --name backend
pm2 save
echo -e "${GREEN}✓ Backend restarted${NC}"
echo ""

# Step 6: Build frontend
echo -e "${YELLOW}[6/8] Building frontend...${NC}"
cd "$PROJECT_DIR/frontend"
echo "Installing dependencies..."
npm install
echo "Building production bundle..."
npm run build
echo -e "${GREEN}✓ Frontend built${NC}"
echo ""

# Step 7: Reload Nginx
echo -e "${YELLOW}[7/8] Reloading Nginx...${NC}"
sudo nginx -t
sudo systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded${NC}"
echo ""

# Step 8: Verify services
echo -e "${YELLOW}[8/8] Verifying services...${NC}"
echo ""
echo "Backend status:"
pm2 status backend
echo ""
echo "PostgreSQL status:"
sudo systemctl status postgresql --no-pager | head -3
echo ""
echo "Mosquitto status:"
sudo systemctl status mosquitto --no-pager | head -3
echo ""
echo "Nginx status:"
sudo systemctl status nginx --no-pager | head -3
echo ""

# Check for recent data
echo "Checking database for recent data..."
psql -U postgres -d stromwater_db -c "SELECT device_id, COUNT(*) as records, MAX(timestamp) as latest_data FROM device_data GROUP BY device_id;"
echo ""

# Show recent backend logs
echo "Recent backend logs:"
pm2 logs backend --lines 10 --nostream
echo ""

echo "=========================================="
echo -e "${GREEN}  Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Access your application at:"
echo "  http://43.205.194.142/"
echo ""
echo "Login credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "To monitor logs:"
echo "  pm2 logs backend"
echo ""
echo "To check all services:"
echo "  pm2 status"
echo "  sudo systemctl status postgresql mosquitto nginx"
echo ""
