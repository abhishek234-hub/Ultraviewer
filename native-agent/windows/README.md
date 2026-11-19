# RemoteX Windows Native Agent

The RemoteX Windows Native Agent provides high-performance, low-latency screen capture integration and Windows hardware input simulation via standard Win32 APIs.

## Architecture Overview

1. **Input Simulation (`input/`)**:
   - `RemoteXInputHelper.cs`: High-performance C# Win32 helper compiled using built-in Windows .NET Framework 4.0 `csc.exe`.
   - APIs utilized:
     - `SendInput` (User32.dll) for hardware-level keyboard events and absolute normalized mouse movements (`MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_VIRTUALDESK`).
     - `SetProcessDPIAware` (User32.dll) ensures pixel-perfect coordinates across high-DPI displays (125%, 150%, 200% Windows scaling).
     - `GetSystemMetrics` queries virtual screen bounds (`SM_CXVIRTUALSCREEN`, `SM_CYVIRTUALSCREEN`) for multi-monitor setups.
     - Line-based command pipeline (`MOVE`, `MOUSEDOWN`, `MOUSEUP`, `CLICK`, `DBLCLICK`, `WHEEL`, `KEYDOWN`, `KEYUP`, `UNICODE`, `RESET`).
     - Automated `RESET` on session termination releases any held modifier keys (Ctrl, Shift, Alt, Win).

2. **Screen Capture (`capture/`)**:
   - Uses Chromium / Electron `desktopCapturer` and `navigator.mediaDevices.getUserMedia` with `chromeMediaSource: 'desktop'`.
   - Real-time frame capture at up to 60 FPS with adaptive bitrate encoding.
   - Dynamic monitor source enumeration and switching.

3. **Security and Permissions (`permissions/`)**:
   - Isolated non-elevated child process architecture:
     - Never runs with Administrator UAC privileges unless explicitly elevated.
     - Never executes arbitrary shell strings or shell commands.
     - Strictly parses numeric virtual keycodes (VK) and normalized floats `[0.0, 1.0]`.
     - Host retains full authority with real-time revocation and emergency stop controls.

## Compilation

To recompile the native helper:

```cmd
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:exe /out:native-agent\windows\input\bin\RemoteXInputHelper.exe /optimize+ native-agent\windows\input\RemoteXInputHelper.cs
```
