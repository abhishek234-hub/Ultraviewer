import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  Laptop2,
  History,
  FolderSync,
  MessageSquare,
  ShieldCheck,
  Settings,
  User,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { deviceStatus } = useDevice();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/connect', label: 'Connect Remote', icon: Radio },
    { to: '/devices', label: 'My Devices', icon: Laptop2 },
    { to: '/recent-sessions', label: 'Recent Sessions', icon: History },
    { to: '/files', label: 'File Transfer', icon: FolderSync },
    { to: '/chat', label: 'Chat', icon: MessageSquare },
    { to: '/security', label: 'Security', icon: ShieldCheck },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-9 bottom-0 left-0 w-64 bg-dark-surface border-r border-dark-border z-40 flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between lg:hidden pb-3 mb-2 border-b border-dark-border">
            <span className="text-sm font-semibold text-slate-200">Navigation</span>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:bg-dark-card hover:text-slate-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info: Status & Profile */}
        <div className="pt-3 border-t border-dark-border space-y-3">
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="text-slate-400 font-medium">Network</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium ${
                deviceStatus === 'online'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-700/30 text-slate-400 border border-slate-600/30'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  deviceStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              />
              {deviceStatus.toUpperCase()}
            </span>
          </div>

          {user ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-dark-card/60 border border-dark-border/60">
              <NavLink
                to="/profile"
                onClick={() => onClose && onClose()}
                className="flex items-center gap-2.5 text-slate-200 hover:text-white group truncate"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-semibold text-xs border border-blue-500/30">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="truncate text-xs font-medium">
                  <div className="truncate group-hover:text-blue-400 transition-colors">{user.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                </div>
              </NavLink>

              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              onClick={() => onClose && onClose()}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold bg-dark-card hover:bg-dark-cardHover text-slate-200 border border-dark-border rounded-lg transition-all"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </NavLink>
          )}
        </div>
      </aside>
    </>
  );
}
