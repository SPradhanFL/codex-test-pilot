param(
    [Parameter(Mandatory = $true)][string]$OrgId,
    [string]$RunId = (Get-Date -Format 'yyyyMMdd-HHmmss'),
    [string[]]$Controller = @(),
    [string[]]$ExcludeController = @(),
    [ValidateSet('Full', 'TimeAndAttendance')]
    [string]$ScenarioScope = 'Full',
    [ValidateRange(0, 100)][int]$MaxLanes = 0,
    [ValidateRange(5, 360)][int]$TimeoutMinutes = 90
)

$ErrorActionPreference = 'Stop'
$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
. (Join-Path $PSScriptRoot 'multi-user-org-context.ps1')

function ConvertTo-ParallelProcessArgument {
    param([Parameter(Mandatory = $true)][string]$Value)
    if ($Value -notmatch '[\s"]') { return $Value }
    return '"' + $Value.Replace('"', '\"') + '"'
}

$readinessArguments = @{ OrgId = $OrgId; Controller = $Controller; ExcludeController = $ExcludeController; ScenarioScope = $ScenarioScope; Parallel = $true; MaxLanes = $MaxLanes }
& (Join-Path $PSScriptRoot 'check-multi-user-run-readiness.ps1') @readinessArguments
if ($LASTEXITCODE -ne 0) { throw 'Parallel readiness did not return READY.' }

$scaffoldArguments = @{ OrgId = $OrgId; RunId = $RunId; Controller = $Controller; ExcludeController = $ExcludeController; ScenarioScope = $ScenarioScope; Parallel = $true; MaxLanes = $MaxLanes }
$scaffoldJson = & (Join-Path $PSScriptRoot 'start-multi-user-full-suite-run.ps1') @scaffoldArguments
$scaffold = $scaffoldJson | ConvertFrom-Json
$runDirectory = [System.IO.Path]::GetFullPath([string]$scaffold.runDirectory)
$manifestPath = Join-Path $runDirectory 'run-manifest.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json

$codex = Get-Command codex -ErrorAction SilentlyContinue
if ($null -eq $codex) { throw 'Codex CLI is required for parallel lane execution.' }

$processes = @()
foreach ($lane in @($manifest.lanes)) {
    $accountSlugs = @($manifest.accounts | Where-Object { [int]$_.laneId -eq [int]$lane.laneId } | Select-Object -ExpandProperty slug)
    $scopePrompt = if ($ScenarioScope -eq 'TimeAndAttendance') {
@"
SCENARIO SCOPE: TIME & ATTENDANCE ONLY. Execute every repository scenario from 29 through 46 that is authorized by the selected controllers and their role/organization contexts. Do not execute or record scenarios 1 through 28. Do not execute the supplemental Absence Management-origin App Switcher workflow. Absence Management may be visited only when it is an explicit step inside a Time & Attendance scenario such as the TA -> AM -> TA round trip. Record workflow events only for scenario IDs 29-46, using workflow slugs that contain scenario-29 through scenario-46. This scope overrides any full-controller or full-suite wording in the referenced controller documents.
"@
    } else {
        'SCENARIO SCOPE: FULL. Execute every workflow authorized by the selected controllers.'
    }
    $prompt = @"
Execute parallel test lane $($lane.slug) for organization $OrgId and run $RunId. Use only the playwright_lane$($lane.laneId) MCP browser tools; never use playwright or another lane server. Read instructions/multi-user-full-suite-execution.md and execute these controllers sequentially in manifest order: $(@($lane.controllers) -join ', '). Do not edit repository source or configuration. Never print or persist resolved usernames, passwords, tokens, cookies, or session values.

Apply the manifest's 120-second UI recovery policy before finalizing any potential functional failure caused by missing, slow, or incomplete rendering. Measure each screen or required-control load from its triggering action until the expected responsive state appears. Add a SLOW_UI_LOAD warning with the actual measured elapsed seconds whenever that time exceeds 30 seconds; the warning does not change the functional status. Read config/known-failures.json and, only when the observed failure matches a catalog signature exactly, keep status FAIL and add the matching knownFailure metadata so the report displays KNOWN FAILED with its Jira ticket. Do not infer a match from a scenario number or a vaguely similar symptom.

HCMAT-79933 RECOVERY: when Sidekick/global navigation is delayed but becomes visible and responsive within 120 seconds, continue the scenario and mark it PASS if all functional assertions succeed. Add a SLOW_UI_LOAD warning with the exact elapsedSeconds and knownIssue.ticket HCMAT-79933 so the Jira link appears in the description. Use knownFailure HCMAT-79933 only when the matching Sidekick state never becomes usable by the 120-second timeout.

$scopePrompt

Open a fresh headed Stage Chrome page with the lane MCP server. Then dot-source scripts/browser-window-capture-support.ps1 and call Get-MultiUserChromeWindowForCurrentCodexLane to resolve the exact Chrome handle structurally from this Codex lane's process tree. Start scripts/start-browser-window-video.ps1 with -OrgId $OrgId -RunId $RunId -LaneSlug $($lane.slug) -WindowSlot $($lane.laneId) and the explicit -WindowHandle. Write every video event with scripts/write-multi-user-video-event.ps1 and -LaneSlug $($lane.slug). Use the account slugs from the manifest ($($accountSlugs -join ', ')); controllers sharing this lane must remain sequential. Save this lane's observation JSON only at lanes/$($lane.slug)/execution-observations.json, following the documented execution-observations schema. Save screenshots in each controller's roles/<account-slug>/screenshots folder. On completion write RecordingEnd for this lane and call scripts/stop-browser-window-video.ps1 with -LaneSlug $($lane.slug). Preserve all partial evidence if any controller fails, and return a concise lane result without credential values.
"@

    # --approve-for-me already selects the workspace-write sandbox; the CLI rejects
    # combining it with an explicit --sandbox argument.
    $arguments = @('exec', '--ephemeral', '--approve-for-me', '--color', 'never', '-C', $workspaceRoot)
    foreach ($serverNumber in 1..10) {
        $enabledValue = if ($serverNumber -eq [int]$lane.laneId) { 'true' } else { 'false' }
        $arguments += @('-c', "mcp_servers.playwright_lane$serverNumber.enabled=$enabledValue")
    }
    $arguments += @('-c', 'mcp_servers.playwright.enabled=false', $prompt)
    $argumentText = @($arguments | ForEach-Object { ConvertTo-ParallelProcessArgument ([string]$_) }) -join ' '
    $process = Start-Process -FilePath $codex.Source -ArgumentList $argumentText -PassThru -WindowStyle Hidden
    $processes += [pscustomobject]@{ LaneId = [int]$lane.laneId; Slug = [string]$lane.slug; Process = $process; TimedOut = $false }
}

