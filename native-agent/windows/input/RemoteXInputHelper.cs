using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;

namespace RemoteX.Native
{
    class Program
    {
        [DllImport("user32.dll", SetLastError = true)]
        static extern uint SendInput(uint nInputs, [MarshalAs(UnmanagedType.LPArray), In] INPUT[] pInputs, int cbSize);

        [DllImport("user32.dll")]
        static extern int GetSystemMetrics(int nIndex);

        [DllImport("user32.dll")]
        static extern bool SetProcessDPIAware();

        [DllImport("user32.dll")]
        static extern short VkKeyScan(char ch);

        [DllImport("user32.dll")]
        static extern uint MapVirtualKey(uint uCode, uint uMapType);

        const int SM_CXSCREEN = 0;
        const int SM_CYSCREEN = 1;
        const int SM_XVIRTUALSCREEN = 76;
        const int SM_YVIRTUALSCREEN = 77;
        const int SM_CXVIRTUALSCREEN = 78;
        const int SM_CYVIRTUALSCREEN = 79;

        const int INPUT_MOUSE = 0;
        const int INPUT_KEYBOARD = 1;

        const uint MOUSEEVENTF_MOVE = 0x0001;
        const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
        const uint MOUSEEVENTF_LEFTUP = 0x0004;
        const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
        const uint MOUSEEVENTF_RIGHTUP = 0x0010;
        const uint MOUSEEVENTF_MIDDLEDOWN = 0x0020;
        const uint MOUSEEVENTF_MIDDLEUP = 0x0040;
        const uint MOUSEEVENTF_WHEEL = 0x0800;
        const uint MOUSEEVENTF_HWHEEL = 0x1000;
        const uint MOUSEEVENTF_ABSOLUTE = 0x8000;
        const uint MOUSEEVENTF_VIRTUALDESK = 0x4000;

        const uint KEYEVENTF_EXTENDEDKEY = 0x0001;
        const uint KEYEVENTF_KEYUP = 0x0002;
        const uint KEYEVENTF_UNICODE = 0x0004;
        const uint KEYEVENTF_SCANCODE = 0x0008;

        [StructLayout(LayoutKind.Sequential)]
        struct INPUT
        {
            public int type;
            public InputUnion u;
        }

        [StructLayout(LayoutKind.Explicit)]
        struct InputUnion
        {
            [FieldOffset(0)]
            public MOUSEINPUT mi;
            [FieldOffset(0)]
            public KEYBDINPUT ki;
            [FieldOffset(0)]
            public HARDWAREINPUT hi;
        }

        [StructLayout(LayoutKind.Sequential)]
        struct MOUSEINPUT
        {
            public int dx;
            public int dy;
            public uint mouseData;
            public uint dwFlags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        [StructLayout(LayoutKind.Sequential)]
        struct KEYBDINPUT
        {
            public ushort wVk;
            public ushort wScan;
            public uint dwFlags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        [StructLayout(LayoutKind.Sequential)]
        struct HARDWAREINPUT
        {
            public uint uMsg;
            public ushort wParamL;
            public ushort wParamH;
        }

        static void Main(string[] args)
        {
            try
            {
                SetProcessDPIAware();
            }
            catch { }

            // Initial screen metrics
            SendDisplayMetrics();

            // Read line-based JSON-like or pipe-delimited commands:
            // Format: CMD|ARG1|ARG2|ARG3
            // Example:
            // MOVE|0.523|0.412
            // MOUSEDOWN|left
            // MOUSEUP|left
            // CLICK|left
            // DBLCLICK|left
            // WHEEL|120|0
            // KEYDOWN|65
            // KEYUP|65
            // KEYPRESS|65
            // UNICODE|A
            // RESET
            // METRICS
            string line;
            while ((line = Console.ReadLine()) != null)
            {
                line = line.Trim();
                if (string.IsNullOrEmpty(line)) continue;

                if (line.Equals("EXIT", StringComparison.OrdinalIgnoreCase))
                {
                    break;
                }

                try
                {
                    ProcessCommand(line);
                }
                catch (Exception ex)
                {
                    Console.WriteLine("ERR|" + ex.Message);
                }
            }
        }

