$ErrorActionPreference = 'Stop'
$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
. (Join-Path $workspaceRoot 'scripts\multi-user-org-context.ps1')

function Assert-ParallelTest {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw "Parallel execution test failed: $Message" }
}

$context = Resolve-MultiUserOrganizationContext -WorkspaceRoot $workspaceRoot -OrgId '140463'
$selected = @(Select-MultiUserControllers -Context $context)
$lanes = @(Group-MultiUserControllerLanes -Context $context -SelectedControllers $selected)
Assert-ParallelTest ($selected.Count -eq 10) '140463 should currently select ten controllers.'
Assert-ParallelTest ($lanes.Count -eq 9) 'Current 140463 credentials should resolve to nine distinct account lanes.'
Assert-ParallelTest (@($lanes | Where-Object { @($_.Controllers).Count -eq 2 }).Count -eq 1) 'The currently shared account must remain in one two-controller lane.'

$first = $context.ControllerCatalog[0]; $second = $context.ControllerCatalog[1]
$firstEnvironment = $script:MultiUserCredentialEnvironments[$first.File][0]; $secondEnvironment = $script:MultiUserCredentialEnvironments[$second.File][0]
$savedFirst = [Environment]::GetEnvironmentVariable($firstEnvironment); $savedSecond = [Environment]::GetEnvironmentVariable($secondEnvironment)
try {
    [Environment]::SetEnvironmentVariable($firstEnvironment, $null); [Environment]::SetEnvironmentVariable($secondEnvironment, $null)
    $synthetic = [pscustomobject]@{ Config = [pscustomobject]@{ testUsernames = [pscustomobject]@{ org_username = ' Same@Test.Invalid '; campusUser = 'same@test.invalid' } } }
    $syntheticLanes = @(Group-MultiUserControllerLanes -Context $synthetic -SelectedControllers @($first, $second))
    Assert-ParallelTest ($syntheticLanes.Count -eq 1) 'Two different keys resolving to the same username must share one lane.'
} finally {
    [Environment]::SetEnvironmentVariable($firstEnvironment, $savedFirst); [Environment]::SetEnvironmentVariable($secondEnvironment, $savedSecond)
}

$limited = @(Group-MultiUserControllerLanes -Context $context -SelectedControllers $selected -MaxLanes 3)
Assert-ParallelTest ($limited.Count -eq 3) 'MaxLanes must safely merge lanes down to the requested count.'

$parallelLauncherText = Get-Content -LiteralPath (Join-Path $workspaceRoot 'scripts\start-multi-user-parallel-lanes.ps1') -Raw
$scaffoldText = Get-Content -LiteralPath (Join-Path $workspaceRoot 'scripts\start-multi-user-full-suite-run.ps1') -Raw
$builderText = Get-Content -LiteralPath (Join-Path $workspaceRoot 'scripts\build-multi-user-run-data.mjs') -Raw
Assert-ParallelTest ($parallelLauncherText -match "ValidateSet\('Full', 'TimeAndAttendance'\)") 'Parallel launcher must expose the explicit TimeAndAttendance scenario scope.'
Assert-ParallelTest ($parallelLauncherText -match 'ScenarioScope = \$ScenarioScope; Parallel = \$true') 'Parallel launcher must propagate scenario scope through readiness and scaffolding.'
Assert-ParallelTest ($parallelLauncherText -match 'Do not execute or record scenarios 1 through 28') 'Parallel lane prompt must explicitly exclude AM scenarios for a TA-only run.'
Assert-ParallelTest ($scaffoldText -match "name = 'time-and-attendance'") 'Run manifest scaffolding must persist the TA-only scope.'
Assert-ParallelTest ($scaffoldText -match 'observationTimeoutSeconds = 120') 'Run manifest scaffolding must persist the 120-second UI-recovery policy.'
Assert-ParallelTest ($scaffoldText -match 'warningThresholdSeconds = 30') 'Run manifest scaffolding must persist the measured slow-load warning threshold.'
Assert-ParallelTest ($scaffoldText -match 'known-failures\.json') 'Run manifest scaffolding must persist the known-failure catalog.'
Assert-ParallelTest ($builderText -match 'Time & Attendance scope rejected out-of-scope workflow') 'Post-processing must reject out-of-scope workflow evidence.'
Assert-ParallelTest ($builderText -match 'Known failure metadata requires FAIL status') 'Post-processing must validate known-failure classification.'

$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$testRun = [System.IO.Path]::GetFullPath((Join-Path $context.FullSuiteRoot $runId))
Assert-ParallelTest ($testRun.StartsWith($context.FullSuiteRoot, [System.StringComparison]::OrdinalIgnoreCase)) 'Stress-test path escaped the organization report root.'
$jobs = @()
try {
    foreach ($laneNumber in 1..8) { New-Item -ItemType Directory -Force -Path (Join-Path (Join-Path $testRun 'lanes') "lane-$laneNumber") | Out-Null }
    $eventScript = Join-Path $workspaceRoot 'scripts\write-multi-user-video-event.ps1'
    $jobs = @(foreach ($laneNumber in 1..8) {
        Start-Job -ScriptBlock {
            param($EventScript, $RunId, $LaneNumber)
            $lane = "lane-$LaneNumber"
            & $EventScript -OrgId 140463 -RunId $RunId -LaneSlug $lane -Event RecordingStart | Out-Null
            foreach ($eventNumber in 1..23) { & $EventScript -OrgId 140463 -RunId $RunId -LaneSlug $lane -Event WorkflowStart -AccountSlug 'stress-account' -WorkflowSlug ("workflow-{0:d2}" -f $eventNumber) | Out-Null }
            & $EventScript -OrgId 140463 -RunId $RunId -LaneSlug $lane -Event RecordingEnd | Out-Null
        } -ArgumentList $eventScript, $runId, $laneNumber
    })
    $jobs | Wait-Job | Out-Null
    $failedJobs = @($jobs | Where-Object State -ne 'Completed')
    if ($failedJobs.Count -gt 0) { $failedJobs | Receive-Job; throw 'One or more event stress jobs failed.' }
    foreach ($laneNumber in 1..8) {
        $journal = Get-Content -Raw -LiteralPath (Join-Path (Join-Path (Join-Path $testRun 'lanes') "lane-$laneNumber") 'video-events.json') | ConvertFrom-Json
        Assert-ParallelTest (@($journal.events).Count -eq 25) "Lane $laneNumber lost events."
        Assert-ParallelTest ((Compare-Object @(1..25) @($journal.events.sequence)).Count -eq 0) "Lane $laneNumber sequence is not contiguous."
    }
} finally {
    if ($jobs.Count -gt 0) { $jobs | Remove-Job -Force -ErrorAction SilentlyContinue }
    if (Test-Path -LiteralPath $testRun) { Remove-Item -LiteralPath $testRun -Recurse -Force }
}

Write-Output 'PASS: lane grouping, duplicate-account enforcement, TA-only parallel scope propagation, MaxLanes merging, and 200-event concurrency stress checks succeeded.'
