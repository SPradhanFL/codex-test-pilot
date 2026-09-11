param(
    [Parameter(Mandatory = $true)]
    [string]$OrgId,

    [Parameter(Mandatory = $true)]
    [string]$RunId,
    [string]$VideoSource
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
$runDataPath = Join-Path $runDirectory 'run-data.json'
$manifestPath = Join-Path $runDirectory 'run-manifest.json'
$videoDirectory = Join-Path $runDirectory 'videos'
$videoDestination = Join-Path $videoDirectory 'multi-user-full-suite-execution.webm'

if (-not $runDirectory.StartsWith($fullSuiteRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'The run directory resolved outside the full-suite report root.'
}
if (-not (Test-Path -LiteralPath $runDirectory)) {
    throw "Missing run directory: $runDirectory"
}
if (-not (Test-Path -LiteralPath $runDataPath)) {
    throw "Missing run data: $runDataPath"
}
if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "Missing run manifest: $manifestPath"
}
$data = Get-Content -LiteralPath $runDataPath -Raw | ConvertFrom-Json
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$parallel = [string]$manifest.capture.executionMode -eq 'parallel'
$failedLaneSlugs = if ($parallel -and $data.lanes) { @($data.lanes | Where-Object { $_.failed -eq $true } | ForEach-Object { [string]$_.slug }) } else { @() }
$videoEventPaths = if ($parallel) { @($manifest.lanes | Where-Object { [string]$_.slug -notin $failedLaneSlugs } | ForEach-Object { Join-Path (Join-Path (Join-Path $runDirectory 'lanes') $_.slug) 'video-events.json' }) } else { @(Join-Path $runDirectory 'video-events.json') }
$missingEvents = @($videoEventPaths | Where-Object { -not (Test-Path -LiteralPath $_) })
if ($missingEvents.Count -gt 0) { throw "Missing measured video event journal(s): $($missingEvents -join ', ')" }
if ([string]$manifest.organizationId -ne $OrgId -or [string]$data.organizationId -ne $OrgId) {
    throw "Run manifest/data organization does not match requested OrgId $OrgId."
}
if ($data.timelineSource -ne 'measured-video-events-v1' -or -not ([double]$data.sourceElapsedMilliseconds -gt 0)) {
    throw 'Apply the measured video event timeline before finalization. Estimated or evenly divided ranges are not accepted.'
}
$expectedReports = if ($null -ne $manifest.expectedRoleReports) {
    [int]$manifest.expectedRoleReports
} else {
    [int]$manifest.expectedAccountReports
}
if (@($data.accounts).Count -ne $expectedReports) {
    throw "Expected $expectedReports role/login-combination results in run-data.json, found $(@($data.accounts).Count)."
}

if ($parallel) {
    if (@($manifest.lanes).Count -ne [int]$manifest.capture.videoCount) { throw 'Parallel videoCount must equal lane count.' }
    foreach ($lane in @($manifest.lanes)) {
        if ([string]$lane.slug -in $failedLaneSlugs) { continue }
        $directory = [System.IO.Path]::GetFullPath((Join-Path (Join-Path (Join-Path $runDirectory 'lanes') $lane.slug) 'videos'))
        $expected = Join-Path $directory ($lane.slug + '.webm')
        $videos = if (Test-Path -LiteralPath $directory) { @(Get-ChildItem -LiteralPath $directory -File -Filter '*.webm') } else { @() }
        if (-not $directory.StartsWith($runDirectory, [System.StringComparison]::OrdinalIgnoreCase) -or $videos.Count -ne 1 -or $videos[0].FullName -ne $expected) { throw "Lane $($lane.slug) must contain exactly one finalized WebM." }
    }
    $videoFiles = @($manifest.lanes | Where-Object { [string]$_.slug -notin $failedLaneSlugs })
} else {
    New-Item -ItemType Directory -Force -Path $videoDirectory | Out-Null
    if ([string]::IsNullOrWhiteSpace($VideoSource)) { $VideoSource = Join-Path $workspaceRoot 'multi-user-full-suite-execution.webm' }
    $resolvedVideoSource = [System.IO.Path]::GetFullPath($VideoSource)
    if (-not (Test-Path -LiteralPath $videoDestination)) {
        if (-not (Test-Path -LiteralPath $resolvedVideoSource)) { throw "Missing final continuous video: $resolvedVideoSource" }
        Move-Item -LiteralPath $resolvedVideoSource -Destination $videoDestination
    }
    $videoFiles = @(Get-ChildItem -LiteralPath $videoDirectory -File -Filter '*.webm')
    if ($videoFiles.Count -ne 1 -or $videoFiles[0].Name -ne 'multi-user-full-suite-execution.webm') { throw 'The current run must contain exactly one user-facing WebM video.' }
}

$movedScreenshots = 0
$missingScreenshots = New-Object System.Collections.Generic.List[string]
foreach ($account in $data.accounts) {
    if ($account.slug -notmatch '^[a-z0-9-]+$') {
        throw "Unexpected account slug: $($account.slug)"
    }
    $roleDirectory = Join-Path (Join-Path $runDirectory 'roles') $account.slug
    $destinationDirectory = Join-Path $roleDirectory 'screenshots'
    New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null

    $accountScreenshots = @($account.screenshots)
    $workflowScreenshots = @(
        foreach ($workflow in @($account.workflows)) {
            foreach ($screenshot in @($workflow.screenshots)) {
                $screenshot
            }
        }
    )
    $requiredScreenshots = @($accountScreenshots + $workflowScreenshots | Sort-Object -Unique)

    foreach ($screenshot in $requiredScreenshots) {
        if ($screenshot -notmatch '^[A-Za-z0-9_.-]+\.png$') {
            throw "Unexpected screenshot filename: $screenshot"
        }
        $destination = Join-Path $destinationDirectory $screenshot
        if (Test-Path -LiteralPath $destination) {
            continue
        }
        $source = Join-Path $workspaceRoot $screenshot
        if (Test-Path -LiteralPath $source) {
            Move-Item -LiteralPath $source -Destination $destination
            $movedScreenshots++
        } else {
            $missingScreenshots.Add("$($account.slug)/$screenshot")
        }
    }
}

if ($missingScreenshots.Count -gt 0) {
    throw "Missing screenshot artifacts: $($missingScreenshots -join ', ')"
}

[pscustomobject]@{
    organizationId = $OrgId
    runId = $RunId
    roleReports = @($data.accounts).Count
    video = if ($parallel) { $null } else { $videoDestination }
    videoCount = $videoFiles.Count
    screenshotsMoved = $movedScreenshots
} | ConvertTo-Json -Depth 4
