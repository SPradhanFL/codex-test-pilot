# Multi-Organization Employee + Substitute Execution Controller

## Purpose

Execute the clubbed Employee and Substitute scenario sets across multiple organizations. Run Employee scenarios **14 and 16** in every Employee organization context, then run Substitute scenarios **14 and 16** in every Substitute organization context.

## Mandatory preparation

Read completely before opening the browser:

1. `instructions/project-instructions.md`
2. `instructions/html-reporting-standard.md`
3. `config/aes-stage.ml.json`
4. `instructions/Multi User Instructions/role-scenario-matrix.md`
5. `tests/navigation/absence-tab.md`
6. `tests/logout/logout-navigation-matrix.md`

Execute directly in headed Chrome through Playwright MCP. Keep the run read-only and do not generate automation source code.

Also read and execute `instructions/Multi User Instructions/app-switcher-validation.md` after every successful login or role/context selection and again at the Home-page checkpoint. Apply its visibility condition separately to every Employee and Substitute organization context: run and report the switching workflow only when an App Switcher is exposed.

## Credentials

- Expected username: `vtqamail+stageMOSSD0@dev.frontlineed.com`
- Username source: `testUsernames.multiOrgEmployeeSubstitute` in `config/aes-stage.ml.json`
- Password source: `AES_STAGE_MULTI_ORG_EMPLOYEE_SUBSTITUTE_PASSWORD`, otherwise `multi_org_employee_substitute_password` in `.secrets/aes-stage.ml.credentials.json`
- Never place the password or session secrets in this file, a report, screenshot, video, log, or response.

## Context-block execution order

1. Authenticate and verify the initial organization and role context is visible and responsive.
2. Open the organization/role switcher and capture all visible context entries.
3. Verify at least one Employee context and one Substitute context exist under distinguishable organization labels.
4. Execute every Employee organization context first. In each context:
   1. Select the context and verify Employee Home, active organization/role labels, permitted navigation, and account control.
   2. Execute Employee scenario **14** read-only.
   3. Execute Employee scenario **16** from a fresh login with that exact Employee organization context reselected.
5. After all Employee contexts, execute every Substitute organization context. In each context:
   1. Re-authenticate with the same account, select the context, and verify Substitute Home and the correct active organization/role labels.
   2. Execute Substitute scenario **14** read-only without accepting or changing work.
   3. Execute Substitute scenario **16** from a fresh login with that exact Substitute organization context reselected.
6. A missing item blocks only scenario 14 in that context. Continue to its logout scenario and the remaining contexts.
7. Report scenarios 14 and 16 separately for every context; do not merge outcomes with another role or organization.

Do not create, accept, reject, cancel, edit, assign, save, or delete business data.

## Reporting

Follow `instructions/html-reporting-standard.md`. Create the run under `reports/role-executions/multi-org-employee-substitute/<YYYYMMDD-HHMMSS>/`. Group results by organization and role, with separate scenario 14 and 16 outcomes for every context. Report organization labels only to the extent needed to prove context separation; omit personal and secret data. Include screenshots, one continuous video, expected/actual results, and failure reproduction steps.

## Invocation

`Execute instructions/Multi User Instructions/multi-org-employee-substitute-execution.md in unattended safe mode.`
