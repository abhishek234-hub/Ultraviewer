import React, { useRef, useEffect, useState } from 'react';
import {
  Maximize,
  Minimize,
  MessageSquare,
  PhoneOff,
  ShieldAlert,
  Zap,
  Send,
  X
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import webrtcService from '../services/webrtcService';

export default function RemoteSession() {
  const {
    activeSession,
    isHost,
    remoteStream,
    sessionPermissions,
    connectionQuality,
    disconnectSession,
    chatMessages,
    sendChatMessage
  } = useSession();

  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [displaySources, setDisplaySources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);

  // Attach WebRTC stream to video element
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
      videoRef.current.play().catch(e => console.warn('[Video Play]', e));
    }
  }, [remoteStream]);

  // Load available monitor displays if Host
  useEffect(() => {
    async function loadDisplays() {
      if (window.remotexApi?.isElectron && isHost) {
        try {
          const sources = await window.remotexApi.getScreenSources();
          setDisplaySources(sources);
          if (sources.length > 0) setSelectedSource(sources[0].id);
        } catch (e) {
          console.error(e);
        }
      }
    }
    loadDisplays();
  }, [isHost]);

  // Handle Monitor Switch (Host)
  const handleSwitchMonitor = async (sourceId) => {
    setSelectedSource(sourceId);
    try {
      await webrtcService.startScreenCapture(sourceId);
    } catch (e) {
      console.error('[Switch Monitor]', e);
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => alert(err.message));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => alert(err.message));
      setIsFullscreen(false);
    }
  };

  // Remote Mouse Movement & Normalized Coordinates
  const handleMouseMove = (e) => {
    if (isHost || !sessionPermissions.mouseKeyboard) return;
    const video = videoRef.current;
    if (!video) return;

    const rect = video.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    if (nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) {
      webrtcService.sendInput({
        type: 'mousemove',
        x: nx,
        y: ny
      });
    }
  };

  const handleMouseDown = (e) => {
    if (isHost || !sessionPermissions.mouseKeyboard) return;
    const btn = e.button === 2 ? 'right' : (e.button === 1 ? 'middle' : 'left');
    webrtcService.sendInput({
      type: 'mousedown',
      button: btn
    });
  };

  const handleMouseUp = (e) => {
    if (isHost || !sessionPermissions.mouseKeyboard) return;
    const btn = e.button === 2 ? 'right' : (e.button === 1 ? 'middle' : 'left');
    webrtcService.sendInput({
      type: 'mouseup',
      button: btn
    });
  };

  const handleWheel = (e) => {
    if (isHost || !sessionPermissions.mouseKeyboard) return;
    webrtcService.sendInput({
      type: 'wheel',
      deltaY: e.deltaY > 0 ? -120 : 120
    });
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  // Keyboard Event Handlers
  const handleKeyDown = (e) => {
    if (isHost || !sessionPermissions.mouseKeyboard) return;
    if (['F5', 'F11', 'F12'].includes(e.key)) return;
    e.preventDefault();

    webrtcService.sendInput({
      type: 'keydown',
      vk: e.keyCode || e.which
    });
  };

  const handleKeyUp = (e) => {
    if (isHost || !sessionPermissions.mouseKeyboard) return;
    e.preventDefault();

    webrtcService.sendInput({
      type: 'keyup',
      vk: e.keyCode || e.which
    });
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  const handleEmergencyReset = () => {
    if (window.remotexApi?.isElectron) {
      window.remotexApi.resetInput();
    }
    webrtcService.sendInput({ type: 'reset' });
  };

  if (!activeSession) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-6 text-slate-400 text-sm">
        No active remote session. Connect to a device from the Dashboard.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden outline-none select-none"
    >
      {/* Host Screen Sharing Indicator Banner */}
      {isHost && (
        <div className="absolute top-3 left-3 bg-rose-600/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl flex items-center gap-3 z-30 shadow-lg border border-rose-500/30 text-xs">
          <div className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span className="font-semibold text-white">
            Sharing Screen ({activeSession.clientCode})
          </span>
          <button
            onClick={disconnectSession}
            className="px-2.5 py-0.5 rounded-lg bg-white text-rose-600 font-bold hover:bg-slate-100 transition-colors"
          >
            Stop
          </button>
        </div>
      )}

      {/* Floating Session Toolbar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-dark-surface/90 backdrop-blur-md border border-dark-border px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-2xl z-30">
        <div className="flex items-center gap-1.5 px-2 text-xs font-medium text-emerald-400">
          <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">{connectionQuality}</span>
        </div>

        <div className="w-px h-4 bg-dark-border" />

        {/* Multi-Monitor Switch (Host) */}
        {isHost && displaySources.length > 1 && (
          <select
            value={selectedSource || ''}
            onChange={(e) => handleSwitchMonitor(e.target.value)}
            className="bg-dark-input text-white border border-dark-border rounded-lg px-2 py-1 text-xs outline-none"
          >
            {displaySources.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className={`p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors ${
            isFullscreen ? 'bg-blue-600 text-white' : ''
          }`}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        {/* Chat Toggle Button */}
        <button
          onClick={() => setShowChat(!showChat)}
          className={`p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors ${
            showChat ? 'bg-blue-600 text-white' : ''
          }`}
          title="In-Session Chat"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* Emergency Reset Button */}
        <button
          onClick={handleEmergencyReset}
          className="p-1.5 rounded-full text-amber-400 hover:bg-amber-500/15 transition-colors"
          title="Emergency Release Held Keys & Mouse"
        >
          <ShieldAlert className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-dark-border" />

        {/* Disconnect Button */}
        <button
          onClick={disconnectSession}
          className="p-1.5 rounded-full bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
          title="Disconnect Session"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>

      {/* Remote Screen Video View */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        className="max-w-full max-h-full object-contain cursor-crosshair"
      />

      {/* Chat Overlay Drawer */}
      {showChat && (
        <div className="absolute top-16 right-4 bottom-4 w-72 sm:w-80 bg-dark-card/95 backdrop-blur-xl border border-dark-border rounded-2xl flex flex-col z-40 shadow-2xl overflow-hidden animate-fadeIn">
          <div className="p-3.5 border-b border-dark-border flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-white">In-Session Chat</span>
            <button
              onClick={() => setShowChat(false)}
              className="text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {chatMessages.length === 0 ? (
              <div className="text-center text-slate-500 text-xs py-10">
                No messages yet. Send a message to your partner.
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} className="bg-dark-surface p-2.5 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-sky-400">{msg.senderName}</span>
                    <span className="text-slate-500">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-slate-200 break-words leading-relaxed">{msg.message}</div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendChat} className="p-2.5 border-t border-dark-border flex gap-2">
            <input
              type="text"
              placeholder="Type message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-dark-input border border-dark-border focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
            />
            <button
              type="submit"
              className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