$deadline = [DateTimeOffset]::UtcNow.AddMinutes($TimeoutMinutes)
while (@($processes | Where-Object { -not $_.Process.HasExited }).Count -gt 0 -and [DateTimeOffset]::UtcNow -lt $deadline) { Start-Sleep -Seconds 2 }
foreach ($item in @($processes | Where-Object { -not $_.Process.HasExited })) {
    $item.TimedOut = $true
    Stop-Process -Id $item.Process.Id -Force -ErrorAction SilentlyContinue
    $item.Process.WaitForExit(10000) | Out-Null
}

$laneResults = @($processes | ForEach-Object {
    $laneRoot = Join-Path (Join-Path $runDirectory 'lanes') $_.Slug
    $journalPath = Join-Path $laneRoot 'video-events.json'
    $observationPath = Join-Path $laneRoot 'execution-observations.json'
    $metadataPath = Join-Path $laneRoot 'browser-window-video-metadata.json'
    $videoPath = Join-Path (Join-Path $laneRoot 'videos') "$($_.Slug).webm"
    $artifactFailure = $null

    if (-not $_.TimedOut -and $_.Process.ExitCode -eq 0) {
        if (-not (Test-Path -LiteralPath $journalPath)) {
            $artifactFailure = 'missing event journal'
        } elseif (-not (Test-Path -LiteralPath $observationPath)) {
            $artifactFailure = 'missing execution observations'
        } elseif (-not (Test-Path -LiteralPath $metadataPath)) {
            $artifactFailure = 'missing video metadata'
        } elseif (-not (Test-Path -LiteralPath $videoPath) -or (Get-Item -LiteralPath $videoPath).Length -lt 1024) {
            $artifactFailure = 'missing finalized lane video'
        } else {
            try {
                $journal = Get-Content -LiteralPath $journalPath -Raw | ConvertFrom-Json
                if (@($journal.events | Where-Object kind -eq 'recording-start').Count -ne 1 -or
                    @($journal.events | Where-Object kind -eq 'recording-end').Count -ne 1) {
                    $artifactFailure = 'invalid recording boundaries'
                }
            } catch {
                $artifactFailure = 'invalid event journal'
            }
        }
    }

    $status = if ($_.TimedOut) { 'TIMED_OUT' } elseif ($_.Process.ExitCode -ne 0) { 'FAILED' } elseif ($null -ne $artifactFailure) { 'FAILED_ARTIFACTS' } else { 'SUCCEEDED' }
    [ordered]@{
        laneId = $_.LaneId
        slug = $_.Slug
        status = $status
        exitCode = if ($_.TimedOut) { $null } else { $_.Process.ExitCode }
        artifactFailure = $artifactFailure
    }
})
$summary = [ordered]@{
    organizationId = $OrgId
    runId = $RunId
    scenarioScope = $manifest.scenarioScope
    completedAtUtc = [DateTimeOffset]::UtcNow.ToString('o')
    timeoutMinutes = $TimeoutMinutes
    lanes = $laneResults
    postProcessing = [ordered]@{ status = 'PENDING'; stage = 'lane-validation'; message = 'Detailed HTML report processing has not started.' }
}
$summaryPath = Join-Path $runDirectory 'parallel-run-summary.json'
$summary | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $summaryPath -Encoding utf8

