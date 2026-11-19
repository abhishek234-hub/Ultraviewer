import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  UserCheck,
  Copy,
  RefreshCw,
  Key,
  ChevronDown,
  ArrowRight,
  Check,
  HelpCircle,
  FolderOpen,
  Settings as SettingsIcon,
  Activity
} from 'lucide-react';
import { useDevice } from '../context/DeviceContext';
import { useSession } from '../context/SessionContext';
import api from '../services/api';

export default function Dashboard() {
  const {
    deviceCode,
    devicePassword,
    refreshPassword,
    unattendedSettings,
    updateUnattendedSetting,
    deviceStatus
  } = useDevice();

  const { connectToRemote, activeSession } = useSession();
  const navigate = useNavigate();

  const [partnerId, setPartnerId] = useState('');
  const [partnerPassword, setPartnerPassword] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [recentIds, setRecentIds] = useState(() => {
    try {
      const saved = localStorage.getItem('remotex_recent_partner_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const [customPasswordModal, setCustomPasswordModal] = useState(false);
  const [customPassInput, setCustomPassInput] = useState(unattendedSettings.customPassword || '');

  const handleCopyId = () => {
    navigator.clipboard.writeText(deviceCode.replace(/-/g, ''));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyPass = () => {
    navigator.clipboard.writeText(devicePassword);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const handleConnect = (e) => {
    e.preventDefault();
    const cleanId = partnerId.trim();
    if (!cleanId) return;

    // Save to recent partner IDs
    if (!recentIds.includes(cleanId)) {
      const updated = [cleanId, ...recentIds.slice(0, 4)];
      setRecentIds(updated);
      localStorage.setItem('remotex_recent_partner_ids', JSON.stringify(updated));
    }

    connectToRemote(cleanId, partnerPassword);
  };

  const handleSelectRecent = (id) => {
    setPartnerId(id);
    setShowRecentDropdown(false);
  };

  const handleSaveCustomPassword = (e) => {
    e.preventDefault();
    updateUnattendedSetting('customPassword', customPassInput);
    setCustomPasswordModal(false);
  };

  // Format code for display like UltraViewer: e.g. 134613711
  const displayId = deviceCode.replace(/^RX-/, '').replace(/-/g, '');

  return (
    <div className="w-full h-full flex flex-col bg-[#eef2f6] text-[#2c3e50] select-none rounded-lg shadow-xl overflow-hidden border border-[#b8c7d9]">
      {/* UltraViewer Classic Menu Bar */}
      <div className="bg-[#7da7cb] text-white px-3 py-1 flex items-center justify-between text-xs font-normal border-b border-[#6b96bc]">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/files')} className="hover:bg-[#6b96bc] px-2 py-0.5 rounded transition-colors">
            File
          </button>
          <button onClick={() => navigate('/settings')} className="hover:bg-[#6b96bc] px-2 py-0.5 rounded transition-colors">
            Settings
          </button>
          <button onClick={() => alert('RemoteX - UltraViewer Edition v6.6\nComplete Remote Desktop Client')} className="hover:bg-[#6b96bc] px-2 py-0.5 rounded transition-colors">
            Help
          </button>
        </div>

        {activeSession && (
          <div className="flex items-center gap-2 bg-[#2d577a] px-2.5 py-0.5 rounded text-[11px] font-medium text-sky-200">
            <Activity className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
            <span>Active Session: {activeSession.sessionCode}</span>
            <button
              onClick={() => navigate('/session')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.2 rounded text-[10px] font-bold"
            >
              View
            </button>
          </div>
        )}

        <HelpCircle className="w-4 h-4 text-white/80 hover:text-white cursor-pointer" />
      </div>

      {/* Main Container with Left Vertical Tool Strip & 2 Main Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Vertical Tool Strip (Like UltraViewer) */}
        <div className="w-12 bg-[#e4ebf2] border-r border-[#c5d5e5] flex flex-col items-center py-3 space-y-2 flex-shrink-0">
          <button
            title="Remote Control"
            className="w-8 h-8 rounded bg-[#1e6bb8] text-white flex items-center justify-center shadow transition-colors"
          >
            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold leading-none">▲</span>
              <span className="text-[10px] font-bold leading-none">▼</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/devices')}
            title="My Devices / Address Book"
            className="w-8 h-8 rounded bg-[#b8956b] hover:bg-[#a68257] text-white flex items-center justify-center shadow transition-colors"
          >
            <UserCheck className="w-4 h-4" />
          </button>
        </div>

        {/* Two Main Columns (UltraViewer Layout) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 p-5 gap-6 overflow-y-auto">
          {/* Column 1: Allow Remote Control */}
          <div className="bg-white border border-[#c5d5e5] rounded-lg p-5 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              {/* Header with Radar Icon */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#e8f1f8] border border-[#bcd3e6] flex items-center justify-center text-[#1e6bb8] flex-shrink-0">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1e6bb8] tracking-tight">Allow Remote Control</h2>
                  <p className="text-[11px] text-[#556980] leading-snug mt-0.5">
                    Please tell your partner the following ID and Password if you would like to allow remote control
                  </p>
                </div>
              </div>

              {/* Your ID Row */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center">
                  <label className="w-24 text-xs font-semibold text-[#44566c]">Your ID</label>
                  <div className="flex-1 flex items-center bg-[#f4f7fa] border border-[#bcd3e6] rounded px-3 py-1.5 justify-between">
                    <span className="font-mono text-base font-bold text-[#112233] tracking-widest">
                      {displayId}
                    </span>
                    <button
                      onClick={handleCopyId}
                      className="text-[#556980] hover:text-[#1e6bb8] p-1 rounded"
                      title="Copy Your ID"
                    >
                      {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Row */}
                <div className="flex items-center">
                  <label className="w-24 text-xs font-semibold text-[#44566c]">Password</label>
                  <div className="flex-1 flex items-center bg-[#f4f7fa] border border-[#bcd3e6] rounded px-3 py-1.5 justify-between">
                    <span className="font-mono text-base font-bold text-[#112233] tracking-widest">
                      {devicePassword}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={handleCopyPass}
                        className="text-[#556980] hover:text-[#1e6bb8] p-1 rounded"
                        title="Copy Password"
                      >
                        {copiedPass ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={refreshPassword}
                        className="text-[#556980] hover:text-[#1e6bb8] p-1 rounded"
                        title="Generate New Password"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unattended Access Section */}
              <div className="pt-4 border-t border-[#d8e2ec]">
                <h3 className="text-xs font-bold text-[#2c3e50] text-center mb-3">Unattended access</h3>
                <div className="space-y-2 text-xs text-[#44566c]">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={unattendedSettings.runOnStartup}
                      onChange={(e) => updateUnattendedSetting('runOnStartup', e.target.checked)}
                      className="rounded border-[#bcd3e6] text-[#1e6bb8] focus:ring-0"
                    />
                    <span>Run RemoteX with Windows</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={unattendedSettings.preventSleep}
                      onChange={(e) => updateUnattendedSetting('preventSleep', e.target.checked)}
                      className="rounded border-[#bcd3e6] text-[#1e6bb8] focus:ring-0"
                    />
                    <span>Prevent Windows from going to sleep</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={unattendedSettings.allowTurnOn}
                      onChange={(e) => updateUnattendedSetting('allowTurnOn', e.target.checked)}
                      className="rounded border-[#bcd3e6] text-[#1e6bb8] focus:ring-0"
                    />
                    <span>Allow turn on computer remotely</span>
                  </label>

                  <div className="flex items-center pt-2">
                    <span className="w-28 text-xs text-[#44566c]">Custom Password</span>
                    <input
                      type="password"
                      readOnly
                      placeholder="••••••••"
                      value={unattendedSettings.customPassword ? '••••••••' : ''}
                      onClick={() => setCustomPasswordModal(true)}
                      className="flex-1 bg-[#f4f7fa] border border-[#bcd3e6] rounded px-2 py-1 text-xs cursor-pointer"
                    />
                    <button
                      onClick={() => setCustomPasswordModal(true)}
                      className="ml-1.5 p-1 text-amber-500 hover:text-amber-600 rounded"
                      title="Set Custom Password"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Control a Remote Computer */}
          <div className="bg-white border border-[#c5d5e5] rounded-lg p-5 flex flex-col justify-between shadow-sm">
            <form onSubmit={handleConnect} className="space-y-4">
              {/* Header with User/Computer Icon */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#e8f1f8] border border-[#bcd3e6] flex items-center justify-center text-[#1e6bb8] flex-shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1e6bb8] tracking-tight">Control a Remote Computer</h2>
                  <p className="text-[11px] text-[#556980] leading-snug mt-0.5">
                    Please enter your partner's ID to remote control your partner's computer
                  </p>
                </div>
              </div>

              {/* Partner ID Input Row with Dropdown */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center relative">
                  <label className="w-24 text-xs font-bold text-[#112233]">Partner ID</label>
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="text"
                      required
                      placeholder="e.g. 134613711"
                      value={partnerId}
                      onChange={(e) => setPartnerId(e.target.value)}
                      className="w-full bg-white border border-[#96afc7] focus:border-[#1e6bb8] focus:ring-1 focus:ring-[#1e6bb8]/30 rounded px-3 py-1.5 text-sm font-mono tracking-wider outline-none text-[#112233]"
                    />
                    {recentIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowRecentDropdown(!showRecentDropdown)}
                        className="absolute right-1.5 text-[#556980] hover:text-[#1e6bb8] p-1"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    )}

                    {/* Recent Partner IDs Dropdown */}
                    {showRecentDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#96afc7] rounded shadow-lg z-30 py-1">
                        <div className="text-[10px] text-slate-400 px-3 py-1 border-b border-slate-100 uppercase font-semibold">
                          Recent Connections
                        </div>
                        {recentIds.map((id, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectRecent(id)}
                            className="px-3 py-1.5 text-xs font-mono hover:bg-[#eef4fa] cursor-pointer text-[#112233]"
                          >
                            {id}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Password Input Row */}
                <div className="flex items-center">
                  <label className="w-24 text-xs font-semibold text-[#44566c]">Password</label>
                  <input
                    type="password"
                    placeholder="Partner password (optional)"
                    value={partnerPassword}
                    onChange={(e) => setPartnerPassword(e.target.value)}
                    className="flex-1 bg-white border border-[#bcd3e6] focus:border-[#1e6bb8] rounded px-3 py-1.5 text-sm outline-none text-[#112233]"
                  />
                </div>
              </div>

              {/* Connect to Partner Button */}
              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 rounded bg-gradient-to-r from-[#2a75bd] to-[#1e6bb8] hover:from-[#2368a8] hover:to-[#175b9f] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Connect to partner</span>
                  <ChevronDown className="w-3.5 h-3.5 ml-1 border-l border-white/30 pl-1" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* UltraViewer Classic Footer Status Bar */}
      <div className="bg-[#f0f4f8] border-t border-[#c5d5e5] px-4 py-1.5 flex items-center justify-between text-xs text-[#556980]">
        <div className="flex items-center space-x-2">
          <span className={`w-2.5 h-2.5 rounded-full ${deviceStatus === 'online' ? 'bg-emerald-500 shadow-sm' : 'bg-rose-500'}`} />
          <span className="text-[11px] font-medium text-[#334455]">
            {deviceStatus === 'online' ? 'Ready to connect' : 'Connecting to signaling network...'}
          </span>
        </div>

        <span className="text-[11px] text-[#778899]">
          Copyright RemoteX Technologies Co., Ltd
        </span>
      </div>

      {/* Custom Password Modal */}
      {customPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#96afc7] rounded-lg p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-[#1e6bb8]">Set Custom Unattended Password</h3>
            <p className="text-xs text-[#556980]">
              This password allows you to access this computer unattended without someone clicking Accept.
            </p>
            <form onSubmit={handleSaveCustomPassword} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Enter custom password..."
                value={customPassInput}
                onChange={(e) => setCustomPassInput(e.target.value)}
                className="w-full border border-[#bcd3e6] rounded px-3 py-1.5 text-xs outline-none focus:border-[#1e6bb8]"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCustomPasswordModal(false)}
                  className="px-3 py-1 rounded border border-[#bcd3e6] text-xs text-[#556980] hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded bg-[#1e6bb8] text-white text-xs font-bold hover:bg-[#175b9f]"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
