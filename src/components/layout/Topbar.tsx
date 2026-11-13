import React from 'react';
import { Menu, Plus, Calendar, Clock } from 'lucide-react';
import { Button } from '../common/Button';
import { formatDateDisplay, getTodayDateString, getCurrentTimeString } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  onOpenAddModal: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu, onOpenAddModal }) => {
  const { user } = useAuth();
  const todayStr = getTodayDateString();
  const currentTime = getCurrentTimeString();

  return (
    <header className="h-16 bg-white border-b border-[#E5E9E3] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile toggle button */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-[#737C74] hover:text-[#252B27] hover:bg-forest-50 cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Date / Time Status */}
        <div className="flex items-center gap-4 text-xs font-medium text-[#737C74]">
          <div className="flex items-center gap-1.5 bg-[#F7F8F5] px-2.5 py-1 rounded-md border border-[#E5E9E3]">
            <Calendar className="w-3.5 h-3.5 text-forest-600" />
            <span className="font-semibold text-[#252B27]">{formatDateDisplay(todayStr)}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[#737C74]">
            <Clock className="w-3.5 h-3.5" />
            <span>{currentTime}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Add Note Button for Mobile/Tablet */}
        <Button
          onClick={onOpenAddModal}
          size="sm"
          className="sm:hidden"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Note
        </Button>

        {/* User initials badge */}
        <div className="flex items-center gap-2 pl-2">
          <div className="w-8 h-8 rounded-full bg-forest-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
            {user?.full_name?.charAt(0).toUpperCase() || 'W'}
          </div>
        </div>
      </div>
    </header>
  );
};

