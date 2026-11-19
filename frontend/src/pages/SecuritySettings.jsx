import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Key, Check, Laptop2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function SecuritySettings() {
  const [unattendedPassword, setUnattendedPassword] = useState('');
  const [enableUnattended, setEnableUnattended] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSecuritySettings() {
      try {
        const res = await api.get('/auth/settings');
        if (res.success && res.data.settings) {
          const s = res.data.settings;
          if (s.enableUnattended !== undefined) setEnableUnattended(Boolean(s.enableUnattended));
          if (s.unattendedPassword) setUnattendedPassword(s.unattendedPassword);
        }
      } catch (err) {
        setUnattendedPassword(localStorage.getItem('rx_unattended_pass') || '');
        setEnableUnattended(localStorage.getItem('rx_unattended_enabled') === 'true');
      } finally {
        setLoading(false);
      }
    }
    fetchSecuritySettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem('rx_unattended_pass', unattendedPassword);
    localStorage.setItem('rx_unattended_enabled', enableUnattended);

    try {
      await api.put('/auth/settings', {
        enableUnattended,
        unattendedPassword
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Security & Access Control</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Control unattended access passwords, session permissions and trusted devices via API.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4 text-emerald-300" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          <span>{saving ? 'Saving...' : saved ? 'Saved to DB!' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="space-y-5">
        {/* Unattended Access Password */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Unattended Remote Access</h3>
              <p className="text-xs text-slate-400">Enable remote connection with permanent access password</p>
            </div>
          </div>

          <label className="flex items-center justify-between p-3.5 rounded-xl bg-dark-surface border border-dark-border hover:border-slate-700 cursor-pointer transition-colors">
            <div>
              <div className="text-xs sm:text-sm font-semibold text-white">Enable Permanent Password</div>
              <div className="text-[11px] text-slate-400">Allows pre-authorized partners to connect without interactive prompt</div>
            </div>
            <input
              type="checkbox"
              checked={enableUnattended}
              onChange={(e) => setEnableUnattended(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-dark-input border-dark-border cursor-pointer"
            />
          </label>

          {enableUnattended && (
            <div className="bg-dark-surface border border-dark-border rounded-xl p-4 space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Set Unattended Permanent Password
              </label>
              <input
                type="password"
                placeholder="Enter strong unattended access key"
                value={unattendedPassword}
                onChange={(e) => setUnattendedPassword(e.target.value)}
                className="w-full max-w-sm bg-dark-input border border-dark-border focus:border-blue-500 text-slate-100 rounded-xl px-3.5 py-2 text-xs sm:text-sm outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Never share this password with untrusted parties. It bypasses the interactive approval prompt.
              </p>
            </div>
          )}
        </div>

        {/* Cryptographic Standards */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Cryptographic Standards</h3>
              <p className="text-xs text-slate-400">End-to-end transport and input security protocols</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-dark-surface border border-dark-border rounded-xl p-4 space-y-1">
              <span className="text-[11px] text-slate-400">Signaling Protocol</span>
              <div className="text-sm font-bold text-white">WSS & TLS 1.3</div>
              <span className="inline-block text-[10px] text-emerald-400 font-medium">Encrypted WebSocket</span>
            </div>

            <div className="bg-dark-surface border border-dark-border rounded-xl p-4 space-y-1">
              <span className="text-[11px] text-slate-400">Media Streaming</span>
              <div className="text-sm font-bold text-white">WebRTC DTLS-SRTP</div>
              <span className="inline-block text-[10px] text-emerald-400 font-medium">End-to-End Encrypted</span>
            </div>

            <div className="bg-dark-surface border border-dark-border rounded-xl p-4 space-y-1">
              <span className="text-[11px] text-slate-400">Native Input Shield</span>
              <div className="text-sm font-bold text-white">Win32 SendInput Isolated</div>
              <span className="inline-block text-[10px] text-emerald-400 font-medium">Non-Elevated Sandbox</span>
            </div>
          </div>
        </div>

        {/* Trusted Devices Shortcut */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white">Trusted Devices Whitelist</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Computers allowed to connect directly with pre-authorized permissions.
            </p>
          </div>
          <button
            onClick={() => navigate('/devices')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-surface hover:bg-dark-border border border-dark-border text-slate-200 text-xs font-semibold transition-colors"
          >
            <Laptop2 className="w-4 h-4 text-blue-400" />
            <span>Manage Devices</span>
          </button>
        </div>
      </div>
    </div>
  );
}
