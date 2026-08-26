param(
    [Parameter(Mandatory = $true)]
    [string]$OrgId,

    [Parameter(Mandatory = $true)]
    [string]$RunId,

    [Parameter(Mandatory = $true)]
    [uri]$InitialUrl,

    [Parameter(Mandatory = $true)]
    [ValidateSet('playwright-mcp')]
    [string]$ControlSurface,

    [Parameter(Mandatory = $true)]
    [ValidateRange(1, 100)]
    [int]$ControlledTabCount,

    [Parameter(Mandatory = $true)]
    [string]$WindowTitleToken,

    [switch]$ContextReset,

    [switch]$PageControlProbe
)

$ErrorActionPreference = 'Stop'

if ($RunId -notmatch '^\d{8}-\d{6}$') {
    throw 'RunId must use the format yyyyMMdd-HHmmss.'
}
$expectedWindowTitleToken = "AES Stage ML Isolated Run $RunId"
if (-not [string]::Equals($WindowTitleToken, $expectedWindowTitleToken, [System.StringComparison]::Ordinal)) {
    throw "WindowTitleToken must equal '$expectedWindowTitleToken'."
}

$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
. (Join-Path $PSScriptRoot 'multi-user-org-context.ps1')
. (Join-Path $PSScriptRoot 'browser-window-capture-support.ps1')

$context = Resolve-MultiUserOrganizationContext -WorkspaceRoot $workspaceRoot -OrgId $OrgId
$runDirectory = [System.IO.Path]::GetFullPath((Join-Path $context.FullSuiteRoot $RunId))
$manifestPath = Join-Path $runDirectory 'run-manifest.json'
$evidencePath = Join-Path $runDirectory 'browser-isolation.json'
$playwrightConfigPath = Join-Path $workspaceRoot '.codex\config.toml'
$videoEventPath = Join-Path $runDirectory 'video-events.json'
$videoStatePath = Join-Path $runDirectory 'browser-window-video-state.json'

if (-not $runDirectory.StartsWith($context.FullSuiteRoot, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $manifestPath)) {
    throw "Missing or invalid run directory: $runDirectory"
}
if (Test-Path -LiteralPath $evidencePath) {
    throw 'Browser isolation has already been confirmed for this run.'
}
if ((Test-Path -LiteralPath $videoEventPath) -or (Test-Path -LiteralPath $videoStatePath)) {
    throw 'Confirm browser isolation before recording or scenario events begin.'
}
if (-not (Test-Path -LiteralPath $playwrightConfigPath)) {
    throw 'Missing project-scoped Playwright MCP configuration.'
}

$playwrightConfigText = Get-Content -LiteralPath $playwrightConfigPath -Raw
$isolatedMcpConfiguration = $playwrightConfigText -match '(?m)^\s*"--browser"\s*,?\s*$' -and
    $playwrightConfigText -match '(?m)^\s*"chrome"\s*,?\s*$' -and
    $playwrightConfigText -match '(?m)^\s*"--isolated"\s*,?\s*$' -and
    $playwrightConfigText -notmatch '(?m)^\s*"--(?:extension|cdp-endpoint|user-data-dir|storage-state|shared-browser-context|save-session)"\s*,?\s*$'
if (-not $isolatedMcpConfiguration) {
    throw 'Playwright MCP must launch headed Chrome with --isolated and without extension, CDP, persistent profile, storage-state, saved-session, or shared-context options.'
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
if ([string]$manifest.organizationId -ne $OrgId -or $manifest.capture.isolationStatus -ne 'PENDING') {
    throw 'The run manifest is not awaiting browser-isolation confirmation.'
}
$requiredTabCount = [int]$context.Config.browserIsolation.initialControlledTabCount
if ($ControlledTabCount -ne $requiredTabCount) {
    throw "The isolated Playwright context must contain exactly $requiredTabCount controlled tab before credential entry; observed $ControlledTabCount."
}
if ($context.Config.browserIsolation.requireContextReset -eq $true -and -not $ContextReset.IsPresent) {
    throw 'The prior Playwright MCP backend/context was not closed before this suite invocation.'
}
if ($context.Config.browserIsolation.requirePageControlProbe -eq $true -and -not $PageControlProbe.IsPresent) {
    throw 'The Playwright MCP page-control title write/read probe was not confirmed.'
}

$configuredInitialUrl = [uri][string]$context.Config.url
if (-not [string]::Equals($InitialUrl.Scheme, $configuredInitialUrl.Scheme, [System.StringComparison]::OrdinalIgnoreCase) -or
    -not [string]::Equals($InitialUrl.Host, $configuredInitialUrl.Host, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "The first controlled page must remain on the configured Stage login origin before credentials are entered. Observed host: $($InitialUrl.Host)"
}

$window = Get-ForegroundChromeCaptureWindow -Width 1280 -Height 720 -Resize -PreferredTitleContains $WindowTitleToken -RequirePreferredTitle
$confirmedAt = (Get-Date).ToString('o')
$evidence = [ordered]@{
    schemaVersion = 1
    organizationId = $OrgId
    runId = $RunId
    status = 'CONFIRMED'
    confirmedAt = $confirmedAt
    controlSurface = $ControlSurface
    browser = 'Chrome'
    profileMode = 'isolated-in-memory'
    playwrightConfig = '.codex/config.toml'
    isolatedArgumentConfigured = $true
    extensionModeConfigured = $false
    persistentProfileConfigured = $false
    storageStateConfigured = $false
    sharedBrowserContextConfigured = $false
    priorContextReset = $ContextReset.IsPresent
    pageControlProbe = $PageControlProbe.IsPresent
    controlledTabCount = $ControlledTabCount
    initialUrlOrigin = $InitialUrl.GetLeftPart([System.UriPartial]::Authority)
    dedicatedWindow = $true
    windowTitleToken = $WindowTitleToken
    chromeProcessId = $window.ProcessId
    chromeWindowHandle = $window.Handle.ToInt64()
    windowSize = "$($window.Width)x$($window.Height)"
}
$evidence | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $evidencePath -Encoding utf8

$manifest.capture.isolationStatus = 'CONFIRMED'
$manifest.capture.freshAutomationContext = $true
$manifest.capture.freshBrowserWindow = $true
$manifest.capture | Add-Member -NotePropertyName confirmedAt -NotePropertyValue $confirmedAt -Force
$manifest.capture | Add-Member -NotePropertyName chromeProcessId -NotePropertyValue $window.ProcessId -Force
$manifest.capture | Add-Member -NotePropertyName chromeWindowHandle -NotePropertyValue $window.Handle.ToInt64() -Force
$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding utf8

[pscustomobject]@{
    organizationId = $OrgId
    runId = $RunId
    isolationStatus = 'CONFIRMED'
    evidence = $evidencePath
    controlSurface = $ControlSurface
    controlledTabCount = $ControlledTabCount
    chromeProcessId = $window.ProcessId
    chromeWindowHandle = $window.Handle.ToInt64()
} | ConvertTo-Json -Depth 4
