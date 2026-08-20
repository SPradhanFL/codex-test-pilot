param(
    [string]$RunId = (Get-Date -Format 'yyyyMMdd-HHmmss'),
    [string[]]$ExcludeController = @()
)

$ErrorActionPreference = 'Stop'

$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$fullSuiteRoot = [System.IO.Path]::GetFullPath((Join-Path $workspaceRoot 'reports\full-suite'))
$archiveRoot = [System.IO.Path]::GetFullPath((Join-Path $fullSuiteRoot 'old-reports'))
$controllerRoot = [System.IO.Path]::GetFullPath((Join-Path $workspaceRoot 'instructions\Multi User Instructions'))

if ($RunId -notmatch '^\d{8}-\d{6}$') {
    throw 'RunId must use the format yyyyMMdd-HHmmss.'
}
if (-not $fullSuiteRoot.StartsWith($workspaceRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'The full-suite report root resolved outside the workspace.'
}
if (-not $archiveRoot.StartsWith($fullSuiteRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'The archive root resolved outside the full-suite report root.'
}
if (-not (Test-Path -LiteralPath $controllerRoot)) {
    throw "Missing multi-user controller directory: $controllerRoot"
}

$controllerOrder = @(
    'organization-user-execution.md',
    'campus-user-execution.md',
    'employee-user-execution.md',
    'substitute-user-execution.md',
    'multi-role-campus-employee-organization-execution.md',
    'multi-role-organization-employee-execution.md',
    'multi-role-employee-employee-substitute-execution.md',
    'multi-org-employee-substitute-execution.md',
    'multi-org-employee-employee-execution.md',
    'multi-org-organization-campus-execution.md'
)

$discovered = @(
    Get-ChildItem -LiteralPath $controllerRoot -File -Filter '*-execution.md' |
        Select-Object -ExpandProperty Name |
        Sort-Object
)
$expected = @($controllerOrder | Sort-Object)

if ($discovered.Count -ne $controllerOrder.Count) {
    throw "Expected exactly $($controllerOrder.Count) execution controllers, discovered $($discovered.Count)."
}
if ((Compare-Object -ReferenceObject $expected -DifferenceObject $discovered).Count -ne 0) {
    throw 'The discovered controller set does not match the required account order.'
}

$unknownExclusions = @($ExcludeController | Where-Object { $_ -notin $controllerOrder })
if ($unknownExclusions.Count -gt 0) {
    throw "Unknown excluded controller: $($unknownExclusions -join ', ')"
}
$selectedControllerOrder = @($controllerOrder | Where-Object { $_ -notin $ExcludeController })
if ($selectedControllerOrder.Count -eq 0) {
    throw 'At least one execution controller must remain selected.'
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
        $destination = [System.IO.Path]::GetFullPath(
            (Join-Path $archiveRoot ('old-' + $source.Name + '-' + (Get-Date -Format 'yyyyMMdd-HHmmss')))
        )
    }

    Move-Item -LiteralPath $sourcePath -Destination $destination
    $archived.Add($destination)
}

$currentZipFiles = @(
    Get-ChildItem -LiteralPath $fullSuiteRoot -File -Filter '*.zip' |
        Where-Object { $_.BaseName -match '(\d{8}-\d{6})$' }
)
foreach ($zip in $currentZipFiles) {
    $zipRunId = [regex]::Match($zip.BaseName, '(\d{8}-\d{6})$').Groups[1].Value
    $zipArchive = Join-Path $archiveRoot ('old-' + $zipRunId)
    if (-not (Test-Path -LiteralPath $zipArchive)) {
        New-Item -ItemType Directory -Force -Path $zipArchive | Out-Null
    }
    Move-Item -LiteralPath $zip.FullName -Destination (Join-Path $zipArchive $zip.Name) -Force
}

$runDirectory = [System.IO.Path]::GetFullPath((Join-Path $fullSuiteRoot $RunId))
if (-not $runDirectory.StartsWith($fullSuiteRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'The new run directory resolved outside the full-suite report root.'
}
if (Test-Path -LiteralPath $runDirectory) {
    throw "The requested run directory already exists: $runDirectory"
}

New-Item -ItemType Directory -Path $runDirectory | Out-Null
New-Item -ItemType Directory -Path (Join-Path $runDirectory 'roles') | Out-Null
New-Item -ItemType Directory -Path (Join-Path $runDirectory 'videos') | Out-Null

$friendlyNames = @{
    'organization-user-execution.md' = 'Organization User'
    'campus-user-execution.md' = 'Campus User'
    'employee-user-execution.md' = 'Employee'
    'substitute-user-execution.md' = 'Substitute'
    'multi-role-campus-employee-organization-execution.md' = 'Multi-role Campus User + Employee + Organization User'
    'multi-role-organization-employee-execution.md' = 'Multi-role Organization User + Employee'
    'multi-role-employee-employee-substitute-execution.md' = 'Multi-role Employee + Employee + Substitute'
    'multi-org-employee-substitute-execution.md' = 'Multi-org Employee + Substitute'
    'multi-org-employee-employee-execution.md' = 'Multi-org Employee + Employee'
    'multi-org-organization-campus-execution.md' = 'Multi-org Organization User + Campus User'
}

$manifestAccounts = for ($index = 0; $index -lt $selectedControllerOrder.Count; $index++) {
    $fileName = $selectedControllerOrder[$index]
    $slug = $fileName -replace '-execution\.md$', ''
    [ordered]@{
        execution = $index + 1
        name = $friendlyNames[$fileName]
        slug = $slug
        controller = 'instructions/Multi User Instructions/' + $fileName
        report = 'roles/' + $slug + '/index.html'
        status = 'PENDING'
    }
}

foreach ($role in $manifestAccounts) {
    $roleDirectory = Join-Path (Join-Path $runDirectory 'roles') $role.slug
    New-Item -ItemType Directory -Path $roleDirectory | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $roleDirectory 'scenarios') | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $roleDirectory 'screenshots') | Out-Null
}

$manifest = [ordered]@{
    runId = $RunId
    createdAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss zzz')
    mode = 'multi-user unattended safe mode'
    reportFormat = 'migrated-user-navigation-reference-v1'
    reportDirectory = 'roles'
    expectedAccountReports = $selectedControllerOrder.Count
    expectedRoleReports = $selectedControllerOrder.Count
    excludedControllers = @($ExcludeController)
    video = 'videos/multi-user-full-suite-execution.webm'
    capture = [ordered]@{
        browser = 'Chrome'
        browserMode = 'headed'
        viewport = '1280x720'
        videoCount = 1
        continuous = $true
        blur = $false
        masking = $false
        overlays = $false
        dimming = $false
        annotations = $false
        chapterCards = $false
    }
    accounts = $manifestAccounts
}
$manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $runDirectory 'run-manifest.json') -Encoding utf8

[pscustomobject]@{
    runId = $RunId
    runDirectory = $runDirectory
    controllerCount = $selectedControllerOrder.Count
    controllers = $manifestAccounts
    archivedRunDirectories = @($archived)
    archiveRoot = $archiveRoot
} | ConvertTo-Json -Depth 7
