const { contextBridge, ipcRenderer } = require('electron');

// Whitelist of valid IPC events that renderer is allowed to invoke
const VALID_INVOKE_CHANNELS = [
  'screen:get-sources',
  'screen:get-displays',
  'input:execute',
  'input:reset',
  'system:get-info',
  'window:minimize',
  'window:maximize',
  'window:close',
  'window:is-maximized',
  'dialog:save-file',
  'dialog:open-files',
  'fs:save-buffer'
];

contextBridge.exposeInMainWorld('remotexApi', {
  isElectron: true,

  // Screen Capture & Displays
  getScreenSources: (opts) => ipcRenderer.invoke('screen:get-sources', opts),
  getDisplays: () => ipcRenderer.invoke('screen:get-displays'),

  // Native Windows Input Simulation
  executeRemoteInput: (inputEvent) => ipcRenderer.invoke('input:execute', inputEvent),
  resetInput: () => ipcRenderer.invoke('input:reset'),

  // System Details
  getSystemInfo: () => ipcRenderer.invoke('system:get-info'),

  // Window Controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),

  // File Transfer Dialogs and Storage
  showSaveDialog: (opts) => ipcRenderer.invoke('dialog:save-file', opts),
  showOpenDialog: (opts) => ipcRenderer.invoke('dialog:open-files', opts),
  saveBuffer: (filePath, base64Data) => ipcRenderer.invoke('fs:save-buffer', { filePath, base64Data }),

  // Safe Listener Registration
  on: (channel, callback) => {
    const validReceives = ['session:state-change', 'screen:updated'];
    if (validReceives.includes(channel)) {
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    }
  }
});
