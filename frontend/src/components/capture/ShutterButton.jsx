export function ShutterButton({ onClick, disabled, justCaptured = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Capture photo"
      className="relative flex h-20 w-20 touch-manipulation items-center justify-center disabled:opacity-40"
    >
      <span className="absolute inset-0 rounded-full bg-blue-500/20" />
      <span
        className={`absolute inset-2 rounded-full border-4 transition-colors duration-200 ${
          justCaptured ? 'border-emerald-400/90' : 'border-white/30'
        }`}
      />
      <span
        className={`relative z-10 h-16 w-16 rounded-full bg-white shadow-lg ring-4 transition-transform duration-100 active:scale-90 ${
          justCaptured ? 'ring-emerald-400/80' : 'ring-blue-500/50'
        }`}
      />
    </button>
  );
}
