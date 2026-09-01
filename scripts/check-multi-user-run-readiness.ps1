param(
    [Parameter(Mandatory = $true)]
    [string]$OrgId,

    [string[]]$Controller = @(),
    [string[]]$ExcludeController = @()
)

$ErrorActionPreference = 'Stop'

$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
. (Join-Path $PSScriptRoot 'multi-user-org-context.ps1')

$context = Resolve-MultiUserOrganizationContext -WorkspaceRoot $workspaceRoot -OrgId $OrgId
$selected = @(Select-MultiUserControllers -Context $context -Controller $Controller -ExcludeController $ExcludeController)
$controllerRoot = Join-Path $workspaceRoot 'instructions\Multi User Instructions'
$disposableProfileCheckPath = Join-Path $workspaceRoot 'scripts\check-disposable-playwright-profile.ps1'
$timeAttendanceFiles = @(
    (Join-Path $workspaceRoot 'instructions\time-and-attendance-details.md'),
    (Join-Path $workspaceRoot 'tests\time-and-attendance\app-switcher-navigation-matrix.md'),
    (Join-Path $workspaceRoot 'tests\time-and-attendance\organization-user-navigation.md'),
    (Join-Path $workspaceRoot 'tests\time-and-attendance\logout-navigation-matrix.md'),
    (Join-Path $workspaceRoot 'tests\time-and-attendance\multi-role-multi-org-context-matrix.md')
)
$timelineScriptPaths = @(
    (Join-Path $workspaceRoot 'scripts\write-multi-user-video-event.ps1'),
    (Join-Path $workspaceRoot 'scripts\apply-multi-user-video-timeline.mjs'),
    (Join-Path $workspaceRoot 'scripts\generate-multi-user-full-suite-report.mjs'),
    (Join-Path $workspaceRoot 'scripts\browser-window-capture-support.ps1'),
    (Join-Path $workspaceRoot 'scripts\browser-window-video-worker.ps1'),
    (Join-Path $workspaceRoot 'scripts\start-browser-window-video.ps1'),
    (Join-Path $workspaceRoot 'scripts\stop-browser-window-video.ps1'),
    (Join-Path $workspaceRoot 'scripts\capture-browser-window-screenshot.ps1')
)
$ffmpegPath = Join-Path $workspaceRoot 'node_modules\ffmpeg-static\ffmpeg.exe'
$suiteInstructionPath = Join-Path $workspaceRoot 'instructions\multi-user-full-suite-execution.md'
$suiteInstructionText = if (Test-Path -LiteralPath $suiteInstructionPath) { Get-Content -LiteralPath $suiteInstructionPath -Raw } else { '' }

$secrets = if (Test-Path -LiteralPath $context.SecretPath) {
    Get-Content -LiteralPath $context.SecretPath -Raw | ConvertFrom-Json
} else {
    $null
}

$credentialEnvironments = @{
    'organization-user-execution.md' = @('AES_STAGE_ORGANIZATION_USERNAME', 'AES_STAGE_ORGANIZATION_PASSWORD')
    'campus-user-execution.md' = @('AES_STAGE_CAMPUS_USERNAME', 'AES_STAGE_CAMPUS_PASSWORD')
    'employee-user-execution.md' = @('AES_STAGE_EMPLOYEE_USERNAME', 'AES_STAGE_EMPLOYEE_PASSWORD')
    'substitute-user-execution.md' = @('AES_STAGE_SUBSTITUTE_USERNAME', 'AES_STAGE_SUBSTITUTE_PASSWORD')
    'multi-role-campus-employee-organization-execution.md' = @('AES_STAGE_ROLE_SWITCHER_ORG_USERNAME', 'AES_STAGE_ROLE_SWITCHER_ORG_PASSWORD')
    'multi-role-organization-employee-execution.md' = @('AES_STAGE_MULTI_ROLE_ORG_EMPLOYEE_USERNAME', 'AES_STAGE_MULTI_ROLE_ORG_EMPLOYEE_PASSWORD')
    'multi-role-employee-employee-substitute-execution.md' = @('AES_STAGE_MULTI_ROLE_EMPLOYEE_EMPLOYEE_SUBSTITUTE_USERNAME', 'AES_STAGE_MULTI_ROLE_EMPLOYEE_EMPLOYEE_SUBSTITUTE_PASSWORD')
    'multi-org-employee-substitute-execution.md' = @('AES_STAGE_MULTI_ORG_EMPLOYEE_SUBSTITUTE_USERNAME', 'AES_STAGE_MULTI_ORG_EMPLOYEE_SUBSTITUTE_PASSWORD')
    'multi-org-employee-employee-execution.md' = @('AES_STAGE_MULTI_ORG_EMPLOYEE_EMPLOYEE_USERNAME', 'AES_STAGE_MULTI_ORG_EMPLOYEE_EMPLOYEE_PASSWORD')
    'multi-org-organization-campus-execution.md' = @('AES_STAGE_MULTI_ORG_ORG_CAMPUS_USERNAME', 'AES_STAGE_MULTI_ORG_ORG_CAMPUS_PASSWORD')
}

$timeAttendanceFilesReady = @($timeAttendanceFiles | Where-Object { -not (Test-Path -LiteralPath $_) }).Count -eq 0
$disposableProfileReady = $false
if (Test-Path -LiteralPath $disposableProfileCheckPath) {
    $null = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $disposableProfileCheckPath -Quiet 2>&1
    $disposableProfileReady = $LASTEXITCODE -eq 0
}

