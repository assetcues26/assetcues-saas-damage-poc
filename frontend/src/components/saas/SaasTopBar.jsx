import { ActivityNotificationBell } from './ActivityNotificationBell';

export function SaasTopBar() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-end border-b border-gray-200/80 bg-white/90 px-6 py-3 backdrop-blur">
      <ActivityNotificationBell />
    </header>
  );
}
