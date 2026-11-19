import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Laptop2,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  FolderSync,
  History,
  Activity,
  Monitor,
  Loader2
} from 'lucide-react';
import { useDevice } from '../context/DeviceContext';
import { useSession } from '../context/SessionContext';
import api from '../services/api';

export default function Dashboard() {
  const { deviceCode, deviceName, operatingSystem, deviceStatus, systemSpecs } = useDevice();
  const { connectToRemote, activeSession } = useSession();
  const navigate = useNavigate();

  const [targetId, setTargetId] = useState('');
  const [copied, setCopied] = useState(false);
  const [recentSessions, setRecentSessions] = useState([]);
  const [lookupResult, setLookupResult] = useState(null);
  const [loadingLookup, setLoadingLookup] = useState(false);

  useEffect(() => {
    async function fetchRecent() {
      try {
        const res = await api.get('/sessions/recent');
        if (res.success && res.data.sessions) {
          setRecentSessions(res.data.sessions.slice(0, 5));
        }
      } catch (err) {}
    }
    fetchRecent();
  }, []);

  const handleCopyId = () => {
    navigator.clipboard.writeText(deviceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLookup = async (code) => {
    setTargetId(code);
    if (code.trim().length >= 8) {
      setLoadingLookup(true);
      try {
        const res = await api.get(`/devices/lookup/${code.trim()}`);
        if (res.success && res.data.device) {
          setLookupResult(res.data.device);
        } else {
          setLookupResult(null);
        }
      } catch (e) {
        setLookupResult(null);
      } finally {
        setLoadingLookup(false);
      }
    } else {
      setLookupResult(null);
    }
  };

  const handleConnect = (e) => {
    e.preventDefault();
    if (!targetId.trim()) return;
    connectToRemote(targetId.trim());
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Header / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Remote Desktop Console</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Control remote Windows systems, transfer files and collaborate securely.
          </p>
        </div>

        {activeSession && (
          <div className="flex items-center gap-3 bg-blue-600/15 border border-blue-500/30 px-3.5 py-2 rounded-xl text-xs sm:text-sm text-blue-300">
            <Activity className="w-4 h-4 text-blue-400 animate-pulse flex-shrink-0" />
            <span className="truncate">Session: {activeSession.sessionCode}</span>
            <button
              onClick={() => navigate('/session')}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-xs shadow transition-colors"
            >
              Resume
            </button>
          </div>
        )}
      </div>

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Card 1: This Computer (Host) */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-slate-700 transition-colors border-l-4 border-l-brand-cyan shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">This Computer</h3>
                  <p className="text-xs text-slate-400">Ready for incoming connections</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  deviceStatus === 'online'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-700/30 text-slate-400 border border-slate-600/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${deviceStatus === 'online' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                {deviceStatus.toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Share your RemoteX ID with the partner who wants to connect to your PC:
            </p>

            <div className="bg-dark-surface border border-dark-border rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-3">
              <span className="font-mono text-lg sm:text-2xl font-bold tracking-widest text-sky-400 truncate">
                {deviceCode}
              </span>
              <button
                onClick={handleCopyId}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-card hover:bg-dark-border border border-dark-border text-slate-200 hover:text-white text-xs font-medium transition-colors flex-shrink-0"
                title="Copy ID to Clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-dark-border flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span className="truncate">Host: {deviceName}</span>
            <span className="truncate">OS: {operatingSystem}</span>
            {systemSpecs?.totalMem && <span>RAM: {systemSpecs.totalMem}</span>}
          </div>
        </div>

        {/* Card 2: Control Remote Computer (Client) */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-slate-700 transition-colors border-l-4 border-l-brand-blue shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/20">
                <Laptop2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Control Remote Computer</h3>
                <p className="text-xs text-slate-400">Enter partner's 9-digit RemoteX ID</p>
              </div>
            </div>

            <form onSubmit={handleConnect} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  required
                  placeholder="e.g. RX-982-143-520"
                  value={targetId}
                  onChange={(e) => handleLookup(e.target.value)}
                  className="flex-1 bg-dark-input border border-dark-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-mono tracking-wider outline-none transition-all placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-all flex-shrink-0"
                >
                  <span>Connect</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {loadingLookup && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span>Validating partner device...</span>
              </div>
            )}

            {lookupResult && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs">
                <span className="text-emerald-300 font-medium truncate">Host: {lookupResult.deviceName}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold text-[10px]">
                  {lookupResult.deviceStatus}
                </span>
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-dark-border flex flex-wrap gap-4 text-xs">
            <button
              onClick={() => navigate('/files')}
              className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              <FolderSync className="w-3.5 h-3.5" />
              <span>Direct File Transfer</span>
            </button>
            <button
              onClick={() => navigate('/security')}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 font-medium transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Access Security</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm sm:text-base font-semibold text-white">Recent Remote Connections</h3>
          </div>
          <button
            onClick={() => navigate('/recent-sessions')}
            className="text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors"
          >
            View All History →
          </button>
        </div>

        {recentSessions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No recent sessions logged yet. Connect to a computer above to start your first session.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-dark-border">
                  <th className="py-2.5 px-3 font-semibold">Session Code</th>
                  <th className="py-2.5 px-3 font-semibold">Host Computer</th>
                  <th className="py-2.5 px-3 font-semibold">Client</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Started At</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/60">
                {recentSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-dark-surface/50 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-300">{s.session_code}</td>
                    <td className="py-3 px-3 text-white font-medium">
                      <div>{s.host_name}</div>
                      <div className="font-mono text-[10px] text-sky-400">{s.host_code}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{s.client_name}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {s.session_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{s.started_at}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => connectToRemote(s.host_code)}
                        className="px-3 py-1 rounded-lg bg-dark-surface hover:bg-dark-border text-slate-200 hover:text-white border border-dark-border text-xs font-medium transition-colors"
                      >
                        Reconnect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
