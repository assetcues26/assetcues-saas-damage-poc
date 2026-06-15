import { Link } from 'react-router-dom';
import { AssetCuesLogo } from './AssetCuesLogo';
import { ActivityNotificationBell } from './ActivityNotificationBell';

export function SaasTopBar() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-gray-200/80 bg-white/90 px-3 py-2.5 backdrop-blur sm:px-6 sm:py-3 lg:justify-end">
      <Link to="/" className="shrink-0 lg:hidden" aria-label="Dashboard">
        <AssetCuesLogo variant="sidebar" />
      </Link>
      <ActivityNotificationBell />
    </header>
  );
}
