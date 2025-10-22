#!/bin/bash

echo "=========================================="
echo "  Fix MQTT Port 1883 Access"
echo "=========================================="
echo ""

# Step 1: Check current UFW status
echo "Step 1: Checking UFW firewall status..."
sudo ufw status numbered

# Step 2: Allow port 1883
echo ""
echo "Step 2: Allowing MQTT port 1883..."
sudo ufw allow 1883/tcp
sudo ufw allow 1883/udp

# Step 3: Reload UFW
echo ""
echo "Step 3: Reloading firewall..."
sudo ufw reload

# Step 4: Verify port is listening
echo ""
echo "Step 4: Verifying Mosquitto is listening on 1883..."
sudo netstat -tlnp | grep 1883

# Step 5: Check Mosquitto config
echo ""
echo "Step 5: Checking Mosquitto configuration..."
cat /etc/mosquitto/mosquitto.conf

# Step 6: Test MQTT from localhost
echo ""
echo "Step 6: Testing MQTT publish from localhost..."
mosquitto_pub -h localhost -p 1883 -t "test/connection" -m "test message" -u stromwater_mqtt -P mqtt123 -d

# Step 7: Show listening ports
echo ""
echo "Step 7: All listening ports..."
sudo netstat -tlnp | grep LISTEN | grep -E "(1883|5000|3000|5001|80)"

echo ""
echo "=========================================="
echo "  MQTT Port Configuration Complete"
echo "=========================================="
echo ""
echo "Now test from Windows with:"
echo "  Test-NetConnection -ComputerName 43.205.194.142 -Port 1883"
echo ""
