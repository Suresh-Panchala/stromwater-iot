#!/bin/bash
# StromWater Deployment Diagnostics Script
# Run this on your VPS to diagnose white page issues

echo "================================================"
echo "StromWater IoT Platform - Deployment Diagnostics"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check PM2 Status
echo "1. Checking PM2 Applications..."
echo "--------------------------------"
pm2 status
echo ""

# Check if apps are online
BACKEND_STATUS=$(pm2 jlist | grep -o '"name":"stromwater-backend".*"status":"[^"]*"' | grep -o 'status":"[^"]*"' | cut -d'"' -f3)
FRONTEND_STATUS=$(pm2 jlist | grep -o '"name":"stromwater-frontend".*"status":"[^"]*"' | grep -o 'status":"[^"]*"' | cut -d'"' -f3)

if [ "$BACKEND_STATUS" = "online" ]; then
    echo -e "${GREEN}✓ Backend is online${NC}"
else
    echo -e "${RED}✗ Backend is NOT online (Status: $BACKEND_STATUS)${NC}"
fi

if [ "$FRONTEND_STATUS" = "online" ]; then
    echo -e "${GREEN}✓ Frontend is online${NC}"
else
    echo -e "${RED}✗ Frontend is NOT online (Status: $FRONTEND_STATUS)${NC}"
fi
echo ""

# Check ports
echo "2. Checking Ports..."
echo "--------------------------------"
PORT_3000=$(netstat -tlnp 2>/dev/null | grep ":3000" || ss -tlnp 2>/dev/null | grep ":3000")
PORT_5000=$(netstat -tlnp 2>/dev/null | grep ":5000" || ss -tlnp 2>/dev/null | grep ":5000")
PORT_5001=$(netstat -tlnp 2>/dev/null | grep ":5001" || ss -tlnp 2>/dev/null | grep ":5001")

if [ -n "$PORT_3000" ]; then
    echo -e "${GREEN}✓ Port 3000 (Frontend) is listening${NC}"
else
    echo -e "${RED}✗ Port 3000 (Frontend) is NOT listening${NC}"
fi

if [ -n "$PORT_5000" ]; then
    echo -e "${GREEN}✓ Port 5000 (Backend) is listening${NC}"
else
    echo -e "${RED}✗ Port 5000 (Backend) is NOT listening${NC}"
fi

if [ -n "$PORT_5001" ]; then
    echo -e "${GREEN}✓ Port 5001 (WebSocket) is listening${NC}"
else
    echo -e "${YELLOW}⚠ Port 5001 (WebSocket) is NOT listening${NC}"
fi
echo ""

# Test endpoints locally
echo "3. Testing Local Endpoints..."
echo "--------------------------------"

# Test backend health
HEALTH_RESPONSE=$(curl -s http://localhost:5000/health)
if [ -n "$HEALTH_RESPONSE" ]; then
    echo -e "${GREEN}✓ Backend health endpoint responding${NC}"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}✗ Backend health endpoint NOT responding${NC}"
fi
echo ""

# Test frontend
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Frontend responding (HTTP $FRONTEND_RESPONSE)${NC}"
else
    echo -e "${RED}✗ Frontend NOT responding properly (HTTP $FRONTEND_RESPONSE)${NC}"
fi
echo ""

# Check Nginx
echo "4. Checking Nginx..."
echo "--------------------------------"
NGINX_STATUS=$(systemctl is-active nginx)
if [ "$NGINX_STATUS" = "active" ]; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
else
    echo -e "${RED}✗ Nginx is NOT running${NC}"
fi

# Test Nginx config
nginx -t 2>&1 | head -5
echo ""

# Check if site is enabled
if [ -L "/etc/nginx/sites-enabled/stromwater" ]; then
    echo -e "${GREEN}✓ StromWater site is enabled${NC}"
else
    echo -e "${RED}✗ StromWater site is NOT enabled${NC}"
fi
echo ""

# Check firewall
echo "5. Checking Firewall..."
echo "--------------------------------"
ufw status | head -10
echo ""

