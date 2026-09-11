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
$serverBlocks = [regex]::Matches($configText, '(?ms)^\[mcp_servers\.(playwright(?:_lane\d+)?)\]\s*(.*?)(?=^\[|\z)')
if ($serverBlocks.Count -eq 0) {
    Write-Error 'Missing Playwright MCP configuration blocks.'
    exit 1
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
$approvalTools = @('browser_click','browser_navigate','browser_select_option','browser_type','browser_close','browser_resize','browser_run_code_unsafe','browser_fill_form','browser_tabs','browser_evaluate','browser_navigate_back')

$serverResults = @($serverBlocks | ForEach-Object {
    $name = $_.Groups[1].Value; $block = $_.Value
    $required = [ordered]@{ Enabled = $block -match '(?m)^enabled\s*=\s*true\s*$'; Chrome = $block -match '(?s)"--browser"\s*,\s*"chrome"'; Isolated = $block -match '"--isolated"'; Headed = $block -notmatch '"--headless"'; Viewport = $block -match '(?s)"--viewport-size"\s*,\s*"1280x720"' }
    $forbidden = [ordered]@{ Extension = $block -match '"--extension"'; UserDataDirectory = $block -match '"--user-data-dir"'; StorageState = $block -match '"--storage-state"'; SharedBrowserContext = $block -match '"--shared-browser-context"'; SaveSession = $block -match '"--save-session"' }
    $approvalsReady = @($approvalTools | Where-Object {
        $approvalPattern = '(?ms)^\[mcp_servers\.{0}\.tools\.{1}\]\s*approval_mode\s*=\s*"approve"\s*$' -f [regex]::Escape($name), [regex]::Escape($_)
        $configText -notmatch $approvalPattern
    }).Count -eq 0
    [pscustomobject]@{ Name = $name; Required = $required; Forbidden = $forbidden; ApprovalsReady = $approvalsReady; Ready = @($required.Values | Where-Object { -not $_ }).Count -eq 0 -and @($forbidden.Values | Where-Object { $_ }).Count -eq 0 -and $approvalsReady }
})
$ready = @($serverResults | Where-Object { -not $_.Ready }).Count -eq 0 -and -not $environmentOverridePresent

if (-not $Quiet) {
    [pscustomobject]@{
        Config = $configPath
        ServersValidated = $serverResults.Count
        Browser = 'Chrome'
        Headed = @($serverResults | Where-Object { -not $_.Required.Headed }).Count -eq 0
        IsolatedInMemoryProfile = @($serverResults | Where-Object { -not $_.Required.Isolated }).Count -eq 0
        PersistentExtensionDisabled = @($serverResults | Where-Object { $_.Forbidden.Extension }).Count -eq 0
        PersistentProfileOptionsAbsent = @($serverResults | Where-Object { @($_.Forbidden.Values | Where-Object { $_ }).Count -gt 0 }).Count -eq 0
        ConflictingEnvironmentOverridesAbsent = -not $environmentOverridePresent
        ToolApprovalsPreserved = @($serverResults | Where-Object { -not $_.ApprovalsReady }).Count -eq 0
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
