import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, ScanLine, Settings } from 'lucide-react';
import { AssetCuesLogo } from './AssetCuesLogo';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/assets/create', label: 'Create Asset', icon: PlusCircle },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/poc', label: 'Asset Analysis', icon: ScanLine },
];

export function SaasSidebar() {
  return (
    <aside className="relative z-10 hidden w-56 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
      <div className="border-b border-gray-200 px-4 py-5">
        <NavLink to="/" className="inline-block transition-opacity hover:opacity-90" title="Dashboard">
          <AssetCuesLogo variant="sidebar" />
        </NavLink>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
