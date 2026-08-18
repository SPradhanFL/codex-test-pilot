param(
    [Parameter(Mandatory = $true)]
    [string]$RunId
)

$ErrorActionPreference = 'Stop'

if ($RunId -notmatch '^\d{8}-\d{6}$') {
    throw 'RunId must use the format yyyyMMdd-HHmmss.'
}

$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$runDirectory = [System.IO.Path]::GetFullPath((Join-Path $workspaceRoot "reports\full-suite\$RunId"))
$runDataPath = Join-Path $runDirectory 'run-data.json'

if (-not $runDirectory.StartsWith($workspaceRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'The run directory resolved outside the workspace.'
}
if (-not (Test-Path -LiteralPath $runDataPath)) {
    throw "Missing run data: $runDataPath"
}

$data = Get-Content -Raw -LiteralPath $runDataPath | ConvertFrom-Json
$videoSource = Join-Path $workspaceRoot 'full-suite-execution.webm'
$videoDirectory = Join-Path $runDirectory 'videos'
New-Item -ItemType Directory -Force -Path $videoDirectory | Out-Null

if (Test-Path -LiteralPath $videoSource) {
    Move-Item -LiteralPath $videoSource -Destination (Join-Path $videoDirectory 'full-suite-execution.webm') -Force
}

$movedScreenshots = 0
foreach ($execution in $data.executions) {
    $destinationDirectory = Join-Path (Join-Path $runDirectory 'screenshots') $execution.slug
    New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null

    foreach ($screenshot in $execution.screenshots) {
        if ($screenshot -notmatch '^[A-Za-z0-9_.-]+\.png$') {
            throw "Unexpected screenshot filename: $screenshot"
        }
        $source = Join-Path $workspaceRoot $screenshot
        if (Test-Path -LiteralPath $source) {
            Move-Item -LiteralPath $source -Destination (Join-Path $destinationDirectory $screenshot) -Force
            $movedScreenshots++
        }
    }
}

[pscustomobject]@{
    runId = $RunId
    video = Join-Path $videoDirectory 'full-suite-execution.webm'
    screenshotsMoved = $movedScreenshots
} | ConvertTo-Json
