import { motion } from 'framer-motion';
import { formatConfidence } from '../../utils/formatters';

export function ConfidenceBar({ value, label = 'Stitching Confidence' }) {
  const pct = Math.min(100, Math.max(0, Math.round((value || 0) * 100)));

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-blue-600">{formatConfidence(value)}</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className="h-full origin-left rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: pct / 100 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
