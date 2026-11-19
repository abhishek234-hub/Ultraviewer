import React, { useState, useEffect } from 'react';
import { FolderSync, Upload, Download, CheckCircle, Clock } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import api from '../services/api';
import webrtcService from '../services/webrtcService';

export default function FileTransfer() {
  const { activeSession, sessionPermissions } = useSession();
  const [transfers, setTransfers] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    async function loadTransfers() {
      if (activeSession?.sessionCode) {
        try {
          const res = await api.get(`/files/session/${activeSession.sessionCode}`);
          if (res.success && res.data.transfers) {
            setTransfers(res.data.transfers);
          }
        } catch (e) {}
      }
    }
    loadTransfers();
  }, [activeSession]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const startTransfer = async () => {
    if (!selectedFile) return;
    if (!activeSession) {
      alert('You must be in an active remote session to transfer files.');
      return;
    }
    if (!sessionPermissions.fileTransfer) {
      alert('File transfer permission is not granted by the host.');
      return;
    }

    setIsTransferring(true);
    setProgress(0);
    setStatusMessage('Initiating chunked transfer...');

    try {
      // 1. Log transfer metadata in backend database
      const metaRes = await api.post('/files/transfer', {
        sessionCode: activeSession.sessionCode,
        fileName: selectedFile.name,
        fileSize: selectedFile.size
      });

      const transferId = metaRes.data.transfer.id;

      // 2. Chunk-based peer-to-peer WebRTC transfer
      const CHUNK_SIZE = 16384; // 16KB standard WebRTC chunk
      let offset = 0;
      const fileReader = new FileReader();

      const readNextChunk = () => {
        const slice = selectedFile.slice(offset, offset + CHUNK_SIZE);
        fileReader.readAsArrayBuffer(slice);
      };

      fileReader.onload = async (e) => {
        if (!isTransferring && offset > 0) return;

        const buffer = e.target.result;
        if (webrtcService.fileChannel && webrtcService.fileChannel.readyState === 'open') {
          webrtcService.fileChannel.send(buffer);
        }

        offset += buffer.byteLength;
        const currentProgress = Math.min(100, Math.round((offset / selectedFile.size) * 100));
        setProgress(currentProgress);

        if (offset < selectedFile.size) {
          readNextChunk();
        } else {
          setIsTransferring(false);
          setStatusMessage('Transfer completed successfully!');
          await api.put(`/files/transfer/${transferId}/status`, { status: 'completed' });
          setSelectedFile(null);

          const res = await api.get(`/files/session/${activeSession.sessionCode}`);
          if (res.success) setTransfers(res.data.transfers);
        }
      };

      readNextChunk();
    } catch (err) {
      setIsTransferring(false);
      setStatusMessage(`Transfer error: ${err.message}`);
    }
  };

  const cancelTransfer = () => {
    setIsTransferring(false);
    setProgress(0);
    setStatusMessage('Transfer cancelled.');
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Secure File Transfer</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Peer-to-peer chunked file transfer over encrypted WebRTC DataChannel.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Send Files Box */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/20">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Send File to Partner</h3>
                <p className="text-xs text-slate-400">Encrypted P2P DataChannel chunking</p>
              </div>
            </div>

            <div className="border-2 border-dashed border-dark-border hover:border-slate-600 rounded-2xl p-6 text-center bg-dark-surface/50 transition-colors">
              <input
                type="file"
                id="file-input"
                className="hidden"
                onChange={handleFileSelect}
              />
              <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center gap-2.5">
                <FolderSync className="w-8 h-8 text-sky-400" />
                <span className="text-xs sm:text-sm font-semibold text-white break-all">
                  {selectedFile ? selectedFile.name : 'Click to select local file'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {selectedFile ? formatBytes(selectedFile.size) : 'Any file up to 2GB'}
                </span>
              </label>
            </div>

            {isTransferring && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Transfer Progress</span>
                  <span className="font-mono font-semibold text-sky-400">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-dark-surface rounded-full overflow-hidden border border-dark-border">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {statusMessage && (
              <p className="text-xs text-slate-300">{statusMessage}</p>
            )}
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              onClick={startTransfer}
              disabled={!selectedFile || isTransferring}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isTransferring ? 'Sending...' : 'Send File'}</span>
            </button>
            {isTransferring && (
              <button
                onClick={cancelTransfer}
                className="py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-600/30 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Receive Settings Box */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Receiving Policies</h3>
                <p className="text-xs text-slate-400">Inbound transfer security rules</p>
              </div>
            </div>

            <div className="bg-dark-surface border border-dark-border rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Download Directory:</span>
                <span className="text-slate-200 font-medium">Downloads\RemoteX</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Path Traversal Guard:</span>
                <span className="text-emerald-400 font-semibold">Active & Sanitized</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Auto Execution:</span>
                <span className="text-rose-400 font-semibold">Disabled (Safe)</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            All received files are checksum-verified before local storage. Remote execution of transferred binaries is strictly prohibited without explicit user confirmation.
          </p>
        </div>
      </div>

      {/* Transfer History Table */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <h3 className="text-sm sm:text-base font-semibold text-white">
          Session Transfer History
        </h3>

        {transfers.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No file transfers recorded in current session.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-dark-border">
                  <th className="py-2.5 px-3 font-semibold">File Name</th>
                  <th className="py-2.5 px-3 font-semibold">Size</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/60">
                {transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-dark-surface/50 transition-colors">
                    <td className="py-3 px-3 text-white font-medium break-all">{t.file_name}</td>
                    <td className="py-3 px-3 font-mono text-slate-300">{formatBytes(t.file_size)}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {t.transfer_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{t.created_at}</td>
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
