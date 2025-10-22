#!/bin/bash

# StromWater MQTT Broker Setup Script
# Run this on your Ubuntu VPS

set -e

echo "========================================="
echo "StromWater MQTT Broker Setup"
echo "========================================="

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Mosquitto
echo "Installing Mosquitto MQTT Broker..."
sudo apt install -y mosquitto mosquitto-clients

# Stop mosquitto to configure
sudo systemctl stop mosquitto

# Create directories
echo "Creating required directories..."
sudo mkdir -p /etc/mosquitto/certs
sudo mkdir -p /var/log/mosquitto
sudo chown mosquitto:mosquitto /var/log/mosquitto

# Generate SSL certificates (self-signed for development)
echo "Generating SSL certificates..."
cd /etc/mosquitto/certs

# Create CA key and certificate
sudo openssl genrsa -out ca.key 2048
sudo openssl req -new -x509 -days 3650 -key ca.key -out ca.crt \
  -subj "/C=AE/ST=Dubai/L=Dubai/O=StromWater/CN=StromWater CA"

# Create server key and certificate
sudo openssl genrsa -out server.key 2048
sudo openssl req -new -key server.key -out server.csr \
  -subj "/C=AE/ST=Dubai/L=Dubai/O=StromWater/CN=$(hostname -I | awk '{print $1}')"

sudo openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key \
  -CAcreateserial -out server.crt -days 3650

# Set permissions
sudo chown mosquitto:mosquitto /etc/mosquitto/certs/*
sudo chmod 600 /etc/mosquitto/certs/*.key

# Copy configuration
echo "Copying Mosquitto configuration..."
sudo cp mosquitto.conf /etc/mosquitto/conf.d/stromwater.conf

# Create password file
echo "Creating MQTT users..."
echo "Enter password for MQTT user 'stromwater_mqtt':"
sudo mosquitto_passwd -c /etc/mosquitto/passwd stromwater_mqtt

echo "Enter password for MQTT user 'stromwater_device' (for IoT devices):"
sudo mosquitto_passwd /etc/mosquitto/passwd stromwater_device

# Set permissions
sudo chown mosquitto:mosquitto /etc/mosquitto/passwd
sudo chmod 600 /etc/mosquitto/passwd

# Enable and start Mosquitto
echo "Starting Mosquitto service..."
sudo systemctl enable mosquitto
sudo systemctl start mosquitto

# Check status
echo ""
echo "========================================="
echo "Mosquitto Status:"
echo "========================================="
sudo systemctl status mosquitto --no-pager

# Configure firewall
echo ""
echo "Configuring firewall..."
sudo ufw allow 1883/tcp comment "MQTT"
sudo ufw allow 8883/tcp comment "MQTT SSL"
sudo ufw allow 9001/tcp comment "MQTT WebSocket"

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo "MQTT Broker is running on:"
echo "  - MQTT:       mqtt://$(hostname -I | awk '{print $1}'):1883"
echo "  - MQTT SSL:   mqtts://$(hostname -I | awk '{print $1}'):8883"
echo "  - WebSocket:  ws://$(hostname -I | awk '{print $1}'):9001"
echo ""
echo "Users created:"
echo "  - stromwater_mqtt (for backend)"
echo "  - stromwater_device (for IoT devices)"
echo ""
echo "Test connection with:"
echo "  mosquitto_sub -h localhost -p 1883 -u stromwater_mqtt -P <password> -t 'devices/#'"
echo "========================================="