        static void SendDisplayMetrics()
        {
            int cxScreen = GetSystemMetrics(SM_CXSCREEN);
            int cyScreen = GetSystemMetrics(SM_CYSCREEN);
            int vx = GetSystemMetrics(SM_XVIRTUALSCREEN);
            int vy = GetSystemMetrics(SM_YVIRTUALSCREEN);
            int vcx = GetSystemMetrics(SM_CXVIRTUALSCREEN);
            int vcy = GetSystemMetrics(SM_CYVIRTUALSCREEN);

            Console.WriteLine(string.Format("METRICS|{0}|{1}|{2}|{3}|{4}|{5}", cxScreen, cyScreen, vx, vy, vcx, vcy));
        }

        static void ProcessCommand(string command)
        {
            string[] parts = command.Split('|');
            string action = parts[0].ToUpperInvariant();

            int vcx = GetSystemMetrics(SM_CXVIRTUALSCREEN);
            int vcy = GetSystemMetrics(SM_CYVIRTUALSCREEN);
            if (vcx <= 0) vcx = GetSystemMetrics(SM_CXSCREEN);
            if (vcy <= 0) vcy = GetSystemMetrics(SM_CYSCREEN);

            int vx = GetSystemMetrics(SM_XVIRTUALSCREEN);
            int vy = GetSystemMetrics(SM_YVIRTUALSCREEN);

            switch (action)
            {
                case "METRICS":
                    SendDisplayMetrics();
                    break;

                case "MOVE":
                    if (parts.Length >= 3)
                    {
                        double nx = double.Parse(parts[1], System.Globalization.CultureInfo.InvariantCulture);
                        double ny = double.Parse(parts[2], System.Globalization.CultureInfo.InvariantCulture);

                        // Clamp to [0.0, 1.0]
                        if (nx < 0.0) nx = 0.0; if (nx > 1.0) nx = 1.0;
                        if (ny < 0.0) ny = 0.0; if (ny > 1.0) ny = 1.0;

                        // Normalize to 65535 coordinate system for SendInput
                        int absX = (int)(nx * 65535.0);
                        int absY = (int)(ny * 65535.0);

                        INPUT[] inputs = new INPUT[1];
                        inputs[0].type = INPUT_MOUSE;
                        inputs[0].u.mi.dx = absX;
                        inputs[0].u.mi.dy = absY;
                        inputs[0].u.mi.dwFlags = MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_VIRTUALDESK;
                        SendInput(1, inputs, Marshal.SizeOf(typeof(INPUT)));
                        Console.WriteLine("OK|MOVE");
                    }
                    break;

                case "MOUSEDOWN":
                    if (parts.Length >= 2)
                    {
                        string btn = parts[1].ToLowerInvariant();
                        uint flag = btn == "right" ? MOUSEEVENTF_RIGHTDOWN : (btn == "middle" ? MOUSEEVENTF_MIDDLEDOWN : MOUSEEVENTF_LEFTDOWN);
                        SendMouseFlag(flag);
                        Console.WriteLine("OK|MOUSEDOWN");
                    }
                    break;

                case "MOUSEUP":
                    if (parts.Length >= 2)
                    {
                        string btn = parts[1].ToLowerInvariant();
                        uint flag = btn == "right" ? MOUSEEVENTF_RIGHTUP : (btn == "middle" ? MOUSEEVENTF_MIDDLEUP : MOUSEEVENTF_LEFTUP);
                        SendMouseFlag(flag);
                        Console.WriteLine("OK|MOUSEUP");
                    }
                    break;

                case "CLICK":
                    if (parts.Length >= 2)
                    {
                        string btn = parts[1].ToLowerInvariant();
                        uint down = btn == "right" ? MOUSEEVENTF_RIGHTDOWN : (btn == "middle" ? MOUSEEVENTF_MIDDLEDOWN : MOUSEEVENTF_LEFTDOWN);
                        uint up = btn == "right" ? MOUSEEVENTF_RIGHTUP : (btn == "middle" ? MOUSEEVENTF_MIDDLEUP : MOUSEEVENTF_LEFTUP);
                        SendMouseFlag(down);
                        Thread.Sleep(15);
                        SendMouseFlag(up);
                        Console.WriteLine("OK|CLICK");
                    }
                    break;

                case "DBLCLICK":
                    {
                        SendMouseFlag(MOUSEEVENTF_LEFTDOWN);
                        Thread.Sleep(10);
                        SendMouseFlag(MOUSEEVENTF_LEFTUP);
                        Thread.Sleep(40);
                        SendMouseFlag(MOUSEEVENTF_LEFTDOWN);
                        Thread.Sleep(10);
                        SendMouseFlag(MOUSEEVENTF_LEFTUP);
                        Console.WriteLine("OK|DBLCLICK");
                    }
                    break;

                case "WHEEL":
                    if (parts.Length >= 2)
                    {
                        int deltaY = int.Parse(parts[1]);
                        INPUT[] inputs = new INPUT[1];
                        inputs[0].type = INPUT_MOUSE;
                        inputs[0].u.mi.mouseData = (uint)deltaY;
                        inputs[0].u.mi.dwFlags = MOUSEEVENTF_WHEEL;
                        SendInput(1, inputs, Marshal.SizeOf(typeof(INPUT)));
                        Console.WriteLine("OK|WHEEL");
                    }
                    break;

                case "KEYDOWN":
                    if (parts.Length >= 2)
                    {
                        ushort vk = ushort.Parse(parts[1]);
                        SendKey(vk, false);
                        Console.WriteLine("OK|KEYDOWN");
                    }
                    break;

                case "KEYUP":
                    if (parts.Length >= 2)
                    {
                        ushort vk = ushort.Parse(parts[1]);
                        SendKey(vk, true);
                        Console.WriteLine("OK|KEYUP");
                    }
                    break;

                case "KEYPRESS":
                    if (parts.Length >= 2)
                    {
                        ushort vk = ushort.Parse(parts[1]);
                        SendKey(vk, false);
                        Thread.Sleep(15);
                        SendKey(vk, true);
                        Console.WriteLine("OK|KEYPRESS");
                    }
                    break;

                case "UNICODE":
                    if (parts.Length >= 2 && parts[1].Length > 0)
                    {
                        char ch = parts[1][0];
                        SendUnicodeChar(ch);
                        Console.WriteLine("OK|UNICODE");
                    }
                    break;

                case "RESET":
                    // Release all common modifier keys (Shift, Ctrl, Alt, Win, Left/Right Mouse)
                    SendMouseFlag(MOUSEEVENTF_LEFTUP);
                    SendMouseFlag(MOUSEEVENTF_RIGHTUP);
                    SendMouseFlag(MOUSEEVENTF_MIDDLEUP);
                    SendKey(0x10, true); // VK_SHIFT
                    SendKey(0x11, true); // VK_CONTROL
                    SendKey(0x12, true); // VK_MENU (Alt)
                    SendKey(0x5B, true); // VK_LWIN
                    SendKey(0x5C, true); // VK_RWIN
                    Console.WriteLine("OK|RESET");
                    break;

                default:
                    Console.WriteLine("ERR|UNKNOWN_COMMAND");
                    break;
            }
        }

