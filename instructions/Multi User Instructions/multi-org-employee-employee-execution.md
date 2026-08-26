# Multi-Organization Employee + Employee Execution Controller

## Purpose

Execute Employee scenarios **14, 16, 31, and 38** separately in every Employee organization context exposed by this account. Confirm each context is distinct, selectable, responsive, and isolated from the other organization contexts.

## Mandatory preparation

Read completely before opening the browser:

1. `instructions/project-instructions.md`
2. `instructions/html-reporting-standard.md`
3. `config/aes-stage.ml.<OrgId>.json`
4. `instructions/Multi User Instructions/role-scenario-matrix.md`
5. `tests/navigation/absence-tab.md`
6. `tests/logout/logout-navigation-matrix.md`
7. `instructions/time-and-attendance-details.md`
8. `tests/time-and-attendance/app-switcher-navigation-matrix.md`
9. `tests/time-and-attendance/logout-navigation-matrix.md`

Execute directly in headed Chrome through Playwright MCP. Keep the run read-only except for Scenario 14's temporary absence create-and-cleanup lifecycle, and do not generate automation source code.

Also read and execute `instructions/Multi User Instructions/app-switcher-validation.md` after every successful login or role/context selection and again at the Home-page checkpoint. Apply its visibility condition separately to every Employee organization context: run and report the switching workflow only when an App Switcher is exposed.

Also read and execute `instructions/Multi User Instructions/stage-ml-application-launch.md` after every Passport authentication and before role scenarios. Apply its final-tab discovery and launcher recovery checks in every organization context.

Also read and execute `instructions/Multi User Instructions/url-evidence-validation.md` at every workflow's final evidence checkpoint. Use its full-browser screenshot and URL warning rules in every organization context.

## Credentials

- Require `OrgId` and confirm this controller is enabled in `config/aes-stage.ml.<OrgId>.json`.
- Username source: `testUsernames.multiOrgEmployeeEmployee` in the organization-scoped configuration.
- Password source: `multi_org_employee_employee_password` in `.secrets/aes-stage.ml.<OrgId>.credentials.json`.
- Never place the password or session secrets in this file, a report, screenshot, video, log, or response.

## Context-block execution order

1. Authenticate and verify the initial Employee organization context is visible and responsive.
2. Open the organization/role switcher and capture every Employee context and its visible organization label.
3. Verify at least two distinguishable Employee organization contexts are present and selectable.
4. For each Employee organization context, in visible order:
   1. Select the context and verify Employee Home, active organization label, permitted navigation, and account control.
   2. Confirm the organization label or destination distinguishes it from the previously executed context and no stale cross-organization content appears.
   3. Execute Employee scenarios **14 and 31** read-only.
   4. Execute logout scenarios **16 and 38** independently from fresh logins with that exact organization context reselected.
5. A missing absence blocks only scenario 14 in that context; continue with independent scenarios and remaining contexts.
6. Report scenarios 14, 16, 31, and 38 separately for every organization context; do not combine duplicate scenario IDs.

Do not create, edit, submit, accept, reject, cancel, or delete business data except for Scenario 14's exact temporary absence create-and-cleanup lifecycle.

## Reporting

Follow `instructions/html-reporting-standard.md`. Create the role report under `reports/full-suite/<OrgId>/<YYYYMMDD-HHMMSS>/roles/multi-org-employee-employee/`. Group results by Employee organization context and include scenarios 14, 16, 31, and 38 for each, evidence that every context is distinct, screenshots, one continuous video, expected/actual results, and failure reproduction steps without personal or secret data.

## Invocation

`For OrgId <OrgId>, execute instructions/Multi User Instructions/multi-org-employee-employee-execution.md in unattended safe mode using only the matching organization-scoped configuration and credentials.`
