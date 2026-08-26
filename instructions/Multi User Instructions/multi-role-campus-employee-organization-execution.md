# Multi-Role Campus User + Employee + Organization User Execution Controller

## Purpose

Execute the clubbed role-specific scenario sets for the account that exposes Campus User, Employee, and Organization User. Follow the requested role order: Campus User first, Employee second, and Organization User third.

The required outcomes are:

- Campus User: scenarios **3, 7, 14, 16, 17, 20, 21, 30, and 37**
- Employee: scenarios **14, 16, 31, and 38**
- Organization User: scenarios **1–19, 29, and 33–36**

Shared scenario IDs are repeated in every applicable role and must not be deduplicated.

## Mandatory preparation

Read completely before opening the browser:

1. `instructions/project-instructions.md`
2. `instructions/html-reporting-standard.md`
3. `instructions/Multi User Instructions/role-scenario-matrix.md`
4. `config/aes-stage.ml.<OrgId>.json`
5. Every source Markdown test mapped to Organization User scenarios 1–19, 29, and 33–36
6. `tests/navigation/cross-application-navigation-matrix.md`
7. `tests/navigation/absence-tab.md`
8. `tests/logout/logout-navigation-matrix.md`
9. `instructions/time-and-attendance-details.md`
10. `tests/time-and-attendance/app-switcher-navigation-matrix.md`
11. `tests/time-and-attendance/organization-user-navigation.md`
12. `tests/time-and-attendance/logout-navigation-matrix.md`

Execute directly in headed Chrome through Playwright MCP. Keep the run read-only except for Scenario 14's temporary absence create-and-cleanup lifecycle, and do not generate automation source code.

Also read and execute `instructions/Multi User Instructions/app-switcher-validation.md` after every successful login or role/context selection and again at the Home-page checkpoint. Apply its visibility condition separately to Campus User, Employee, and Organization User: run and report the switching workflow only when an App Switcher is exposed.

Also read and execute `instructions/Multi User Instructions/stage-ml-application-launch.md` after every Passport authentication and before role scenarios. Apply its final-tab discovery and launcher recovery checks in every role context.

Also read and execute `instructions/Multi User Instructions/url-evidence-validation.md` at every workflow's final evidence checkpoint. Use its full-browser screenshot and URL warning rules in every role context.

## Credentials

- Require `OrgId` and confirm this controller is enabled in `config/aes-stage.ml.<OrgId>.json`.
- Username source: `testUsernames.userRoleSwitcher` in the organization-scoped configuration.
- Password source: `roleswitcher_org_password` in `.secrets/aes-stage.ml.<OrgId>.credentials.json`.
- Never place the username/password combination, password, or session secrets in a report, screenshot, video, log, or response.

## Preparation — discover roles

1. Authenticate and confirm the account lands on a responsive authorized page.
2. Open the account/role switcher and capture the complete visible role list.
3. Verify Campus User, Employee, and Organization User are all present and selectable.
4. A missing required role marks only that role block **BLOCKED**. Continue with the other available role blocks in their documented order.

## Role block 1 — Campus User

1. Select Campus User and verify Campus Dashboard or the approved Campus React Home, active role label, organization label, permitted navigation, and account control.
2. Execute scenario **3**: React Home to Angular Daily Report.
3. Execute scenario **7**: Angular Daily Report to global search for `report`, confirm matching results or the explicit `0 results` state, then navigate to React Home.
4. Execute scenario **14** read-only. If no existing absence is accessible, mark it **BLOCKED** and do not create data.
5. Execute Campus-only scenarios **20 and 21** exactly as defined in `campus-user-execution.md`.
6. Execute scenario **30** from the verified Campus User context.
7. Execute logout scenarios **16, 17, and 37** independently from fresh logins to this same account with Campus User reselected.
7. Do not execute Campus scenario 8 or any Organization-only scenario while Campus User is active.

## Role block 2 — Employee

1. After the final Campus logout, authenticate again with this same account and select Employee.
2. Verify Employee Home, active role label, organization label, permitted navigation, and account control.
3. Execute Employee scenario **14** read-only. If no existing absence is available, mark it **BLOCKED** and do not create data.
4. Execute Employee scenario **31** from the verified Employee context.
5. Execute logout scenarios **16 and 38** independently from fresh logins with Employee reselected.

## Role block 3 — Organization User

1. After the Employee logout, authenticate again with this same account and select Organization User.
2. Verify React Home, active role label, organization label, global navigation, and account control.
3. Execute Organization User non-logout scenarios **1–15, 29, and 33–35** in numerical and dependency-safe order.
4. Execute logout scenarios **16, 17, 18, 19, and 36** independently. Start each with a fresh login to this same account and reselect Organization User.
5. In scenario 14, use an existing absence in unattended safe mode. If none exists, mark the scenario **BLOCKED** unless the invocation explicitly authorizes the documented create-and-cleanup fallback.

For every switch, confirm the active role and destination together. A changed role label on the wrong portal does not pass the switch or the dependent scenario.

## Safety rules

- Do not create, edit, approve, reconcile, import, invite, accept, reject, assign, save, or delete business data in unattended safe mode except for Scenario 14's exact temporary absence create-and-cleanup lifecycle.
- Restore read-only filters, searches, dates, and views before leaving a scenario.
- Continue after independent FAIL or BLOCKED outcomes.
- After every logout, finish Back and direct-route checks before re-authenticating.

## Reporting

Follow `instructions/html-reporting-standard.md`. Create the role report under `reports/full-suite/<OrgId>/<YYYYMMDD-HHMMSS>/roles/multi-role-campus-employee-organization/`.

The report must:

- group results in Campus User → Employee → Organization User order;
- include nine Campus outcomes, four Employee outcomes, and twenty-four Organization User outcomes;
- include screenshots and exact continuous-video ranges for every scenario;
- keep duplicate scenario IDs separate by active role;
- include numbered reproduction steps for every failure and exact reasons for blocked scenarios; and
- omit credentials, personal data, and sensitive redirect/session data.

The controller is **PASS** only when all three roles exist and all 37 role-specific scenario outcomes pass.

## Invocation

`For OrgId <OrgId>, execute instructions/Multi User Instructions/multi-role-campus-employee-organization-execution.md in unattended safe mode using only the matching organization-scoped configuration and credentials.`
