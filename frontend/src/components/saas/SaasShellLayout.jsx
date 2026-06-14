import { Outlet } from 'react-router-dom';
import { SaasSidebar } from './SaasSidebar';
import { SaasBrandWatermark } from './SaasBrandWatermark';

export function SaasShellLayout() {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <SaasSidebar />
      <main className="relative min-w-0 flex-1 overflow-auto">
        <SaasBrandWatermark />
        <div className="relative z-[1]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
