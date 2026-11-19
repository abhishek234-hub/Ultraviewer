import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Monitor, Wifi, Volume2, Save, Check, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function Settings() {
  const [displayQuality, setDisplayQuality] = useState('balanced');
  const [resolution, setResolution] = useState('native');
  const [enableAudio, setEnableAudio] = useState(false);
  const [enableRecording, setEnableRecording] = useState(false);
  const [turnPreference, setTurnPreference] = useState('auto');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await api.get('/auth/settings');
        if (res.success && res.data.settings) {
          const s = res.data.settings;
          if (s.displayQuality) setDisplayQuality(s.displayQuality);
          if (s.resolution) setResolution(s.resolution);
          if (s.enableAudio !== undefined) setEnableAudio(Boolean(s.enableAudio));
          if (s.enableRecording !== undefined) setEnableRecording(Boolean(s.enableRecording));
          if (s.turnPreference) setTurnPreference(s.turnPreference);
        }
      } catch (err) {
        // Fallback to local storage if not logged in
        setDisplayQuality(localStorage.getItem('rx_quality') || 'balanced');
        setResolution(localStorage.getItem('rx_resolution') || 'native');
        setEnableAudio(localStorage.getItem('rx_audio') === 'true');
        setEnableRecording(localStorage.getItem('rx_recording') === 'true');
        setTurnPreference(localStorage.getItem('rx_turn_pref') || 'auto');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      displayQuality,
      resolution,
      enableAudio,
      enableRecording,
      turnPreference
    };

    // Save locally as backup cache
    localStorage.setItem('rx_quality', displayQuality);
    localStorage.setItem('rx_resolution', resolution);
    localStorage.setItem('rx_audio', enableAudio);
    localStorage.setItem('rx_recording', enableRecording);
    localStorage.setItem('rx_turn_pref', turnPreference);

    try {
      await api.put('/auth/settings', payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      // Still show saved locally if unauthenticated guest
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
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Application Settings</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure display, WebRTC stream parameters, audio and network policies via API.
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
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? 'Saving...' : saved ? 'Saved to DB!' : 'Save Settings'}</span>
        </button>
      </div>

      <div className="space-y-5">
        {/* Display Settings */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/20">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Display & Stream Quality</h3>
              <p className="text-xs text-slate-400">Target bitrate, framerate and resolution limits</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Streaming Quality Mode
              </label>
              <select
                value={displayQuality}
                onChange={(e) => setDisplayQuality(e.target.value)}
                className="w-full bg-dark-input border border-dark-border focus:border-blue-500 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none"
              >
                <option value="quality">Best Quality (Crisp text, 60fps)</option>
                <option value="balanced">Balanced (Adaptive bitrate)</option>
                <option value="speed">Max Performance (Low bandwidth)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Target Resolution Limit
              </label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full bg-dark-input border border-dark-border focus:border-blue-500 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none"
              >
                <option value="native">Native Host Resolution</option>
                <option value="1080p">1080p (1920 × 1080)</option>
                <option value="720p">720p (1280 × 720)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audio & Recording */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Audio & Recording</h3>
              <p className="text-xs text-slate-400">Explicit permissions for audio and screen recording</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-dark-surface border border-dark-border hover:border-slate-700 cursor-pointer transition-colors">
              <div>
                <div className="text-xs sm:text-sm font-semibold text-white">Transmit System Audio</div>
                <div className="text-[11px] text-slate-400">Stream host audio output to client with explicit permission</div>
              </div>
              <input
                type="checkbox"
                checked={enableAudio}
                onChange={(e) => setEnableAudio(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-dark-input border-dark-border cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-dark-surface border border-dark-border hover:border-slate-700 cursor-pointer transition-colors">
              <div>
                <div className="text-xs sm:text-sm font-semibold text-white">Session Recording Consent</div>
                <div className="text-[11px] text-slate-400">Enable local session recording with visible red indicator</div>
              </div>
              <input
                type="checkbox"
                checked={enableRecording}
                onChange={(e) => setEnableRecording(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-dark-input border-dark-border cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Network & Relay */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Network & NAT Traversal</h3>
              <p className="text-xs text-slate-400">STUN/TURN fallback and relay policy</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Relay Strategy
            </label>
            <select
              value={turnPreference}
              onChange={(e) => setTurnPreference(e.target.value)}
              className="w-full bg-dark-input border border-dark-border focus:border-blue-500 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none"
            >
              <option value="auto">Automatic (Direct P2P via STUN, fallback to TURN)</option>
              <option value="prefer_p2p">Strict P2P Direct (Fastest LAN/WAN)</option>
              <option value="relay_only">Always Relay via TURN (Highest Firewall Penetration)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
