import { ipcMain, app } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let helperProcess = null;

function resolveHelperPath() {
  // 1. Packaged location (extraResources)
  const prodPath = path.join(process.resourcesPath, 'native-agent', 'RemoteXInputHelper.exe');
  if (fs.existsSync(prodPath)) return prodPath;

  // 2. Development location
  const devPath = path.resolve(__dirname, '../../../../native-agent/windows/input/bin/RemoteXInputHelper.exe');
  if (fs.existsSync(devPath)) return devPath;

  // 3. Fallback relative path
  const fallbackPath = path.resolve(__dirname, '../../../native-agent/windows/input/bin/RemoteXInputHelper.exe');
  if (fs.existsSync(fallbackPath)) return fallbackPath;

  return devPath;
}

function ensureHelperRunning() {
  if (helperProcess && !helperProcess.killed) {
    return true;
  }

  const helperExe = resolveHelperPath();
  if (!fs.existsSync(helperExe)) {
    console.warn(`[NativeInput] Warning: Helper executable not found at ${helperExe}`);
    return false;
  }

  try {
    helperProcess = spawn(helperExe, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    });

    helperProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      // Debug or metrics log
    });

    helperProcess.stderr.on('data', (err) => {
      console.error('[NativeInput Helper Error]:', err.toString());
    });

    helperProcess.on('exit', (code) => {
      console.log(`[NativeInput Helper] Process exited with code ${code}`);
      helperProcess = null;
    });

    console.log('[NativeInput Helper] Started native Windows input process.');
    return true;
  } catch (err) {
    console.error('[NativeInput Helper] Failed to spawn input helper:', err);
    return false;
  }
}

export function sendCommandToHelper(cmd) {
  if (!ensureHelperRunning() || !helperProcess || !helperProcess.stdin) {
    return false;
  }
  try {
    helperProcess.stdin.write(cmd + '\n');
    return true;
  } catch (err) {
    console.error('[NativeInput] Error writing to helper stdin:', err);
    return false;
  }
}

export function registerNativeInputHandlers() {
  // Ensure helper is spawned on start
  ensureHelperRunning();

  // Execute remote input event
  ipcMain.handle('input:execute', (event, inputEvent) => {
    if (!inputEvent || !inputEvent.type) return false;

    const { type } = inputEvent;

    switch (type) {
      case 'mousemove': {
        const nx = Math.max(0, Math.min(1, parseFloat(inputEvent.x) || 0));
        const ny = Math.max(0, Math.min(1, parseFloat(inputEvent.y) || 0));
        return sendCommandToHelper(`MOVE|${nx.toFixed(5)}|${ny.toFixed(5)}`);
      }
      case 'mousedown': {
        const btn = (inputEvent.button || 'left').toLowerCase();
        return sendCommandToHelper(`MOUSEDOWN|${btn}`);
      }
      case 'mouseup': {
        const btn = (inputEvent.button || 'left').toLowerCase();
        return sendCommandToHelper(`MOUSEUP|${btn}`);
      }
      case 'click': {
        const btn = (inputEvent.button || 'left').toLowerCase();
        return sendCommandToHelper(`CLICK|${btn}`);
      }
      case 'dblclick': {
        return sendCommandToHelper('DBLCLICK');
      }
      case 'wheel': {
        const deltaY = parseInt(inputEvent.deltaY, 10) || 0;
        return sendCommandToHelper(`WHEEL|${deltaY}`);
      }
      case 'keydown': {
        const vk = parseInt(inputEvent.vk, 10);
        if (vk > 0) return sendCommandToHelper(`KEYDOWN|${vk}`);
        return false;
      }
      case 'keyup': {
        const vk = parseInt(inputEvent.vk, 10);
        if (vk > 0) return sendCommandToHelper(`KEYUP|${vk}`);
        return false;
      }
      case 'keypress': {
        const vk = parseInt(inputEvent.vk, 10);
        if (vk > 0) return sendCommandToHelper(`KEYPRESS|${vk}`);
        return false;
      }
      case 'unicode': {
        const ch = (inputEvent.char || '').charAt(0);
        if (ch) return sendCommandToHelper(`UNICODE|${ch}`);
        return false;
      }
      case 'reset': {
        return sendCommandToHelper('RESET');
      }
      default:
        return false;
    }
  });

  // Emergency reset
  ipcMain.handle('input:reset', () => {
    return sendCommandToHelper('RESET');
  });

  app.on('will-quit', () => {
    if (helperProcess && !helperProcess.killed) {
      try {
        helperProcess.stdin.write('RESET\nEXIT\n');
        helperProcess.kill();
      } catch (e) {}
    }
  });
}

export default registerNativeInputHandlers;
