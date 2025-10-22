#!/bin/bash

# Quick 500 Error Diagnostic Script
# Run this on VPS to diagnose the 500 error

echo "================================================"
echo "  500 Error Diagnostic Tool"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check PM2 Status
echo -e "${YELLOW}[1/8] Checking PM2 Status...${NC}"
if pm2 status | grep -q "backend"; then
    STATUS=$(pm2 status | grep backend | awk '{print $10}')
    if [ "$STATUS" = "online" ]; then
        echo -e "${GREEN}✓ Backend is ONLINE${NC}"
    else
        echo -e "${RED}✗ Backend status: $STATUS${NC}"
        echo -e "${YELLOW}Fix: pm2 restart backend${NC}"
    fi
else
    echo -e "${RED}✗ Backend not found in PM2${NC}"
    echo -e "${YELLOW}Fix: cd ~/stromwater-iot/backend && pm2 start src/index.js --name backend${NC}"
fi
echo ""

# 2. Check Backend Logs
echo -e "${YELLOW}[2/8] Checking Backend Logs for Errors...${NC}"
if pm2 logs backend --lines 20 --nostream 2>/dev/null | grep -i error; then
    echo -e "${RED}✗ Errors found in logs (see above)${NC}"
else
    echo -e "${GREEN}✓ No errors in recent logs${NC}"
fi
echo ""

# 3. Check PostgreSQL
echo -e "${YELLOW}[3/8] Checking PostgreSQL...${NC}"
if sudo systemctl is-active postgresql >/dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
    if psql -U postgres -d stromwater_db -c "SELECT 1;" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Database connection works${NC}"
    else
        echo -e "${RED}✗ Cannot connect to database${NC}"
        echo -e "${YELLOW}Fix: Check .env file has correct DB credentials${NC}"
    fi
else
    echo -e "${RED}✗ PostgreSQL is not running${NC}"
    echo -e "${YELLOW}Fix: sudo systemctl start postgresql${NC}"
fi
echo ""

# 4. Check Backend Port
echo -e "${YELLOW}[4/8] Checking if Backend is listening on port 5000...${NC}"
if sudo netstat -tlnp 2>/dev/null | grep -q ":5000"; then
    echo -e "${GREEN}✓ Port 5000 is listening${NC}"
    sudo netstat -tlnp | grep ":5000"
else
    echo -e "${RED}✗ Nothing listening on port 5000${NC}"
    echo -e "${YELLOW}Fix: Backend is not running. Check pm2 logs backend${NC}"
fi
echo ""

# 5. Check Mosquitto
echo -e "${YELLOW}[5/8] Checking Mosquitto MQTT...${NC}"
if sudo systemctl is-active mosquitto >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Mosquitto is running${NC}"
else
    echo -e "${RED}✗ Mosquitto is not running${NC}"
    echo -e "${YELLOW}Fix: sudo systemctl start mosquitto${NC}"
fi
echo ""

# 6. Check Nginx
echo -e "${YELLOW}[6/8] Checking Nginx...${NC}"
if sudo systemctl is-active nginx >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
    if sudo nginx -t 2>&1 | grep -q "syntax is ok"; then
        echo -e "${GREEN}✓ Nginx config is valid${NC}"
    else
        echo -e "${RED}✗ Nginx config has errors${NC}"
        sudo nginx -t
    fi
else
    echo -e "${RED}✗ Nginx is not running${NC}"
    echo -e "${YELLOW}Fix: sudo systemctl start nginx${NC}"
fi
echo ""

# 7. Test Backend Directly
echo -e "${YELLOW}[7/8] Testing Backend API directly...${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null)
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Backend responds: HTTP $RESPONSE${NC}"
elif [ "$RESPONSE" = "000" ]; then
    echo -e "${RED}✗ Backend not responding (connection refused)${NC}"
    echo -e "${YELLOW}Fix: Backend is not running${NC}"
else
    echo -e "${RED}✗ Backend responds: HTTP $RESPONSE${NC}"
fi
echo ""

# 8. Test Web App
echo -e "${YELLOW}[8/8] Testing Web Application...${NC}"
WEB_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://43.205.194.142/ 2>/dev/null)
if [ "$WEB_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Web app responds: HTTP $WEB_RESPONSE${NC}"
elif [ "$WEB_RESPONSE" = "502" ]; then
    echo -e "${RED}✗ Web app responds: HTTP 502 (Bad Gateway)${NC}"
    echo -e "${YELLOW}This means Nginx can't connect to backend${NC}"
elif [ "$WEB_RESPONSE" = "500" ]; then
    echo -e "${RED}✗ Web app responds: HTTP 500 (Internal Server Error)${NC}"
    echo -e "${YELLOW}This means backend is returning an error${NC}"
else
    echo -e "${RED}✗ Web app responds: HTTP $WEB_RESPONSE${NC}"
fi
echo ""

# Summary
echo "================================================"
echo -e "${YELLOW}  Summary & Recommended Actions${NC}"
echo "================================================"
echo ""

# Check what's wrong and suggest fix
if pm2 status 2>/dev/null | grep backend | grep -q "online" && \
   sudo systemctl is-active postgresql >/dev/null 2>&1 && \
   sudo systemctl is-active nginx >/dev/null 2>&1 && \
   [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}All services are running correctly!${NC}"
    echo ""
    echo "If you're still getting 500 error:"
    echo "1. Check browser console (F12) for errors"
    echo "2. Check backend logs: pm2 logs backend --lines 50"
    echo "3. Check Nginx error log: sudo tail -f /var/log/nginx/error.log"
else
    echo -e "${RED}Issues detected. Run these commands:${NC}"
    echo ""

    # Generate fix commands
    if ! pm2 status 2>/dev/null | grep backend | grep -q "online"; then
        echo "# Start/Restart Backend"
        echo "cd ~/stromwater-iot/backend"
        echo "pm2 restart backend || pm2 start src/index.js --name backend"
        echo "pm2 save"
        echo ""
    fi

    if ! sudo systemctl is-active postgresql >/dev/null 2>&1; then
        echo "# Start PostgreSQL"
        echo "sudo systemctl start postgresql"
        echo ""
    fi

    if ! sudo systemctl is-active mosquitto >/dev/null 2>&1; then
        echo "# Start Mosquitto"
        echo "sudo systemctl start mosquitto"
        echo ""
    fi

    if ! sudo systemctl is-active nginx >/dev/null 2>&1; then
        echo "# Start Nginx"
        echo "sudo systemctl start nginx"
        echo ""
    fi

    echo "# Then check logs"
    echo "pm2 logs backend --lines 30"
fi
echo ""

echo "================================================"
echo "  View Detailed Logs"
echo "================================================"
echo "pm2 logs backend --lines 50"
echo "sudo tail -f /var/log/nginx/error.log"
echo "================================================"
