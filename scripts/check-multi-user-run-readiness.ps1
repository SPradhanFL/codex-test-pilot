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
$organizationBrowserBackTestPath = Join-Path $workspaceRoot 'tests\logout\organization-user-browser-back-after-logout.md'
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
$playwrightConfigPath = Join-Path $workspaceRoot '.codex\config.toml'
$playwrightConfigText = if (Test-Path -LiteralPath $playwrightConfigPath) { Get-Content -LiteralPath $playwrightConfigPath -Raw } else { '' }
$isolationConfirmationPath = Join-Path $workspaceRoot 'scripts\confirm-multi-user-browser-isolation.ps1'

$secrets = if (Test-Path -LiteralPath $context.SecretPath) {
    Get-Content -LiteralPath $context.SecretPath -Raw | ConvertFrom-Json
} else {
    $null
}

$results = @(foreach ($item in $selected) {
    $controllerPath = Join-Path $controllerRoot $item.File
    $usernameFromConfig = [string]$context.Config.testUsernames.($item.UsernameKey)
    $passwordFromSecret = if ($null -ne $secrets) { [string]$secrets.($item.PasswordKey) } else { '' }
    $controllerText = if (Test-Path -LiteralPath $controllerPath) { Get-Content -LiteralPath $controllerPath -Raw } else { '' }

    $usernameReady = Test-MultiUserConfiguredValue $usernameFromConfig
    $passwordReady = Test-MultiUserConfiguredValue $passwordFromSecret
    $organizationBrowserBackReady = $item.File -ne 'organization-user-execution.md' -or
        (($controllerText -match 'organization-user-browser-back-after-logout\.md') -and (Test-Path -LiteralPath $organizationBrowserBackTestPath))

    [pscustomobject]@{
        Controller = $item.File
        ControllerFile = Test-Path -LiteralPath $controllerPath
        Username = $usernameReady
        Password = $passwordReady
        ApplicationLaunch = $controllerText -match 'stage-ml-application-launch\.md'
        AppSwitcher = $controllerText -match 'app-switcher-validation\.md'
        UrlValidation = $controllerText -match 'url-evidence-validation\.md'
        OrgBrowserBack = $organizationBrowserBackReady
        Ready = (Test-Path -LiteralPath $controllerPath) -and $usernameReady -and $passwordReady -and ($controllerText -match 'stage-ml-application-launch\.md') -and ($controllerText -match 'app-switcher-validation\.md') -and ($controllerText -match 'url-evidence-validation\.md') -and $organizationBrowserBackReady
    }
})

$urlReady = Test-MultiUserConfiguredValue ([string]$context.Config.url)
$requiredUrlReady = Test-MultiUserConfiguredValue ([string]$context.Config.requiredUrlContains)
$urlPolicyReady = [string]::Equals([string]$context.Config.requiredUrlContains, [string]$context.ExpectedUrlMarker, [System.StringComparison]::OrdinalIgnoreCase)
$freshBrowserIsolationReady = $suiteInstructionText -match 'fresh isolated headed Chrome automation context' -and
    $suiteInstructionText -match 'confirm-multi-user-browser-isolation\.ps1' -and
    (Test-Path -LiteralPath $isolationConfirmationPath)
$playwrightMcpIsolationReady = $playwrightConfigText -match '(?m)^\s*"--browser"\s*,?\s*$' -and
    $playwrightConfigText -match '(?m)^\s*"chrome"\s*,?\s*$' -and
    $playwrightConfigText -match '(?m)^\s*"--isolated"\s*,?\s*$' -and
    $playwrightConfigText -notmatch '(?m)^\s*"--(?:extension|cdp-endpoint|user-data-dir|storage-state|shared-browser-context|save-session)"\s*,?\s*$'
