$script:BrowserCaptureNativeType = 'MultiUserBrowserCapture.NativeMethods'

function Initialize-MultiUserBrowserCaptureNativeMethods {
    if ($null -ne ($script:BrowserCaptureNativeType -as [type])) {
        return
    }

    Add-Type -TypeDefinition @'
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;

namespace MultiUserBrowserCapture {
    public static class NativeMethods {
        [StructLayout(LayoutKind.Sequential)]
        public struct RECT {
            public int Left;
            public int Top;
            public int Right;
            public int Bottom;
        }

        [DllImport("user32.dll")]
        public static extern IntPtr GetForegroundWindow();

        public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool EnumWindows(EnumWindowsProc callback, IntPtr lParam);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern IntPtr OpenDesktop(string desktopName, uint flags, bool inherit, uint desiredAccess);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool CloseDesktop(IntPtr desktopHandle);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool EnumDesktopWindows(IntPtr desktopHandle, EnumWindowsProc callback, IntPtr lParam);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool IsWindowVisible(IntPtr hWnd);

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        public static extern int GetWindowTextLength(IntPtr hWnd);

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int maxCount);

        [DllImport("user32.dll")]
        public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool IsIconic(IntPtr hWnd);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool IsZoomed(IntPtr hWnd);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool SetWindowPos(IntPtr hWnd, IntPtr insertAfter, int x, int y, int width, int height, uint flags);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdcBlt, uint nFlags);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool SetProcessDPIAware();

        public static IntPtr FindVisibleChromeWindow(string preferredTitleContains) {
            IntPtr fallback = IntPtr.Zero;
            IntPtr preferred = IntPtr.Zero;
            EnumWindowsProc inspectWindow = delegate (IntPtr hWnd, IntPtr lParam) {
                if (!IsWindowVisible(hWnd)) {
                    return true;
                }

                uint processId = 0;
                GetWindowThreadProcessId(hWnd, out processId);
                try {
                    Process process = Process.GetProcessById((int)processId);
                    if (!String.Equals(process.ProcessName, "chrome", StringComparison.OrdinalIgnoreCase)) {
                        return true;
                    }
                } catch {
                    return true;
                }

                if (fallback == IntPtr.Zero) {
                    fallback = hWnd;
                }

                int titleLength = GetWindowTextLength(hWnd);
                StringBuilder title = new StringBuilder(Math.Max(titleLength + 1, 2));
                GetWindowText(hWnd, title, title.Capacity);
                if (!String.IsNullOrWhiteSpace(preferredTitleContains) &&
                    title.ToString().IndexOf(preferredTitleContains, StringComparison.OrdinalIgnoreCase) >= 0) {
                    preferred = hWnd;
                    return false;
                }

                return true;
            };

            EnumWindows(inspectWindow, IntPtr.Zero);
            if (preferred == IntPtr.Zero && fallback == IntPtr.Zero) {
                const uint DESKTOP_ENUMERATEWINDOWS = 0x0040;
                IntPtr defaultDesktop = OpenDesktop("Default", 0, false, DESKTOP_ENUMERATEWINDOWS);
                if (defaultDesktop != IntPtr.Zero) {
                    // Keep the desktop handle open for the lifetime of this short-lived
                    // capture process. Closing it immediately invalidates cross-desktop
                    // window queries in non-interactive PowerShell hosts.
                    EnumDesktopWindows(defaultDesktop, inspectWindow, IntPtr.Zero);
                }
            }

            return preferred != IntPtr.Zero ? preferred : fallback;
        }

        public static IntPtr ResolveVisibleWindow(long requestedHandle) {
            IntPtr resolved = IntPtr.Zero;
            EnumWindowsProc inspectWindow = delegate (IntPtr hWnd, IntPtr lParam) {
                if (IsWindowVisible(hWnd) && hWnd.ToInt64() == requestedHandle) {
                    resolved = hWnd;
                    return false;
                }
                return true;
            };

            EnumWindows(inspectWindow, IntPtr.Zero);
            if (resolved == IntPtr.Zero) {
                const uint DESKTOP_ENUMERATEWINDOWS = 0x0040;
                IntPtr defaultDesktop = OpenDesktop("Default", 0, false, DESKTOP_ENUMERATEWINDOWS);
                if (defaultDesktop != IntPtr.Zero) {
                    EnumDesktopWindows(defaultDesktop, inspectWindow, IntPtr.Zero);
                }
            }
            return resolved;
        }
    }
}
'@

    [MultiUserBrowserCapture.NativeMethods]::SetProcessDPIAware() | Out-Null
}

function Get-MultiUserFfmpegPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$WorkspaceRoot
    )

    $ffmpegPath = [System.IO.Path]::GetFullPath((Join-Path $WorkspaceRoot 'node_modules\ffmpeg-static\ffmpeg.exe'))
    if (-not $ffmpegPath.StartsWith([System.IO.Path]::GetFullPath($WorkspaceRoot), [System.StringComparison]::OrdinalIgnoreCase)) {
        throw 'The FFmpeg path resolved outside the workspace.'
    }
    if (-not (Test-Path -LiteralPath $ffmpegPath)) {
        throw "Missing bundled FFmpeg executable: $ffmpegPath"
    }

    return $ffmpegPath
}

