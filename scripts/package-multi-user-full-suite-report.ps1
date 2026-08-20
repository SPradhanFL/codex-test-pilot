param(
    [Parameter(Mandatory = $true)]
    [string]$RunId
)

$ErrorActionPreference = 'Stop'

if ($RunId -notmatch '^\d{8}-\d{6}$') {
    throw 'RunId must use the format yyyyMMdd-HHmmss.'
}

$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$fullSuiteRoot = [System.IO.Path]::GetFullPath((Join-Path $workspaceRoot 'reports\full-suite'))
$runDirectory = [System.IO.Path]::GetFullPath((Join-Path $fullSuiteRoot $RunId))
$zipPath = [System.IO.Path]::GetFullPath((Join-Path $fullSuiteRoot ("multi-user-full-suite-$RunId.zip")))
$manifestPath = Join-Path $runDirectory 'run-manifest.json'

if (-not $runDirectory.StartsWith($fullSuiteRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'The run directory resolved outside the full-suite report root.'
}
if (-not (Test-Path -LiteralPath (Join-Path $runDirectory 'index.html'))) {
    throw 'The consolidated dashboard has not been generated.'
}
if (-not (Test-Path -LiteralPath (Join-Path $runDirectory 'timeline.json'))) {
    throw 'The execution timeline has not been generated.'
}
if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw 'The run manifest is missing.'
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$expectedReports = if ($null -ne $manifest.expectedRoleReports) {
    [int]$manifest.expectedRoleReports
} else {
    [int]$manifest.expectedAccountReports
}
$roleRoot = Join-Path $runDirectory 'roles'
$roleReports = @(
    Get-ChildItem -LiteralPath $roleRoot -Directory |
        Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'index.html') }
)
if ($roleReports.Count -ne $expectedReports) {
    throw "Expected $expectedReports role/login-combination reports, found $($roleReports.Count)."
}
$videos = @(Get-ChildItem -LiteralPath (Join-Path $runDirectory 'videos') -File -Filter '*.webm')
if ($videos.Count -ne 1) {
    throw "Expected one final video, found $($videos.Count)."
}
if (Test-Path -LiteralPath $zipPath) {
    throw "The package already exists: $zipPath"
}

Compress-Archive -LiteralPath $runDirectory -DestinationPath $zipPath -CompressionLevel Optimal

[pscustomobject]@{
    runId = $RunId
    roleReports = $roleReports.Count
    videos = $videos.Count
    package = $zipPath
    packageBytes = (Get-Item -LiteralPath $zipPath).Length
} | ConvertTo-Json -Depth 3
