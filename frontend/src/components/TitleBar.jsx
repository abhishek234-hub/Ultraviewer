import React, { useState, useEffect } from 'react';
import { Minus, Square, Copy, X, MonitorPlay } from 'lucide-react';

export default function TitleBar({ onToggleSidebar }) {
  const [isMax, setIsMax] = useState(false);

  useEffect(() => {
    async function checkMax() {
      if (window.remotexApi?.isMaximized) {
        const val = await window.remotexApi.isMaximized();
        setIsMax(val);
      }
    }
    checkMax();
  }, []);

  const handleMinimize = () => {
    if (window.remotexApi?.minimizeWindow) {
      window.remotexApi.minimizeWindow();
    }
  };

  const handleMaximize = async () => {
    if (window.remotexApi?.maximizeWindow) {
      await window.remotexApi.maximizeWindow();
      const val = await window.remotexApi.isMaximized();
      setIsMax(val);
    }
  };

  const handleClose = () => {
    if (window.remotexApi?.closeWindow) {
      window.remotexApi.closeWindow();
    }
  };

  return (
    <header className="h-9 bg-[#070a10] border-b border-slate-800/80 flex items-center justify-between px-3 select-none window-drag z-50">
      <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-sky-400 window-no-drag">
        <MonitorPlay className="w-4 h-4 text-sky-400" />
        <span className="hidden sm:inline">REMOTEX DESKTOP</span>
        <span className="sm:hidden text-xs">REMOTEX</span>
      </div>

      <div className="flex items-center window-no-drag space-x-1">
        <button
          onClick={handleMinimize}
          title="Minimize"
          className="w-8 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          title={isMax ? "Restore" : "Maximize"}
          className="w-8 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          {isMax ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
        </button>
        <button
          onClick={handleClose}
          title="Close"
          className="w-8 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-600 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
