# Multi-Role Employee + Employee + Substitute Execution Controller

## Purpose

Execute the clubbed scenario sets for two distinct Employee contexts and one Substitute context. Run Employee scenarios **14 and 16** separately in the first Employee context, repeat **14 and 16** in the second Employee context, then switch to Substitute and run **14 and 16** again.

## Mandatory preparation

Read completely before opening the browser:

1. `instructions/project-instructions.md`
2. `instructions/html-reporting-standard.md`
3. `config/aes-stage.ml.<OrgId>.json`
4. `instructions/Multi User Instructions/role-scenario-matrix.md`
5. `tests/navigation/absence-tab.md`
6. `tests/logout/logout-navigation-matrix.md`

Execute directly in headed Chrome through Playwright MCP. Keep the run read-only except for Scenario 14's temporary absence create-and-cleanup lifecycle, and do not generate automation source code.

Also read and execute `instructions/Multi User Instructions/app-switcher-validation.md` after every successful login or role/context selection and again at the Home-page checkpoint. Apply its visibility condition separately to both Employee contexts and the Substitute context: run and report the switching workflow only when an App Switcher is exposed.

Also read and execute `instructions/Multi User Instructions/stage-ml-application-launch.md` after every Passport authentication and before role scenarios. Apply its final-tab discovery and launcher recovery checks in every role context.

Also read and execute `instructions/Multi User Instructions/url-evidence-validation.md` at every workflow's final evidence checkpoint. Use its full-browser screenshot and URL warning rules in every role context.

## Credentials

- Require `OrgId` and confirm this controller is enabled in `config/aes-stage.ml.<OrgId>.json`.
- Username source: `testUsernames.multiRoleEmployeeEmployeeSubstitute` in the organization-scoped configuration.
- Password source: `multi_role_employee_employee_substitute_password` in `.secrets/aes-stage.ml.<OrgId>.credentials.json`.
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
3. Execute Substitute scenario **14** using the Substitute-specific four-view validation: Available Jobs, Scheduled Jobs/Schedule, Past Jobs/History Jobs, and Non Work Days. Do not require an individual job-detail page and do not accept, reject, cancel, create, assign, or change work.
4. Execute Substitute scenario **16** from a fresh session with Substitute reselected.

For each Employee context, prefer an existing viewable absence and use Scenario 14's temporary absence fallback only when safe creation, unique reopening, and cleanup are supported. For the Substitute context, never run the fallback and never require an individual job; validate the four required schedule/history views, accepting valid empty states. Mark only the affected scenario **BLOCKED** when its role-specific prerequisite is unavailable, then continue to scenario 16. Record all six scenario outcomes separately; do not deduplicate scenario IDs across contexts.

Do not accept, reject, cancel, create, edit, assign, save, or delete an absence, job, employee, or substitute record except for an Employee-context Scenario 14 exact temporary absence create-and-cleanup lifecycle. Never create, accept, or assign Substitute work merely to create evidence.

## Reporting

Follow `instructions/html-reporting-standard.md`. Create the role report under `reports/full-suite/<OrgId>/<YYYYMMDD-HHMMSS>/roles/multi-role-employee-employee-substitute/`. Group results by first Employee, second Employee, and Substitute; include separate outcomes for scenarios 14 and 16 in each context, evidence for all contexts, one continuous video, expected/actual results, and failure reproduction steps without personal data.

## Invocation

`For OrgId <OrgId>, execute instructions/Multi User Instructions/multi-role-employee-employee-substitute-execution.md in unattended safe mode using only the matching organization-scoped configuration and credentials.`
