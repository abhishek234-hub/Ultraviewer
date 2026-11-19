import { ipcMain, desktopCapturer, screen } from 'electron';

export function registerScreenCapturerHandlers() {
  // Enumerate screen capture sources (displays and windows)
  ipcMain.handle('screen:get-sources', async (event, opts = {}) => {
    try {
      const types = opts.types || ['screen'];
      const sources = await desktopCapturer.getSources({
        types,
        thumbnailSize: { width: 320, height: 180 },
        fetchWindowIcons: false
      });

      const allDisplays = screen.getAllDisplays();

      return sources.map((source, index) => {
        const display = allDisplays[index] || screen.getPrimaryDisplay();
        return {
          id: source.id,
          name: source.name,
          displayId: source.display_id,
          thumbnail: source.thumbnail.toDataURL(),
          bounds: display ? display.bounds : { width: 1920, height: 1080 },
          scaleFactor: display ? display.scaleFactor : 1.0,
          isPrimary: display ? (display.id === screen.getPrimaryDisplay().id) : (index === 0)
        };
      });
    } catch (err) {
      console.error('[IPC Error] screen:get-sources:', err);
      return [];
    }
  });

  // Get primary and all monitor metrics
  ipcMain.handle('screen:get-displays', () => {
    const primary = screen.getPrimaryDisplay();
    const all = screen.getAllDisplays();
    return {
      primary: {
        id: primary.id,
        bounds: primary.bounds,
        workArea: primary.workArea,
        scaleFactor: primary.scaleFactor
      },
      displays: all.map(d => ({
        id: d.id,
        bounds: d.bounds,
        workArea: d.workArea,
        scaleFactor: d.scaleFactor,
        isPrimary: d.id === primary.id
      }))
    };
  });
}

export default registerScreenCapturerHandlers;
