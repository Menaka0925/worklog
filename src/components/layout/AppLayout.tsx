import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ActivityFormModal } from '../records/ActivityFormModal';
import { Plus, Menu } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F8F5] flex flex-col md:flex-row text-[#252B27]">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:shrink-0 sticky top-0 h-screen">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop and Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-[#15291F]/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col">
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area - No desktop top navbar next to sidebar */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header (only visible on mobile screens where sidebar is hidden) */}
        <div className="md:hidden h-16 bg-white border-b border-[#E5E9E3] px-4 sm:px-5 flex items-center justify-between sticky top-0 z-20">
          <img
            src={logoImg}
            alt="WorkTrace"
            className="h-10 sm:h-11 max-w-[185px] w-auto object-contain"
          />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -mr-1.5 rounded-lg text-[#252B27] hover:bg-forest-50 cursor-pointer transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6 text-[#252B27]" />
          </button>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => setIsAddNoteOpen(true)}
        className="md:hidden fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-forest-600 text-white shadow-xl flex items-center justify-center hover:bg-forest-700 active:scale-95 transition-transform cursor-pointer"
        aria-label="Add activity note"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Global Add Note Modal */}
      <ActivityFormModal
        isOpen={isAddNoteOpen}
        onClose={() => setIsAddNoteOpen(false)}
      />
    </div>
  );
};

