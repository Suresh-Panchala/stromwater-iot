#!/bin/bash

# StromWater Platform Deployment Script
# Run this on your Ubuntu VPS

set -e

echo "========================================="
echo "StromWater Platform Deployment"
echo "========================================="

# Variables
APP_DIR="/opt/stromwater"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
echo "Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
echo "Installing Nginx..."
sudo apt install -y nginx

# Install PM2
echo "Installing PM2..."
sudo npm install -g pm2

# Create application directory
echo "Creating application directory..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Setup PostgreSQL Database
echo "Setting up PostgreSQL database..."
sudo -u postgres psql <<EOF
CREATE DATABASE stromwater_db;
CREATE USER stromwater_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE stromwater_db TO stromwater_user;
\q
EOF

echo "Database created successfully!"

# Instructions for manual steps
echo ""
echo "========================================="
echo "Next Steps:"
echo "========================================="
echo ""
echo "1. Copy your application files to the VPS:"
echo "   scp -r backend/ user@your-vps-ip:$APP_DIR/"
echo "   scp -r frontend/ user@your-vps-ip:$APP_DIR/"
echo ""
echo "2. SSH into your VPS and run:"
echo "   cd $BACKEND_DIR"
echo "   cp .env.example .env"
echo "   nano .env  # Edit with your configuration"
echo "   npm install"
echo "   npm run init-db"
echo "   pm2 start src/server.js --name stromwater-backend"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "3. Build and deploy frontend:"
echo "   cd $FRONTEND_DIR"
echo "   npm install"
echo "   npm run build"
echo ""
echo "4. Configure Nginx (see nginx.conf in deployment folder)"
echo ""
echo "========================================="
