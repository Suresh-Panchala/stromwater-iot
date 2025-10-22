const alertService = require('../services/alertService');

exports.getAlerts = async (req, res) => {
  try {
    const { deviceId, severity, acknowledged, limit, offset } = req.query;

    const alerts = await alertService.getAlerts({
      deviceId,
      severity,
      acknowledged: acknowledged === 'true' ? true : acknowledged === 'false' ? false : undefined,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
    });

    res.json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

exports.acknowledgeAlert = async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await alertService.acknowledgeAlert(alertId, req.user.id);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
};
