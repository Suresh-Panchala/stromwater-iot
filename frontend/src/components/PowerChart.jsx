import { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { deviceAPI } from '../services/api';
import { format } from 'date-fns';

const PowerChart = ({ deviceId, title, dataKey }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const response = await deviceAPI.getHistoricalData(deviceId, 24);

      // Safely extract array from response
      const rawData = Array.isArray(response.data) ? response.data : [];

      const formattedData = rawData.map((item) => ({
        timestamp: format(new Date(item.timestamp), 'HH:mm'),
        ...formatDataByKey(item, dataKey),
      }));
      setData(formattedData);
    } catch (error) {
      console.error('Failed to load chart data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId, dataKey]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [loadData]);

  const formatDataByKey = (item, key) => {
    if (key === 'voltage') {
      return {
        'Pump 1 R': item.vrms_1_r || 0,
        'Pump 1 Y': item.vrms_1_y || 0,
        'Pump 1 B': item.vrms_1_b || 0,
        'Pump 2 R': item.vrms_2_r || 0,
        'Pump 2 Y': item.vrms_2_y || 0,
        'Pump 2 B': item.vrms_2_b || 0,
      };
    } else if (key === 'current') {
      return {
        'Pump 1 R': item.irms_1_r || 0,
        'Pump 1 Y': item.irms_1_y || 0,
        'Pump 1 B': item.irms_1_b || 0,
        'Pump 2 R': item.irms_2_r || 0,
        'Pump 2 Y': item.irms_2_y || 0,
        'Pump 2 B': item.irms_2_b || 0,
      };
    } else if (key === 'power') {
      return {
        'Pump 1 R': item.power_1_r || 0,
        'Pump 1 Y': item.power_1_y || 0,
        'Pump 1 B': item.power_1_b || 0,
        'Pump 2 R': item.power_2_r || 0,
        'Pump 2 Y': item.power_2_y || 0,
        'Pump 2 B': item.power_2_b || 0,
      };
    }
    return {};
  };

  const getColors = () => {
    return {
      'Pump 1 R': '#ef4444',
      'Pump 1 Y': '#eab308',
      'Pump 1 B': '#3b82f6',
      'Pump 2 R': '#f97316',
      'Pump 2 Y': '#84cc16',
      'Pump 2 B': '#06b6d4',
    };
  };

  if (loading) {
    return (
      <div className="card h-80 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card h-80 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  const colors = getColors();

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="timestamp"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
          />
          <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f3f4f6',
            }}
          />
          <Legend />
          {Object.keys(colors).map((key) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[key]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PowerChart;
