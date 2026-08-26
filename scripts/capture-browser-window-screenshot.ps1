param(
    [Parameter(Mandatory = $true)]
    [string]$OrgId,

    [Parameter(Mandatory = $true)]
    [string]$RunId,

    [Parameter(Mandatory = $true)]
    [string]$AccountSlug,

    [Parameter(Mandatory = $true)]
    [string]$EvidenceName
)

$ErrorActionPreference = 'Stop'

if ($RunId -notmatch '^\d{8}-\d{6}$') {
    throw 'RunId must use the format yyyyMMdd-HHmmss.'
}
if ($AccountSlug -notmatch '^[a-z0-9-]+$') {
    throw 'AccountSlug may contain only lowercase letters, digits, and hyphens.'
}
if ($EvidenceName -notmatch '^[A-Za-z0-9_.-]+\.png$') {
    throw 'EvidenceName must be a safe PNG filename.'
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
if ([string]$manifest.organizationId -ne $OrgId -or $AccountSlug -notin @($manifest.accounts.slug)) {
    throw 'The organization or account slug does not match the run manifest.'
}
$isolationEvidencePath = [System.IO.Path]::GetFullPath((Join-Path $runDirectory [string]$manifest.capture.isolationEvidence))
if (-not $isolationEvidencePath.StartsWith($runDirectory, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $isolationEvidencePath)) {
    throw 'Missing confirmed browser-isolation evidence for screenshot capture.'
}
$isolationEvidence = Get-Content -LiteralPath $isolationEvidencePath -Raw | ConvertFrom-Json
if ($manifest.capture.isolationStatus -ne 'CONFIRMED' -or
    $isolationEvidence.status -ne 'CONFIRMED' -or
    [string]$isolationEvidence.organizationId -ne $OrgId -or
    [string]$isolationEvidence.runId -ne $RunId -or
    $isolationEvidence.controlSurface -ne 'playwright-mcp' -or
    $isolationEvidence.profileMode -ne 'isolated-in-memory' -or
    $isolationEvidence.priorContextReset -ne $true -or
    $isolationEvidence.pageControlProbe -ne $true -or
    [int]$isolationEvidence.controlledTabCount -ne 1) {
    throw 'The browser-isolation evidence is incomplete or does not match this screenshot run.'
}

$screenshotDirectory = [System.IO.Path]::GetFullPath((Join-Path (Join-Path (Join-Path $runDirectory 'roles') $AccountSlug) 'screenshots'))
$expectedRoleRoot = [System.IO.Path]::GetFullPath((Join-Path $runDirectory 'roles'))
if (-not $screenshotDirectory.StartsWith($expectedRoleRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'The screenshot destination resolved outside the role evidence directory.'
}
New-Item -ItemType Directory -Force -Path $screenshotDirectory | Out-Null

$destination = [System.IO.Path]::GetFullPath((Join-Path $screenshotDirectory $EvidenceName))
if (-not $destination.StartsWith($screenshotDirectory, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'The screenshot path resolved outside its evidence directory.'
}

$videoStatePath = Join-Path $runDirectory 'browser-window-video-state.json'
$recordedWindowHandle = [long]$isolationEvidence.chromeWindowHandle
if (Test-Path -LiteralPath $videoStatePath) {
    $videoState = Get-Content -LiteralPath $videoStatePath -Raw | ConvertFrom-Json
    if ([long]$videoState.chromeWindowHandle -ne $recordedWindowHandle) {
        throw 'The recording window does not match the confirmed isolated Chrome window.'
    }
}
$window = Get-ForegroundChromeCaptureWindow -Width 1280 -Height 720 -Resize -WindowHandle $recordedWindowHandle
if ($window.ProcessId -ne [int]$isolationEvidence.chromeProcessId) {
    throw 'The confirmed isolated Chrome process is no longer available. Refusing to capture another Chrome window.'
}
Add-Type -AssemblyName System.Drawing
$bitmap = New-Object System.Drawing.Bitmap($window.Width, $window.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$screenCopyFailed = $false
try {
    try {
        $graphics.CopyFromScreen($window.X, $window.Y, 0, 0, $bitmap.Size, [System.Drawing.CopyPixelOperation]::SourceCopy)
        $bitmap.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)
    } catch {
        $screenCopyFailed = $true
    }
} finally {
    $graphics.Dispose()
    $bitmap.Dispose()
}

if ($screenCopyFailed -or -not (Test-Path -LiteralPath $destination) -or (Get-Item -LiteralPath $destination -ErrorAction SilentlyContinue).Length -lt 1024) {
    $printBitmap = New-Object System.Drawing.Bitmap($window.Width, $window.Height)
    $printGraphics = [System.Drawing.Graphics]::FromImage($printBitmap)
    $printHdc = $printGraphics.GetHdc()
    try {
        $printSucceeded = [MultiUserBrowserCapture.NativeMethods]::PrintWindow($window.Handle, $printHdc, 2)
    } finally {
        $printGraphics.ReleaseHdc($printHdc)
        $printGraphics.Dispose()
    }
    try {
        if ($printSucceeded) {
            $printBitmap.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)
        }
    } finally {
        $printBitmap.Dispose()
    }
}

if (-not (Test-Path -LiteralPath $destination) -or (Get-Item -LiteralPath $destination -ErrorAction SilentlyContinue).Length -lt 1024) {
    $ffmpegPath = Get-MultiUserFfmpegPath -WorkspaceRoot $workspaceRoot
    $ffmpegArguments = @(
        '-hide_banner', '-loglevel', 'error',
        '-f', 'gdigrab', '-draw_mouse', '0', '-framerate', '1',
        '-offset_x', [string]$window.X, '-offset_y', [string]$window.Y,
        '-video_size', ("{0}x{1}" -f $window.Width, $window.Height),
        '-i', 'desktop', '-frames:v', '1', '-y', $destination
    )
    & $ffmpegPath @ffmpegArguments
    if ($LASTEXITCODE -ne 0) {
        throw 'Windows screen copy, PrintWindow, and the bundled full-browser screenshot fallback all failed.'
    }
}

if (-not (Test-Path -LiteralPath $destination) -or (Get-Item -LiteralPath $destination).Length -lt 1024) {
    throw 'The full-browser screenshot was not created successfully.'
}

[pscustomobject]@{
    organizationId = $OrgId
    runId = $RunId
    accountSlug = $AccountSlug
    screenshot = $destination
    captureScope = 'full-browser-window'
    width = $window.Width
    height = $window.Height
    addressBarIncluded = $true
} | ConvertTo-Json -Depth 3
