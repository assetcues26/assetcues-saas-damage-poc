import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

const links = [
  { to: '/', label: 'Home' },
  { to: '/capture', label: 'Capture' },
  { to: '/upload', label: 'Upload' },
  { to: '/history', label: 'History' },
];

export function AppFooter() {
  return (
    <footer className="relative mt-auto border-t border-transparent bg-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-safe px-3 py-8 pb-safe sm:flex-row sm:justify-between sm:px-6 sm:py-10 lg:px-8">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <BrandLogo className="h-8 w-auto" />
          <p className="text-xs text-gray-500">Enterprise Asset Intelligence</p>
        </div>
        <nav
          className="flex flex-wrap justify-center gap-3 text-sm text-gray-600 sm:gap-4"
          aria-label="Footer navigation"
        >
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="touch-manipulation rounded-lg px-2 py-2 transition-colors duration-200 active:text-gray-900 sm:hover:text-gray-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs text-gray-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
          </span>
          Powered by AI
        </div>
      </div>
    </footer>
  );
}
