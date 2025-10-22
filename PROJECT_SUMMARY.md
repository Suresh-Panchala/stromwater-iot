# StromWater IoT Platform - Project Summary

## Overview

A complete, production-ready IoT monitoring platform built for StromWater pump stations with real-time data visualization, alerting, and user management.

## Technology Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **MQTT Client**: mqtt.js v5
- **Authentication**: JWT (jsonwebtoken)
- **Real-time**: WebSocket (ws)
- **Logging**: Winston
- **Validation**: Joi
- **Security**: Helmet, bcryptjs, CORS, Rate Limiting
- **Email**: Nodemailer
- **Export**: json2csv, PDFKit

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **Charts**: Recharts 2
- **Maps**: React Leaflet 4
- **Animation**: Framer Motion 10
- **Routing**: React Router DOM 6
- **State**: React Context + Zustand
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

### Infrastructure
- **MQTT Broker**: Mosquitto with SSL/TLS
- **Web Server**: Nginx (reverse proxy)
- **Process Manager**: PM2
- **SSL**: Let's Encrypt (Certbot)
- **OS**: Ubuntu 22.04 LTS

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   IoT       │ MQTT    │  Mosquitto   │  MQTT   │   Backend   │
│   Device    ├────────>│   Broker     ├────────>│  (Node.js)  │
└─────────────┘  8883   └──────────────┘         └──────┬──────┘
                                                         │
                                                         │ WebSocket
                                                         │ REST API
                                                         │
                                                  ┌──────┴──────┐
                                                  │  PostgreSQL │
                                                  │  Database   │
                                                  └─────────────┘
                                                         │
                                                         │
                                                  ┌──────┴──────┐
