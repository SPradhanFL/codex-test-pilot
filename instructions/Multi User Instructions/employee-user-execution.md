# Employee User Execution Controller

## Purpose

Execute only Employee scenarios **14, 16, 31, and 38** from `role-scenario-matrix.md`: view an existing absence, validate Time & Attendance application switching, and verify logout from React Home and Time & Attendance. This controller does not modify existing tests.

## Mandatory preparation

Before opening the browser, read completely:

1. `instructions/project-instructions.md`
2. `instructions/application-details.md`
3. `instructions/test-data.md`
4. `config/aes-stage.ml.<OrgId>.json`
5. `instructions/Multi User Instructions/role-scenario-matrix.md`
6. `tests/navigation/absence-tab.md`
7. `tests/logout/logout-navigation-matrix.md`
8. `instructions/time-and-attendance-details.md`
9. `tests/time-and-attendance/app-switcher-navigation-matrix.md`
10. `tests/time-and-attendance/logout-navigation-matrix.md`

Execute directly in Chrome through Playwright MCP. Run unattended in safe mode, with only Scenario 14's temporary absence create-and-cleanup exception. Do not generate browser-automation source code.

Also read and execute `instructions/Multi User Instructions/app-switcher-validation.md` after every successful login or role/context selection and again at the Home-page checkpoint. Apply its visibility condition: run and report the switching workflow only when an App Switcher is exposed.

Also read and execute `instructions/Multi User Instructions/stage-ml-application-launch.md` after every Passport authentication and before role scenarios. Follow its normal tile-click, final-tab discovery, launcher recovery, and responsive-application checks.

Also read and execute `instructions/Multi User Instructions/url-evidence-validation.md` at every workflow's final evidence checkpoint. Use its full-browser screenshot and URL warning rules.

## Employee credentials

1. Require the invocation to supply `OrgId` and confirm this controller is listed in `config/aes-stage.ml.<OrgId>.json` under `enabledControllers`.
2. Read the Stage ML URL and `testUsernames.employee` only from `config/aes-stage.ml.<OrgId>.json`.
3. Read `employee_password` only from `.secrets/aes-stage.ml.<OrgId>.credentials.json`.
4. If either value is missing or is a placeholder, create a **BLOCKED** report and stop before browser actions.
5. Use this same Employee identity for all four workflows. Do not fall back to the default Organization User.
6. Never print, display, log, screenshot, report, or copy credentials or session secrets.

## Shared safety and execution rules

- Use only the Stage ML URL and approved hosts in `config/aes-stage.ml.<OrgId>.json`.
- Do not create, edit, approve, reconcile, assign, save, or delete data except for Scenario 14's temporary self-service absence create-and-cleanup fallback in `tests/navigation/absence-tab.md`.
- If the Employee has no viewable absence, use the supported self-service fallback for the currently authenticated configured Stage test identity. Mark the workflow **BLOCKED** only when creation, unique identification, reopening, or cleanup is unavailable or unsafe.
- Continue to the independent logout workflow after an absence-workflow failure or block when authentication remains safe.
- Start the logout workflow with a fresh Employee session.

## Scenario 14 — View an Absence and every available detail tab

Use the read-only absence navigation described by `tests/navigation/absence-tab.md`, adapting to the Employee portal's visible navigation without switching roles.

1. Authenticate as the Employee and confirm the authenticated React Home page is responsive.
2. Open the Employee's available Absences list or history using visible navigation.
3. If no absence is available, create one minimum-duration temporary absence through the Employee portal, record its exact identifier, and confirm it can be reopened and deleted/cancelled before continuing.
4. Open the existing or newly created absence through its supported view/details action. Do not change an existing absence.
5. Capture the visible set of enabled absence-detail tabs before traversing them. Do not report personally identifying absence data.
6. Select every captured tab once, from first to last.
7. On each tab, confirm the selected state, associated content, responsive layout, and absence of an application error.
8. Return to the first tab and confirm the same absence remains open and no unsaved change indicator appears.

Expected: Every available detail tab can be viewed successfully; an existing absence remains unchanged, or the exact temporary fallback absence is deleted/cancelled and verified absent before the scenario passes.

## Scenario 31 — Time & Attendance to Absence Management and back

Execute the Employee flow from `tests/time-and-attendance/app-switcher-navigation-matrix.md`.

Expected: Time & Attendance is established as the starting application, Absence Management opens with the same Employee context, and Time & Attendance is restored successfully.

## Scenario 16 — Logout from React Home

Start a fresh Employee session and apply **Flow 1 — Logout from React Home** plus the shared authentication, logout, and session-termination checks from `tests/logout/logout-navigation-matrix.md` to the Employee React Home page.

Expected: Logout reaches the approved login page, browser Back does not restore an authenticated session, and direct access to the captured React Home route requires authentication.

## Scenario 38 — Logout from Time & Attendance

Start a fresh Employee session and execute the Employee flow from `tests/time-and-attendance/logout-navigation-matrix.md`.

Expected: Logout reaches the approved login page, browser Back does not restore Time & Attendance, and direct access requires authentication.

## Result classification and reporting

Create the canonical report under `reports/full-suite/<OrgId>/<YYYYMMDD-HHMMSS>/roles/employee-user/` with linked scenario pages, screenshots, and the organization run's continuous video. Archive older runs only within `reports/full-suite/<OrgId>/old-reports/`. Include:

- Employee as the execution role
- One outcome card for each of scenarios 14, 16, 31, and 38
- The discovered absence tabs and a result for each, without personal data
- Detailed action, expected result, actual result, and status rows
- PASS, FAIL, BLOCKED, and NOT TESTED totals
- Safe route observations and screenshot paths
- Numbered reproduction steps for failures
- Session termination and cleanup results

Mark each scenario independently. The overall result is **PASS** only when scenarios 14, 16, 31, and 38 pass. Never include credentials, sensitive redirect data, or absence personal data.

## Invocation

`For OrgId <OrgId>, execute instructions/Multi User Instructions/employee-user-execution.md in unattended safe mode using only the matching organization-scoped configuration and credentials.`
