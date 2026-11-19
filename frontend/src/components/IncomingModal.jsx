import React, { useState } from 'react';
import { ShieldAlert, MousePointer, FolderSync, Clipboard, Volume2, Check, X } from 'lucide-react';
import { useSession } from '../context/SessionContext';

export default function IncomingModal() {
  const { incomingRequest, acceptIncomingConnection, rejectIncomingConnection } = useSession();

  const [permissions, setPermissions] = useState({
    mouseKeyboard: true,
    fileTransfer: true,
    clipboard: true,
    audio: false
  });

  if (!incomingRequest) return null;

  const handleToggle = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl p-6 shadow-2xl flex flex-col space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-500/15 text-rose-500 rounded-xl border border-rose-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Incoming Connection</h3>
            <p className="text-xs text-slate-400">A remote computer is requesting access to your screen.</p>
          </div>
        </div>

        {/* Client Info Card */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs">RemoteX ID:</span>
            <span className="font-mono font-bold text-sky-400 text-sm">{incomingRequest.clientCode}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs">Device Name:</span>
            <span className="text-slate-200 font-medium text-xs">{incomingRequest.clientName || 'Unknown Device'}</span>
          </div>
        </div>

        {/* Permissions List */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-slate-300">Authorize Permissions:</div>

          <label className="flex items-center justify-between p-3 rounded-xl bg-dark-surface border border-dark-border hover:border-slate-700 cursor-pointer transition-colors">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
              <MousePointer className="w-4 h-4 text-blue-400" />
              <span>Allow Mouse & Keyboard</span>
            </div>
            <input
              type="checkbox"
              checked={permissions.mouseKeyboard}
              onChange={() => handleToggle('mouseKeyboard')}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-dark-input border-dark-border cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-dark-surface border border-dark-border hover:border-slate-700 cursor-pointer transition-colors">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
              <FolderSync className="w-4 h-4 text-emerald-400" />
              <span>Allow File Transfer</span>
            </div>
            <input
              type="checkbox"
              checked={permissions.fileTransfer}
              onChange={() => handleToggle('fileTransfer')}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-dark-input border-dark-border cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-dark-surface border border-dark-border hover:border-slate-700 cursor-pointer transition-colors">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
              <Clipboard className="w-4 h-4 text-amber-400" />
              <span>Allow Clipboard Sharing</span>
            </div>
            <input
              type="checkbox"
              checked={permissions.clipboard}
              onChange={() => handleToggle('clipboard')}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 bg-dark-input border-dark-border cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-dark-surface border border-dark-border hover:border-slate-700 cursor-pointer transition-colors">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
              <Volume2 className="w-4 h-4 text-purple-400" />
              <span>Allow Remote Audio</span>
            </div>
            <input
              type="checkbox"
              checked={permissions.audio}
              onChange={() => handleToggle('audio')}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-dark-input border-dark-border cursor-pointer"
            />
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => rejectIncomingConnection('Declined by user')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-600/30 font-semibold text-xs transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Decline</span>
          </button>
          <button
            onClick={() => acceptIncomingConnection(permissions)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5"
          >
            <Check className="w-4 h-4" />
            <span>Accept & Connect</span>
          </button>
        </div>
      </div>
    </div>
  );
}
