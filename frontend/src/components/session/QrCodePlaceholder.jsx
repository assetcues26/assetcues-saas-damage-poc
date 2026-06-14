/**
 * Decorative blurred QR preview — visual only, not interactive.
 *
 * @param {{ size?: number, className?: string }} props
 */
export function QrCodePlaceholder({ size = 180, className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-dashed border-gray-200 bg-gray-50 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div className="absolute inset-0 flex items-center justify-center p-3">
        <svg
          viewBox="0 0 120 120"
          className="h-full w-full text-gray-700 opacity-70 blur-[7px]"
          fill="currentColor"
        >
          <rect x="8" y="8" width="32" height="32" rx="2" />
          <rect x="14" y="14" width="20" height="20" fill="#f9fafb" />
          <rect x="18" y="18" width="12" height="12" />
          <rect x="80" y="8" width="32" height="32" rx="2" />
          <rect x="86" y="14" width="20" height="20" fill="#f9fafb" />
          <rect x="90" y="18" width="12" height="12" />
          <rect x="8" y="80" width="32" height="32" rx="2" />
          <rect x="14" y="86" width="20" height="20" fill="#f9fafb" />
          <rect x="18" y="90" width="12" height="12" />
          <rect x="48" y="8" width="8" height="8" />
          <rect x="60" y="8" width="8" height="8" />
          <rect x="48" y="20" width="8" height="8" />
          <rect x="48" y="48" width="8" height="8" />
          <rect x="60" y="48" width="8" height="8" />
          <rect x="72" y="48" width="8" height="8" />
          <rect x="48" y="60" width="8" height="8" />
          <rect x="72" y="60" width="8" height="8" />
          <rect x="84" y="48" width="8" height="8" />
          <rect x="96" y="60" width="8" height="8" />
          <rect x="48" y="84" width="8" height="8" />
          <rect x="60" y="96" width="8" height="8" />
          <rect x="72" y="84" width="8" height="8" />
          <rect x="84" y="96" width="8" height="8" />
          <rect x="96" y="84" width="8" height="8" />
        </svg>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/50 to-white/70" />
    </div>
  );
}
