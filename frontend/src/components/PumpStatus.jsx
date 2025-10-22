import { motion } from 'framer-motion';
import { Power, Settings, Shield, CircleDot } from 'lucide-react';

const PumpStatus = ({ pumpNumber, data = {} }) => {
  const isOn = data[`pump_${pumpNumber}_contactor_feedback`] === 1;
  const isManual = data[`pump_${pumpNumber}_manual`] === 1;
  const isAuto = data[`pump_${pumpNumber}_auto`] === 1;
  const isProtected = data[`pump_${pumpNumber}_protection`] === 1;

  const getMode = () => {
    if (isProtected) return { label: 'PROTECTED', color: 'red' };
    if (isManual) return { label: 'MANUAL', color: 'blue' };
    if (isAuto) return { label: 'AUTO', color: 'green' };
    return { label: 'OFF', color: 'gray' };
  };

  const mode = getMode();

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Pump {pumpNumber}
        </h3>
        <motion.div
          animate={{
            scale: isOn ? [1, 1.2, 1] : 1,
          }}
          transition={{
            duration: 1,
            repeat: isOn ? Infinity : 0,
          }}
        >
          <Power
            className={`w-6 h-6 ${
              isOn ? 'text-green-500' : 'text-gray-400'
            }`}
          />
        </motion.div>
      </div>

      <div className="space-y-4">
        {/* Status indicator */}
        <div className="flex items-center justify-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <div className="relative">
            <motion.div
              className={`w-24 h-24 rounded-full flex items-center justify-center ${
                isOn
                  ? 'bg-green-500 shadow-lg shadow-green-500/50'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
              animate={{
                boxShadow: isOn
                  ? [
                      '0 0 20px rgba(34, 197, 94, 0.5)',
                      '0 0 40px rgba(34, 197, 94, 0.8)',
                      '0 0 20px rgba(34, 197, 94, 0.5)',
                    ]
                  : 'none',
              }}
              transition={{
                duration: 2,
                repeat: isOn ? Infinity : 0,
              }}
            >
              <span className="text-2xl font-bold text-white">
                {isOn ? 'ON' : 'OFF'}
              </span>
            </motion.div>
          </div>
        </div>

        {/* Mode badges */}
        <div className="grid grid-cols-3 gap-2">
          <div
            className={`flex items-center justify-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
              isManual
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            <Settings className="w-3 h-3" />
            <span>Manual</span>
          </div>

          <div
            className={`flex items-center justify-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
              isAuto
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            <CircleDot className="w-3 h-3" />
            <span>Auto</span>
          </div>

          <div
            className={`flex items-center justify-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
              isProtected
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>Protected</span>
          </div>
        </div>

        {/* Electrical parameters */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Voltage (R/Y/B)</span>
            <span className="font-mono text-gray-900 dark:text-white">
              {data[`vrms_${pumpNumber}_r`] ?? 0}/{data[`vrms_${pumpNumber}_y`] ?? 0}/{data[`vrms_${pumpNumber}_b`] ?? 0} V
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Current (R/Y/B)</span>
            <span className="font-mono text-gray-900 dark:text-white">
              {data[`irms_${pumpNumber}_r`] ?? 0}/{data[`irms_${pumpNumber}_y`] ?? 0}/{data[`irms_${pumpNumber}_b`] ?? 0} A
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Frequency</span>
            <span className="font-mono text-gray-900 dark:text-white">
              {data[`freq_${pumpNumber}_r`] ?? 0} Hz
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PumpStatus;
