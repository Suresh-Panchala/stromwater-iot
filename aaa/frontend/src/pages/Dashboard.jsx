import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deviceAPI } from '../services/api';
import websocketService from '../services/websocket';
import WaterTankLevel from '../components/WaterTankLevel';
import PumpStatus from '../components/PumpStatus';
import PowerChart from '../components/PowerChart';
import PumpTrendChart from '../components/PumpTrendChart';
import DeviceMap from '../components/DeviceMap';
import ElectricalMetricCard from '../components/ElectricalMetricCard';
import { MapPin, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [latestData, setLatestData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();

    // WebSocket listeners
    const unsubscribe = websocketService.on('device_update', (data) => {
      if (data.deviceId === selectedDevice?.device_id) {
        setLatestData(data.data);
      }
    });

    const alertListener = websocketService.on('alert', (alert) => {
      toast.error(`Alert: ${alert.alert_message}`, {
        icon: '🚨',
        duration: 5000,
      });
    });

    return () => {
      unsubscribe();
      alertListener();
    };
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      loadLatestData(selectedDevice.device_id);
      websocketService.subscribe(selectedDevice.device_id);
    }
  }, [selectedDevice]);

  const loadDevices = async () => {
    try {
      const response = await deviceAPI.getDevices();
      setDevices(response.data);
      if (response.data.length > 0) {
        setSelectedDevice(response.data[0]);
      }
    } catch (error) {
      toast.error('Failed to load devices');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadLatestData = async (deviceId) => {
    try {
      const response = await deviceAPI.getLatestData(deviceId);
      setLatestData(response.data);
    } catch (error) {
      console.error('Failed to load latest data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!selectedDevice || !latestData) {
    return (
      <div className="text-center py-12">
        <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No device data available</p>
      </div>
    );
  }

  const alerts = [];
  if (latestData.dry_run_alert === 1) {
    alerts.push({ type: 'error', message: 'Dry Run Alert Active!' });
  }
  if (latestData.high_level_float_alert === 1) {
    alerts.push({ type: 'warning', message: 'High Water Level Alert!' });
  }
  if (latestData.pump_1_protection === 1) {
    alerts.push({ type: 'error', message: 'Pump 1 Protection Active!' });
  }
  if (latestData.pump_2_protection === 1) {
    alerts.push({ type: 'error', message: 'Pump 2 Protection Active!' });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time monitoring of StromWater devices
          </p>
        </div>

        {devices.length > 1 && (
          <select
            value={selectedDevice?.device_id}
            onChange={(e) =>
              setSelectedDevice(devices.find((d) => d.device_id === e.target.value))
            }
            className="input max-w-xs"
          >
            {devices.map((device) => (
              <option key={device.device_id} value={device.device_id}>
                {device.device_name || device.device_id}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`flex items-center space-x-3 p-4 rounded-lg ${
                alert.type === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
              }`}
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{alert.message}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Device Info */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {selectedDevice.device_name || selectedDevice.device_id}
            </h2>
            <div className="flex items-center space-x-2 mt-1 text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>{selectedDevice.location}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Live {new Date(latestData.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Water Level */}
        <div className="card flex items-center justify-center">
          <WaterTankLevel level={latestData.hydrostatic_value} maxLevel={100} />
        </div>

        {/* Pump 1 Status */}
        <PumpStatus pumpNumber={1} data={latestData} />

        {/* Pump 2 Status */}
        <PumpStatus pumpNumber={2} data={latestData} />
      </div>

      {/* Map and Pump Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeviceMap device={selectedDevice} />
        <PumpTrendChart deviceId={selectedDevice.device_id} />
      </div>

      {/* Electrical Parameters - Pump 1 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Pump 1 - Electrical Parameters
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <ElectricalMetricCard
            title="Voltage"
            value={latestData.vrms_1_r}
            unit="V"
            phase="R"
            type="voltage"
          />
          <ElectricalMetricCard
            title="Voltage"
            value={latestData.vrms_1_y}
            unit="V"
            phase="Y"
            type="voltage"
          />
          <ElectricalMetricCard
            title="Voltage"
            value={latestData.vrms_1_b}
            unit="V"
            phase="B"
            type="voltage"
          />
          <ElectricalMetricCard
            title="Current"
            value={latestData.irms_1_r}
            unit="A"
            phase="R"
            type="current"
          />
          <ElectricalMetricCard
            title="Current"
            value={latestData.irms_1_y}
            unit="A"
            phase="Y"
            type="current"
          />
          <ElectricalMetricCard
            title="Current"
            value={latestData.irms_1_b}
            unit="A"
            phase="B"
            type="current"
          />
          <ElectricalMetricCard
            title="Power"
            value={latestData.power_1_r}
            unit="W"
            phase="R"
            type="power"
          />
          <ElectricalMetricCard
            title="Power"
            value={latestData.power_1_y}
            unit="W"
            phase="Y"
            type="power"
          />
          <ElectricalMetricCard
            title="Power"
            value={latestData.power_1_b}
            unit="W"
            phase="B"
            type="power"
          />
          <ElectricalMetricCard
            title="Frequency"
            value={latestData.freq_1_r}
            unit="Hz"
            phase="R"
            type="frequency"
          />
          <ElectricalMetricCard
            title="Frequency"
            value={latestData.freq_1_y}
            unit="Hz"
            phase="Y"
            type="frequency"
          />
          <ElectricalMetricCard
            title="Frequency"
            value={latestData.freq_1_b}
            unit="Hz"
            phase="B"
            type="frequency"
          />
          <ElectricalMetricCard
            title="Energy"
            value={latestData.vahr_1_r}
            unit="VAh"
            phase="R"
            type="energy"
          />
          <ElectricalMetricCard
            title="Energy"
            value={latestData.vahr_1_y}
            unit="VAh"
            phase="Y"
            type="energy"
          />
          <ElectricalMetricCard
            title="Energy"
            value={latestData.vahr_1_b}
            unit="VAh"
            phase="B"
            type="energy"
          />
        </div>
      </div>

      {/* Electrical Parameters - Pump 2 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Pump 2 - Electrical Parameters
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <ElectricalMetricCard
            title="Voltage"
            value={latestData.vrms_2_r}
            unit="V"
            phase="R"
            type="voltage"
          />
          <ElectricalMetricCard
            title="Voltage"
            value={latestData.vrms_2_y}
            unit="V"
            phase="Y"
            type="voltage"
          />
          <ElectricalMetricCard
            title="Voltage"
            value={latestData.vrms_2_b}
            unit="V"
            phase="B"
            type="voltage"
          />
          <ElectricalMetricCard
            title="Current"
            value={latestData.irms_2_r}
            unit="A"
            phase="R"
            type="current"
          />
          <ElectricalMetricCard
            title="Current"
            value={latestData.irms_2_y}
            unit="A"
            phase="Y"
            type="current"
          />
          <ElectricalMetricCard
            title="Current"
            value={latestData.irms_2_b}
            unit="A"
            phase="B"
            type="current"
          />
          <ElectricalMetricCard
            title="Power"
            value={latestData.power_2_r}
            unit="W"
            phase="R"
            type="power"
          />
          <ElectricalMetricCard
            title="Power"
            value={latestData.power_2_y}
            unit="W"
            phase="Y"
            type="power"
          />
          <ElectricalMetricCard
            title="Power"
            value={latestData.power_2_b}
            unit="W"
            phase="B"
            type="power"
          />
          <ElectricalMetricCard
            title="Frequency"
            value={latestData.freq_2_r}
            unit="Hz"
            phase="R"
            type="frequency"
          />
          <ElectricalMetricCard
            title="Frequency"
            value={latestData.freq_2_y}
            unit="Hz"
            phase="Y"
            type="frequency"
          />
          <ElectricalMetricCard
            title="Frequency"
            value={latestData.freq_2_b}
            unit="Hz"
            phase="B"
            type="frequency"
          />
          <ElectricalMetricCard
            title="Energy"
            value={latestData.vahr_2_r}
            unit="VAh"
            phase="R"
            type="energy"
          />
          <ElectricalMetricCard
            title="Energy"
            value={latestData.vahr_2_y}
            unit="VAh"
            phase="Y"
            type="energy"
          />
          <ElectricalMetricCard
            title="Energy"
            value={latestData.vahr_2_b}
            unit="VAh"
            phase="B"
            type="energy"
          />
        </div>
      </div>

      {/* Power Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PowerChart
          deviceId={selectedDevice.device_id}
          title="Voltage Trends (24h)"
          dataKey="voltage"
        />
        <PowerChart
          deviceId={selectedDevice.device_id}
          title="Current Trends (24h)"
          dataKey="current"
        />
      </div>

      {/* Legacy Quick Stats - Hidden */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 hidden">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Voltage</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {((latestData.vrms_1_r + latestData.vrms_1_y + latestData.vrms_1_b) / 3).toFixed(1)}V
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Frequency</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {latestData.freq_1_r} Hz
              </p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pump 1 Current</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {latestData.irms_1_r} A
              </p>
            </div>
            <Activity className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pump 2 Current</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {latestData.irms_2_r} A
              </p>
            </div>
            <Activity className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Link
          to={`/device/${selectedDevice.device_id}`}
          className="btn btn-primary"
        >
          View Detailed Analytics
        </Link>
        <Link to="/alerts" className="btn btn-secondary">
          View All Alerts
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
