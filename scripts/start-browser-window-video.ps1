param(
    [Parameter(Mandatory = $true)]
    [string]$OrgId,

    [Parameter(Mandatory = $true)]
    [string]$RunId,

    [ValidateRange(640, 3840)]
    [int]$Width = 1280,

    [ValidateRange(480, 2160)]
    [int]$Height = 720,

    [ValidateRange(5, 60)]
    [int]$FrameRate = 15,

    [string]$PreferredTitleContains = 'Frontline Education - Sign In'
)

$ErrorActionPreference = 'Stop'

if ($RunId -notmatch '^\d{8}-\d{6}$') {
    throw 'RunId must use the format yyyyMMdd-HHmmss.'
}

$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
. (Join-Path $PSScriptRoot 'multi-user-org-context.ps1')
. (Join-Path $PSScriptRoot 'browser-window-capture-support.ps1')

$context = Resolve-MultiUserOrganizationContext -WorkspaceRoot $workspaceRoot -OrgId $OrgId
$runDirectory = [System.IO.Path]::GetFullPath((Join-Path $context.FullSuiteRoot $RunId))
$manifestPath = Join-Path $runDirectory 'run-manifest.json'
if (-not $runDirectory.StartsWith($context.FullSuiteRoot, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $manifestPath)) {
    throw "Missing or invalid run directory: $runDirectory"
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
if ([string]$manifest.organizationId -ne $OrgId) {
    throw 'The organization does not match the run manifest.'
}

$videoDirectory = [System.IO.Path]::GetFullPath((Join-Path $runDirectory 'videos'))
$statePath = [System.IO.Path]::GetFullPath((Join-Path $runDirectory 'browser-window-video-state.json'))
$capturePath = [System.IO.Path]::GetFullPath((Join-Path $videoDirectory 'multi-user-full-suite-execution.capture.webm'))
$finalPath = [System.IO.Path]::GetFullPath((Join-Path $videoDirectory 'multi-user-full-suite-execution.webm'))
$stopSignalPath = [System.IO.Path]::GetFullPath((Join-Path $runDirectory 'browser-window-video.stop'))
$readyPath = [System.IO.Path]::GetFullPath((Join-Path $runDirectory 'browser-window-video.ready.json'))
$resultPath = [System.IO.Path]::GetFullPath((Join-Path $runDirectory 'browser-window-video.result.json'))
foreach ($path in @($videoDirectory, $statePath, $capturePath, $finalPath, $stopSignalPath, $readyPath, $resultPath)) {
    if (-not $path.StartsWith($runDirectory, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw 'A video capture path resolved outside the current run directory.'
    }
}
if (@(@($statePath, $capturePath, $finalPath, $stopSignalPath, $readyPath, $resultPath) | Where-Object { Test-Path -LiteralPath $_ }).Count -gt 0) {
    throw 'A browser-window video capture or finalized video already exists for this run.'
}

New-Item -ItemType Directory -Force -Path $videoDirectory | Out-Null
$logDirectory = [System.IO.Path]::GetFullPath((Join-Path $workspaceRoot '.playwright-mcp'))
New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
$stderrPath = Join-Path $logDirectory ("browser-window-video-$OrgId-$RunId.stderr.log")
$stdoutPath = Join-Path $logDirectory ("browser-window-video-$OrgId-$RunId.stdout.log")

$window = Get-ForegroundChromeCaptureWindow -Width $Width -Height $Height -Resize -PreferredTitleContains $PreferredTitleContains
$ffmpegPath = Get-MultiUserFfmpegPath -WorkspaceRoot $workspaceRoot
$workerPath = Join-Path $PSScriptRoot 'browser-window-video-worker.ps1'
if (-not (Test-Path -LiteralPath $workerPath)) {
    throw "Missing browser-window recording worker: $workerPath"
}

$workerArguments = @(
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ('"' + $workerPath.Replace('"', '\"') + '"'),
    '-FfmpegPath', ('"' + $ffmpegPath.Replace('"', '\"') + '"'),
    '-CapturePath', ('"' + $capturePath.Replace('"', '\"') + '"'),
    '-StopSignalPath', ('"' + $stopSignalPath.Replace('"', '\"') + '"'),
    '-ReadyPath', ('"' + $readyPath.Replace('"', '\"') + '"'),
    '-ResultPath', ('"' + $resultPath.Replace('"', '\"') + '"'),
    '-WindowHandle', [string]$window.Handle.ToInt64(),
    '-X', [string]$window.X, '-Y', [string]$window.Y,
    '-Width', [string]$window.Width, '-Height', [string]$window.Height,
    '-FrameRate', [string]$FrameRate
)

$workerProcess = Start-Process -FilePath 'powershell.exe' -ArgumentList ($workerArguments -join ' ') -PassThru -WindowStyle Hidden -RedirectStandardError $stderrPath -RedirectStandardOutput $stdoutPath
$readyDeadline = [DateTimeOffset]::UtcNow.AddSeconds(15)
while (-not (Test-Path -LiteralPath $readyPath) -and -not $workerProcess.HasExited -and [DateTimeOffset]::UtcNow -lt $readyDeadline) {
    Start-Sleep -Milliseconds 250
}
if (-not (Test-Path -LiteralPath $readyPath)) {
    if (-not (Test-Path -LiteralPath $stopSignalPath)) {
        'stop' | Set-Content -LiteralPath $stopSignalPath -Encoding ascii
    }
    $workerProcess.WaitForExit(10000) | Out-Null
    $diagnostic = if (Test-Path -LiteralPath $resultPath) {
        [string](Get-Content -LiteralPath $resultPath -Raw | ConvertFrom-Json).error
    } elseif (Test-Path -LiteralPath $stderrPath) {
        (Get-Content -LiteralPath $stderrPath -Tail 20) -join ' '
    } else {
        'No capture-worker diagnostic was produced.'
    }
    throw "Full-browser recording failed to start. $diagnostic"
}
$ready = Get-Content -LiteralPath $readyPath -Raw | ConvertFrom-Json

$state = [ordered]@{
    organizationId = $OrgId
    runId = $RunId
    workerProcessId = $workerProcess.Id
    captureProcessId = [int]$ready.ffmpegProcessId
    chromeProcessId = $window.ProcessId
    chromeWindowHandle = $window.Handle.ToInt64()
    startedAtUtc = [string]$ready.startedAtUtc
    capturePath = $capturePath
    finalPath = $finalPath
    stopSignalPath = $stopSignalPath
    readyPath = $readyPath
    resultPath = $resultPath
    stderrPath = $stderrPath
    stdoutPath = $stdoutPath
    x = $window.X
    y = $window.Y
    width = $window.Width
    height = $window.Height
    frameRate = $FrameRate
    captureScope = 'full-browser-window'
    captureMethod = 'print-window-raw-frame-pipe'
    addressBarIncluded = $true
}
$state | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $statePath -Encoding utf8

[pscustomobject]$state | ConvertTo-Json -Depth 4