        static void SendMouseFlag(uint flags)
        {
            INPUT[] inputs = new INPUT[1];
            inputs[0].type = INPUT_MOUSE;
            inputs[0].u.mi.dwFlags = flags;
            SendInput(1, inputs, Marshal.SizeOf(typeof(INPUT)));
        }

        static void SendKey(ushort vk, bool isUp)
        {
            INPUT[] inputs = new INPUT[1];
            inputs[0].type = INPUT_KEYBOARD;
            inputs[0].u.ki.wVk = vk;
            inputs[0].u.ki.wScan = (ushort)MapVirtualKey(vk, 0);
            inputs[0].u.ki.dwFlags = isUp ? KEYEVENTF_KEYUP : 0;
            if ((vk >= 0x21 && vk <= 0x28) || vk == 0x2D || vk == 0x2E) // Extended keys (arrows, insert, delete, home, end, etc.)
            {
                inputs[0].u.ki.dwFlags |= KEYEVENTF_EXTENDEDKEY;
            }
            SendInput(1, inputs, Marshal.SizeOf(typeof(INPUT)));
        }

        static void SendUnicodeChar(char ch)
        {
            INPUT[] inputs = new INPUT[2];
            inputs[0].type = INPUT_KEYBOARD;
            inputs[0].u.ki.wVk = 0;
            inputs[0].u.ki.wScan = (ushort)ch;
            inputs[0].u.ki.dwFlags = KEYEVENTF_UNICODE;

            inputs[1].type = INPUT_KEYBOARD;
            inputs[1].u.ki.wVk = 0;
            inputs[1].u.ki.wScan = (ushort)ch;
            inputs[1].u.ki.dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP;

            SendInput(2, inputs, Marshal.SizeOf(typeof(INPUT)));
        }
    }
}
