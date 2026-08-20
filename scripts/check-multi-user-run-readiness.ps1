param(
    [string[]]$Controller = @(),
    [string[]]$ExcludeController = @()
)

$ErrorActionPreference = 'Stop'

$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$controllerRoot = Join-Path $workspaceRoot 'instructions\Multi User Instructions'
$configPath = Join-Path $workspaceRoot 'config\aes-stage.ml.json'
$secretPath = Join-Path $workspaceRoot '.secrets\aes-stage.ml.credentials.json'

if (-not (Test-Path -LiteralPath $configPath)) {
    throw "Missing ML configuration: $configPath"
}

$config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
$secrets = if (Test-Path -LiteralPath $secretPath) {
    Get-Content -LiteralPath $secretPath -Raw | ConvertFrom-Json
} else {
    $null
}

$catalog = @(
    [pscustomobject]@{ File = 'organization-user-execution.md'; UsernameKey = 'org_username'; UsernameEnvironment = 'AES_STAGE_ORGANIZATION_USERNAME'; PasswordKey = 'org_password'; PasswordEnvironment = 'AES_STAGE_ORGANIZATION_PASSWORD' }
    [pscustomobject]@{ File = 'campus-user-execution.md'; UsernameKey = 'campusUser'; UsernameEnvironment = 'AES_STAGE_CAMPUS_USERNAME'; PasswordKey = 'campus_password'; PasswordEnvironment = 'AES_STAGE_CAMPUS_PASSWORD' }
    [pscustomobject]@{ File = 'employee-user-execution.md'; UsernameKey = 'employee'; UsernameEnvironment = 'AES_STAGE_EMPLOYEE_USERNAME'; PasswordKey = 'employee_password'; PasswordEnvironment = 'AES_STAGE_EMPLOYEE_PASSWORD' }
    [pscustomobject]@{ File = 'substitute-user-execution.md'; UsernameKey = 'substitute'; UsernameEnvironment = 'AES_STAGE_SUBSTITUTE_USERNAME'; PasswordKey = 'substitute_password'; PasswordEnvironment = 'AES_STAGE_SUBSTITUTE_PASSWORD' }
    [pscustomobject]@{ File = 'multi-role-campus-employee-organization-execution.md'; UsernameKey = 'userRoleSwitcher'; UsernameEnvironment = 'AES_STAGE_ROLE_SWITCHER_ORG_USERNAME'; PasswordKey = 'roleswitcher_org_password'; PasswordEnvironment = 'AES_STAGE_ROLE_SWITCHER_ORG_PASSWORD' }
    [pscustomobject]@{ File = 'multi-role-organization-employee-execution.md'; UsernameKey = 'multiRoleOrgEmployee'; UsernameEnvironment = 'AES_STAGE_MULTI_ROLE_ORG_EMPLOYEE_USERNAME'; PasswordKey = 'multi_role_org_employee_password'; PasswordEnvironment = 'AES_STAGE_MULTI_ROLE_ORG_EMPLOYEE_PASSWORD' }
    [pscustomobject]@{ File = 'multi-role-employee-employee-substitute-execution.md'; UsernameKey = 'multiRoleEmployeeEmployeeSubstitute'; UsernameEnvironment = 'AES_STAGE_MULTI_ROLE_EMPLOYEE_EMPLOYEE_SUBSTITUTE_USERNAME'; PasswordKey = 'multi_role_employee_employee_substitute_password'; PasswordEnvironment = 'AES_STAGE_MULTI_ROLE_EMPLOYEE_EMPLOYEE_SUBSTITUTE_PASSWORD' }
    [pscustomobject]@{ File = 'multi-org-employee-substitute-execution.md'; UsernameKey = 'multiOrgEmployeeSubstitute'; UsernameEnvironment = 'AES_STAGE_MULTI_ORG_EMPLOYEE_SUBSTITUTE_USERNAME'; PasswordKey = 'multi_org_employee_substitute_password'; PasswordEnvironment = 'AES_STAGE_MULTI_ORG_EMPLOYEE_SUBSTITUTE_PASSWORD' }
    [pscustomobject]@{ File = 'multi-org-employee-employee-execution.md'; UsernameKey = 'multiOrgEmployeeEmployee'; UsernameEnvironment = 'AES_STAGE_MULTI_ORG_EMPLOYEE_EMPLOYEE_USERNAME'; PasswordKey = 'multi_org_employee_employee_password'; PasswordEnvironment = 'AES_STAGE_MULTI_ORG_EMPLOYEE_EMPLOYEE_PASSWORD' }
    [pscustomobject]@{ File = 'multi-org-organization-campus-execution.md'; UsernameKey = 'multiOrgOrgCampus'; UsernameEnvironment = 'AES_STAGE_MULTI_ORG_ORG_CAMPUS_USERNAME'; PasswordKey = 'multi_org_org_campus_password'; PasswordEnvironment = 'AES_STAGE_MULTI_ORG_ORG_CAMPUS_PASSWORD' }
)

