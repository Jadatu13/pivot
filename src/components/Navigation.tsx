import { NavLink } from 'react-router-dom';
import { CalendarDays, Users, Clock } from 'lucide-react';

const tabs = [
  { to: '/', label: 'Plan', Icon: CalendarDays },
  { to: '/roster', label: 'Roster', Icon: Users },
  { to: '/history', label: 'History', Icon: Clock },
];

export default function Navigation() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 pb-safe z-40">
      <div className="flex">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-violet-600' : 'text-slate-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  className={isActive ? 'text-violet-600' : 'text-slate-400'}
                  strokeWidth={isActive ? 2.5 : 1.75}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
