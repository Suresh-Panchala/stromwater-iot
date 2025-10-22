#!/bin/bash

# SSL Setup with Let's Encrypt
# Run this after DNS is configured

set -e

echo "========================================="
echo "SSL Certificate Setup"
echo "========================================="

# Install Certbot
echo "Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
echo "Enter your domain name (e.g., stromwater.example.com):"
read DOMAIN

echo "Enter your email address for SSL notifications:"
read EMAIL

# Obtain certificate
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL

# Auto-renewal
echo "Setting up auto-renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo ""
echo "========================================="
echo "SSL Setup Complete!"
echo "========================================="
echo "Certificate will auto-renew every 90 days"
echo "Test renewal with: sudo certbot renew --dry-run"
echo "========================================="
