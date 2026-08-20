# Substitute User Execution Controller

## Purpose

Execute only Substitute scenarios **14 and 16** from `role-scenario-matrix.md`: view an existing assignment, job, or absence and every available detail tab, then verify logout from React Home. This controller does not modify existing tests.

## Mandatory preparation

Before opening the browser, read completely:

1. `instructions/project-instructions.md`
2. `instructions/application-details.md`
3. `instructions/test-data.md`
4. `config/aes-stage.ml.json`
5. `instructions/Multi User Instructions/role-scenario-matrix.md`
6. `tests/navigation/absence-tab.md`
7. `tests/logout/logout-navigation-matrix.md`

Execute directly in Chrome through Playwright MCP. Run unattended in read-only safe mode. Do not generate browser-automation source code.

Also read and execute `instructions/Multi User Instructions/app-switcher-validation.md` after every successful login or role/context selection and again at the Home-page checkpoint. Apply its visibility condition: run and report the switching workflow only when an App Switcher is exposed.

## Substitute credentials

1. Read the Stage ML URL from `config/aes-stage.ml.json`.
2. Resolve the username from `AES_STAGE_SUBSTITUTE_USERNAME`. If it is unavailable and `config/aes-stage.ml.json` contains `testUsernames.substitute`, use that value.
3. Resolve the password from `AES_STAGE_SUBSTITUTE_PASSWORD`. If it is unavailable and `.secrets/aes-stage.ml.credentials.json` contains `substitute_password`, use that value.
4. If either value is missing or is a placeholder, create a **BLOCKED** report and stop before browser actions.
5. Use this same Substitute identity for both workflows. Do not fall back to the default Organization User.
6. Never print, display, log, screenshot, report, or copy credentials or session secrets.

## Shared safety and execution rules

- Use only the Stage ML URL and approved hosts in `config/aes-stage.ml.json`.
- Do not accept, reject, cancel, create, edit, assign, save, or delete an absence or job.
- If the Substitute lacks a required permission or has no viewable absence, mark the affected workflow **BLOCKED** rather than using another identity or creating test data.
- Continue to the independent logout workflow after an absence-workflow failure or block when authentication remains safe.
- Start the logout workflow with a fresh Substitute session.

## Scenario 14 — View an Absence and every available detail tab

Use the read-only absence navigation described by `tests/navigation/absence-tab.md`, adapting to the Substitute portal's visible navigation without switching roles.

1. Authenticate as the Substitute and confirm the authenticated React Home page is responsive.
2. Open the Substitute's available Absences, Assignments, or history list through visible read-only navigation.
3. If no existing absence or assignment is available, mark this workflow **BLOCKED**; do not create or accept test data.
4. Open one existing item through a view/details action. Do not use accept, reject, cancel, edit, or another data-changing action.
5. Capture the visible set of enabled detail tabs before traversing them. Do not report personally identifying absence, employee, or substitute data.
6. Select every captured tab once, from first to last.
7. On each tab, confirm the selected state, associated content, responsive layout, and absence of an application error.
8. Return to the first tab and confirm the same item remains open and no unsaved change indicator appears.

Expected: Every available detail tab can be viewed successfully and no absence, assignment, or job is changed.

## Scenario 16 — Logout from React Home

Start a fresh Substitute session and apply **Flow 1 — Logout from React Home** plus the shared authentication, logout, and session-termination checks from `tests/logout/logout-navigation-matrix.md` to the Substitute React Home page.

Expected: Logout reaches the approved login page, browser Back does not restore an authenticated session, and direct access to the captured React Home route requires authentication.

## Result classification and reporting

Create the canonical timestamped report under `reports/role-executions/substitute/<YYYYMMDD-HHMMSS>/` with `index.html`, linked scenario pages, screenshots, and one continuous video. Before the new run, move older timestamped Substitute runs into `reports/role-executions/substitute/old-reports/old-<timestamp>/`. Include:

- Substitute as the execution role
- One outcome card for scenario 14 and one for scenario 16
- The discovered detail tabs and a result for each, without personal data
- Detailed action, expected result, actual result, and status rows
- PASS, FAIL, BLOCKED, and NOT TESTED totals
- Safe route observations and screenshot paths
- Numbered reproduction steps for failures
- Session termination and cleanup results

Mark each scenario independently. The overall result is **PASS** only when scenarios 14 and 16 both pass. Never include credentials, sensitive redirect data, or absence personal data.

## Invocation

`Execute instructions/Multi User Instructions/substitute-user-execution.md in unattended safe mode.`
