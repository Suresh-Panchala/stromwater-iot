import { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { deviceAPI } from '../services/api';
import { Activity } from 'lucide-react';

const PumpTrendChart = ({ deviceId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPumpTrends = useCallback(async () => {
    try {
      setLoading(true);
      const response = await deviceAPI.getHistoricalData(deviceId, 24);

      // Safely extract array from response
      const rawData = Array.isArray(response.data) ? response.data : [];

      // Transform data for chart
      const chartData = rawData.map(item => ({
        time: new Date(item.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        pump1: item.pump_1_contactor_feedback === 1 ? 1 : 0,
        pump2: item.pump_2_contactor_feedback === 1 ? 1 : 0,
      }));

      setData(chartData.reverse().slice(-50)); // Last 50 readings
    } catch (error) {
      console.error('Failed to load pump trends:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    loadPumpTrends();
  }, [loadPumpTrends]);

  if (loading) {
    return (
      <div className="card flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">No pump data available</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pump ON/OFF Trends (24h)
          </h3>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
          <XAxis
            dataKey="time"
            stroke="#6B7280"
            tick={{ fill: '#6B7280', fontSize: 12 }}
          />
          <YAxis
            stroke="#6B7280"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            domain={[0, 1]}
            ticks={[0, 1]}
            tickFormatter={(value) => value === 1 ? 'ON' : 'OFF'}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value) => value === 1 ? 'ON' : 'OFF'}
          />
          <Legend />
          <Line
            type="stepAfter"
            dataKey="pump1"
            stroke="#10B981"
            strokeWidth={2}
            name="Pump 1"
            dot={false}
          />
          <Line
            type="stepAfter"
            dataKey="pump2"
            stroke="#3B82F6"
            strokeWidth={2}
            name="Pump 2"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PumpTrendChart;
