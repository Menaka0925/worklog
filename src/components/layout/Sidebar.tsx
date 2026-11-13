import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Search,
  CheckSquare,
  Settings,
  LogOut,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/logo.png';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, signOut } = useAuth();

  const navItems = [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
    { label: 'My Records', to: '/records', icon: BookOpen },
    { label: 'Calendar', to: '/calendar', icon: CalendarDays },
    { label: 'Search History', to: '/search', icon: Search },
    { label: 'Follow-ups', to: '/followups', icon: CheckSquare },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-full h-full flex flex-col select-none">
      {/* Brand Header - Pure white background, zero forest green behind or around it */}
      <div className="w-full h-16 md:h-[88px] px-4 md:px-5 bg-white border-b border-r border-[#E5E9E3] flex items-center justify-between shrink-0">
        <img
          src={logoImg}
          alt="WorkTrace"
          className="h-9 sm:h-10 md:h-[68px] max-w-[190px] md:max-w-[215px] w-auto object-contain transition-all"
        />
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 -mr-1.5 rounded-lg text-[#737C74] hover:text-[#252B27] hover:bg-[#F2F5F0] transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation & Profile Area - Forest Green background */}
      <div className="flex-1 flex flex-col min-h-0 bg-forest-900 border-r border-forest-800 text-white">
        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                isActive
                  ? 'bg-white/15 text-white shadow-xs font-bold border border-white/15'
                  : 'text-forest-200/75 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Card */}
      <div className="p-4 border-t border-white/10 bg-forest-950/60 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-forest-800 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 border border-forest-700">
              {user?.full_name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {user?.full_name || 'Professional User'}
              </p>
              <p className="text-[11px] text-forest-200/60 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            title="Sign out"
            className="p-1.5 rounded-lg text-forest-300 hover:text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </aside>
);
};