┌─────────────┐         ┌──────────────┐         │             │
│   Browser   │ HTTPS   │    Nginx     │  HTTP   │  Frontend   │
│             │<────────┤ Reverse Proxy│<────────┤  (React)    │
└─────────────┘  443    └──────────────┘   3000  └─────────────┘
```

## Features Implemented

### Core Functionality
- [x] MQTT broker integration with SSL/TLS
- [x] Real-time data ingestion from IoT devices
- [x] PostgreSQL database with optimized schema and indexing
- [x] RESTful API with complete CRUD operations
- [x] WebSocket for real-time dashboard updates
- [x] JWT-based authentication with refresh tokens
- [x] Role-based access control (Admin/User)

### Dashboard Features
- [x] Real-time water level visualization (animated tank)
- [x] Dual pump status monitoring with visual indicators
- [x] Electrical parameters display (Voltage, Current, Frequency)
- [x] Interactive charts for historical data (24h trends)
- [x] Device location on interactive map (Leaflet)
- [x] Dark/Light theme toggle with persistence
- [x] Responsive design for mobile/tablet/desktop

### Alert System
- [x] Automatic threshold-based alert detection
- [x] Alert types: Dry Run, High Water Level, Pump Protection, Voltage Anomaly
- [x] Email notifications (via SMTP)
- [x] Telegram notifications (optional)
- [x] Alert acknowledgment system
- [x] Real-time alert display with severity levels

### Data Management
- [x] Historical data storage with efficient indexing
- [x] Data export to CSV format
- [x] Data export to PDF format
- [x] Device statistics and analytics
- [x] Configurable time ranges for data queries

### User Management
- [x] User creation and deletion (Admin only)
- [x] Password change functionality
- [x] User activity tracking (last login)
- [x] Active/Inactive user status
- [x] Session management with refresh tokens

### Security
- [x] Password hashing with bcrypt
- [x] JWT token authentication
- [x] HTTPS/SSL support
- [x] MQTT SSL/TLS encryption
- [x] CORS protection
- [x] Rate limiting
- [x] SQL injection prevention (parameterized queries)
- [x] XSS protection (Helmet.js)

### DevOps & Deployment
- [x] Environment-based configuration
- [x] PM2 process management
- [x] Nginx reverse proxy configuration
- [x] SSL certificate automation (Let's Encrypt)
- [x] Database migration scripts
- [x] Automated deployment scripts
- [x] Logging and error handling
- [x] Health check endpoints

## File Structure

```
SHARJ/
├── backend/                      # Node.js Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js      # PostgreSQL connection
│   │   ├── controllers/
│   │   │   ├── authController.js    # Authentication logic
│   │   │   ├── deviceController.js  # Device data operations
│   │   │   ├── userController.js    # User management
│   │   │   └── alertController.js   # Alert handling
│   │   ├── middleware/
│   │   │   └── auth.js          # JWT authentication middleware
│   │   ├── routes/
│   │   │   └── index.js         # API routes
│   │   ├── services/
│   │   │   ├── mqttService.js   # MQTT client and data handling
│   │   │   ├── alertService.js  # Alert creation and notifications
│   │   │   └── websocketService.js  # WebSocket server
│   │   ├── utils/
│   │   │   └── logger.js        # Winston logger
│   │   ├── scripts/
│   │   │   └── initDatabase.js  # Database initialization
│   │   └── server.js            # Express server entry point
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── frontend/                     # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx       # Main layout with sidebar
│   │   │   ├── WaterTankLevel.jsx   # Animated water tank
│   │   │   ├── PumpStatus.jsx   # Pump status card
│   │   │   └── PowerChart.jsx   # Recharts visualization
│   │   ├── pages/
│   │   │   ├── Login.jsx        # Login page
│   │   │   ├── Dashboard.jsx    # Main dashboard
│   │   │   ├── DeviceDetail.jsx # Device analytics
│   │   │   ├── Alerts.jsx       # Alert management
│   │   │   ├── Users.jsx        # User management (Admin)
│   │   │   └── Settings.jsx     # User settings
│   │   ├── services/
│   │   │   ├── api.js           # Axios API client
│   │   │   └── websocket.js     # WebSocket client
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  # Authentication state
│   │   │   └── ThemeContext.jsx # Theme management
│   │   ├── App.jsx              # Main app component
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── mqtt-config/                  # MQTT Broker Configuration
│   ├── mosquitto.conf           # Mosquitto configuration
│   └── setup-mosquitto.sh       # MQTT setup script
│
├── deployment/                   # Deployment Scripts
│   ├── deploy.sh                # Main deployment script
│   ├── nginx.conf               # Nginx configuration
│   ├── setup-ssl.sh             # SSL certificate setup
│   └── ecosystem.config.js      # PM2 configuration
│
├── README.md                     # Complete documentation
├── QUICKSTART.md                # Quick start guide
├── PROJECT_SUMMARY.md           # This file
└── test-mqtt.js                 # MQTT device simulator
```

## Database Schema

### Tables Created

1. **users** - User accounts and authentication
   - Primary key: `id`
   - Unique: `username`, `email`
   - Fields: password_hash, role, created_at, last_login, is_active

2. **devices** - IoT device registry
   - Primary key: `id`
   - Unique: `device_id`
   - Fields: device_name, location, latitude, longitude, last_seen

3. **device_data** - Time-series device telemetry
   - Primary key: `id`
   - Indexed: `device_id`, `timestamp`, `(device_id, timestamp)`
   - 48 fields for all sensor data
   - JSONB field for raw payload

4. **alerts** - System alerts
   - Primary key: `id`
   - Indexed: `device_id`, `timestamp`
   - Fields: alert_type, severity, acknowledged, acknowledged_by

5. **refresh_tokens** - JWT refresh token storage
   - Primary key: `id`
   - Foreign key: `user_id`
   - Fields: token, expires_at

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Devices
- `GET /api/devices` - List all devices
- `GET /api/devices/:deviceId` - Get device details
- `GET /api/devices/:deviceId/data` - Get device data with pagination
- `GET /api/devices/:deviceId/latest` - Get latest data point
- `GET /api/devices/:deviceId/historical` - Get historical data
- `GET /api/devices/:deviceId/stats` - Get device statistics
- `GET /api/devices/:deviceId/export/csv` - Export data as CSV
- `GET /api/devices/:deviceId/export/pdf` - Export data as PDF

### Alerts
- `GET /api/alerts` - Get alerts with filters
- `PUT /api/alerts/:alertId/acknowledge` - Acknowledge alert

### Users (Admin Only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user
- `POST /api/users/change-password` - Change password

### System
- `GET /health` - Health check endpoint

## Configuration

### Environment Variables

**Backend (.env):**
- Database: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- MQTT: MQTT_BROKER_URL, MQTT_USERNAME, MQTT_PASSWORD, MQTT_TOPIC
- JWT: JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET
- CORS: CORS_ORIGIN
- Alerts: SMTP_*, TELEGRAM_*

**Frontend (.env):**
- VITE_API_URL - Backend API endpoint
- VITE_WS_URL - WebSocket endpoint

## Testing

### Device Simulator
Run the included test script to simulate device data:

```bash
cd SHARJ
npm install mqtt  # Install mqtt dependency
node test-mqtt.js
```

This will:
- Connect to local MQTT broker
- Publish realistic device data every 5 seconds
- Simulate water level changes
- Trigger pumps based on water level
- Generate alerts when thresholds are exceeded

## Deployment Checklist

- [ ] Ubuntu VPS with SSH access
- [ ] Domain name with DNS configured
- [ ] Run `mqtt-config/setup-mosquitto.sh`
- [ ] Run `deployment/deploy.sh`
- [ ] Upload application code
- [ ] Configure `.env` files
- [ ] Initialize database
- [ ] Build frontend
- [ ] Configure Nginx
- [ ] Setup SSL certificates
- [ ] Start PM2 process
- [ ] Configure firewall
- [ ] Test all endpoints

## Performance Optimizations

1. **Database**
   - Indexed queries on device_id and timestamp
   - Connection pooling (20 connections)
   - Prepared statements to prevent SQL injection

2. **Backend**
   - PM2 cluster mode (2 instances)
   - Rate limiting (100 req/15min)
   - Gzip compression
   - Efficient MQTT message handling

3. **Frontend**
   - Vite build optimization
   - Code splitting
   - Lazy loading
   - Static asset caching
   - WebSocket for real-time updates (no polling)

4. **Infrastructure**
   - Nginx reverse proxy
   - SSL/TLS termination at Nginx
   - Static file serving from Nginx
   - WebSocket connection pooling

## Security Measures

1. **Authentication & Authorization**
   - Bcrypt password hashing (10 rounds)
   - JWT with short expiration (24h)
   - Refresh tokens with 7-day expiration
   - Role-based access control

2. **Network Security**
   - HTTPS/SSL everywhere
   - MQTT over TLS
   - CORS whitelisting
   - Helmet.js security headers

3. **Application Security**
   - Input validation (Joi)
   - SQL injection prevention (parameterized queries)
   - XSS protection
   - Rate limiting
   - Environment variable secrets

4. **Infrastructure Security**
   - Firewall configuration
   - Regular security updates
   - SSL certificate auto-renewal
   - Non-root user execution

## Monitoring & Maintenance

### Logs
- Backend: `/opt/stromwater/backend/logs/`
- PM2: `/var/log/pm2/`
- Nginx: `/var/log/nginx/`
- MQTT: `/var/log/mosquitto/`

### Commands
```bash
# Check services
pm2 status
sudo systemctl status mosquitto
sudo systemctl status nginx
sudo systemctl status postgresql

# View logs
pm2 logs stromwater-backend
sudo tail -f /var/log/mosquitto/mosquitto.log
sudo tail -f /var/log/nginx/stromwater-error.log

# Restart services
pm2 restart stromwater-backend
sudo systemctl restart mosquitto
sudo systemctl restart nginx

# Database backup
sudo -u postgres pg_dump stromwater_db > backup.sql
```

## Future Enhancements (Optional)

- [ ] Multi-tenancy support
- [ ] SMS alerts
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and ML predictions
- [ ] Data retention policies
- [ ] Audit logs
- [ ] API rate limiting per user
- [ ] Two-factor authentication
- [ ] MQTT message encryption
- [ ] Grafana integration
- [ ] Prometheus metrics

## Support

- Documentation: See README.md
- Quick Start: See QUICKSTART.md
- Issues: Create an issue in the repository

## License

MIT License

---

**Project Status:** Production Ready ✅

**Last Updated:** October 2025

**Built by:** Claude Code Assistant