$results = foreach ($item in $selected) {
    $controllerPath = Join-Path $controllerRoot $item.File
    $usernameFromConfig = [string]$context.Config.testUsernames.($item.UsernameKey)
    $passwordFromSecret = if ($null -ne $secrets) { [string]$secrets.($item.PasswordKey) } else { '' }
    $environmentNames = $credentialEnvironments[$item.File]
    $usernameFromEnvironment = if ($null -ne $environmentNames) { [Environment]::GetEnvironmentVariable($environmentNames[0]) } else { '' }
    $passwordFromEnvironment = if ($null -ne $environmentNames) { [Environment]::GetEnvironmentVariable($environmentNames[1]) } else { '' }
    $controllerText = if (Test-Path -LiteralPath $controllerPath) { Get-Content -LiteralPath $controllerPath -Raw } else { '' }

    $usernameReady = (Test-MultiUserConfiguredValue $usernameFromEnvironment) -or (Test-MultiUserConfiguredValue $usernameFromConfig)
    $passwordReady = (Test-MultiUserConfiguredValue $passwordFromEnvironment) -or (Test-MultiUserConfiguredValue $passwordFromSecret)
    $applicationLaunchReady = $controllerText -match 'stage-ml-application-launch\.md'
    $appSwitcherReady = $controllerText -match 'app-switcher-validation\.md'
    $urlValidationReady = $controllerText -match 'url-evidence-validation\.md'
    $timeAttendanceReady = $timeAttendanceFilesReady -and $controllerText -match 'time-and-attendance-details\.md'

    [pscustomobject]@{
        Controller = $item.File
        ControllerFile = Test-Path -LiteralPath $controllerPath
        Username = $usernameReady
        Password = $passwordReady
        ApplicationLaunch = $applicationLaunchReady
        AppSwitcher = $appSwitcherReady
        UrlValidation = $urlValidationReady
        TimeAttendance = $timeAttendanceReady
        Ready = (Test-Path -LiteralPath $controllerPath) -and $usernameReady -and $passwordReady -and $applicationLaunchReady -and $appSwitcherReady -and $urlValidationReady -and $timeAttendanceReady
    }
}

$urlReady = Test-MultiUserConfiguredValue ([string]$context.Config.url)
$urlHost = if ($urlReady) { ([System.Uri][string]$context.Config.url).Host } else { '' }
$approvedHosts = @($context.Config.approvedHosts | ForEach-Object { [string]$_ })
$prohibitedHosts = @($context.Config.prohibitedHosts | ForEach-Object { [string]$_ })
$urlHostApproved = $urlReady -and $urlHost -in $approvedHosts
$approvedHostsUnique = @($approvedHosts | Sort-Object -Unique).Count -eq $approvedHosts.Count
$hostListsDisjoint = @($approvedHosts | Where-Object { $_ -in $prohibitedHosts }).Count -eq 0
$requiredUrlReady = Test-MultiUserConfiguredValue ([string]$context.Config.requiredUrlContains)
$stageUrlPolicyReady = [string]::Equals([string]$context.Config.requiredUrlContains, 'stage-k12.ss', [System.StringComparison]::OrdinalIgnoreCase)
$freshBrowserIsolationReady = $suiteInstructionText -match 'fresh isolated headed Chrome automation context' -and $suiteInstructionText -match 'Do not claim or reuse'
$timelineScriptsReady = @($timelineScriptPaths | Where-Object { -not (Test-Path -LiteralPath $_) }).Count -eq 0
$ffmpegReady = Test-Path -LiteralPath $ffmpegPath
$results | Format-Table -AutoSize

$notReady = @($results | Where-Object { -not $_.Ready })
[pscustomobject]@{
    OrganizationId = $context.OrgId
    ConfigurationFile = [System.IO.Path]::GetFileName($context.ConfigPath)
    StageUrl = $urlReady
    StageUrlApproved = $urlHostApproved
    ApprovedHostsUnique = $approvedHostsUnique
    HostListsDisjoint = $hostListsDisjoint
    RequiredUrlSubstring = $requiredUrlReady -and $stageUrlPolicyReady
    FreshBrowserIsolation = $freshBrowserIsolationReady
    SecretFile = Test-Path -LiteralPath $context.SecretPath
    DisposableChromeProfile = $disposableProfileReady
    TimeAttendanceFiles = $timeAttendanceFilesReady
    SelectedControllers = @($results).Count
    ReadyControllers = @($results | Where-Object Ready).Count
    NotReadyControllers = $notReady.Count
    MeasuredVideoTimelineScripts = $timelineScriptsReady
    FullBrowserCapture = $timelineScriptsReady -and $ffmpegReady
    ReportRoot = $context.FullSuiteRoot
} | Format-List

if (-not $urlReady -or -not $urlHostApproved -or -not $approvedHostsUnique -or -not $hostListsDisjoint -or -not $requiredUrlReady -or -not $stageUrlPolicyReady -or -not $freshBrowserIsolationReady -or -not $disposableProfileReady -or -not $timeAttendanceFilesReady -or -not $timelineScriptsReady -or -not $ffmpegReady -or $notReady.Count -gt 0) {
    Write-Error "Multi-user readiness check failed for organization $OrgId. Only presence was checked; no credential values were displayed."
    exit 1
}

Write-Output "READY: organization $OrgId has $(@($results).Count) selected controller(s) with organization-scoped configuration, local credentials, disposable fresh Chrome isolation, Time & Attendance sources, Stage ML application-launch recovery, App Switcher instructions, stage-k12.ss URL validation, and full-browser capture support."
