import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { deviceAPI } from '../services/api';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import PowerChart from '../components/PowerChart';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

const DeviceDetail = () => {
  const { deviceId } = useParams();
  const [device, setDevice] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeviceData();
  }, [deviceId]);

  const loadDeviceData = async () => {
    try {
      const [deviceRes, statsRes] = await Promise.all([
        deviceAPI.getDeviceById(deviceId),
        deviceAPI.getDeviceStats(deviceId, 24),
      ]);
      setDevice(deviceRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to load device data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const response =
        format === 'csv'
          ? await deviceAPI.exportCSV(deviceId, {})
          : await deviceAPI.exportPDF(deviceId, {});

      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/pdf',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${deviceId}_data.${format}`;
      link.click();

      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export data');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!device) {
    return <div className="text-center py-12">Device not found</div>;
  }

  const position = [device.latitude || 25.276987, device.longitude || 55.296249];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {device.device_name || device.device_id}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Detailed analytics and insights
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="btn btn-secondary"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="btn btn-secondary"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Hydrostatic</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {parseFloat(stats.avg_hydrostatic).toFixed(2)}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Voltage</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {parseFloat(stats.avg_voltage).toFixed(1)}V
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pump 1 Runtime</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.pump_1_on_count} cycles
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pump 2 Runtime</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.pump_2_on_count} cycles
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PowerChart deviceId={deviceId} title="Voltage (24h)" dataKey="voltage" />
        <PowerChart deviceId={deviceId} title="Current (24h)" dataKey="current" />
        <PowerChart deviceId={deviceId} title="Power (24h)" dataKey="power" />
      </div>

      {/* Map */}
      {device.latitude && device.longitude && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Device Location
          </h3>
          <div className="h-96 rounded-lg overflow-hidden">
            <MapContainer
              center={position}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={position}>
                <Popup>
                  {device.device_name || device.device_id}
                  <br />
                  {device.location}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceDetail;
