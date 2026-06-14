import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function ProceedButton({
  label = 'Proceed to Analysis',
  disabled = false,
  onClick,
  count,
  fullWidth = true,
  className = '',
}) {
  return (
    <motion.button
      type="button"
      whileHover={disabled ? undefined : { scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.99 }}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-600 disabled:shadow-none ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      <span>{label}</span>
      {count != null && (
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{count}</span>
      )}
      <ArrowRight size={18} className={disabled ? '' : 'animate-pulse'} />
    </motion.button>
  );
}
