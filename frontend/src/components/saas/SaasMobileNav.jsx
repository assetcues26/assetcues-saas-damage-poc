import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Settings } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/assets/create', label: 'Create', icon: PlusCircle },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function SaasMobileNav() {
  return (
    <nav
      data-saas-mobile-nav
      className="saas-shell-mobile-nav fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 pb-safe backdrop-blur-md lg:hidden"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2 text-[10px] font-medium transition-colors ${
                isActive ? 'text-blue-700' : 'text-gray-600'
              }`
            }
          >
            <Icon size={20} strokeWidth={2} aria-hidden />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
