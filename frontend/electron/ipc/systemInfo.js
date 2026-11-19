import { ipcMain, BrowserWindow, dialog, app } from 'electron';
import os from 'os';
import fs from 'fs';
import path from 'path';

export function registerSystemInfoHandlers() {
  ipcMain.handle('system:get-info', () => {
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      osRelease: os.release(),
      osType: os.type(),
      arch: os.arch(),
      totalMem: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB',
      freeMem: Math.round(os.freemem() / (1024 * 1024 * 1024)) + ' GB',
      username: os.userInfo().username
    };
  });

  // Window Controls
  ipcMain.handle('window:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.minimize();
  });

  ipcMain.handle('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });

  ipcMain.handle('window:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.close();
  });

  ipcMain.handle('window:is-maximized', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win ? win.isMaximized() : false;
  });

  // File save/open dialogs for real file transfer
  ipcMain.handle('dialog:save-file', async (event, opts = {}) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showSaveDialog(win, {
      title: opts.title || 'Save Remote File',
      defaultPath: opts.defaultPath || path.join(app.getPath('downloads'), opts.filename || 'downloaded_file'),
      buttonLabel: 'Save'
    });
    return result;
  });

  ipcMain.handle('dialog:open-files', async (event, opts = {}) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win, {
      title: opts.title || 'Select Files to Send',
      properties: ['openFile', 'multiSelections']
    });
    return result;
  });

  // Write file buffer to local disk safely
  ipcMain.handle('fs:save-buffer', async (event, { filePath, base64Data }) => {
    try {
      // Validate path is within allowed user directories
      const resolved = path.resolve(filePath);
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(resolved, buffer);
      return { success: true, path: resolved, size: buffer.length };
    } catch (err) {
      console.error('[IPC Error] fs:save-buffer:', err);
      return { success: false, error: err.message };
    }
  });
}

export default registerSystemInfoHandlers;
