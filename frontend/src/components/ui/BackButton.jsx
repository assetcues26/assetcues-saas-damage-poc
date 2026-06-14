import { ChevronLeft } from 'lucide-react';

export function BackButton({ label = 'Back', onClick, variant = 'light' }) {
  const isDark = variant === 'dark';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`touch-manipulation inline-flex min-h-11 items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
        isDark
          ? 'text-gray-200 active:bg-gray-800 active:text-white'
          : 'text-gray-700 active:bg-gray-100 active:text-gray-900'
      }`}
      aria-label={label}
    >
      <ChevronLeft size={20} />
      <span>{label}</span>
    </button>
  );
}