$timelineScriptsReady = @($timelineScriptPaths | Where-Object { -not (Test-Path -LiteralPath $_) }).Count -eq 0
$ffmpegReady = Test-Path -LiteralPath $ffmpegPath
$manageAccess = $context.Config.scenarioData.manageAccess
$manageAccessReady = $false
if ($OrgId -eq '140462') {
    $manageAccessCases = @($manageAccess.cases)
    $expectedManageAccessCases = @(
        [pscustomobject]@{
            CaseId = 'migrated-organization-migrated-user'
            Search = 'EmployeeUser'
            Result = 'EmployeeUser, SSD'
            Identifier = 'ssdemp'
            WorkId = '9343911'
            Application = 'Frontline Administration'
            Detail1 = 'SSD Patty EmployeeUser'
            Detail2 = 'Manualsetup86 SSD'
        },
        [pscustomobject]@{
            CaseId = 'migrated-organization-non-migrated-user'
            Search = 'DontmigrateSSD0EMP'
            Result = 'DontmigrateSSD0EMP, SSD'
            Identifier = 'DontMigemp0'
            WorkId = '9343914'
            Application = 'Absence Management'
            Detail1 = 'SSD DontmigrateSSD0EMP'
            Detail2 = 'Manualsetup86 SSD'
        }
    )
    $validManageAccessCaseCount = 0
    foreach ($expectedCase in $expectedManageAccessCases) {
        $actualCase = @($manageAccessCases | Where-Object { $_.caseId -eq $expectedCase.CaseId })
        if ($actualCase.Count -eq 1 -and
            [string]$actualCase[0].employeeSearchText -eq $expectedCase.Search -and
            [string]$actualCase[0].expectedResultName -eq $expectedCase.Result -and
            [string]$actualCase[0].employeeIdentifier -eq $expectedCase.Identifier -and
            [string]$actualCase[0].workId -eq $expectedCase.WorkId -and
            [string]$actualCase[0].expectedSelectedApplication -eq $expectedCase.Application -and
            @($actualCase[0].expectedOrganizationDetailsContains) -contains $expectedCase.Detail1 -and
            @($actualCase[0].expectedOrganizationDetailsContains) -contains $expectedCase.Detail2) {
            $validManageAccessCaseCount++
        }
    }
    $manageAccessReady = $manageAccess.enabled -eq $true -and
        [string]$manageAccess.organizationId -eq '140462' -and
        [string]$manageAccess.loginUsernameKey -eq 'org_username' -and
        [string]$manageAccess.role -eq 'Organization User' -and
        [string]$manageAccess.requiredUrlContains -eq 'stage-k12.ss' -and
        $manageAccessCases.Count -eq 2 -and
        $validManageAccessCaseCount -eq 2
} else {
    $manageAccessReady = $null -ne $manageAccess -and $manageAccess.enabled -eq $false
}
$logoutBrowserBack = $context.Config.scenarioData.logoutBrowserBack
$logoutBrowserBackScopeReady = @('140462', '140463', '140466') -contains $OrgId -and
    $null -ne $logoutBrowserBack -and
    $logoutBrowserBack.enabled -eq $true -and
    [string]$logoutBrowserBack.loginUsernameKey -eq 'org_username' -and
    [string]$logoutBrowserBack.role -eq 'Organization User' -and
    [string]$logoutBrowserBack.controller -eq 'organization-user-execution.md' -and
    [string]$logoutBrowserBack.workflowSlug -eq 'organization-user-logout-browser-back-after-logout' -and
    [int]$logoutBrowserBack.executionsPerOrganization -eq 1
$results | Format-Table -AutoSize

$notReady = @($results | Where-Object { -not $_.Ready })
[pscustomobject]@{
    OrganizationId = $context.OrgId
    ConfigurationFile = [System.IO.Path]::GetFileName($context.ConfigPath)
    StageUrl = $urlReady
    RequiredUrlSubstring = $requiredUrlReady -and $urlPolicyReady
    FreshBrowserIsolation = $freshBrowserIsolationReady
    PlaywrightMcpIsolatedProfile = $playwrightMcpIsolationReady
    SecretFile = Test-Path -LiteralPath $context.SecretPath
    SelectedControllers = $results.Count
    ReadyControllers = @($results | Where-Object Ready).Count
    NotReadyControllers = $notReady.Count
    MeasuredVideoTimelineScripts = $timelineScriptsReady
    FullBrowserCapture = $timelineScriptsReady -and $ffmpegReady
    ManageAccessScope = $manageAccessReady
    LogoutBrowserBackScope = $logoutBrowserBackScopeReady
    ReportRoot = $context.FullSuiteRoot
} | Format-List

if (-not $urlReady -or -not $requiredUrlReady -or -not $urlPolicyReady -or -not $freshBrowserIsolationReady -or -not $playwrightMcpIsolationReady -or -not $timelineScriptsReady -or -not $ffmpegReady -or -not $manageAccessReady -or -not $logoutBrowserBackScopeReady -or $notReady.Count -gt 0) {
    Write-Error "Multi-user readiness check failed for organization $OrgId. Only presence was checked; no credential values were displayed."
    exit 1
}

Write-Output "READY: organization $OrgId has $($results.Count) selected controller(s) with organization-scoped configuration, local credentials, fresh Chrome isolation, $($context.Environment) application-launch handling, App Switcher instructions, $($context.ExpectedUrlMarker) URL validation, and full-browser capture support."
