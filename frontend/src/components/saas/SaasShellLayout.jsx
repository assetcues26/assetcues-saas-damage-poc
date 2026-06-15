import { Outlet } from 'react-router-dom';
import { SaasSidebar } from './SaasSidebar';
import { SaasBrandWatermark } from './SaasBrandWatermark';
import { SaasTopBar } from './SaasTopBar';
import { SaasMobileNav } from './SaasMobileNav';

export function SaasShellLayout() {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <SaasSidebar />
      <main className="relative min-w-0 flex-1 overflow-x-hidden pb-[4.25rem] lg:pb-0">
        <SaasBrandWatermark />
        <div className="relative z-[1] flex min-h-screen flex-col">
          <SaasTopBar />
          <Outlet />
        </div>
      </main>
      <SaasMobileNav />
    </div>
  );
}
