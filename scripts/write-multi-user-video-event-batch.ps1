param(
    [Parameter(Mandatory = $true)]
    [string]$OrgId,

    [Parameter(Mandatory = $true)]
    [string]$RunId,

    [Parameter(Mandatory = $true)]
    [string]$AccountSlug,

    [Parameter(Mandatory = $true)]
    [string[]]$WorkflowSlugs,

    [switch]$EndAccount
)

$ErrorActionPreference = 'Stop'

if ($RunId -notmatch '^\d{8}-\d{6}$') {
    throw 'RunId must use the format yyyyMMdd-HHmmss.'
}
if ($AccountSlug -notmatch '^[a-z0-9-]+$') {
    throw 'AccountSlug must contain only lowercase letters, digits, and hyphens.'
}
if ($WorkflowSlugs.Count -eq 0) {
    throw 'At least one WorkflowSlug is required.'
}
foreach ($workflowSlug in $WorkflowSlugs) {
    if ($workflowSlug -notmatch '^[a-z0-9-]+$') {
        throw "Invalid WorkflowSlug: $workflowSlug"
    }
}

$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
. (Join-Path $PSScriptRoot 'multi-user-org-context.ps1')
$context = Resolve-MultiUserOrganizationContext -WorkspaceRoot $workspaceRoot -OrgId $OrgId
$fullSuiteRoot = $context.FullSuiteRoot
$runDirectory = [System.IO.Path]::GetFullPath((Join-Path $fullSuiteRoot $RunId))
$eventPath = Join-Path $runDirectory 'video-events.json'

if (-not $runDirectory.StartsWith($fullSuiteRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'The run directory resolved outside the full-suite report root.'
}
if (-not (Test-Path -LiteralPath $eventPath)) {
    throw "Missing video event journal: $eventPath"
}

$journal = Get-Content -LiteralPath $eventPath -Raw | ConvertFrom-Json
if ([string]$journal.organizationId -ne $OrgId -or $journal.runId -ne $RunId -or $journal.timelineSource -ne 'measured-video-events-v1') {
    throw 'The video event journal does not match this run or timeline schema.'
}
if ($null -ne $journal.recordingEndedAtUtc -and -not [string]::IsNullOrWhiteSpace([string]$journal.recordingEndedAtUtc)) {
    throw 'The video event journal is already closed.'
}

$events = [System.Collections.Generic.List[object]]::new()
foreach ($existingEvent in @($journal.events)) {
    $events.Add($existingEvent)
}

$originTimestamp = [double]$journal.monotonicOriginTimestamp
$frequency = [double]$journal.monotonicFrequency
if (-not ($frequency -gt 0)) {
    throw 'The video event journal is missing its monotonic clock frequency.'
}

foreach ($workflowSlug in $WorkflowSlugs) {
    foreach ($kind in @('workflow-start', 'workflow-end')) {
        $duplicate = @($events | Where-Object {
            $_.kind -eq $kind -and
            [string]$_.accountSlug -eq $AccountSlug -and
            [string]$_.workflowSlug -eq $workflowSlug
        })
        if ($duplicate.Count -gt 0) {
            throw "Duplicate video event: $kind / $AccountSlug / $workflowSlug"
        }

        $now = [DateTimeOffset]::UtcNow
        $monotonicNow = [System.Diagnostics.Stopwatch]::GetTimestamp()
        $elapsedMilliseconds = [math]::Round((($monotonicNow - $originTimestamp) * 1000) / $frequency)
        $events.Add([pscustomobject][ordered]@{
            sequence = $events.Count + 1
            kind = $kind
            recordedAtUtc = $now.ToString('o')
            monotonicTimestamp = $monotonicNow
            elapsedMilliseconds = $elapsedMilliseconds
            accountSlug = $AccountSlug
            workflowSlug = $workflowSlug
        })
        Start-Sleep -Milliseconds 25
    }
}

if ($EndAccount) {
    $duplicateAccountEnd = @($events | Where-Object {
        $_.kind -eq 'account-end' -and [string]$_.accountSlug -eq $AccountSlug
    })
    if ($duplicateAccountEnd.Count -gt 0) {
        throw "Duplicate video event: account-end / $AccountSlug"
    }

    $now = [DateTimeOffset]::UtcNow
    $monotonicNow = [System.Diagnostics.Stopwatch]::GetTimestamp()
    $elapsedMilliseconds = [math]::Round((($monotonicNow - $originTimestamp) * 1000) / $frequency)
    $events.Add([pscustomobject][ordered]@{
        sequence = $events.Count + 1
        kind = 'account-end'
        recordedAtUtc = $now.ToString('o')
        monotonicTimestamp = $monotonicNow
        elapsedMilliseconds = $elapsedMilliseconds
        accountSlug = $AccountSlug
    })
}

$journal.events = @($events)
$journal | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $eventPath -Encoding utf8

[pscustomobject]@{
    organizationId = $OrgId
    runId = $RunId
    accountSlug = $AccountSlug
    workflowCount = $WorkflowSlugs.Count
    accountEnded = [bool]$EndAccount
    eventCount = $events.Count
} | ConvertTo-Json -Depth 4
