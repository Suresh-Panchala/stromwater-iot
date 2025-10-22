const express = require('express');
const authController = require('../controllers/authController');
const deviceController = require('../controllers/deviceController');
const exportController = require('../controllers/exportController');
const userController = require('../controllers/userController');
const alertController = require('../controllers/alertController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refreshToken);

// Protected routes
router.use(authenticate);

// Auth routes
router.get('/auth/profile', authController.getProfile);
router.post('/auth/logout', authController.logout);
router.post('/users/change-password', userController.changePassword);

// Device routes
router.get('/devices', deviceController.getDevices);
router.get('/devices/:deviceId', deviceController.getDeviceById);
router.get('/devices/:deviceId/data', deviceController.getDeviceData);
router.get('/devices/:deviceId/latest', deviceController.getLatestData);
router.get('/devices/:deviceId/historical', deviceController.getHistoricalData);
router.get('/devices/:deviceId/stats', deviceController.getDeviceStats);
router.get('/devices/:deviceId/export/csv', exportController.exportCSV);
router.get('/devices/:deviceId/export/pdf', exportController.exportPDF);

// Alert routes
router.get('/alerts', alertController.getAlerts);
router.put('/alerts/:alertId/acknowledge', alertController.acknowledgeAlert);

// Admin-only routes
router.post('/auth/register', authorize('admin'), authController.register);
router.get('/users', authorize('admin'), userController.getAllUsers);
router.post('/users', authorize('admin'), userController.createUser);
router.put('/users/:userId', authorize('admin'), userController.updateUser);
router.delete('/users/:userId', authorize('admin'), userController.deleteUser);

module.exports = router;
