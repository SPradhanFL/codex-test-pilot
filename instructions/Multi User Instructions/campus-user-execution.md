# Campus User Execution Controller

## Purpose

Execute only Campus User scenarios **3, 7, 14, 16, and 17** from `role-scenario-matrix.md`. This controller reuses selected flows from existing tests and does not modify those source tests.

## Mandatory preparation

Before opening the browser, read completely:

1. `instructions/project-instructions.md`
2. `instructions/application-details.md`
3. `instructions/test-data.md`
4. `config/aes-stage.ml.json`
5. `instructions/Multi User Instructions/role-scenario-matrix.md`
6. `tests/navigation/cross-application-navigation-matrix.md`
7. `tests/navigation/absence-tab.md`
8. `tests/logout/logout-navigation-matrix.md`

Execute directly in Chrome through Playwright MCP. Run unattended in read-only safe mode. Do not generate browser-automation source code.

Also read and execute `instructions/Multi User Instructions/app-switcher-validation.md` after every successful login or role/context selection and again at the Home-page checkpoint. Apply its visibility condition: run and report the switching workflow only when an App Switcher is exposed.

## Campus User credentials

1. Read the Stage ML URL from `config/aes-stage.ml.json`.
2. Resolve the username from `AES_STAGE_CAMPUS_USERNAME`. If it is unavailable and `config/aes-stage.ml.json` contains `testUsernames.campusUser`, use that value.
3. Resolve the password from `AES_STAGE_CAMPUS_PASSWORD`. If it is unavailable and `.secrets/aes-stage.ml.credentials.json` contains `campus_password`, use that value.
4. If either value is missing or is a placeholder, create a **BLOCKED** report and stop before browser actions.
5. Use this same Campus User identity for all five workflows. Do not fall back to the default Organization User.
6. Never print, display, log, screenshot, report, or copy credentials or session secrets.

## Shared safety and execution rules

- Use only the Stage ML URL and approved hosts in `config/aes-stage.ml.json`.
- Do not create, edit, approve, reconcile, import, invite, or delete data.
- Execute workflows in the order below. Re-authenticate with the Campus User after a logout.
- Continue after a failed independent workflow when it is safe to do so.
- If the Campus User lacks a required permission, mark that workflow **BLOCKED**, record the missing destination or control, and continue with independent workflows.
- Restore all changed read-only filters, views, and search fields.

## Scenario 3 — React Home to Angular Daily Report

1. Authenticate as the Campus User and confirm React Home at `/navigator/Dashboard.aspx`.
2. Confirm the global Search and `Daily Report` navigation are visible and enabled.
3. Select `Daily Report` and wait for navigation to settle.
4. Confirm `/reports/absence/daily-report`, the `Daily Report` heading, date, report filters, totals, and authenticated account control are visible.

Expected: React Home navigates directly to a responsive Angular Daily Report page without authentication loss, stale content, or an unapproved redirect.

## Scenario 7 — Angular Daily Report to global Search to React Home

Execute **Flow 2 — Angular Daily Report to Search to React Home** from `tests/navigation/cross-application-navigation-matrix.md`, including its shared Daily Report and Global Search checks. Use the exact search term `report`.

Expected: Search results or the documented explicit zero-result state are shown, then React Home loads successfully.

## Scenario 14 — View an Absence and every available detail tab

Use the read-only `Absences` → `Modify` navigation established by `tests/navigation/absence-tab.md`.

1. Navigate to `Absences` → `Modify` and wait for the page to become responsive.
2. Run a safe read-only search using the page's default permitted criteria.
3. If no absence is available, mark this workflow **BLOCKED**; do not create test data.
4. Open one existing absence through a view/details action. Do not select edit, approve, reconcile, assign, save, delete, or another data-changing action.
5. Capture the visible set of enabled absence-detail tabs before traversing them. Do not report personally identifying absence data.
6. Select each captured tab once, from first to last. For every tab, confirm its selected state, associated content, responsive layout, and absence of an application error.
7. Return to the first tab and confirm the same absence context remains open with no unsaved change indicator.

Expected: Every available detail tab for the selected absence can be viewed successfully and no record is changed.

## Scenario 16 — Logout from React Home

Start a fresh Campus User session and execute **Flow 1 — Logout from React Home** from `tests/logout/logout-navigation-matrix.md`, including the shared authentication, logout, and session-termination checks.

Expected: Logout reaches the approved login page, browser Back does not restore an authenticated session, and direct React Home access requires authentication.

## Scenario 17 — Logout from Angular Daily Report

Start a fresh Campus User session and execute **Flow 2 — Logout from Angular Daily Report** from `tests/logout/logout-navigation-matrix.md`, including the shared authentication, logout, and session-termination checks.

Expected: Logout reaches the approved login page, browser Back does not restore an authenticated session, and direct Daily Report access requires authentication.

## Result classification and reporting

Create the canonical timestamped report under `reports/role-executions/campus-user/<YYYYMMDD-HHMMSS>/` with `index.html`, linked scenario pages, screenshots, and one continuous video. Before the new run, move older timestamped Campus User runs into `reports/role-executions/campus-user/old-reports/old-<timestamp>/`. Include:

- Campus User as the execution role
- One outcome card for each of scenarios 3, 7, 14, 16, and 17
- Detailed action, expected result, actual result, and status rows
- PASS, FAIL, BLOCKED, and NOT TESTED totals
- Safe route observations and screenshot paths
- Numbered reproduction steps for failures
- Restoration, session termination, and cleanup results

Mark each scenario independently. The overall result is **PASS** only when all five authorized scenarios pass. Never include credentials, sensitive redirect data, or absence personal data.

## Invocation

`Execute instructions/Multi User Instructions/campus-user-execution.md in unattended safe mode.`
