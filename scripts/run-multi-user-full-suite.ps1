param(
    [Parameter(Mandatory = $true)][string]$OrgId,
    [string]$RunId = (Get-Date -Format 'yyyyMMdd-HHmmss'),
    [string[]]$Controller = @(),
    [string[]]$ExcludeController = @(),
    [ValidateSet('Full', 'TimeAndAttendance')]
    [string]$ScenarioScope = 'Full',
    [switch]$Parallel,
    [ValidateRange(0, 100)][int]$MaxLanes = 0,
    [ValidateRange(5, 360)][int]$TimeoutMinutes = 90
)

$ErrorActionPreference = 'Stop'
$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
. (Join-Path $PSScriptRoot 'multi-user-org-context.ps1')

if ($MaxLanes -gt 0 -and -not $Parallel) {
    Write-Warning '-MaxLanes is only used with -Parallel; ignoring for serial run.'
}

# Parallel mode: delegate entirely to the dedicated parallel runner.
if ($Parallel) {
    $parallelArgs = @{
        OrgId = $OrgId; RunId = $RunId; Controller = $Controller
        ExcludeController = $ExcludeController; ScenarioScope = $ScenarioScope
        MaxLanes = $MaxLanes; TimeoutMinutes = $TimeoutMinutes
    }
    & (Join-Path $PSScriptRoot 'start-multi-user-parallel-lanes.ps1') @parallelArgs
    return
}

# -- SERIAL PATH -------------------------------------------------------------

$codex = Get-Command codex -ErrorAction SilentlyContinue
if ($null -eq $codex) { throw 'Codex CLI is required for serial execution.' }

$readinessArguments = @{ OrgId = $OrgId; Controller = $Controller; ExcludeController = $ExcludeController; ScenarioScope = $ScenarioScope }
& (Join-Path $PSScriptRoot 'check-multi-user-run-readiness.ps1') @readinessArguments
if ($LASTEXITCODE -ne 0) { throw 'Serial readiness check did not return READY.' }

$scaffoldArguments = @{ OrgId = $OrgId; RunId = $RunId; Controller = $Controller; ExcludeController = $ExcludeController; ScenarioScope = $ScenarioScope }
$scaffoldJson = & (Join-Path $PSScriptRoot 'start-multi-user-full-suite-run.ps1') @scaffoldArguments
$scaffold = $scaffoldJson | ConvertFrom-Json
$runDirectory = [System.IO.Path]::GetFullPath([string]$scaffold.runDirectory)
$manifestPath = Join-Path $runDirectory 'run-manifest.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json

$allControllerNames = @($manifest.accounts | Select-Object -ExpandProperty controller | ForEach-Object { [System.IO.Path]::GetFileName($_) })
$allControllerSlugs = @($manifest.accounts | Select-Object -ExpandProperty slug)

$scopePrompt = if ($ScenarioScope -eq 'TimeAndAttendance') {
@"
SCENARIO SCOPE: TIME & ATTENDANCE ONLY. Execute every repository scenario from 29 through 46 that is authorized by the selected controllers and their role/organization contexts. Do not execute or record scenarios 1 through 28. Do not execute the supplemental Absence Management-origin App Switcher workflow. Absence Management may be visited only when it is an explicit step inside a Time & Attendance scenario such as the TA -> AM -> TA round trip. Record workflow events only for scenario IDs 29-46, using workflow slugs that contain scenario-29 through scenario-46. This scope overrides any full-controller or full-suite wording in the referenced controller documents.
"@
} else {
    'SCENARIO SCOPE: FULL. Execute every workflow authorized by the selected controllers.'
}

$runDirForward = [string]$scaffold.runDirectory -replace '\\', '/'
$prompt = @"
Execute multi-user full suite for organization $OrgId and run $RunId. Use the playwright MCP browser tools; never use a lane-specific MCP server. Read instructions/multi-user-full-suite-execution.md and execute these controllers sequentially in manifest order: $($allControllerNames -join ', '). Do not edit repository source or configuration. Never print or persist resolved usernames, passwords, tokens, cookies, or session values.

Apply the manifest's 120-second UI recovery policy before finalizing any potential functional failure caused by missing, slow, or incomplete rendering. Measure each screen or required-control load from its triggering action until the expected responsive state appears. Add a SLOW_UI_LOAD warning with the actual measured elapsed seconds whenever that time exceeds 30 seconds; the warning does not change the functional status. Read config/known-failures.json and, only when the observed failure matches a catalog signature exactly, keep status FAIL and add the matching knownFailure metadata so the report displays KNOWN FAILED with its Jira ticket. Do not infer a match from a scenario number or a vaguely similar symptom.

HCMAT-79933 RECOVERY: when Sidekick/global navigation is delayed but becomes visible and responsive within 120 seconds, continue the scenario and mark it PASS if all functional assertions succeed. Add a SLOW_UI_LOAD warning with the exact elapsedSeconds and knownIssue.ticket HCMAT-79933 so the Jira link appears in the description. Use knownFailure HCMAT-79933 only when the matching Sidekick state never becomes usable by the 120-second timeout.