# Check PostgreSQL
echo "6. Checking PostgreSQL..."
echo "--------------------------------"
POSTGRES_STATUS=$(systemctl is-active postgresql)
if [ "$POSTGRES_STATUS" = "active" ]; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${RED}✗ PostgreSQL is NOT running${NC}"
fi
echo ""

# Check Mosquitto
echo "7. Checking Mosquitto MQTT..."
echo "--------------------------------"
MOSQUITTO_STATUS=$(systemctl is-active mosquitto)
if [ "$MOSQUITTO_STATUS" = "active" ]; then
    echo -e "${GREEN}✓ Mosquitto is running${NC}"
else
    echo -e "${RED}✗ Mosquitto is NOT running${NC}"
fi
echo ""

# Check recent PM2 logs
echo "8. Recent PM2 Logs (Last 20 lines)..."
echo "--------------------------------"
echo "=== Backend Logs ==="
pm2 logs stromwater-backend --lines 10 --nostream 2>/dev/null || echo "No backend logs available"
echo ""
echo "=== Frontend Logs ==="
pm2 logs stromwater-frontend --lines 10 --nostream 2>/dev/null || echo "No frontend logs available"
echo ""

# Check Nginx error logs
echo "9. Recent Nginx Errors..."
echo "--------------------------------"
if [ -f "/var/log/nginx/stromwater-error.log" ]; then
    tail -10 /var/log/nginx/stromwater-error.log
else
    echo "No Nginx error log found"
fi
echo ""

# Check if frontend build exists
echo "10. Checking Frontend Build..."
echo "--------------------------------"
if [ -d "/var/www/stromwater/frontend/dist" ]; then
    echo -e "${GREEN}✓ Frontend build directory exists${NC}"
    echo "   Files: $(ls /var/www/stromwater/frontend/dist 2>/dev/null | wc -l)"
    echo "   Size: $(du -sh /var/www/stromwater/frontend/dist 2>/dev/null | cut -f1)"
else
    echo -e "${RED}✗ Frontend build directory NOT found${NC}"
    echo -e "${YELLOW}   Run: cd /var/www/stromwater/frontend && npm run build${NC}"
fi
echo ""

# Check environment files
echo "11. Checking Environment Files..."
echo "--------------------------------"
if [ -f "/var/www/stromwater/backend/.env" ]; then
    echo -e "${GREEN}✓ Backend .env exists${NC}"
else
    echo -e "${RED}✗ Backend .env NOT found${NC}"
fi

if [ -f "/var/www/stromwater/frontend/.env" ]; then
    echo -e "${GREEN}✓ Frontend .env exists${NC}"
    echo "   Content:"
    cat /var/www/stromwater/frontend/.env | grep -v PASSWORD | grep -v SECRET
else
    echo -e "${YELLOW}⚠ Frontend .env NOT found (might be optional)${NC}"
fi
echo ""

# Summary
echo "================================================"
echo "DIAGNOSTIC SUMMARY"
echo "================================================"
echo ""

# Count issues
ISSUES=0

[ "$BACKEND_STATUS" != "online" ] && ISSUES=$((ISSUES+1))
[ "$FRONTEND_STATUS" != "online" ] && ISSUES=$((ISSUES+1))
[ -z "$PORT_3000" ] && ISSUES=$((ISSUES+1))
[ -z "$PORT_5000" ] && ISSUES=$((ISSUES+1))
[ "$NGINX_STATUS" != "active" ] && ISSUES=$((ISSUES+1))
[ ! -d "/var/www/stromwater/frontend/dist" ] && ISSUES=$((ISSUES+1))

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ No critical issues found!${NC}"
    echo ""
    echo "If you're still seeing a white page:"
    echo "1. Check browser console (F12) for errors"
    echo "2. Verify CORS settings in backend/.env"
    echo "3. Check that frontend/.env has correct API URL"
else
    echo -e "${RED}Found $ISSUES critical issue(s)${NC}"
    echo ""
    echo "Common fixes:"
    echo "1. Restart apps: pm2 restart all"
    echo "2. Rebuild frontend: cd /var/www/stromwater/frontend && npm run build"
    echo "3. Restart Nginx: sudo systemctl restart nginx"
    echo "4. Check logs: pm2 logs"
fi
echo ""
echo "================================================"
