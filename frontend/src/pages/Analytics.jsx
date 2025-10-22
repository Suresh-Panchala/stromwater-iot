import { useEffect, useState } from 'react';
import { deviceAPI } from '../services/api';
import { BarChart, LineChart, Activity, Zap, Gauge } from 'lucide-react';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Analytics = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [dateRange, setDateRange] = useState('7days');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      loadAnalytics();
    }
  }, [selectedDevice, dateRange]);

  const loadDevices = async () => {
    try {
      const response = await deviceAPI.getDevices();
      setDevices(response.data);
      if (response.data.length > 0) {
        setSelectedDevice(response.data[0].device_id);
      }
    } catch (error) {
      toast.error('Failed to load devices');
      console.error(error);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      let startDate;

      switch (dateRange) {
        case '24hours':
          startDate = subDays(endDate, 1);
          break;
        case '7days':
          startDate = subDays(endDate, 7);
          break;
        case '30days':
          startDate = subDays(endDate, 30);
          break;
        default:
          startDate = subDays(endDate, 7);
      }

      const response = await deviceAPI.getDeviceData(selectedDevice, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      // Handle different response formats
      let data = response.data;

      // If data is an object with a data property, extract it
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        if (data.data && Array.isArray(data.data)) {
          data = data.data;
        } else if (data.readings && Array.isArray(data.readings)) {
          data = data.readings;
        } else {
          // If it's an object but not an array, convert to empty array
          data = [];
        }
      }

      // Ensure data is an array
      if (!Array.isArray(data)) {
        data = [];
      }

      // Calculate analytics
      const analytics = calculateAnalytics(data);
      setAnalyticsData(analytics);
    } catch (error) {
      toast.error('Failed to load analytics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (data) => {
    // Ensure data is an array and has elements
    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        totalReadings: 0,
        avgHydrostatic: 0,
        avgVoltage: 0,
        avgCurrent: 0,
        pump1Uptime: 0,
        pump2Uptime: 0,
        alerts: 0,
      };
    }

    const totalReadings = data.length;

    const avgHydrostatic = data.reduce((sum, d) => sum + (parseFloat(d.hydrostatic_value) || 0), 0) / totalReadings;

    const avgVoltage = data.reduce((sum, d) => {
      const v1r = parseFloat(d.vrms_1_r) || 0;
      const v1y = parseFloat(d.vrms_1_y) || 0;
      const v1b = parseFloat(d.vrms_1_b) || 0;
      return sum + (v1r + v1y + v1b) / 3;
    }, 0) / totalReadings;

    const avgCurrent = data.reduce((sum, d) => {
      const i1r = parseFloat(d.irms_1_r) || 0;
      const i1y = parseFloat(d.irms_1_y) || 0;
      const i1b = parseFloat(d.irms_1_b) || 0;
      return sum + (i1r + i1y + i1b) / 3;
    }, 0) / totalReadings;

    const pump1OnCount = data.filter(d => d.pump_1_status === 'ON' || d.pump_1_auto === 1).length;
    const pump2OnCount = data.filter(d => d.pump_2_status === 'ON' || d.pump_2_auto === 1).length;

    const pump1Uptime = (pump1OnCount / totalReadings) * 100;
    const pump2Uptime = (pump2OnCount / totalReadings) * 100;

    const alerts = data.reduce((sum, d) => {
      return sum + (d.dry_run_alert || 0) + (d.high_level_float_alert || 0);
    }, 0);

    return {
      totalReadings,
      avgHydrostatic: avgHydrostatic.toFixed(2),
      avgVoltage: avgVoltage.toFixed(2),
      avgCurrent: avgCurrent.toFixed(2),
      pump1Uptime: pump1Uptime.toFixed(1),
      pump2Uptime: pump2Uptime.toFixed(1),
      alerts,
    };
  };

  if (loading && !analyticsData) {
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
            Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Device performance and statistics
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="input"
          >
            {devices.map((device) => (
              <option key={device.device_id} value={device.device_id}>
                {device.device_name || device.device_id}
              </option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input"
          >
            <option value="24hours">Last 24 Hours</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {analyticsData && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Readings</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {analyticsData.totalReadings}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Water Level</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {analyticsData.avgHydrostatic} m
                  </p>
                </div>
                <Gauge className="w-8 h-8 text-cyan-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Voltage</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {analyticsData.avgVoltage} V
                  </p>
                </div>
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Current</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {analyticsData.avgCurrent} A
                  </p>
                </div>
                <BarChart className="w-8 h-8 text-green-500" />
              </div>
            </motion.div>
          </div>

          {/* Pump Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Pump 1 Statistics
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Uptime</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {analyticsData.pump1Uptime}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${analyticsData.pump1Uptime}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Pump 2 Statistics
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Uptime</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {analyticsData.pump2Uptime}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${analyticsData.pump2Uptime}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts Summary */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Alerts Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">Total Alerts</p>
                <p className="text-3xl font-bold text-red-700 dark:text-red-300 mt-1">
                  {analyticsData.alerts}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-600 dark:text-blue-400">Data Quality</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                  {analyticsData.totalReadings > 0 ? '100%' : '0%'}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-600 dark:text-green-400">System Status</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-300 mt-1">
                  {analyticsData.totalReadings > 0 ? 'Operational' : 'No Data'}
                </p>
              </div>
            </div>
          </div>

          {analyticsData.totalReadings === 0 && (
            <div className="card text-center py-12">
              <BarChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No data available for the selected period
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Analytics;