function Get-ForegroundChromeCaptureWindow {
    param(
        [ValidateRange(640, 3840)]
        [int]$Width = 1280,

        [ValidateRange(480, 2160)]
        [int]$Height = 720,

        [switch]$Resize,

        [long]$WindowHandle = 0,

        [string]$PreferredTitleContains = 'Frontline Education - Sign In'
    )

    Initialize-MultiUserBrowserCaptureNativeMethods

    $handle = if ($WindowHandle -ne 0) {
        [MultiUserBrowserCapture.NativeMethods]::ResolveVisibleWindow($WindowHandle)
    } else {
        [MultiUserBrowserCapture.NativeMethods]::GetForegroundWindow()
    }
    $needsChromeActivation = $WindowHandle -eq 0 -and $handle -eq [IntPtr]::Zero
    if (-not $needsChromeActivation) {
        [uint32]$foregroundProcessId = 0
        [MultiUserBrowserCapture.NativeMethods]::GetWindowThreadProcessId($handle, [ref]$foregroundProcessId) | Out-Null
        $foregroundProcess = Get-Process -Id $foregroundProcessId -ErrorAction SilentlyContinue
        $needsChromeActivation = $null -eq $foregroundProcess -or $foregroundProcess.ProcessName -ne 'chrome'
    }
    if ($needsChromeActivation) {
        $chromeWindow = Get-Process -Name 'chrome' -ErrorAction SilentlyContinue |
            Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } |
            Sort-Object StartTime -Descending |
            Select-Object -First 1
        if ($null -ne $chromeWindow) {
            $handle = $chromeWindow.MainWindowHandle
            [MultiUserBrowserCapture.NativeMethods]::ShowWindow($handle, 9) | Out-Null
            $shell = New-Object -ComObject WScript.Shell
            $shell.AppActivate($chromeWindow.Id) | Out-Null
            [MultiUserBrowserCapture.NativeMethods]::SetForegroundWindow($handle) | Out-Null
            Start-Sleep -Milliseconds 400
        } else {
            $handle = [MultiUserBrowserCapture.NativeMethods]::FindVisibleChromeWindow($PreferredTitleContains)
            if ($handle -ne [IntPtr]::Zero) {
                [uint32]$enumeratedProcessId = 0
                [MultiUserBrowserCapture.NativeMethods]::GetWindowThreadProcessId($handle, [ref]$enumeratedProcessId) | Out-Null
                [MultiUserBrowserCapture.NativeMethods]::ShowWindow($handle, 9) | Out-Null
                $shell = New-Object -ComObject WScript.Shell
                $shell.AppActivate([int]$enumeratedProcessId) | Out-Null
                [MultiUserBrowserCapture.NativeMethods]::SetForegroundWindow($handle) | Out-Null
                Start-Sleep -Milliseconds 400
            }
        }
    }
    if ($handle -eq [IntPtr]::Zero) {
        throw 'No visible Chrome window is available for full-browser capture.'
    }

    [uint32]$processId = 0
    [MultiUserBrowserCapture.NativeMethods]::GetWindowThreadProcessId($handle, [ref]$processId) | Out-Null
    $process = Get-Process -Id $processId -ErrorAction Stop
    if ($process.ProcessName -ne 'chrome') {
        throw "The foreground window belongs to '$($process.ProcessName)', not Chrome. Bring the dedicated headed Chrome window to the foreground and retry."
    }
    $isMinimized = [MultiUserBrowserCapture.NativeMethods]::IsIconic($handle)
    $isMaximized = [MultiUserBrowserCapture.NativeMethods]::IsZoomed($handle)
    if (($isMinimized -or $isMaximized) -and $Resize) {
        $restoreWindow = 9
        [MultiUserBrowserCapture.NativeMethods]::ShowWindow($handle, $restoreWindow) | Out-Null
        Start-Sleep -Milliseconds 300
    }
    elseif ($isMinimized) {
        throw 'The Chrome capture window is minimized. Restore it and retry.'
    }

    if ($Resize) {
        $showWindowWithoutActivation = 0x0040
        if (-not [MultiUserBrowserCapture.NativeMethods]::SetWindowPos($handle, [IntPtr]::Zero, 0, 0, $Width, $Height, $showWindowWithoutActivation)) {
            throw 'Unable to position the Chrome window for the required 1280x720 full-browser capture.'
        }
        $shell = New-Object -ComObject WScript.Shell
        $shell.AppActivate($processId) | Out-Null
        [MultiUserBrowserCapture.NativeMethods]::SetForegroundWindow($handle) | Out-Null
        Start-Sleep -Milliseconds 400
    }

    $rect = New-Object MultiUserBrowserCapture.NativeMethods+RECT
    if (-not [MultiUserBrowserCapture.NativeMethods]::GetWindowRect($handle, [ref]$rect)) {
        throw 'Unable to read the Chrome window bounds.'
    }

    $actualWidth = $rect.Right - $rect.Left
    $actualHeight = $rect.Bottom - $rect.Top
    if ($actualWidth -lt 640 -or $actualHeight -lt 480) {
        throw "The Chrome window is too small for readable evidence: ${actualWidth}x${actualHeight}."
    }
    if ($Resize -and ($actualWidth -ne $Width -or $actualHeight -ne $Height)) {
        throw "Chrome did not reach the required ${Width}x${Height} outer-window size; actual size is ${actualWidth}x${actualHeight}."
    }

    return [pscustomobject]@{
        Handle = $handle
        ProcessId = [int]$processId
        X = $rect.Left
        Y = $rect.Top
        Width = $actualWidth
        Height = $actualHeight
    }
}
