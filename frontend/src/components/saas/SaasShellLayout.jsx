import { Outlet } from 'react-router-dom';
import { SaasSidebar } from './SaasSidebar';
import { SaasBrandWatermark } from './SaasBrandWatermark';
import { SaasTopBar } from './SaasTopBar';
import { SaasMobileNav } from './SaasMobileNav';
import { useSaasMobileLayout } from '../../hooks/useSaasMobileLayout';

export function SaasShellLayout() {
  const isMobile = useSaasMobileLayout();

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {!isMobile && <SaasSidebar />}
      <main
        className={`relative min-w-0 flex-1 overflow-x-hidden ${isMobile ? 'pb-[4.25rem]' : ''}`}
      >
        <SaasBrandWatermark />
        <div className="relative z-[1] flex min-h-screen flex-col">
          <SaasTopBar />
          <Outlet />
        </div>
      </main>
      {isMobile && <SaasMobileNav />}
    </div>
  );
}
