import { useEffect, useState } from 'react';
import { deviceAPI } from '../services/api';
import { Plus, Edit2, Trash2, MapPin, Activity, RefreshCw, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState({
    device_id: '',
    device_name: '',
    location: '',
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await deviceAPI.getAllDevices();

      // Safely extract array from response
      const devicesData = Array.isArray(response.data) ? response.data : [];
      setDevices(devicesData);
    } catch (err) {
      console.error('Load devices error:', err);
      const errorMsg = err?.response?.data?.error || 'Failed to load devices';
      setError(errorMsg);
      toast.error(errorMsg);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingDevice) {
        await deviceAPI.updateDevice(editingDevice.device_id, formData);
        toast.success('Device updated successfully');
      } else {
        await deviceAPI.createDevice(formData);
        toast.success('Device created successfully');
      }

      setShowModal(false);
      setEditingDevice(null);
      setFormData({
        device_id: '',
        device_name: '',
        location: '',
        latitude: '',
        longitude: '',
      });
      loadDevices();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save device');
      console.error(err);
    }
  };

  const handleEdit = (device) => {
    setEditingDevice(device);
    setFormData({
      device_id: device.device_id,
      device_name: device.device_name || '',
      location: device.location || '',
      latitude: device.latitude || '',
      longitude: device.longitude || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (device) => {
    if (!window.confirm(`Are you sure you want to delete device "${device.device_name}"?`)) {
      return;
    }

    try {
      await deviceAPI.deleteDevice(device.device_id);
      toast.success('Device deleted successfully');
      loadDevices();
    } catch (err) {
      toast.error('Failed to delete device');
      console.error(err);
    }
  };

  const handleAdd = () => {
    setEditingDevice(null);
    setFormData({
      device_id: '',
      device_name: '',
      location: '',
      latitude: '',
      longitude: '',
    });
    setShowModal(true);
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
            Device Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Add, edit, and manage IoT devices
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadDevices}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleAdd}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Device
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
                Error
              </h3>
              <p className="text-red-700 dark:text-red-400 mb-4">
                {error}
              </p>
              <button
                onClick={loadDevices}
                className="btn btn-primary flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.length === 0 ? (
          <div className="col-span-full card text-center py-12">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No devices found</p>
            <button
              onClick={handleAdd}
              className="btn btn-primary mt-4 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Your First Device
            </button>
          </div>
        ) : (
          devices.map((device) => (
            <div
              key={device.id}
              className={`card relative ${
                device.is_active
                  ? 'border-l-4 border-green-500'
                  : 'border-l-4 border-gray-400 opacity-60'
              }`}
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    device.is_active
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {device.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Device Info */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {device.device_name || device.device_id}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                  ID: {device.device_id}
                </p>
              </div>

              {/* Location */}
              {device.location && (
                <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{device.location}</span>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Data</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {device.total_data_count || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Last Seen</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {device.last_data_timestamp
                      ? new Date(device.last_data_timestamp).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(device)}
                  className="flex-1 btn btn-secondary text-sm py-2 flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(device)}
                  className="flex-1 btn bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 text-sm py-2 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setShowModal(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingDevice ? 'Edit Device' : 'Add New Device'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Device ID */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Device ID *
                  </label>
                  <input
                    type="text"
                    value={formData.device_id}
                    onChange={(e) =>
                      setFormData({ ...formData, device_id: e.target.value })
                    }
                    className="input"
                    placeholder="e.g., StromWater_Device_3"
                    required
                    disabled={!!editingDevice}
                  />
                  {editingDevice && (
                    <p className="text-xs text-gray-500 mt-1">Device ID cannot be changed</p>
                  )}
                </div>

                {/* Device Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Device Name *
                  </label>
                  <input
                    type="text"
                    value={formData.device_name}
                    onChange={(e) =>
                      setFormData({ ...formData, device_name: e.target.value })
                    }
                    className="input"
                    placeholder="e.g., Abu Dhabi Pump Station"
                    required
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="input"
                    placeholder="e.g., Abu Dhabi, UAE"
                  />
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) =>
                        setFormData({ ...formData, latitude: e.target.value })
                      }
                      className="input"
                      placeholder="25.276987"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) =>
                        setFormData({ ...formData, longitude: e.target.value })
                      }
                      className="input"
                      placeholder="55.296249"
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {editingDevice ? 'Update Device' : 'Create Device'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Devices;
