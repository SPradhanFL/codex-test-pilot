param(
    [Parameter(Mandatory = $true)]
    [string]$OrgId,

    [string]$RunId = (Get-Date -Format 'yyyyMMdd-HHmmss'),
    [string[]]$Controller = @(),
    [string[]]$ExcludeController = @(),
    [ValidateSet('Full', 'TimeAndAttendance')]
    [string]$ScenarioScope = 'Full',
    [ValidateRange(0, 100)][int]$MaxLanes = 0,
    [switch]$Parallel
)

$ErrorActionPreference = 'Stop'

$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
. (Join-Path $PSScriptRoot 'multi-user-org-context.ps1')

$context = Resolve-MultiUserOrganizationContext -WorkspaceRoot $workspaceRoot -OrgId $OrgId
$knownFailuresPath = Join-Path $workspaceRoot 'config\known-failures.json'
if (-not (Test-Path -LiteralPath $knownFailuresPath)) {
    throw "Missing known-failure catalog: $knownFailuresPath"
}
$knownFailures = Get-Content -LiteralPath $knownFailuresPath -Raw | ConvertFrom-Json
if ([int]$knownFailures.schemaVersion -ne 1 -or @($knownFailures.tickets).Count -lt 1) {
    throw 'The known-failure catalog is missing or unsupported.'
}
$selected = @(Select-MultiUserControllers -Context $context -Controller $Controller -ExcludeController $ExcludeController)
$lanes = if ($Parallel) { @(Group-MultiUserControllerLanes -Context $context -SelectedControllers $selected -MaxLanes $MaxLanes) } else { @() }
$fullSuiteRoot = $context.FullSuiteRoot
$archiveRoot = [System.IO.Path]::GetFullPath((Join-Path $fullSuiteRoot 'old-reports'))
$controllerRoot = [System.IO.Path]::GetFullPath((Join-Path $workspaceRoot 'instructions\Multi User Instructions'))

