import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'border-emerald-200 bg-white text-emerald-700',
  error: 'border-red-200 bg-white text-red-700',
  warning: 'border-amber-200 bg-white text-amber-700',
  info: 'border-blue-200 bg-white text-blue-700',
};

function ToastItem({ toast, onDismiss }) {
  const Icon = icons[toast.variant] || Info;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-xl ${styles[toast.variant]}`}
      role="status"
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <p className="flex-1 text-sm text-gray-700">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  return (
    <div
      className="fixed top-4 right-4 z-[90] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
