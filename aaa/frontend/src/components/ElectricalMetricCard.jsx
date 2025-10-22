import { motion } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown } from 'lucide-react';

const ElectricalMetricCard = ({ title, value, unit, phase, type, trend }) => {
  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'R': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'Y': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'B': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50';
    }
  };

  const getTypeIcon = (type) => {
    return <Zap className="w-4 h-4" />;
  };

  const displayValue = typeof value === 'number' ? value.toFixed(2) : (value ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded ${getPhaseColor(phase)}`}>
            {getTypeIcon(type)}
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {title}
            </p>
            {phase && (
              <p className="text-xs font-semibold" style={{
                color: phase === 'R' ? '#DC2626' : phase === 'Y' ? '#D97706' : '#2563EB'
              }}>
                Phase {phase}
              </p>
            )}
          </div>
        </div>
        {trend && (
          <div className={`text-xs flex items-center ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-400'
          }`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-1">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {displayValue}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {unit}
        </span>
      </div>
    </motion.div>
  );
};

export default ElectricalMetricCard;
