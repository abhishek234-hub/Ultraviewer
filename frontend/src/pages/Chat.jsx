import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { useDevice } from '../context/DeviceContext';

export default function Chat() {
  const { activeSession, chatMessages, sendChatMessage } = useSession();
  const { deviceName } = useDevice();
  const [inputText, setInputText] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Session Chat</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {activeSession
            ? `Active session ${activeSession.sessionCode} with ${activeSession.isHost ? activeSession.clientCode : activeSession.hostCode}`
            : 'No active session. Chat is enabled during active remote connections.'}
        </p>
      </div>

      <div className="flex-1 bg-dark-card border border-dark-border rounded-2xl flex flex-col shadow-xl overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2 py-12">
              <MessageSquare className="w-12 h-12 stroke-[1.5] text-slate-600" />
              <p className="text-sm font-medium text-slate-300">No messages exchanged yet</p>
              <p className="text-xs max-w-sm">Messages sent here are encrypted and delivered instantly to your remote partner.</p>
            </div>
          ) : (
            chatMessages.map((msg, index) => {
              const isMe = msg.senderName === deviceName;
              return (
                <div
                  key={index}
                  className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${
                    isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className={`text-[11px] font-semibold ${isMe ? 'text-blue-400' : 'text-emerald-400'}`}>
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div
                    className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed break-words shadow-sm ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-dark-surface border border-dark-border text-slate-100 rounded-bl-none'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 bg-dark-surface border-t border-dark-border flex gap-2.5">
          <input
            type="text"
            disabled={!activeSession}
            placeholder={activeSession ? "Type your message..." : "Connect to a device to chat..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-dark-input border border-dark-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-slate-100 rounded-xl px-4 py-2.5 text-xs sm:text-sm outline-none transition-all placeholder:text-slate-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!activeSession || !inputText.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