& node (Join-Path $PSScriptRoot 'generate-parallel-run-summary-report.mjs') $OrgId $RunId --index
if ($LASTEXITCODE -ne 0) { throw 'Parallel fallback HTML report generation failed.' }

$failed = @($laneResults | Where-Object status -ne 'SUCCEEDED')
$succeeded = @($laneResults | Where-Object status -eq 'SUCCEEDED')
if ($succeeded.Count -eq 0) {
    $summary.postProcessing.status = 'SKIPPED'
    $summary.postProcessing.stage = 'lane-validation'
    $summary.postProcessing.message = 'Detailed report processing was skipped because all lanes failed. The fallback HTML report contains the available evidence.'
    $summary | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $summaryPath -Encoding utf8
    & node (Join-Path $PSScriptRoot 'generate-parallel-run-summary-report.mjs') $OrgId $RunId
    $summary | ConvertTo-Json -Depth 5
    throw "All $($laneResults.Count) parallel lane(s) failed. Partial evidence was preserved; see $summaryPath"
}
if ($failed.Count -gt 0) {
    Write-Warning "$($failed.Count) lane(s) did not complete successfully; post-processing will continue with data from $($succeeded.Count) succeeded lane(s)."
}

try {
    $summary.postProcessing.status = 'RUNNING'
    $summary.postProcessing.stage = 'run-data-build'
    & node (Join-Path $PSScriptRoot 'build-multi-user-run-data.mjs') $OrgId $RunId
    if ($LASTEXITCODE -ne 0) { throw 'Parallel run-data build failed.' }

    $summary.postProcessing.stage = 'video-timeline'
    & node (Join-Path $PSScriptRoot 'apply-multi-user-video-timeline.mjs') $OrgId $RunId
    if ($LASTEXITCODE -ne 0) { throw 'Parallel video timeline application failed.' }

    $summary.postProcessing.stage = 'finalization'
    & (Join-Path $PSScriptRoot 'finalize-multi-user-full-suite-run.ps1') -OrgId $OrgId -RunId $RunId

    $summary.postProcessing.stage = 'html-generation'
    & node (Join-Path $PSScriptRoot 'generate-multi-user-full-suite-report.mjs') $OrgId $RunId
    if ($LASTEXITCODE -ne 0) { throw 'Parallel report generation failed.' }

    $summary.postProcessing.stage = 'packaging'
    & (Join-Path $PSScriptRoot 'package-multi-user-full-suite-report.ps1') -OrgId $OrgId -RunId $RunId
    $summary.postProcessing.status = 'SUCCEEDED'
    $summary.postProcessing.stage = 'complete'
    $summary.postProcessing.message = 'The detailed scenario HTML reports and package were generated successfully.'
    $summary | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $summaryPath -Encoding utf8
    & node (Join-Path $PSScriptRoot 'generate-parallel-run-summary-report.mjs') $OrgId $RunId
} catch {
    $summary.postProcessing.status = 'FAILED'
    $summary.postProcessing.error = $_.Exception.Message
    $summary | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $summaryPath -Encoding utf8
    & node (Join-Path $PSScriptRoot 'generate-parallel-run-summary-report.mjs') $OrgId $RunId
    throw
}

[pscustomobject]@{ organizationId = $OrgId; runId = $RunId; laneCount = @($manifest.lanes).Count; runDirectory = $runDirectory; report = Join-Path $runDirectory 'index.html'; summary = $summaryPath } | ConvertTo-Json -Depth 4
