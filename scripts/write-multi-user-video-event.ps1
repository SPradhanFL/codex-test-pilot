param(
    [Parameter(Mandatory = $true)]
    [string]$OrgId,

    [Parameter(Mandatory = $true)]
    [string]$RunId,

    [Parameter(Mandatory = $true)]
    [ValidateSet('RecordingStart', 'AccountStart', 'WorkflowStart', 'WorkflowEnd', 'AccountEnd', 'RecordingEnd')]
    [string]$Event,

    [string]$AccountSlug,
    [string]$WorkflowSlug,
    [string]$LaneSlug
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
$eventPath = if ([string]::IsNullOrWhiteSpace($LaneSlug)) { Join-Path $runDirectory 'video-events.json' } else {
    if ($LaneSlug -notmatch '^lane-[1-9]\d*$') { throw 'LaneSlug must use lane-<number>.' }
    $laneDirectory = [System.IO.Path]::GetFullPath((Join-Path (Join-Path $runDirectory 'lanes') $LaneSlug))
    if (-not $laneDirectory.StartsWith($runDirectory, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $laneDirectory)) { throw "Missing or invalid lane directory: $laneDirectory" }
    Join-Path $laneDirectory 'video-events.json'
}

if (-not $runDirectory.StartsWith($fullSuiteRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'The run directory resolved outside the full-suite report root.'
}
if (-not (Test-Path -LiteralPath $runDirectory)) {
    throw "Missing run directory: $runDirectory"
}

$requiresAccount = $Event -in @('AccountStart', 'WorkflowStart', 'WorkflowEnd', 'AccountEnd')
$requiresWorkflow = $Event -in @('WorkflowStart', 'WorkflowEnd')

if ($requiresAccount -and $AccountSlug -notmatch '^[a-z0-9-]+$') {
    throw "$Event requires a valid AccountSlug."
}
if ($requiresWorkflow -and $WorkflowSlug -notmatch '^[a-z0-9-]+$') {
    throw "$Event requires a valid WorkflowSlug."
}
if (-not $requiresAccount -and -not [string]::IsNullOrWhiteSpace($AccountSlug)) {
    throw "$Event does not accept AccountSlug."
}
if (-not $requiresWorkflow -and -not [string]::IsNullOrWhiteSpace($WorkflowSlug)) {
    throw "$Event does not accept WorkflowSlug."
}

$kindMap = @{
    RecordingStart = 'recording-start'
    AccountStart = 'account-start'
    WorkflowStart = 'workflow-start'
    WorkflowEnd = 'workflow-end'
    AccountEnd = 'account-end'
    RecordingEnd = 'recording-end'
}
$kind = $kindMap[$Event]
$now = [DateTimeOffset]::UtcNow
$monotonicNow = [System.Diagnostics.Stopwatch]::GetTimestamp()
$monotonicFrequency = [System.Diagnostics.Stopwatch]::Frequency

function Write-LockedJournal {
    param([Parameter(Mandatory = $true)][System.IO.FileStream]$Stream, [Parameter(Mandatory = $true)]$Value)
    $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes(($Value | ConvertTo-Json -Depth 8) + [Environment]::NewLine)
    $Stream.Position = 0; $Stream.SetLength(0); $Stream.Write($bytes, 0, $bytes.Length); $Stream.Flush($true)
}

function Open-EventJournalLock {
    param([Parameter(Mandatory = $true)][string]$Path)
    $deadline = [DateTimeOffset]::UtcNow.AddSeconds(5)
    do {
        try { return [System.IO.File]::Open($Path, 'Open', 'ReadWrite', 'None') }
        catch [System.IO.IOException] {
            if ([DateTimeOffset]::UtcNow -ge $deadline) { throw "Timed out after 5 seconds waiting for the video event journal lock: $Path" }
            Start-Sleep -Milliseconds 50
        }
    } while ($true)
}

if ($Event -eq 'RecordingStart') {
    $stream = $null
    try {
        try { $stream = [System.IO.File]::Open($eventPath, 'CreateNew', 'ReadWrite', 'None') }
        catch [System.IO.IOException] { throw "Video event journal already exists: $eventPath" }
        $journal = [ordered]@{
        schemaVersion = 1
        organizationId = $OrgId
        runId = $RunId
        timelineSource = 'measured-video-events-v1'
        recordingStartedAtUtc = $now.ToString('o')
        recordingEndedAtUtc = $null
        monotonicOriginTimestamp = $monotonicNow
        monotonicFrequency = $monotonicFrequency
        events = @(
            [ordered]@{
                sequence = 1
                kind = $kind
                recordedAtUtc = $now.ToString('o')
                monotonicTimestamp = $monotonicNow
                elapsedMilliseconds = 0
            }
        )
        }
        Write-LockedJournal -Stream $stream -Value $journal
        $journal.events[0] | ConvertTo-Json -Depth 4
    } finally { if ($null -ne $stream) { $stream.Dispose() } }
    return
}

if (-not (Test-Path -LiteralPath $eventPath)) {
    throw 'Record RecordingStart immediately after the full-browser Chrome recorder starts and before any other video event.'
}

$stream = Open-EventJournalLock -Path $eventPath
try {
$reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::UTF8, $true, 1024, $true)
$stream.Position = 0
$journal = $reader.ReadToEnd() | ConvertFrom-Json
$reader.Dispose()
if ([string]$journal.organizationId -ne $OrgId -or $journal.runId -ne $RunId -or $journal.timelineSource -ne 'measured-video-events-v1') {
    throw 'The video event journal does not match this run or timeline schema.'
}
if ($null -ne $journal.recordingEndedAtUtc -and -not [string]::IsNullOrWhiteSpace([string]$journal.recordingEndedAtUtc)) {
    throw 'The video event journal is already closed.'
}

$originTimestamp = [double]$journal.monotonicOriginTimestamp
$frequency = [double]$journal.monotonicFrequency
if (-not ($frequency -gt 0)) {
    throw 'The video event journal is missing its monotonic clock frequency.'
}
$elapsedMilliseconds = [math]::Round((($monotonicNow - $originTimestamp) * 1000) / $frequency)
if ($elapsedMilliseconds -lt 0) {
    throw 'The system clock is earlier than the recording start timestamp.'
}

$events = @($journal.events)
$duplicate = @($events | Where-Object {
    $_.kind -eq $kind -and
    [string]$_.accountSlug -eq [string]$AccountSlug -and
    [string]$_.workflowSlug -eq [string]$WorkflowSlug
})
if ($duplicate.Count -gt 0) {
    throw "Duplicate video event: $kind / $AccountSlug / $WorkflowSlug"
}

$entry = [ordered]@{
    sequence = $events.Count + 1
    kind = $kind
    recordedAtUtc = $now.ToString('o')
    monotonicTimestamp = $monotonicNow
    elapsedMilliseconds = $elapsedMilliseconds
}
if ($requiresAccount) {
    $entry.accountSlug = $AccountSlug
}
if ($requiresWorkflow) {
    $entry.workflowSlug = $WorkflowSlug
}

$journal.events = @($events + [pscustomobject]$entry)
if ($Event -eq 'RecordingEnd') {
    $journal.recordingEndedAtUtc = $now.ToString('o')
}
Write-LockedJournal -Stream $stream -Value $journal
$entry | ConvertTo-Json -Depth 4
} finally { $stream.Dispose() }
