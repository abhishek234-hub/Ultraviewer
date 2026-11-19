import { app, BrowserWindow, session, desktopCapturer } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

import { setupSecurity } from './security.js';
import { registerScreenCapturerHandlers } from './ipc/screenCapturer.js';
import { registerNativeInputHandlers } from './ipc/nativeInput.js';
import { registerSystemInfoHandlers } from './ipc/systemInfo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    frame: false, // Frameless custom professional AnyDesk / UltraViewer titlebar
    backgroundColor: '#0a0e17', // Modern deep dark navy
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });

  // Enable desktop media request permissions for getUserMedia screen sharing
  session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
    try {
      const sources = await desktopCapturer.getSources({ types: ['screen', 'window'] });
      // Default to first primary screen
      callback({ video: sources[0] });
    } catch (e) {
      console.error('[Main] DisplayMediaRequestHandler error:', e);
      callback({});
    }
  });

  // Explicitly allow media and screen capture requests in Electron renderer
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    return true;
  });

  // Setup security policies
  setupSecurity(mainWindow);

  // Register all IPC modules
  registerScreenCapturerHandlers();
  registerNativeInputHandlers();
  registerSystemInfoHandlers();

  // Load URL
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('[RemoteX Electron] Main window launched successfully.');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
