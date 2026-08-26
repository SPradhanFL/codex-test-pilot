param(
    [Parameter(Mandatory = $true)]
    [string]$OrgId,

    [Parameter(Mandatory = $true)]
    [string]$RunId
)

$ErrorActionPreference = 'Stop'

if ($RunId -notmatch '^\d{8}-\d{6}$') {
    throw 'RunId must use the format yyyyMMdd-HHmmss.'
}

$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
. (Join-Path $PSScriptRoot 'multi-user-org-context.ps1')
$context = Resolve-MultiUserOrganizationContext -WorkspaceRoot $workspaceRoot -OrgId $OrgId
$fullSuiteRoot = $context.FullSuiteRoot
$runDirectory = [System.IO.Path]::GetFullPath((Join-Path $fullSuiteRoot $RunId))
$zipPath = [System.IO.Path]::GetFullPath((Join-Path $fullSuiteRoot ("multi-user-full-suite-$OrgId-$RunId.zip")))
$manifestPath = Join-Path $runDirectory 'run-manifest.json'
$runDataPath = Join-Path $runDirectory 'run-data.json'
$timelinePath = Join-Path $runDirectory 'timeline.json'
$videoEventPath = Join-Path $runDirectory 'video-events.json'

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
if (-not (Test-Path -LiteralPath $runDataPath) -or -not (Test-Path -LiteralPath $videoEventPath)) {
    throw 'The measured run data or video event journal is missing.'
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$runData = Get-Content -LiteralPath $runDataPath -Raw | ConvertFrom-Json
$timeline = Get-Content -LiteralPath $timelinePath -Raw | ConvertFrom-Json
if ([string]$manifest.organizationId -ne $OrgId -or [string]$runData.organizationId -ne $OrgId -or [string]$timeline.organizationId -ne $OrgId) {
    throw "Report artifacts do not match requested OrgId $OrgId."
}
if ($runData.timelineSource -ne 'measured-video-events-v1' -or $timeline.timelineSource -ne 'measured-video-events-v1') {
    throw 'The report does not contain a measured video timeline.'
}
foreach ($account in @($runData.accounts)) {
    if ($account.timelineMeasured -ne $true) {
        throw "Account timeline was not measured: $($account.slug)"
    }
    foreach ($workflow in @($account.workflows)) {
        if ($workflow.timelineMeasured -ne $true) {
            throw "Workflow timeline was not measured: $($account.slug)/$($workflow.slug)"
        }
    }
}
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
    organizationId = $OrgId
    runId = $RunId
    roleReports = $roleReports.Count
    videos = $videos.Count
    package = $zipPath
    packageBytes = (Get-Item -LiteralPath $zipPath).Length
} | ConvertTo-Json -Depth 3
