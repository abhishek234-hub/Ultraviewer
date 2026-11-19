import { shell } from 'electron';

export function setupSecurity(mainWindow) {
  // 1. Restrict navigation to unapproved external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    // Allow localhost and local file protocol only
    if (!parsedUrl.origin.startsWith('http://localhost:') && parsedUrl.protocol !== 'file:') {
      console.warn(`[Security] Blocked unauthorized navigation to: ${navigationUrl}`);
      event.preventDefault();
    }
  });

  // 2. Open external links in default OS browser, not in the Electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsedUrl = new URL(url);
      if (['http:', 'https:'].includes(parsedUrl.protocol)) {
        shell.openExternal(url);
      }
    } catch (e) {
      console.error('[Security] Failed to open external URL safely:', e.message);
    }
    return { action: 'deny' };
  });

  // 3. Prevent creation of unauthorized webviews
  mainWindow.webContents.on('will-attach-webview', (event) => {
    event.preventDefault();
    console.warn('[Security] Prevented unapproved webview attachment.');
  });
}

export default setupSecurity;
