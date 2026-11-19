import React from 'react';
import { Loader2, X } from 'lucide-react';
import { useSession } from '../context/SessionContext';

export default function ConnectingModal() {
  const { connectingState, setConnectingState } = useSession();

  if (!connectingState) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-sm bg-dark-card border border-dark-border rounded-2xl p-6 shadow-2xl text-center space-y-4">
        <Loader2 className="w-12 h-12 text-sky-400 animate-spin mx-auto" />
        <div>
          <h3 className="text-lg font-bold text-white">
            {connectingState.status === 'awaiting_approval' ? 'Awaiting Host Approval' : 'Connecting to Partner'}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            {connectingState.message || 'Negotiating WebRTC peer session...'}
          </p>
        </div>

        <button
          onClick={() => setConnectingState(null)}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-dark-surface hover:bg-dark-border text-slate-300 hover:text-white border border-dark-border text-xs font-semibold transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Cancel Connection</span>
        </button>
      </div>
    </div>
  );
}
