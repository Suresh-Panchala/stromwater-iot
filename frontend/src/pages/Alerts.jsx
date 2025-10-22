import { useEffect, useState } from 'react';
import { alertAPI } from '../services/api';
import { AlertTriangle, CheckCircle, Clock, Filter } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    try {
      const params = {};
      if (filter === 'unacknowledged') params.acknowledged = false;
      if (filter === 'acknowledged') params.acknowledged = true;

      const response = await alertAPI.getAlerts(params);

      // Handle different response formats
      let alertData = response.data;

      // If data is an object with a data property, extract it
      if (alertData && typeof alertData === 'object' && !Array.isArray(alertData)) {
        if (alertData.data && Array.isArray(alertData.data)) {
          alertData = alertData.data;
        } else if (alertData.alerts && Array.isArray(alertData.alerts)) {
          alertData = alertData.alerts;
        } else {
          // If it's an object but not an array, convert to empty array
          console.warn('Unexpected alerts data format:', alertData);
          alertData = [];
        }
      }

      // Ensure alertData is an array
      if (!Array.isArray(alertData)) {
        console.warn('Alerts data is not an array:', alertData);
        alertData = [];
      }

      setAlerts(alertData);
    } catch (error) {
      toast.error('Failed to load alerts');
      console.error('Alerts load error:', error);
      setAlerts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await alertAPI.acknowledgeAlert(alertId);
      toast.success('Alert acknowledged');
      loadAlerts();
    } catch (error) {
      toast.error('Failed to acknowledge alert');
      console.error(error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Alerts
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage system alerts
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Alerts</option>
            <option value="unacknowledged">Unacknowledged</option>
            <option value="acknowledged">Acknowledged</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {alerts.length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unacknowledged</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {alerts.filter((a) => !a.acknowledged).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Acknowledged</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {alerts.filter((a) => a.acknowledged).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="card text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No alerts to display</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`card border-l-4 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-semibold">{alert.alert_type}</span>
                    <span className="px-2 py-1 text-xs rounded-full bg-white/50 dark:bg-gray-900/50">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{alert.alert_message}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <span>Device: {alert.device_id}</span>
                    <span>
                      Time: {format(new Date(alert.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                    </span>
                    {alert.acknowledged && (
                      <span className="text-green-600 dark:text-green-400">
                        Acknowledged at{' '}
                        {format(new Date(alert.acknowledged_at), 'MMM dd, yyyy HH:mm')}
                      </span>
                    )}
                  </div>
                </div>

                {!alert.acknowledged && (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="btn btn-primary whitespace-nowrap"
                  >
                    <CheckCircle className="w-4 h-4 mr-2 inline" />
                    Acknowledge
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Alerts;
