$script:MultiUserControllerCatalog = @(
    [pscustomobject]@{ File = 'organization-user-execution.md'; FriendlyName = 'Organization User'; UsernameKey = 'org_username'; PasswordKey = 'org_password' }
    [pscustomobject]@{ File = 'campus-user-execution.md'; FriendlyName = 'Campus User'; UsernameKey = 'campusUser'; PasswordKey = 'campus_password' }
    [pscustomobject]@{ File = 'employee-user-execution.md'; FriendlyName = 'Employee'; UsernameKey = 'employee'; PasswordKey = 'employee_password' }
    [pscustomobject]@{ File = 'substitute-user-execution.md'; FriendlyName = 'Substitute'; UsernameKey = 'substitute'; PasswordKey = 'substitute_password' }
    [pscustomobject]@{ File = 'multi-role-campus-employee-organization-execution.md'; FriendlyName = 'Multi-role Campus User + Employee + Organization User'; UsernameKey = 'userRoleSwitcher'; PasswordKey = 'roleswitcher_org_password' }
    [pscustomobject]@{ File = 'multi-role-organization-employee-execution.md'; FriendlyName = 'Multi-role Organization User + Employee'; UsernameKey = 'multiRoleOrgEmployee'; PasswordKey = 'multi_role_org_employee_password' }
    [pscustomobject]@{ File = 'multi-role-employee-employee-substitute-execution.md'; FriendlyName = 'Multi-role Employee + Employee + Substitute'; UsernameKey = 'multiRoleEmployeeEmployeeSubstitute'; PasswordKey = 'multi_role_employee_employee_substitute_password' }
    [pscustomobject]@{ File = 'multi-org-employee-substitute-execution.md'; FriendlyName = 'Multi-org Employee + Substitute'; UsernameKey = 'multiOrgEmployeeSubstitute'; PasswordKey = 'multi_org_employee_substitute_password' }
    [pscustomobject]@{ File = 'multi-org-employee-employee-execution.md'; FriendlyName = 'Multi-org Employee + Employee'; UsernameKey = 'multiOrgEmployeeEmployee'; PasswordKey = 'multi_org_employee_employee_password' }
    [pscustomobject]@{ File = 'multi-org-organization-campus-execution.md'; FriendlyName = 'Multi-org Organization User + Campus User'; UsernameKey = 'multiOrgOrgCampus'; PasswordKey = 'multi_org_org_campus_password' }
)

function Test-MultiUserConfiguredValue {
    param([AllowNull()][string]$Value)

    return -not [string]::IsNullOrWhiteSpace($Value) -and $Value -notmatch '(?i)placeholder|replace_with|example'
}

function Resolve-MultiUserOrganizationContext {
    param(
        [Parameter(Mandatory = $true)]
        [string]$WorkspaceRoot,

        [Parameter(Mandatory = $true)]
        [string]$OrgId
    )

    if ($OrgId -notmatch '^\d+$') {
        throw 'OrgId must contain digits only.'
    }

    $resolvedWorkspace = [System.IO.Path]::GetFullPath($WorkspaceRoot)
    $configPath = [System.IO.Path]::GetFullPath((Join-Path $resolvedWorkspace "config\aes-stage.ml.$OrgId.json"))
    $secretPath = [System.IO.Path]::GetFullPath((Join-Path $resolvedWorkspace ".secrets\aes-stage.ml.$OrgId.credentials.json"))
    $fullSuiteRoot = [System.IO.Path]::GetFullPath((Join-Path $resolvedWorkspace "reports\full-suite\$OrgId"))
    $allOrganizationsRoot = [System.IO.Path]::GetFullPath((Join-Path $resolvedWorkspace 'reports\full-suite'))

    if (-not $configPath.StartsWith($resolvedWorkspace, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw 'The organization configuration path resolved outside the workspace.'
    }
    if (-not $secretPath.StartsWith($resolvedWorkspace, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw 'The organization credentials path resolved outside the workspace.'
    }
    if (-not $fullSuiteRoot.StartsWith($allOrganizationsRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw 'The organization report root resolved outside reports/full-suite.'
    }
    if (-not (Test-Path -LiteralPath $configPath)) {
        throw "Missing Stage ML organization configuration: $configPath"
    }

    $config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
    if ([string]$config.organizationId -ne $OrgId) {
        throw "Configuration organizationId '$($config.organizationId)' does not match requested OrgId '$OrgId'."
    }
    if (-not (Test-MultiUserConfiguredValue ([string]$config.url))) {
        throw "Configuration $configPath must define a Stage URL."
    }
    if (-not (Test-MultiUserConfiguredValue ([string]$config.requiredUrlContains))) {
        throw "Configuration $configPath must define requiredUrlContains for workflow evidence validation."
    }
    if (-not [string]::Equals([string]$config.requiredUrlContains, 'stage-k12.ss', [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Configuration $configPath must use stage-k12.ss as requiredUrlContains."
    }

    $knownControllers = @($script:MultiUserControllerCatalog.File)
    $enabledControllers = @($config.enabledControllers)
    if ($enabledControllers.Count -eq 0) {
        throw "Configuration $configPath must define at least one enabled controller."
    }
    $unknownEnabled = @($enabledControllers | Where-Object { $_ -notin $knownControllers } | Sort-Object -Unique)
    if ($unknownEnabled.Count -gt 0) {
        throw "Configuration contains unknown enabled controller(s): $($unknownEnabled -join ', ')"
    }
    if (@($enabledControllers | Sort-Object -Unique).Count -ne $enabledControllers.Count) {
        throw 'Configuration enabledControllers contains duplicate entries.'
    }

    return [pscustomobject]@{
        OrgId = $OrgId
        WorkspaceRoot = $resolvedWorkspace
        ConfigPath = $configPath
        SecretPath = $secretPath
        FullSuiteRoot = $fullSuiteRoot
        Config = $config
        EnabledControllers = $enabledControllers
        ControllerCatalog = $script:MultiUserControllerCatalog
    }
}

function Select-MultiUserControllers {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$Context,

        [string[]]$Controller = @(),
        [string[]]$ExcludeController = @()
    )

    $knownControllers = @($Context.ControllerCatalog.File)
    $unknownRequested = @($Controller + $ExcludeController | Where-Object { $_ -notin $knownControllers } | Sort-Object -Unique)
    if ($unknownRequested.Count -gt 0) {
        throw "Unknown controller(s): $($unknownRequested -join ', ')"
    }

    if ($Controller.Count -gt 0) {
        $disabledRequested = @($Controller | Where-Object { $_ -notin $Context.EnabledControllers } | Sort-Object -Unique)
        if ($disabledRequested.Count -gt 0) {
            throw "Controller(s) not enabled for organization $($Context.OrgId): $($disabledRequested -join ', ')"
        }
        $requested = @($Controller)
    } else {
        $requested = @($Context.EnabledControllers)
    }

    $selectedNames = @($requested | Where-Object { $_ -notin $ExcludeController })
    $selected = @($Context.ControllerCatalog | Where-Object { $_.File -in $selectedNames })
    if ($selected.Count -eq 0) {
        throw 'No enabled execution controller remains selected.'
    }

    return $selected
}
