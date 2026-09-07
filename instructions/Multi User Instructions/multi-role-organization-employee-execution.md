# Multi-Role Organization User + Employee Execution Controller

## Purpose

Execute the clubbed Organization User and Employee scenario sets for an account that has both roles. Run Organization User scenarios **1–12, 14, and 16–19** first, then switch to Employee and run scenarios **14 and 16**. Scenario 13 is restricted to a different exact standalone login, and Scenario 15 is retired. Shared scenarios 14 and 16 are repeated in both role contexts.

## Mandatory preparation

Read completely before opening the browser:

1. `instructions/project-instructions.md`
2. `instructions/html-reporting-standard.md`
3. `config/aes-stage.ml.<OrgId>.json`
4. `instructions/Multi User Instructions/role-scenario-matrix.md`
5. Every source test mapped to the active Organization User scenarios
6. `tests/navigation/absence-tab.md`
7. `tests/logout/logout-navigation-matrix.md`

Execute directly in headed Chrome through Playwright MCP. Keep the run read-only except for Scenario 14's temporary absence create-and-cleanup lifecycle, and do not generate automation source code.

Also read and execute `instructions/Multi User Instructions/app-switcher-validation.md` after every successful login or role/context selection and again at the Home-page checkpoint. Apply its visibility condition separately to Organization User and Employee: run and report the switching workflow only when an App Switcher is exposed.

Also read and execute `instructions/Multi User Instructions/stage-ml-application-launch.md` after every Passport authentication and before role scenarios. Apply its final-tab discovery and launcher recovery checks in every role context.

Also read and execute `instructions/Multi User Instructions/url-evidence-validation.md` at every workflow's final evidence checkpoint. Use its full-browser screenshot and URL warning rules in every role context.

## Credentials

- Require `OrgId` and confirm this controller is enabled in `config/aes-stage.ml.<OrgId>.json`.
- Username source: `testUsernames.multiRoleOrgEmployee` in the organization-scoped configuration.
- Password source: `multi_role_org_employee_password` in `.secrets/aes-stage.ml.<OrgId>.credentials.json`.
- Never place the password or session secrets in this file, a report, screenshot, video, log, or response.

## Role-block execution order

### Preparation — discover contexts

1. Authenticate and confirm the account lands on a responsive authorized page.
2. Open the account/role switcher and capture the complete visible role list.
3. Verify distinct Organization User and Employee entries are present and selectable. A missing entry marks only that role block **BLOCKED**.

### Role block 1 — Organization User

1. Select Organization User and verify React Home, the active role label, global navigation, and account control.
2. Execute scenarios **1–12 and 14** from `role-scenario-matrix.md` in numerical and dependency-safe order. Omit Scenario 13 for this combination login and do not execute retired Scenario 15.
3. Execute Organization User logout scenarios **16, 17, 18, and 19** independently. Start each one with a fresh login to this same account and reselect Organization User.
4. Record an independent result, screenshot set, and video range for each of the 17 Organization User scenarios.

### Role block 2 — Employee

1. After the final Organization User logout, authenticate again with this same account and select Employee.
2. Verify Employee Home, the active role label, permitted navigation, and account control.
3. Execute Employee scenario **14**. Prefer an existing absence read-only; if none is available, create one temporary self-service absence for this configured test identity, validate it, delete/cancel it, and verify it is absent as documented in `tests/navigation/absence-tab.md`.
4. Execute Employee scenario **16** from a fresh login to this same account with Employee reselected.
5. Record separate Employee results for scenarios 14 and 16 even though those IDs were already executed as Organization User.

### Completion

1. Confirm the final logout reaches the approved login page.
2. Do not click browser Back or test direct protected access after the final logout.
3. Do not require a final return to Organization User after the Employee block; the required role order is Organization User followed by Employee.

Do not create, edit, approve, reconcile, assign, import, invite, or delete business data except for Scenario 14's exact temporary absence create-and-cleanup lifecycle.

## Reporting

Follow `instructions/html-reporting-standard.md`. Create the role report under `reports/full-suite/<OrgId>/<YYYYMMDD-HHMMSS>/roles/multi-role-organization-employee/` with role-grouped outcomes for all 17 Organization User scenarios and both Employee scenarios, screenshots of each role context, one continuous video, expected/actual results, and reproduction steps for failures. Do not collapse duplicate scenario IDs across roles and do not expose credentials or sensitive identity data.

## Invocation

`For OrgId <OrgId>, execute instructions/Multi User Instructions/multi-role-organization-employee-execution.md in unattended safe mode using only the matching organization-scoped configuration and credentials.`
