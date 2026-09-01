# Multi-Role Organization User + Employee Execution Controller

## Purpose

Execute the clubbed Organization User and Employee scenario sets for an account that has both roles. Run Organization User scenarios **1–19, 29, and 33–36** first, then switch to Employee and run scenarios **14, 16, 31, and 38**. Shared scenarios 14 and 16 are repeated in both role contexts.

## Mandatory preparation

Read completely before opening the browser:

1. `instructions/project-instructions.md`
2. `instructions/html-reporting-standard.md`
3. `config/aes-stage.ml.<OrgId>.json`
4. `instructions/Multi User Instructions/role-scenario-matrix.md`
5. Every source test mapped to Organization User scenarios 1–19, 29, and 33–36
6. `tests/navigation/absence-tab.md`
7. `tests/logout/logout-navigation-matrix.md`
8. `instructions/time-and-attendance-details.md`
9. `tests/time-and-attendance/app-switcher-navigation-matrix.md`
10. `tests/time-and-attendance/organization-user-navigation.md`
11. `tests/time-and-attendance/logout-navigation-matrix.md`
12. `tests/time-and-attendance/multi-role-multi-org-context-matrix.md`

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
2. Execute non-logout scenarios **1–15, 29, and 33–35** from `role-scenario-matrix.md` in numerical and dependency-safe order.
3. Execute Organization User logout scenarios **16, 17, 18, 19, and 36** independently. Start each one with a fresh login to this same account and reselect Organization User.
4. Record an independent result, screenshot set, and video range for each of the 24 Organization User scenarios.

### Role block 2 — Employee

1. After the final Organization User logout, authenticate again with this same account and select Employee.
2. Verify Employee Home, the active role label, permitted navigation, and account control.
3. Execute Employee scenario **14** read-only. If no existing absence is available, mark it **BLOCKED** and do not create data.
4. Execute Employee scenario **31** from the same verified Employee context.
5. Execute Employee logout scenarios **16 and 38** independently from fresh logins to this same account with Employee reselected.
6. Record separate Employee results for scenarios 14, 16, 31, and 38.

### Completion

1. Confirm the final logout reaches the approved login page.
2. Confirm browser Back and direct access do not restore the Employee authenticated session.
3. Do not require a final return to Organization User after the Employee block; the required role order is Organization User followed by Employee.

Do not create, edit, approve, reconcile, assign, import, invite, or delete business data except for Scenario 14's exact temporary absence create-and-cleanup lifecycle.

## Reporting

Before reporting, execute controller-level scenarios **40, 41, 42, and 46** once for this combination account. Use Organization User -> Employee as the required context sequence, switch back to Organization User to prove consistency, preserve the newly selected role through the TA -> AM -> TA round-trip, and execute scenario 46 last. Do not duplicate these four results in either role block.

Follow `instructions/html-reporting-standard.md`. Create the role report under `reports/full-suite/<OrgId>/<YYYYMMDD-HHMMSS>/roles/multi-role-organization-employee/` with role-grouped outcomes for all 24 Organization User scenarios, all four Employee scenarios, and four controller-level context scenarios, screenshots of each role context, one continuous video, expected/actual results, and reproduction steps for failures. Do not collapse duplicate scenario IDs across roles and do not expose passwords, session secrets, or sensitive identity data. The configured Stage test username is the sole narrow exception and is required only in the labeled HTML `Test username` fields for Time & Attendance.

## Invocation

`For OrgId <OrgId>, execute instructions/Multi User Instructions/multi-role-organization-employee-execution.md in unattended safe mode using only the matching organization-scoped configuration and credentials.`