$knownControllers = @($catalog.File)
$unknownRequested = @($Controller + $ExcludeController | Where-Object { $_ -notin $knownControllers } | Sort-Object -Unique)
if ($unknownRequested.Count -gt 0) {
    throw "Unknown controller(s): $($unknownRequested -join ', ')"
}

$selected = if ($Controller.Count -gt 0) {
    @($catalog | Where-Object { $_.File -in $Controller })
} else {
    @($catalog)
}
$selected = @($selected | Where-Object { $_.File -notin $ExcludeController })
if ($selected.Count -eq 0) {
    throw 'No execution controller remains selected.'
}

$isConfigured = {
    param([string]$Value)
    -not [string]::IsNullOrWhiteSpace($Value) -and $Value -notmatch '(?i)placeholder|replace_with|example'
}

$results = foreach ($item in $selected) {
    $controllerPath = Join-Path $controllerRoot $item.File
    $usernameFromEnvironment = [Environment]::GetEnvironmentVariable($item.UsernameEnvironment)
    $usernameFromConfig = [string]$config.testUsernames.($item.UsernameKey)
    $passwordFromEnvironment = [Environment]::GetEnvironmentVariable($item.PasswordEnvironment)
    $passwordFromSecret = if ($null -ne $secrets) { [string]$secrets.($item.PasswordKey) } else { '' }
    $controllerText = if (Test-Path -LiteralPath $controllerPath) { Get-Content -LiteralPath $controllerPath -Raw } else { '' }

    $usernameReady = (& $isConfigured $usernameFromEnvironment) -or (& $isConfigured $usernameFromConfig)
    $passwordReady = (& $isConfigured $passwordFromEnvironment) -or (& $isConfigured $passwordFromSecret)

    [pscustomobject]@{
        Controller = $item.File
        ControllerFile = Test-Path -LiteralPath $controllerPath
        Username = $usernameReady
        Password = $passwordReady
        AppSwitcher = $controllerText -match 'app-switcher-validation\.md'
        Ready = (Test-Path -LiteralPath $controllerPath) -and $usernameReady -and $passwordReady -and ($controllerText -match 'app-switcher-validation\.md')
    }
}

$urlReady = & $isConfigured ([string]$config.url)
$results | Format-Table -AutoSize

$notReady = @($results | Where-Object { -not $_.Ready })
[pscustomobject]@{
    StageUrl = $urlReady
    SecretFile = Test-Path -LiteralPath $secretPath
    SelectedControllers = $results.Count
    ReadyControllers = @($results | Where-Object Ready).Count
    NotReadyControllers = $notReady.Count
} | Format-List

if (-not $urlReady -or $notReady.Count -gt 0) {
    Write-Error 'Multi-user readiness check failed. Only presence was checked; no credential values were displayed.'
    exit 1
}

Write-Output 'READY: selected multi-user controllers have configuration, local credentials, and App Switcher instructions.'
