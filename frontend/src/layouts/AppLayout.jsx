import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, MonitorPlay } from 'lucide-react';
import TitleBar from '../components/TitleBar';
import Sidebar from '../components/Sidebar';
import IncomingModal from '../components/IncomingModal';
import ConnectingModal from '../components/ConnectingModal';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isSessionView = location.pathname === '/session';

  return (
    <div className="flex flex-col h-screen w-screen bg-dark-bg text-slate-100 overflow-hidden select-none">
      {/* Frameless TitleBar */}
      <TitleBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} isSessionView={isSessionView} />

      {/* Mobile Header Bar for small screens (hidden during active remote session) */}
      {!isSessionView && (
        <div className="lg:hidden flex items-center justify-between px-4 py-2.5 bg-dark-surface border-b border-dark-border z-20">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-sm tracking-wide">
            <MonitorPlay className="w-4 h-4" />
            <span>RemoteX</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg bg-dark-card border border-dark-border text-slate-300 hover:text-white hover:bg-dark-cardHover transition-colors"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Body: Full width & height without sidebar or padding during active session */}
      <div className="flex flex-1 overflow-hidden relative">
        {!isSessionView && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
        <main className={`flex-1 bg-dark-bg overflow-hidden flex flex-col ${isSessionView ? 'p-0 w-full h-full' : 'p-4 sm:p-6 lg:p-8 overflow-y-auto'}`}>
          <Outlet />
        </main>
      </div>

      {/* Modals */}
      <IncomingModal />
      <ConnectingModal />
    </div>
  );
}
