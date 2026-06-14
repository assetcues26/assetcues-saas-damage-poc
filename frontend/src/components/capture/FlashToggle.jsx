import { Zap, ZapOff, Sun } from 'lucide-react';

const modes = {
  off: { icon: ZapOff, label: 'Flash off' },
  on: { icon: Zap, label: 'Flash on' },
  auto: { icon: Sun, label: 'Flash auto' },
};

export function FlashToggle({ mode, onCycle, theme = 'light', size = 'default' }) {
  const { icon: Icon, label } = modes[mode] || modes.off;
  const isDark = theme === 'dark';
  const isCompact = size === 'compact';
  const active = mode !== 'off';

  return (
    <button
      type="button"
      onClick={onCycle}
      aria-label={label}
      title={label}
      className={`touch-target touch-manipulation flex shrink-0 items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
        isCompact ? 'h-10 w-10' : 'h-14 w-14 sm:h-12 sm:w-12'
      } ${
        isDark
          ? active
            ? 'bg-amber-500/90 text-gray-950 active:bg-amber-400'
            : 'bg-gray-800 text-gray-100 active:bg-gray-700'
          : active
            ? 'bg-amber-100 text-amber-900 active:bg-amber-200'
            : 'bg-gray-100/90 text-gray-800 active:bg-gray-200'
      }`}
    >
      <Icon size={isCompact ? 18 : 22} />
    </button>
  );
}
