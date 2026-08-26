param(
    [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$configPath = Join-Path $workspaceRoot '.codex\config.toml'

if (-not (Test-Path -LiteralPath $configPath)) {
    Write-Error "Missing project Playwright MCP configuration: $configPath"
    exit 1
}

$configText = Get-Content -LiteralPath $configPath -Raw
$playwrightBlock = [regex]::Match(
    $configText,
    '(?ms)^\[mcp_servers\.playwright\]\s*(.*?)(?=^\[|\z)'
)

if (-not $playwrightBlock.Success) {
    Write-Error 'Missing [mcp_servers.playwright] configuration block.'
    exit 1
}

$block = $playwrightBlock.Value
$required = [ordered]@{
    Enabled = $block -match '(?m)^enabled\s*=\s*true\s*$'
    Chrome = $block -match '(?s)"--browser"\s*,\s*"chrome"'
    Isolated = $block -match '"--isolated"'
    Headed = $block -notmatch '"--headless"'
}
$forbidden = [ordered]@{
    Extension = $block -match '"--extension"'
    UserDataDirectory = $block -match '"--user-data-dir"'
    StorageState = $block -match '"--storage-state"'
    SharedBrowserContext = $block -match '"--shared-browser-context"'
    SaveSession = $block -match '"--save-session"'
}
$forbiddenEnvironmentVariables = @(
    'PLAYWRIGHT_MCP_EXTENSION'
    'PLAYWRIGHT_MCP_USER_DATA_DIR'
    'PLAYWRIGHT_MCP_STORAGE_STATE'
    'PLAYWRIGHT_MCP_SHARED_BROWSER_CONTEXT'
    'PLAYWRIGHT_MCP_SAVE_SESSION'
    'PLAYWRIGHT_MCP_HEADLESS'
)
$environmentOverridePresent = @($forbiddenEnvironmentVariables | Where-Object {
    -not [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($_))
}).Count -gt 0

$ready = @($required.Values | Where-Object { -not $_ }).Count -eq 0 -and
    @($forbidden.Values | Where-Object { $_ }).Count -eq 0 -and
    -not $environmentOverridePresent

if (-not $Quiet) {
    [pscustomobject]@{
        Config = $configPath
        Browser = 'Chrome'
        Headed = $required.Headed
        IsolatedInMemoryProfile = $required.Isolated
        PersistentExtensionDisabled = -not $forbidden.Extension
        PersistentProfileOptionsAbsent = @($forbidden.Values | Where-Object { $_ }).Count -eq 0
        ConflictingEnvironmentOverridesAbsent = -not $environmentOverridePresent
        Ready = $ready
    } | Format-List
}

if (-not $ready) {
    Write-Error 'Disposable Chrome profile preflight failed. Require headed Chrome with --isolated and no extension, user-data-dir, storage-state, shared-context, save-session, headless, or equivalent environment override.'
    exit 1
}

if (-not $Quiet) {
    Write-Output 'READY: Playwright MCP will use a headed, disposable in-memory Chrome profile.'
}