if ($RunId -notmatch '^\d{8}-\d{6}$') {
    throw 'RunId must use the format yyyyMMdd-HHmmss.'
}
if (-not $archiveRoot.StartsWith($fullSuiteRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'The archive root resolved outside the organization report root.'
}
if (-not (Test-Path -LiteralPath $controllerRoot)) {
    throw "Missing multi-user controller directory: $controllerRoot"
}

$knownControllerOrder = @($context.ControllerCatalog.File)
$discovered = @(
    Get-ChildItem -LiteralPath $controllerRoot -File -Filter '*-execution.md' |
        Select-Object -ExpandProperty Name |
        Sort-Object
)
$expected = @($knownControllerOrder | Sort-Object)
if ($discovered.Count -ne $knownControllerOrder.Count -or (Compare-Object -ReferenceObject $expected -DifferenceObject $discovered).Count -ne 0) {
    throw 'The discovered controller set does not match the required controller catalog.'
}

New-Item -ItemType Directory -Force -Path $fullSuiteRoot | Out-Null
New-Item -ItemType Directory -Force -Path $archiveRoot | Out-Null

$archived = New-Object System.Collections.Generic.List[string]
$currentRuns = @(
    Get-ChildItem -LiteralPath $fullSuiteRoot -Directory |
        Where-Object { $_.Name -match '^\d{8}-\d{6}$' }
)

foreach ($source in $currentRuns) {
    $sourcePath = [System.IO.Path]::GetFullPath($source.FullName)
    $destination = [System.IO.Path]::GetFullPath((Join-Path $archiveRoot ('old-' + $source.Name)))

    if (-not $sourcePath.StartsWith($fullSuiteRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to archive unexpected source path: $sourcePath"
    }
    if (-not $destination.StartsWith($archiveRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to use unexpected archive path: $destination"
    }
    if (Test-Path -LiteralPath $destination) {
        $destination = [System.IO.Path]::GetFullPath((Join-Path $archiveRoot ('old-' + $source.Name + '-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))))
    }

    Move-Item -LiteralPath $sourcePath -Destination $destination
    $archived.Add($destination)
}

$currentZipFiles = @(Get-ChildItem -LiteralPath $fullSuiteRoot -File -Filter '*.zip')
foreach ($zip in $currentZipFiles) {
    $zipRunIdMatch = [regex]::Match($zip.BaseName, '(\d{8}-\d{6})$')
    $zipArchiveName = if ($zipRunIdMatch.Success) { 'old-' + $zipRunIdMatch.Groups[1].Value } else { 'old-' + (Get-Date -Format 'yyyyMMdd-HHmmss') }
    $zipArchive = [System.IO.Path]::GetFullPath((Join-Path $archiveRoot $zipArchiveName))
    if (-not $zipArchive.StartsWith($archiveRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to use unexpected ZIP archive path: $zipArchive"
    }
    if (-not (Test-Path -LiteralPath $zipArchive)) {
        New-Item -ItemType Directory -Force -Path $zipArchive | Out-Null
    }
    Move-Item -LiteralPath $zip.FullName -Destination (Join-Path $zipArchive $zip.Name) -Force
}

$runDirectory = [System.IO.Path]::GetFullPath((Join-Path $fullSuiteRoot $RunId))
if (-not $runDirectory.StartsWith($fullSuiteRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'The new run directory resolved outside the organization report root.'
}
if (Test-Path -LiteralPath $runDirectory) {
    throw "The requested run directory already exists: $runDirectory"
}

New-Item -ItemType Directory -Path $runDirectory | Out-Null
New-Item -ItemType Directory -Path (Join-Path $runDirectory 'roles') | Out-Null
if ($Parallel) {
    New-Item -ItemType Directory -Path (Join-Path $runDirectory 'lanes') | Out-Null
    foreach ($lane in $lanes) {
        $laneDirectory = Join-Path (Join-Path $runDirectory 'lanes') $lane.Slug
        New-Item -ItemType Directory -Path $laneDirectory | Out-Null
        New-Item -ItemType Directory -Path (Join-Path $laneDirectory 'videos') | Out-Null
    }
} else { New-Item -ItemType Directory -Path (Join-Path $runDirectory 'videos') | Out-Null }

$manifestAccounts = @(for ($index = 0; $index -lt $selected.Count; $index++) {
    $controllerInfo = $selected[$index]
    $slug = $controllerInfo.File -replace '-execution\.md$', ''
    $account = [ordered]@{
        execution = $index + 1
        name = $controllerInfo.FriendlyName
        slug = $slug
        controller = 'instructions/Multi User Instructions/' + $controllerInfo.File
        report = 'roles/' + $slug + '/index.html'
        status = 'PENDING'
    }
    if ($Parallel) {
        $lane = @($lanes | Where-Object { $controllerInfo.File -in @($_.Controllers.File) })
        if ($lane.Count -ne 1) { throw "Controller $($controllerInfo.File) was not assigned to exactly one lane." }
        $account.laneId = $lane[0].LaneId
        $account.video = "lanes/$($lane[0].Slug)/videos/$($lane[0].Slug).webm"
    }
    $account
})

foreach ($role in $manifestAccounts) {
    $roleDirectory = Join-Path (Join-Path $runDirectory 'roles') $role.slug
    New-Item -ItemType Directory -Path $roleDirectory | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $roleDirectory 'scenarios') | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $roleDirectory 'screenshots') | Out-Null
}

$manifest = [ordered]@{
    runId = $RunId
    organizationId = $OrgId
    configuration = "config/aes-stage.ml.$OrgId.json"
    createdAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss zzz')
    mode = 'multi-user unattended safe mode'
    reportFormat = 'migrated-user-navigation-reference-v3'
    reportDirectory = 'roles'
    expectedAccountReports = $selected.Count
    expectedRoleReports = $selected.Count
    enabledControllers = @($context.EnabledControllers)
    selectedControllers = @($selected.File)
    excludedControllers = @($ExcludeController)
    scenarioScope = if ($ScenarioScope -eq 'TimeAndAttendance') {
        [ordered]@{
            name = 'time-and-attendance'
            repositoryScenarioIds = @(29..46)
            excludedRepositoryScenarioIds = @(1..28)
            includeSupplementalWorkflows = $false
        }
    } else {
        [ordered]@{
            name = 'full'
            repositoryScenarioIds = @()
            excludedRepositoryScenarioIds = @()
            includeSupplementalWorkflows = $true
        }
    }
    video = 'videos/multi-user-full-suite-execution.webm'
    timeline = [ordered]@{
        source = 'measured-video-events-v1'
        eventJournal = 'video-events.json'
        allowEstimatedRanges = $false
        allowEqualPartitioning = $false
    }
    capture = [ordered]@{
        browser = 'Chrome'
        browserMode = 'headed'
        freshAutomationContext = $true
        freshBrowserWindow = $true
        reuseExistingTabs = $false
        reuseExistingSessionState = $false
        captureMethod = 'print-window-raw-frame-pipe'
        captureScope = 'full-browser-window'
        windowSize = '1280x720'
        includeBrowserChrome = $true
        addressBarVisible = $true
        pageOnly = $false
        videoCount = 1
        continuous = $true
        blur = $false
        masking = $false
        overlays = $false
        dimming = $false
        annotations = $false
        chapterCards = $false
    }
    urlValidation = [ordered]@{
        requiredContains = [string]$context.Config.requiredUrlContains
        comparison = 'case-insensitive-substring'
        mismatchClassification = 'WARNING'
        warningDoesNotChangeStatus = $true
        evidence = 'full-browser-window-screenshot'
    }
    failurePolicy = [ordered]@{
        appliesTo = 'FAIL'
        observationTimeoutSeconds = 120
        requireFinalEvidence = $true
        preserveBlockedAndNotTested = $true
    }
    performancePolicy = [ordered]@{
        warningThresholdSeconds = 30
        maximumUiRecoverySeconds = 120
        warningCode = 'SLOW_UI_LOAD'
        warningDoesNotChangeStatus = $true
        requireMeasuredElapsedTime = $true
    }
    knownFailurePolicy = [ordered]@{
        catalog = 'config/known-failures.json'
        schemaVersion = [int]$knownFailures.schemaVersion
        displayLabel = [string]$knownFailures.displayLabel
        statusRemains = [string]$knownFailures.statusRemains
        tickets = @($knownFailures.tickets)
    }
    accounts = $manifestAccounts
}
if ($Parallel) {
    $manifest.Remove('video')
    $manifest.lanes = @($lanes | ForEach-Object { [ordered]@{ laneId = $_.LaneId; slug = $_.Slug; controllers = @($_.Controllers.File) } })
    $manifest.timeline.eventJournal = 'lanes/<lane-slug>/video-events.json'
    $manifest.capture.executionMode = 'parallel'
    $manifest.capture.parallelLanes = $lanes.Count
    $manifest.capture.videoCount = $lanes.Count
}
$manifest | ConvertTo-Json -Depth 7 | Set-Content -LiteralPath (Join-Path $runDirectory 'run-manifest.json') -Encoding utf8

[pscustomobject]@{
    organizationId = $OrgId
    runId = $RunId
    configuration = $context.ConfigPath
    credentialFile = $context.SecretPath
    runDirectory = $runDirectory
    controllerCount = $selected.Count
    scenarioScope = $manifest.scenarioScope
    controllers = $manifestAccounts
    lanes = if ($Parallel) { @($manifest.lanes) } else { $null }
    archivedRunDirectories = @($archived)
    archiveRoot = $archiveRoot
} | ConvertTo-Json -Depth 7
