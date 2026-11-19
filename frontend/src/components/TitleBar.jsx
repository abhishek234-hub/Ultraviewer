import React, { useState, useEffect } from 'react';
import { Minus, Square, Copy, X, Monitor } from 'lucide-react';

export default function TitleBar({ onToggleSidebar, isSessionView }) {
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
    <header className="h-8 bg-[#ffffff] border-b border-[#c5d5e5] flex items-center justify-between px-3 select-none window-drag z-50 text-[#334455]">
      {/* UltraViewer Style Window Title */}
      <div className="flex items-center gap-2 text-xs font-semibold text-[#1e6bb8] window-no-drag">
        <div className="w-4 h-4 rounded bg-[#1e6bb8] text-white flex items-center justify-center">
          <Monitor className="w-3 h-3 text-white" />
        </div>
        <span className="text-[12px] font-medium text-[#2c3e50]">
          RemoteX 6.6 - Free
        </span>
      </div>

      {/* Standard Window Control Buttons */}
      <div className="flex items-center window-no-drag space-x-0.5">
        <button
          onClick={handleMinimize}
          title="Minimize"
          className="w-10 h-7 flex items-center justify-center text-[#556980] hover:text-[#112233] hover:bg-[#e4ebf2] rounded transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          title={isMax ? "Restore" : "Maximize"}
          className="w-10 h-7 flex items-center justify-center text-[#556980] hover:text-[#112233] hover:bg-[#e4ebf2] rounded transition-colors"
        >
          {isMax ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
        </button>
        <button
          onClick={handleClose}
          title="Close"
          className="w-10 h-7 flex items-center justify-center text-[#556980] hover:text-white hover:bg-red-500 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