$scopePrompt

Open a fresh headed Stage Chrome page with the playwright MCP server. Then dot-source scripts/browser-window-capture-support.ps1 and call Get-MultiUserChromeWindowForCurrentCodexLane to resolve the Chrome window handle from this Codex process tree. Start scripts/start-browser-window-video.ps1 with -OrgId $OrgId -RunId $RunId and the explicit -WindowHandle. Write every video event with scripts/write-multi-user-video-event.ps1 (no -LaneSlug for serial mode). Use the account slugs from the manifest ($($allControllerSlugs -join ', ')). Save execution-observations.json at the run directory root ($runDirForward), following the documented execution-observations schema. Save screenshots in each controller's roles/<account-slug>/screenshots folder. On completion write RecordingEnd and call scripts/stop-browser-window-video.ps1. Preserve all partial evidence if any controller fails, and return a concise run result without credential values.
"@

function ConvertTo-SerialProcessArgument {
    param([string]$Value)
    if ($Value -notmatch '[\s"]') { return $Value }
    return '"' + $Value.Replace('"', '\"') + '"'
}

$arguments = @('exec', '--ephemeral', '--approve-for-me', '--color', 'never', '-C', $workspaceRoot)
foreach ($serverNumber in 1..10) {
    $arguments += @('-c', "mcp_servers.playwright_lane$serverNumber.enabled=false")
}
$arguments += @('-c', 'mcp_servers.playwright.enabled=true', $prompt)
$argumentText = @($arguments | ForEach-Object { ConvertTo-SerialProcessArgument ([string]$_) }) -join ' '

Write-Host "Starting serial codex execution for organization $OrgId, run $RunId, $(@($manifest.accounts).Count) controller(s)..."
$process = Start-Process -FilePath $codex.Source -ArgumentList $argumentText -PassThru -WindowStyle Hidden

$deadline = [DateTimeOffset]::UtcNow.AddMinutes($TimeoutMinutes)
while (-not $process.HasExited -and [DateTimeOffset]::UtcNow -lt $deadline) { Start-Sleep -Seconds 2 }
$timedOut = -not $process.HasExited
if ($timedOut) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue; $process.WaitForExit(10000) | Out-Null }

$journalPath  = Join-Path $runDirectory 'video-events.json'
$observationPath = Join-Path $runDirectory 'execution-observations.json'
$videoRootPath   = Join-Path $workspaceRoot 'multi-user-full-suite-execution.webm'
$videoDestPath   = Join-Path (Join-Path $runDirectory 'videos') 'multi-user-full-suite-execution.webm'

if ($timedOut)             { throw "Serial codex execution timed out after $TimeoutMinutes minutes. Partial evidence preserved in $runDirectory." }
if ($process.ExitCode -ne 0) { throw "Serial codex execution failed (exit code $($process.ExitCode)). Partial evidence preserved in $runDirectory." }
if (-not (Test-Path -LiteralPath $journalPath))     { throw "Serial execution produced no video event journal ($journalPath)." }
if (-not (Test-Path -LiteralPath $observationPath)) { throw "Serial execution produced no execution observations ($observationPath)." }
if (-not (Test-Path -LiteralPath $videoRootPath) -and -not (Test-Path -LiteralPath $videoDestPath)) {
    throw "Serial execution produced no video recording (expected at $videoRootPath or $videoDestPath)."
}

Write-Host 'Running post-processing pipeline...'
try {
    & node (Join-Path $PSScriptRoot 'build-multi-user-run-data.mjs') $OrgId $RunId
    if ($LASTEXITCODE -ne 0) { throw 'build-multi-user-run-data failed.' }

    & node (Join-Path $PSScriptRoot 'apply-multi-user-video-timeline.mjs') $OrgId $RunId
    if ($LASTEXITCODE -ne 0) { throw 'apply-multi-user-video-timeline failed.' }

    & (Join-Path $PSScriptRoot 'finalize-multi-user-full-suite-run.ps1') -OrgId $OrgId -RunId $RunId

    & node (Join-Path $PSScriptRoot 'generate-multi-user-full-suite-report.mjs') $OrgId $RunId
    if ($LASTEXITCODE -ne 0) { throw 'generate-multi-user-full-suite-report failed.' }

    & (Join-Path $PSScriptRoot 'package-multi-user-full-suite-report.ps1') -OrgId $OrgId -RunId $RunId
} catch {
    Write-Error "Post-processing failed at: $($_.Exception.Message)"
    throw
}

[pscustomobject]@{
    organizationId = $OrgId
    runId          = $RunId
    mode           = 'serial'
    runDirectory   = $runDirectory
    report         = Join-Path $runDirectory 'index.html'
} | ConvertTo-Json -Depth 4
