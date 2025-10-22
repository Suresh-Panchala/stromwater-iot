import { motion } from 'framer-motion';

const WaterTankLevel = ({ level, maxLevel = 100 }) => {
  // Handle null/undefined level and convert to number
  const numLevel = Number(level) || 0;
  const numMaxLevel = Number(maxLevel) || 100;
  const percentage = Math.min(Math.max((numLevel / numMaxLevel) * 100, 0), 100);

  const getColor = () => {
    if (percentage > 75) return 'from-red-400 to-red-600';
    if (percentage > 50) return 'from-yellow-400 to-yellow-600';
    if (percentage > 25) return 'from-blue-400 to-blue-600';
    return 'from-green-400 to-green-600';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-64 bg-gray-200 dark:bg-gray-700 rounded-lg border-4 border-gray-300 dark:border-gray-600 overflow-hidden">
        {/* Water level */}
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${getColor()}`}
        >
          {/* Wave effect */}
          <div className="wave absolute top-0 left-0 right-0 h-4 bg-white opacity-20 rounded-full" />
        </motion.div>

        {/* Level markers */}
        <div className="absolute inset-0 flex flex-col justify-between py-2 px-2 pointer-events-none">
          {[100, 75, 50, 25, 0].map((mark) => (
            <div
              key={mark}
              className="flex items-center justify-between text-xs font-mono"
            >
              <span className="text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 px-1 rounded">
                {mark}%
              </span>
              <div className="flex-1 mx-2 border-t border-dashed border-gray-400 dark:border-gray-500" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-center">
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {numLevel.toFixed(1)}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Hydrostatic Value
        </div>
      </div>
    </div>
  );
};

export default WaterTankLevel;
