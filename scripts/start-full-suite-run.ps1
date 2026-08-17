param(
    [string]$RunId = (Get-Date -Format 'yyyyMMdd-HHmmss')
)

$ErrorActionPreference = 'Stop'

$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$fullSuiteRoot = [System.IO.Path]::GetFullPath((Join-Path $workspaceRoot 'reports\full-suite'))
$oldRunsRoot = [System.IO.Path]::GetFullPath((Join-Path $fullSuiteRoot 'old-runs'))

if (-not $fullSuiteRoot.StartsWith($workspaceRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'The full-suite report root resolved outside the workspace.'
}

if ($RunId -notmatch '^\d{8}-\d{6}$') {
    throw 'RunId must use the format yyyyMMdd-HHmmss.'
}

New-Item -ItemType Directory -Force -Path $fullSuiteRoot | Out-Null
New-Item -ItemType Directory -Force -Path $oldRunsRoot | Out-Null

$archived = New-Object System.Collections.Generic.List[string]
$activeRunDirectories = @(
    Get-ChildItem -LiteralPath $fullSuiteRoot -Directory |
        Where-Object { $_.Name -match '^\d{8}-\d{6}$' }
)

foreach ($source in $activeRunDirectories) {
    $sourcePath = [System.IO.Path]::GetFullPath($source.FullName)
    $destination = [System.IO.Path]::GetFullPath(
        (Join-Path $oldRunsRoot ('old-' + $source.Name))
    )

    if (-not $sourcePath.StartsWith($fullSuiteRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to move unexpected source path: $sourcePath"
    }
    if (-not $destination.StartsWith($oldRunsRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to use unexpected archive path: $destination"
    }
    if (Test-Path -LiteralPath $destination) {
        $destination = [System.IO.Path]::GetFullPath(
            (Join-Path $oldRunsRoot ('old-' + $source.Name + '-' + (Get-Date -Format 'yyyyMMdd-HHmmss')))
        )
    }

    Move-Item -LiteralPath $sourcePath -Destination $destination
    $archived.Add($destination)
}

$rootZipFiles = @(
    Get-ChildItem -LiteralPath $fullSuiteRoot -File -Filter '*.zip' |
        Where-Object { $_.BaseName -match '^\d{8}-\d{6}$' }
)

foreach ($zip in $rootZipFiles) {
    $archiveDirectory = Join-Path $oldRunsRoot ('old-' + $zip.BaseName)
    if (-not (Test-Path -LiteralPath $archiveDirectory)) {
        New-Item -ItemType Directory -Force -Path $archiveDirectory | Out-Null
    }
    Move-Item -LiteralPath $zip.FullName -Destination (Join-Path $archiveDirectory $zip.Name) -Force
}

$newRunDirectory = [System.IO.Path]::GetFullPath((Join-Path $fullSuiteRoot $RunId))
if (-not $newRunDirectory.StartsWith($fullSuiteRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'The new run directory resolved outside the full-suite report root.'
}
if (Test-Path -LiteralPath $newRunDirectory) {
    throw "The requested run directory already exists: $newRunDirectory"
}

New-Item -ItemType Directory -Path $newRunDirectory | Out-Null
New-Item -ItemType Directory -Path (Join-Path $newRunDirectory 'scenarios') | Out-Null
New-Item -ItemType Directory -Path (Join-Path $newRunDirectory 'screenshots') | Out-Null
New-Item -ItemType Directory -Path (Join-Path $newRunDirectory 'videos') | Out-Null

[pscustomobject]@{
    runId = $RunId
    runDirectory = $newRunDirectory
    archivedRunDirectories = @($archived)
    archiveRoot = $oldRunsRoot
} | ConvertTo-Json -Depth 4
