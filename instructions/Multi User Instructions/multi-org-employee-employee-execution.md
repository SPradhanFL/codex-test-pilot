# Multi-Organization Employee + Employee Execution Controller

## Purpose

Execute Employee scenarios **14 and 16** separately in every Employee organization context exposed by this account. Confirm each context is distinct, selectable, responsive, and isolated from the other organization contexts.

## Mandatory preparation

Read completely before opening the browser:

1. `instructions/project-instructions.md`
2. `instructions/html-reporting-standard.md`
3. `config/aes-stage.ml.json`
4. `instructions/Multi User Instructions/role-scenario-matrix.md`
5. `tests/navigation/absence-tab.md`
6. `tests/logout/logout-navigation-matrix.md`

Execute directly in headed Chrome through Playwright MCP. Keep the run read-only and do not generate automation source code.

Also read and execute `instructions/Multi User Instructions/app-switcher-validation.md` after every successful login or role/context selection and again at the Home-page checkpoint. Apply its visibility condition separately to every Employee organization context: run and report the switching workflow only when an App Switcher is exposed.

## Credentials

- Expected username: `vtqamail+stageSSDMultiOrgEMPEMP@dev.frontlineed.com`
- Username source: `testUsernames.multiOrgEmployeeEmployee` in `config/aes-stage.ml.json`
- Password source: `AES_STAGE_MULTI_ORG_EMPLOYEE_EMPLOYEE_PASSWORD`, otherwise `multi_org_employee_employee_password` in `.secrets/aes-stage.ml.credentials.json`
- Never place the password or session secrets in this file, a report, screenshot, video, log, or response.

## Context-block execution order

1. Authenticate and verify the initial Employee organization context is visible and responsive.
2. Open the organization/role switcher and capture every Employee context and its visible organization label.
3. Verify at least two distinguishable Employee organization contexts are present and selectable.
4. For each Employee organization context, in visible order:
   1. Select the context and verify Employee Home, active organization label, permitted navigation, and account control.
   2. Confirm the organization label or destination distinguishes it from the previously executed context and no stale cross-organization content appears.
   3. Execute Employee scenario **14** read-only.
   4. Execute Employee scenario **16** from a fresh login with that exact organization context reselected.
5. A missing absence blocks only scenario 14 in that context; continue to scenario 16 and remaining contexts.
6. Report scenarios 14 and 16 separately for every organization context; do not combine duplicate scenario IDs.

Do not create, edit, submit, accept, reject, cancel, or delete business data.

## Reporting

Follow `instructions/html-reporting-standard.md`. Create the run under `reports/role-executions/multi-org-employee-employee/<YYYYMMDD-HHMMSS>/`. Group results by Employee organization context and include separate scenario 14 and 16 outcomes for each, evidence that every context is distinct, screenshots, one continuous video, expected/actual results, and failure reproduction steps without personal or secret data.

## Invocation

`Execute instructions/Multi User Instructions/multi-org-employee-employee-execution.md in unattended safe mode.`
