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

$manifestAccount = @($manifest.accounts | Where-Object slug -eq $AccountSlug)
$parallel = [string]$manifest.capture.executionMode -eq 'parallel'
$laneSlug = if ($parallel) { [string](@($manifest.lanes | Where-Object { [int]$_.laneId -eq [int]$manifestAccount[0].laneId })[0].slug) } else { '' }
$videoStatePath = if ($parallel) { Join-Path (Join-Path (Join-Path $runDirectory 'lanes') $laneSlug) 'browser-window-video-state.json' } else { Join-Path $runDirectory 'browser-window-video-state.json' }
$recordedWindowHandle = 0
if (Test-Path -LiteralPath $videoStatePath) {
    $videoState = Get-Content -LiteralPath $videoStatePath -Raw | ConvertFrom-Json
    $recordedWindowHandle = [long]$videoState.chromeWindowHandle
}
if ($parallel -and $recordedWindowHandle -eq 0) { throw "Missing active browser-window state for $laneSlug; refusing to capture another lane's window." }
$windowSlot = if ($parallel) { [int]$manifestAccount[0].laneId } else { 0 }
$window = Get-ForegroundChromeCaptureWindow -Width 1280 -Height 720 -Resize -WindowHandle $recordedWindowHandle -WindowSlot $windowSlot
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
