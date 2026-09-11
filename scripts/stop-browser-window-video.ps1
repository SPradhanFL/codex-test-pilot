param(
    [Parameter(Mandatory = $true)]
    [string]$OrgId,

    [Parameter(Mandatory = $true)]
    [string]$RunId,
    [string]$LaneSlug
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
$parallel = -not [string]::IsNullOrWhiteSpace($LaneSlug)
if ($parallel -and $LaneSlug -notmatch '^lane-[1-9]\d*$') { throw 'LaneSlug must use lane-<number>.' }
$captureRoot = if ($parallel) { [System.IO.Path]::GetFullPath((Join-Path (Join-Path $runDirectory 'lanes') $LaneSlug)) } else { $runDirectory }
$statePath = [System.IO.Path]::GetFullPath((Join-Path $captureRoot 'browser-window-video-state.json'))
if (-not $runDirectory.StartsWith($context.FullSuiteRoot, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $statePath)) {
    throw 'Missing browser-window recording state for the requested organization/run.'
}

$state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
if ([string]$state.organizationId -ne $OrgId -or [string]$state.runId -ne $RunId) {
    throw 'The browser-window recording state does not match the requested organization/run.'
}

$capturePath = [System.IO.Path]::GetFullPath([string]$state.capturePath)
$finalPath = [System.IO.Path]::GetFullPath([string]$state.finalPath)
$stopSignalPath = [System.IO.Path]::GetFullPath([string]$state.stopSignalPath)
$readyPath = [System.IO.Path]::GetFullPath([string]$state.readyPath)
$resultPath = [System.IO.Path]::GetFullPath([string]$state.resultPath)
$eventPath = [System.IO.Path]::GetFullPath((Join-Path $captureRoot 'video-events.json'))
$metadataPath = [System.IO.Path]::GetFullPath((Join-Path $captureRoot 'browser-window-video-metadata.json'))
foreach ($path in @($capturePath, $finalPath, $statePath, $stopSignalPath, $readyPath, $resultPath)) {
    if (-not $path.StartsWith($runDirectory, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw 'A recorded artifact path resolved outside the requested run directory.'
    }
}

$workerProcess = Get-Process -Id ([int]$state.workerProcessId) -ErrorAction SilentlyContinue
if ($null -eq $workerProcess) {
    throw 'The browser-window capture worker is not running; preserve the capture artifacts for diagnosis.'
}
'stop' | Set-Content -LiteralPath $stopSignalPath -Encoding ascii
if (-not $workerProcess.WaitForExit(45000)) {
    throw 'The browser-window capture worker did not stop within 45 seconds; preserve the capture artifacts for diagnosis.'
}
if (-not (Test-Path -LiteralPath $resultPath)) {
    throw 'The browser-window capture worker did not produce a completion result.'
}
$workerResult = Get-Content -LiteralPath $resultPath -Raw | ConvertFrom-Json
if ($workerResult.status -ne 'COMPLETED' -or [int]$workerResult.exitCode -ne 0) {
    throw "The browser-window capture did not stop cleanly: $($workerResult.error)"
}
if (-not (Test-Path -LiteralPath $capturePath) -or (Get-Item -LiteralPath $capturePath).Length -lt 1024) {
    throw 'The full-browser capture file is missing or empty.'
}

$ffmpegPath = Get-MultiUserFfmpegPath -WorkspaceRoot $workspaceRoot
$timestampScale = 1.0
$measuredDurationSeconds = $null
$nativeDurationSeconds = $null
if (Test-Path -LiteralPath $eventPath) {
    $journal = Get-Content -LiteralPath $eventPath -Raw | ConvertFrom-Json
    $recordingStart = @($journal.events | Where-Object { $_.kind -eq 'recording-start' })
    $recordingEnd = @($journal.events | Where-Object { $_.kind -eq 'recording-end' })
    if ($recordingStart.Count -eq 1 -and $recordingEnd.Count -eq 1) {
        $measuredDurationSeconds = ([double]$recordingEnd[0].elapsedMilliseconds - [double]$recordingStart[0].elapsedMilliseconds) / 1000.0
        $nativeDurationSeconds = [double]$workerResult.framesWritten / [double]$state.frameRate
        if (-not ($measuredDurationSeconds -gt 0) -or -not ($nativeDurationSeconds -gt 0)) {
            throw 'The measured or native browser-window video duration is invalid.'
        }
        $timestampScale = $measuredDurationSeconds / $nativeDurationSeconds
        if ($timestampScale -lt 0.5 -or $timestampScale -gt 5.0) {
            throw "The browser-window video timestamp scale is outside the safe alignment range: $timestampScale"
        }
    }
}
$timestampScaleText = [string]::Format(
    [System.Globalization.CultureInfo]::InvariantCulture,
    '{0:F9}',
    $timestampScale
)
$remuxArguments = @(
    '-hide_banner', '-loglevel', 'error', '-y',
    '-fflags', '+genpts', '-itsscale', $timestampScaleText, '-i', $capturePath,
    '-an', '-c:v', 'copy', '-f', 'webm', $finalPath
)
& $ffmpegPath @remuxArguments
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $finalPath) -or (Get-Item -LiteralPath $finalPath).Length -lt 1024) {
    throw 'Unable to finalize the full-browser recording as WebM.'
}

if ($parallel) {
    [ordered]@{
        organizationId = $OrgId
        runId = $RunId
        laneSlug = $LaneSlug
        video = $finalPath
        recordedDurationSeconds = if ($null -ne $measuredDurationSeconds) { $measuredDurationSeconds } else { $nativeDurationSeconds }
        nativeDurationSeconds = $nativeDurationSeconds
        measuredDurationSeconds = $measuredDurationSeconds
        timestampScale = $timestampScale
    } | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $metadataPath -Encoding utf8
}

Remove-Item -LiteralPath $capturePath
Remove-Item -LiteralPath $stopSignalPath
Remove-Item -LiteralPath $readyPath
Remove-Item -LiteralPath $resultPath
Remove-Item -LiteralPath $statePath

[pscustomobject]@{
    organizationId = $OrgId
    runId = $RunId
    laneSlug = if ($parallel) { $LaneSlug } else { $null }
    video = $finalPath
    captureScope = 'full-browser-window'
    addressBarIncluded = $true
    width = [int]$state.width
    height = [int]$state.height
    nativeDurationSeconds = $nativeDurationSeconds
    measuredDurationSeconds = $measuredDurationSeconds
    timestampScale = $timestampScale
} | ConvertTo-Json -Depth 3
