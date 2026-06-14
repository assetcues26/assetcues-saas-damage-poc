const ZOOM_LEVELS = [1, 2, 3, 4, 5];

export function CameraZoomControls({ zoomLevel, onZoomChange, disabled = false }) {
  return (
    <div
      className="flex items-center justify-center gap-1.5 sm:gap-2"
      role="group"
      aria-label="Camera zoom"
    >
      {ZOOM_LEVELS.map((level) => {
        const active = zoomLevel === level;
        return (
          <button
            key={level}
            type="button"
            disabled={disabled}
            onClick={() => onZoomChange(level)}
            aria-label={`${level}x zoom`}
            aria-pressed={active}
            className={`touch-manipulation min-h-9 min-w-9 rounded-full px-2.5 text-xs font-semibold transition-colors sm:min-h-10 sm:min-w-10 sm:text-sm ${
              active
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 active:bg-gray-600'
            } disabled:opacity-40`}
          >
            {level}x
          </button>
        );
      })}
    </div>
  );
}
