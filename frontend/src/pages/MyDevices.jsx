import React, { useState, useEffect } from 'react';
import { Laptop2, Trash2, ShieldCheck, Radio, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useSession } from '../context/SessionContext';

export default function MyDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { connectToRemote } = useSession();

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/devices');
      if (res.success && res.data.devices) {
        setDevices(res.data.devices);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to unregister this device?')) return;
    try {
      await api.delete(`/devices/${id}`);
      setDevices(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleTrust = async (device) => {
    try {
      if (device.is_trusted) {
        await api.delete(`/devices/trusted/${device.id}`);
      } else {
        await api.post(`/devices/trusted/${device.id}`);
      }
      fetchDevices();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">My Registered Devices</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage workstations and laptops associated with your RemoteX account.
          </p>
        </div>
        <button
          onClick={fetchDevices}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-dark-card hover:bg-dark-border border border-dark-border text-slate-200 text-xs font-semibold transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-6 shadow-xl">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">
            Loading registered computers...
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">
            No registered devices found. Devices register automatically when you log in on each computer.
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((d) => (
              <div
                key={d.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-xl bg-dark-surface border border-dark-border hover:border-slate-700 transition-colors gap-4"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/20 flex-shrink-0">
                    <Laptop2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm sm:text-base font-semibold text-white">{d.device_name}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          d.device_status === 'online'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-700/30 text-slate-400 border border-slate-600/30'
                        }`}
                      >
                        {d.device_status}
                      </span>
                      {d.is_trusted === 1 && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          Trusted
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                      <span>ID: <span className="font-mono text-sky-400 font-semibold">{d.device_code}</span></span>
                      <span>OS: {d.operating_system}</span>
                      <span>Last seen: {d.last_seen}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                  <button
                    onClick={() => handleToggleTrust(d)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-card hover:bg-dark-border border border-dark-border text-slate-200 text-xs font-medium transition-colors"
                    title={d.is_trusted ? 'Revoke trust' : 'Mark as trusted'}
                  >
                    <ShieldCheck className={`w-3.5 h-3.5 ${d.is_trusted ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{d.is_trusted ? 'Trusted' : 'Trust'}</span>
                  </button>

                  <button
                    onClick={() => connectToRemote(d.device_code)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition-colors"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Connect</span>
                  </button>

                  <button
                    onClick={() => handleDelete(d.id)}
                    className="p-1.5 rounded-lg bg-dark-card hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-dark-border transition-colors"
                    title="Unregister device"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
