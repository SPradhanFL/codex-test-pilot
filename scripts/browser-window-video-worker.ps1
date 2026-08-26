param(
    [Parameter(Mandatory = $true)][string]$FfmpegPath,
    [Parameter(Mandatory = $true)][string]$CapturePath,
    [Parameter(Mandatory = $true)][string]$StopSignalPath,
    [Parameter(Mandatory = $true)][string]$ReadyPath,
    [Parameter(Mandatory = $true)][string]$ResultPath,
    [Parameter(Mandatory = $true)][long]$WindowHandle,
    [Parameter(Mandatory = $true)][int]$X,
    [Parameter(Mandatory = $true)][int]$Y,
    [Parameter(Mandatory = $true)][int]$Width,
    [Parameter(Mandatory = $true)][int]$Height,
    [Parameter(Mandatory = $true)][int]$FrameRate
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

namespace MultiUserBrowserCapture {
    public static class WorkerNativeMethods {
        public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

        [DllImport("user32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdcBlt, uint nFlags);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool IsWindow(IntPtr hWnd);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern IntPtr OpenDesktop(string desktopName, uint flags, bool inherit, uint desiredAccess);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool CloseDesktop(IntPtr desktopHandle);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool EnumDesktopWindows(IntPtr desktopHandle, EnumWindowsProc callback, IntPtr lParam);

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        public static extern uint SetThreadExecutionState(uint flags);

        public static IntPtr ResolveDesktopWindow(IntPtr desktopHandle, long requestedHandle) {
            IntPtr resolved = IntPtr.Zero;
            EnumDesktopWindows(desktopHandle, delegate (IntPtr hWnd, IntPtr lParam) {
                if (hWnd.ToInt64() == requestedHandle) {
                    resolved = hWnd;
                    return false;
                }
                return true;
            }, IntPtr.Zero);
            return resolved;
        }
    }
}
'@

function ConvertTo-WorkerArgument {
    param([Parameter(Mandatory = $true)][string]$Value)

    if ($Value -notmatch '[\s"]') {
        return $Value
    }
    return '"' + $Value.Replace('"', '\"') + '"'
}

$result = [ordered]@{
    status = 'FAILED'
    ffmpegProcessId = $null
    startedAtUtc = $null
    endedAtUtc = $null
    exitCode = $null
    captureMethod = 'print-window-raw-frame-pipe'
    framesWritten = 0
    repeatedFrames = 0
    error = $null
}

$executionStateContinuous = [uint32]2147483648
$executionStateSystemRequired = [uint32]1
$executionStateDisplayRequired = [uint32]2
$executionStateApplied = $false
$ffmpeg = $null
$bitmap = $null
$graphics = $null
$frameBuffer = $null
$desktopHandle = [IntPtr]::Zero

try {
    if (-not (Test-Path -LiteralPath $FfmpegPath)) {
        throw 'Bundled FFmpeg is missing.'
    }
    if ((Test-Path -LiteralPath $StopSignalPath) -or (Test-Path -LiteralPath $ReadyPath) -or (Test-Path -LiteralPath $ResultPath)) {
        throw 'Capture worker control artifacts already exist.'
    }

    $desktopEnumerateWindows = [uint32]0x0040
    $desktopHandle = [MultiUserBrowserCapture.WorkerNativeMethods]::OpenDesktop('Default', 0, $false, $desktopEnumerateWindows)
    $window = if ($desktopHandle -ne [IntPtr]::Zero) {
        [MultiUserBrowserCapture.WorkerNativeMethods]::ResolveDesktopWindow($desktopHandle, $WindowHandle)
    } else {
        [IntPtr]$WindowHandle
    }
    if ($window -eq [IntPtr]::Zero -or -not [MultiUserBrowserCapture.WorkerNativeMethods]::IsWindow($window)) {
        throw 'The dedicated Chrome window handle is no longer valid.'
    }

    [uint32]$executionStateFlags = $executionStateContinuous -bor $executionStateSystemRequired -bor $executionStateDisplayRequired
    $executionState = [MultiUserBrowserCapture.WorkerNativeMethods]::SetThreadExecutionState($executionStateFlags)
    if ($executionState -eq 0) {
        throw 'Unable to prevent display sleep during full-browser recording.'
    }
    $executionStateApplied = $true

    $arguments = @(
        '-hide_banner', '-loglevel', 'warning', '-y',
        '-f', 'rawvideo', '-pixel_format', 'bgra',
        '-video_size', "${Width}x${Height}", '-framerate', [string]$FrameRate,
        '-i', 'pipe:0',
        '-an', '-c:v', 'libvpx-vp9', '-deadline', 'realtime', '-cpu-used', '8',
        '-b:v', '2500k', '-row-mt', '1', '-threads', '4',
        '-pix_fmt', 'yuv420p', '-f', 'webm', $CapturePath
    )

    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $FfmpegPath
    $startInfo.Arguments = (@($arguments | ForEach-Object { ConvertTo-WorkerArgument ([string]$_) }) -join ' ')
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardInput = $true

    $ffmpeg = New-Object System.Diagnostics.Process
    $ffmpeg.StartInfo = $startInfo
    if (-not $ffmpeg.Start()) {
        throw 'FFmpeg did not start.'
    }

    $bitmap = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $frameBuffer = New-Object byte[] ($Width * $Height * 4)
    $frameRectangle = New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)
    $frameIntervalMilliseconds = 1000.0 / $FrameRate
    $schedule = [System.Diagnostics.Stopwatch]::StartNew()
    $nextFrameMilliseconds = 0.0
    $consecutiveCaptureFailures = 0

    $result.ffmpegProcessId = $ffmpeg.Id
    $result.startedAtUtc = [DateTimeOffset]::UtcNow.ToString('o')
    [ordered]@{
        status = 'READY'
        ffmpegProcessId = $ffmpeg.Id
        startedAtUtc = $result.startedAtUtc
        captureMethod = $result.captureMethod
    } | ConvertTo-Json | Set-Content -LiteralPath $ReadyPath -Encoding utf8

    while (-not (Test-Path -LiteralPath $StopSignalPath)) {
        if ($ffmpeg.HasExited) {
            throw "FFmpeg exited unexpectedly with code $($ffmpeg.ExitCode)."
        }

        $printHdc = $graphics.GetHdc()
        try {
            $captured = [MultiUserBrowserCapture.WorkerNativeMethods]::PrintWindow($window, $printHdc, 2)
        } finally {
            $graphics.ReleaseHdc($printHdc)
        }

        if ($captured) {
            $bitmapData = $bitmap.LockBits(
                $frameRectangle,
                [System.Drawing.Imaging.ImageLockMode]::ReadOnly,
                [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
            )
            try {
                if ($bitmapData.Stride -ne ($Width * 4)) {
                    throw "Unexpected PrintWindow bitmap stride: $($bitmapData.Stride)."
                }
                [System.Runtime.InteropServices.Marshal]::Copy($bitmapData.Scan0, $frameBuffer, 0, $frameBuffer.Length)
            } finally {
                $bitmap.UnlockBits($bitmapData)
            }
            $consecutiveCaptureFailures = 0
        } else {
            $consecutiveCaptureFailures++
            if ($result.framesWritten -eq 0 -or $consecutiveCaptureFailures -ge 25) {
                throw 'PrintWindow could not capture the dedicated Chrome window.'
            }
            $result.repeatedFrames++
        }

        $ffmpeg.StandardInput.BaseStream.Write($frameBuffer, 0, $frameBuffer.Length)
        $result.framesWritten++

        $nextFrameMilliseconds += $frameIntervalMilliseconds
        $remainingMilliseconds = $nextFrameMilliseconds - $schedule.Elapsed.TotalMilliseconds
        if ($remainingMilliseconds -gt 1) {
            Start-Sleep -Milliseconds ([int][Math]::Floor($remainingMilliseconds))
        } elseif ($remainingMilliseconds -lt (-1 * $frameIntervalMilliseconds)) {
            $nextFrameMilliseconds = $schedule.Elapsed.TotalMilliseconds
        }
    }

    $ffmpeg.StandardInput.BaseStream.Flush()
    $ffmpeg.StandardInput.Close()
    if (-not $ffmpeg.WaitForExit(45000)) {
        $ffmpeg.Kill()
        throw 'FFmpeg did not finish the full-browser recording within 45 seconds.'
    }
    if ($ffmpeg.ExitCode -ne 0) {
        throw "FFmpeg stopped with code $($ffmpeg.ExitCode)."
    }
    if (-not (Test-Path -LiteralPath $CapturePath) -or (Get-Item -LiteralPath $CapturePath).Length -lt 1024) {
        throw 'The PrintWindow full-browser recording is missing or empty.'
    }

    $result.status = 'COMPLETED'
    $result.exitCode = 0
} catch {
    $result.error = $_.Exception.Message
    if ($null -ne $ffmpeg -and -not $ffmpeg.HasExited) {
        $ffmpeg.Kill()
        $ffmpeg.WaitForExit()
    }
    if ($null -ne $ffmpeg -and $ffmpeg.HasExited) {
        $result.exitCode = $ffmpeg.ExitCode
    }
} finally {
    if ($null -ne $graphics) {
        $graphics.Dispose()
    }
    if ($null -ne $bitmap) {
        $bitmap.Dispose()
    }
    if ($executionStateApplied) {
        [MultiUserBrowserCapture.WorkerNativeMethods]::SetThreadExecutionState($executionStateContinuous) | Out-Null
    }
    if ($desktopHandle -ne [IntPtr]::Zero) {
        [MultiUserBrowserCapture.WorkerNativeMethods]::CloseDesktop($desktopHandle) | Out-Null
    }
    $result.endedAtUtc = [DateTimeOffset]::UtcNow.ToString('o')
    $result | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $ResultPath -Encoding utf8
}

if ($result.status -ne 'COMPLETED') {
    exit 1
}
