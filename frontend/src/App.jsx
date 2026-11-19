import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DeviceProvider } from './context/DeviceContext';
import { SessionProvider } from './context/SessionContext';

import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ConnectRemote from './pages/ConnectRemote';
import MyDevices from './pages/MyDevices';
import RecentSessions from './pages/RecentSessions';
import RemoteSession from './pages/RemoteSession';
import FileTransfer from './pages/FileTransfer';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import SecuritySettings from './pages/SecuritySettings';

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <DeviceProvider>
          <SessionProvider>
            <Routes>
              {/* Standalone Authentication Pages */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Main App Layout */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/connect" element={<ConnectRemote />} />
                <Route path="/devices" element={<MyDevices />} />
                <Route path="/recent-sessions" element={<RecentSessions />} />
                <Route path="/session" element={<RemoteSession />} />
                <Route path="/files" element={<FileTransfer />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/security" element={<SecuritySettings />} />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </SessionProvider>
        </DeviceProvider>
      </AuthProvider>
    </HashRouter>
  );
}
