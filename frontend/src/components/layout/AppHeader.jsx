import { Link, useLocation } from 'react-router-dom';
import { V6_DEMO_ENABLED, SAAS_MODULE_ENABLED } from '../../config/features';
import { BrandLogo } from './BrandLogo';
import { LandingSettings } from '../landing/LandingSettings';

const navLinks = [
  { to: '/capture', label: 'Capture' },
  { to: '/upload', label: 'Upload' },
  { to: '/history', label: 'History' },
];

const saasNavLinks = [{ to: '/', label: 'Dashboard' }];

export function AppHeader() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 pt-safe backdrop-blur-md">
      <div className="flex h-14 w-full items-center gap-2 px-safe sm:h-16 sm:gap-4 sm:pl-6 sm:pr-6 lg:pl-8 lg:pr-8">
        <Link
          to="/"
          className="flex max-w-[42%] shrink-0 items-center touch-manipulation sm:max-w-none"
          aria-label={SAAS_MODULE_ENABLED ? 'Asset Register dashboard' : 'Home'}
        >
          <BrandLogo className="h-7 w-auto sm:h-11 md:h-12" />
        </Link>
        <nav
          className="flex min-w-0 flex-1 items-center justify-end gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden"
          aria-label="Main navigation"
        >
          <LandingSettings />
          {SAAS_MODULE_ENABLED &&
            saasNavLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`touch-target touch-manipulation shrink-0 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-200 sm:px-3 sm:text-sm ${
                  location.pathname === link.to
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-blue-700 hover:bg-blue-50 hover:text-blue-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          {V6_DEMO_ENABLED && (
            <Link
              to="/v6"
              className={`touch-target touch-manipulation shrink-0 rounded-lg px-2 py-2 text-xs font-medium transition-all duration-200 sm:px-3 sm:text-sm ${
                location.pathname.startsWith('/v6')
                  ? 'bg-violet-100 text-violet-900'
                  : 'text-violet-700 hover:bg-violet-50 hover:text-violet-900'
              }`}
            >
              <span className="sm:hidden">V6</span>
              <span className="hidden sm:inline">V6 Endpoint</span>
            </Link>
          )}
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={`touch-target touch-manipulation hidden shrink-0 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-200 sm:inline-flex sm:px-3 sm:text-sm ${
                location.pathname === link.to
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function CompactHeader({
  title,
  center,
  ariaLabel,
  left,
  right,
  variant = 'light',
  className = '',
}) {
  const isDark = variant === 'dark';
  const label = ariaLabel || (typeof title === 'string' ? title : undefined);

  return (
    <header
      aria-label={label}
      className={`sticky top-0 z-40 grid h-14 min-h-[3.5rem] grid-cols-[auto_1fr_auto] items-center gap-2 border-b px-safe pt-safe backdrop-blur-md ${
        isDark ? 'border-gray-800 bg-gray-950/95' : 'border-gray-200 bg-white/95'
      } ${className}`.trim()}
    >
      <div className="flex shrink-0 items-center">{left}</div>
      <div className="flex min-w-0 items-center justify-center px-1">
        {center ?? (
          <h1
            className={`truncate text-center text-sm font-semibold sm:text-base ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            {title}
          </h1>
        )}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2">{right}</div>
    </header>
  );
}

export function ProgressPill({ current, max, variant = 'light', compact = false, bump = false }) {
  const isDark = variant === 'dark';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border font-semibold tabular-nums leading-none ${
        compact ? 'min-w-[3rem] px-2.5 py-1.5 text-[11px] tracking-tight' : 'px-3 py-1 text-xs'
      } ${bump ? 'capture-pill-bump' : ''} ${
        isDark
          ? 'border-gray-600 bg-gray-800 text-blue-300'
          : 'border-blue-200 bg-blue-50 text-blue-700'
      }`}
      aria-label={`${current} of ${max} photos`}
    >
      {compact ? `${current}/${max}` : `${current} / ${max}`}
    </span>
  );
}
