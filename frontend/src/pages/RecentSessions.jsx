import React, { useState, useEffect } from 'react';
import { History, Radio, RefreshCw, Clock } from 'lucide-react';
import api from '../services/api';
import { useSession } from '../context/SessionContext';

export default function RecentSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { connectToRemote } = useSession();

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sessions/recent');
      if (res.success && res.data.sessions) {
        setSessions(res.data.sessions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '< 1 min';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Recent Remote Sessions</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Detailed audit logs of all past incoming and outgoing remote connections.
          </p>
        </div>
        <button
          onClick={fetchSessions}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-dark-card hover:bg-dark-border border border-dark-border text-slate-200 text-xs font-semibold transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-6 shadow-xl">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">
            Loading session logs...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">
            No previous sessions recorded. Connect to a remote host to create session history.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-dark-border">
                  <th className="py-3 px-3 font-semibold">Session Code</th>
                  <th className="py-3 px-3 font-semibold">Host System</th>
                  <th className="py-3 px-3 font-semibold">Client</th>
                  <th className="py-3 px-3 font-semibold">Duration</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold">Date</th>
                  <th className="py-3 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/60">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-dark-surface/50 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-300 font-medium">{s.session_code}</td>
                    <td className="py-3 px-3 text-white font-medium">
                      <div>{s.host_name}</div>
                      <div className="font-mono text-[10px] text-sky-400">{s.host_code}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <div>{s.client_name}</div>
                      <div className="font-mono text-[10px] text-slate-500">{s.client_code}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formatDuration(s.duration_seconds)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {s.session_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{s.started_at}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => connectToRemote(s.host_code)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-dark-surface hover:bg-dark-border text-slate-200 hover:text-white border border-dark-border text-xs font-medium transition-colors"
                      >
                        <Radio className="w-3 h-3 text-blue-400" />
                        <span>Reconnect</span>
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
