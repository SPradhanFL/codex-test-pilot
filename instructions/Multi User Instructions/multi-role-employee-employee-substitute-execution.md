# Multi-Role Employee + Employee + Substitute Execution Controller

## Purpose

Execute the clubbed scenario sets for two distinct Employee contexts and one Substitute context. Run Employee scenarios **14 and 16** separately in the first Employee context, repeat **14 and 16** in the second Employee context, then switch to Substitute and run **14 and 16** again.

## Mandatory preparation

Read completely before opening the browser:

1. `instructions/project-instructions.md`
2. `instructions/html-reporting-standard.md`
3. `config/aes-stage.ml.json`
4. `instructions/Multi User Instructions/role-scenario-matrix.md`
5. `tests/navigation/absence-tab.md`
6. `tests/logout/logout-navigation-matrix.md`

Execute directly in headed Chrome through Playwright MCP. Keep the run read-only and do not generate automation source code.

Also read and execute `instructions/Multi User Instructions/app-switcher-validation.md` after every successful login or role/context selection and again at the Home-page checkpoint. Apply its visibility condition separately to both Employee contexts and the Substitute context: run and report the switching workflow only when an App Switcher is exposed.

## Credentials

- Expected username: `vtqamail+stageSSDManualSetup86MRemp@dev.frontlineed.com`
- Username source: `testUsernames.multiRoleEmployeeEmployeeSubstitute` in `config/aes-stage.ml.json`
- Password source: `AES_STAGE_MULTI_ROLE_EMPLOYEE_EMPLOYEE_SUBSTITUTE_PASSWORD`, otherwise `multi_role_employee_employee_substitute_password` in `.secrets/aes-stage.ml.credentials.json`
- Never place the password or session secrets in this file, a report, screenshot, video, log, or response.

## Context-block execution order

### Preparation — discover contexts

1. Authenticate and verify the initial authorized landing page is responsive.
2. Open the account/role switcher and capture every role entry with its visible organization or context label.
3. Verify two distinguishable Employee entries and one Substitute entry are available. Two Employee entries pass only when their labels, organization/context labels, or destinations distinguish them.

### Context block 1 — first Employee

1. Select the first Employee context and verify Employee Home, its active context, permitted navigation, and account control.
2. Execute Employee scenario **14** read-only.
3. Execute Employee scenario **16** from a fresh session with the first Employee context reselected.

### Context block 2 — second Employee

1. Re-authenticate with the same account and select the second Employee context.
2. Confirm it is distinguishable from the first and does not show stale content from the first context.
3. Execute Employee scenario **14** read-only.
4. Execute Employee scenario **16** from a fresh session with the second Employee context reselected.

### Context block 3 — Substitute

1. Re-authenticate with the same account and select Substitute.
2. Verify Substitute Home, the active context, permitted navigation, and account control. A Substitute label on Employee Home does not satisfy this check.
3. Execute Substitute scenario **14** read-only without accepting, rejecting, canceling, or changing work.
4. Execute Substitute scenario **16** from a fresh session with Substitute reselected.

For every context, if no existing viewable absence, assignment, or job is available, mark only scenario 14 **BLOCKED** and continue to scenario 16. Record all six scenario outcomes separately; do not deduplicate scenario IDs across contexts.

Do not accept, reject, cancel, create, edit, assign, save, or delete an absence, job, employee, or substitute record.

## Reporting

Follow `instructions/html-reporting-standard.md`. Create the run under `reports/role-executions/multi-role-employee-employee-substitute/<YYYYMMDD-HHMMSS>/`. Group results by first Employee, second Employee, and Substitute; include separate outcomes for scenarios 14 and 16 in each context, evidence for all contexts, one continuous video, expected/actual results, and failure reproduction steps without personal data.

## Invocation

`Execute instructions/Multi User Instructions/multi-role-employee-employee-substitute-execution.md in unattended safe mode.`
