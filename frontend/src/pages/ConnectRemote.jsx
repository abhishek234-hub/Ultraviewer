import React, { useState } from 'react';
import { Radio, ArrowRight, MousePointer, FolderSync, Clipboard, Volume2, Shield } from 'lucide-react';
import { useSession } from '../context/SessionContext';

export default function ConnectRemote() {
  const [targetId, setTargetId] = useState('');
  const [permissions, setPermissions] = useState({
    mouseKeyboard: true,
    fileTransfer: true,
    clipboard: true,
    audio: false
  });

  const { connectToRemote } = useSession();

  const handleToggle = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConnect = (e) => {
    e.preventDefault();
    if (!targetId.trim()) return;
    connectToRemote(targetId.trim(), permissions);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Connect to Remote Computer</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Establish an encrypted WebRTC remote session with mouse, keyboard and file transfer capabilities.
        </p>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-7 shadow-xl">
        <form onSubmit={handleConnect} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-semibold text-white">
              RemoteX Partner ID
            </label>
            <input
              type="text"
              required
              placeholder="e.g. RX-347-891-205"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full bg-dark-input border border-dark-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-sky-400 font-mono text-base sm:text-xl tracking-wider rounded-xl p-3.5 outline-none transition-all placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-xs sm:text-sm font-semibold text-white">Requested Session Permissions</span>
            </div>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-dark-surface border border-dark-border hover:border-slate-700 cursor-pointer transition-colors">
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
                  <MousePointer className="w-4 h-4 text-blue-400" />
                  <span>Remote Mouse & Keyboard Control</span>
                </div>
                <input
                  type="checkbox"
                  checked={permissions.mouseKeyboard}
                  onChange={() => handleToggle('mouseKeyboard')}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-dark-input border-dark-border cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-dark-surface border border-dark-border hover:border-slate-700 cursor-pointer transition-colors">
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
                  <FolderSync className="w-4 h-4 text-emerald-400" />
                  <span>Peer-to-Peer File Transfer</span>
                </div>
                <input
                  type="checkbox"
                  checked={permissions.fileTransfer}
                  onChange={() => handleToggle('fileTransfer')}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-dark-input border-dark-border cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-dark-surface border border-dark-border hover:border-slate-700 cursor-pointer transition-colors">
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
                  <Clipboard className="w-4 h-4 text-amber-400" />
                  <span>Clipboard Synchronization</span>
                </div>
                <input
                  type="checkbox"
                  checked={permissions.clipboard}
                  onChange={() => handleToggle('clipboard')}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 bg-dark-input border-dark-border cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-dark-surface border border-dark-border hover:border-slate-700 cursor-pointer transition-colors">
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
                  <Volume2 className="w-4 h-4 text-purple-400" />
                  <span>Remote Desktop Audio</span>
                </div>
                <input
                  type="checkbox"
                  checked={permissions.audio}
                  onChange={() => handleToggle('audio')}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-dark-input border-dark-border cursor-pointer"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5"
          >
            <Radio className="w-4 h-4" />
            <span>Initiate Remote Connection</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
