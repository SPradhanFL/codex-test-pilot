# Multi-Role Organization User + Employee Execution Controller

## Purpose

Execute the clubbed Organization User and Employee scenario sets for an account that has both roles. Run all Organization User scenarios **1–19** first, then switch to Employee and run scenarios **14 and 16**. Shared scenarios 14 and 16 are repeated in both role contexts.

## Mandatory preparation

Read completely before opening the browser:

1. `instructions/project-instructions.md`
2. `instructions/html-reporting-standard.md`
3. `config/aes-stage.ml.json`
4. `instructions/Multi User Instructions/role-scenario-matrix.md`
5. Every source test mapped to Organization User scenarios 1–19
6. `tests/navigation/absence-tab.md`
7. `tests/logout/logout-navigation-matrix.md`

Execute directly in headed Chrome through Playwright MCP. Keep the run read-only and do not generate automation source code.

Also read and execute `instructions/Multi User Instructions/app-switcher-validation.md` after every successful login or role/context selection and again at the Home-page checkpoint. Apply its visibility condition separately to Organization User and Employee: run and report the switching workflow only when an App Switcher is exposed.

## Credentials

- Expected username: `vtqamail+stageSSDManualSetup86MU@dev.frontlineed.com`
- Username source: `testUsernames.multiRoleOrgEmployee` in `config/aes-stage.ml.json`
- Password source: `AES_STAGE_MULTI_ROLE_ORG_EMPLOYEE_PASSWORD`, otherwise `multi_role_org_employee_password` in `.secrets/aes-stage.ml.credentials.json`
- Never place the password or session secrets in this file, a report, screenshot, video, log, or response.

## Role-block execution order

### Preparation — discover contexts

1. Authenticate and confirm the account lands on a responsive authorized page.
2. Open the account/role switcher and capture the complete visible role list.
3. Verify distinct Organization User and Employee entries are present and selectable. A missing entry marks only that role block **BLOCKED**.

### Role block 1 — Organization User

1. Select Organization User and verify React Home, the active role label, global navigation, and account control.
2. Execute scenarios **1–15** from `role-scenario-matrix.md` in numerical and dependency-safe order.
3. Execute Organization User logout scenarios **16, 17, 18, and 19** independently. Start each one with a fresh login to this same account and reselect Organization User.
4. Record an independent result, screenshot set, and video range for each of the 19 Organization User scenarios.

### Role block 2 — Employee

1. After the final Organization User logout, authenticate again with this same account and select Employee.
2. Verify Employee Home, the active role label, permitted navigation, and account control.
3. Execute Employee scenario **14** read-only. If no existing absence is available, mark it **BLOCKED** and do not create data.
4. Execute Employee scenario **16** from a fresh login to this same account with Employee reselected.
5. Record separate Employee results for scenarios 14 and 16 even though those IDs were already executed as Organization User.

### Completion

1. Confirm the final logout reaches the approved login page.
2. Confirm browser Back and direct access do not restore the Employee authenticated session.
3. Do not require a final return to Organization User after the Employee block; the required role order is Organization User followed by Employee.

Do not create, edit, approve, reconcile, assign, import, invite, or delete business data.

## Reporting

Follow `instructions/html-reporting-standard.md`. Create the run under `reports/role-executions/multi-role-org-employee/<YYYYMMDD-HHMMSS>/` with role-grouped outcomes for all 19 Organization User scenarios and both Employee scenarios, screenshots of each role context, one continuous video, expected/actual results, and reproduction steps for failures. Do not collapse duplicate scenario IDs across roles and do not expose credentials or sensitive identity data.

## Invocation

`Execute instructions/Multi User Instructions/multi-role-organization-employee-execution.md in unattended safe mode.`
