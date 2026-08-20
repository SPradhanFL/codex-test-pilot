# Multi-Role Campus User + Employee + Organization User Execution Controller

## Purpose

Execute the clubbed role-specific scenario sets for the account that exposes Campus User, Employee, and Organization User. Follow the requested role order: Campus User first, Employee second, and Organization User third.

The required outcomes are:

- Campus User: scenarios **3, 7, 14, 16, and 17**
- Employee: scenarios **14 and 16**
- Organization User: scenarios **1–19**

Shared scenario IDs are repeated in every applicable role and must not be deduplicated.

## Mandatory preparation

Read completely before opening the browser:

1. `instructions/project-instructions.md`
2. `instructions/html-reporting-standard.md`
3. `instructions/Multi User Instructions/role-scenario-matrix.md`
4. `config/aes-stage.ml.json`
5. Every source Markdown test mapped to Organization User scenarios 1–19
6. `tests/navigation/cross-application-navigation-matrix.md`
7. `tests/navigation/absence-tab.md`
8. `tests/logout/logout-navigation-matrix.md`

Execute directly in headed Chrome through Playwright MCP. Keep the run read-only and do not generate automation source code.

Also read and execute `instructions/Multi User Instructions/app-switcher-validation.md` after every successful login or role/context selection and again at the Home-page checkpoint. Apply its visibility condition separately to Campus User, Employee, and Organization User: run and report the switching workflow only when an App Switcher is exposed.

## Credentials

- Username source: `testUsernames.userRoleSwitcher` in `config/aes-stage.ml.json`
- Password source: `AES_STAGE_ROLE_SWITCHER_ORG_PASSWORD`, otherwise `roleswitcher_org_password` in `.secrets/aes-stage.ml.credentials.json`
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
5. Execute scenario **16** from a fresh login to this same account with Campus User reselected.
6. Execute scenario **17** from another fresh login to this same account with Campus User reselected.
7. Do not execute Campus scenario 8 or any Organization-only scenario while Campus User is active.

## Role block 2 — Employee

1. After the final Campus logout, authenticate again with this same account and select Employee.
2. Verify Employee Home, active role label, organization label, permitted navigation, and account control.
3. Execute Employee scenario **14** read-only. If no existing absence is available, mark it **BLOCKED** and do not create data.
4. Execute Employee scenario **16** from a fresh login with Employee reselected.

## Role block 3 — Organization User

1. After the Employee logout, authenticate again with this same account and select Organization User.
2. Verify React Home, active role label, organization label, global navigation, and account control.
3. Execute Organization User scenarios **1–15** in numerical and dependency-safe order.
4. Execute logout scenarios **16, 17, 18, and 19** independently. Start each with a fresh login to this same account and reselect Organization User.
5. In scenario 14, use an existing absence in unattended safe mode. If none exists, mark the scenario **BLOCKED** unless the invocation explicitly authorizes the documented create-and-cleanup fallback.

For every switch, confirm the active role and destination together. A changed role label on the wrong portal does not pass the switch or the dependent scenario.

## Safety rules

- Do not create, edit, approve, reconcile, import, invite, accept, reject, assign, save, or delete business data in unattended safe mode.
- Restore read-only filters, searches, dates, and views before leaving a scenario.
- Continue after independent FAIL or BLOCKED outcomes.
- After every logout, finish Back and direct-route checks before re-authenticating.

## Reporting

Follow `instructions/html-reporting-standard.md`. Create the run under `reports/role-executions/multi-role-campus-employee-organization/<YYYYMMDD-HHMMSS>/`.

The report must:

- group results in Campus User → Employee → Organization User order;
- include five Campus outcomes, two Employee outcomes, and nineteen Organization User outcomes;
- include screenshots and exact continuous-video ranges for every scenario;
- keep duplicate scenario IDs separate by active role;
- include numbered reproduction steps for every failure and exact reasons for blocked scenarios; and
- omit credentials, personal data, and sensitive redirect/session data.

The controller is **PASS** only when all three roles exist and all 26 role-specific scenario outcomes pass.

## Invocation

`Execute instructions/Multi User Instructions/multi-role-campus-employee-organization-execution.md in unattended safe mode.`
