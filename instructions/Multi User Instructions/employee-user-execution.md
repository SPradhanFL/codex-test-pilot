# Employee User Execution Controller

## Purpose

Execute only Employee scenarios **14 and 16** from `role-scenario-matrix.md` plus the required standalone `My Staff Profile` navigation workflow in `tests/navigation/standalone-home-menu-navigation.md`: view an existing absence and all available detail tabs, then verify logout from React Home.

## Mandatory preparation

Before opening the browser, read completely:

1. `instructions/project-instructions.md`
2. `instructions/application-details.md`
3. `instructions/test-data.md`
4. `config/aes-stage.ml.<OrgId>.json`
5. `instructions/Multi User Instructions/role-scenario-matrix.md`
6. `tests/navigation/absence-tab.md`
7. `tests/logout/logout-navigation-matrix.md`
8. `tests/navigation/standalone-home-menu-navigation.md`

Execute directly in Chrome through Playwright MCP. Run unattended in safe mode, with only Scenario 14's temporary absence create-and-cleanup exception. Do not generate browser-automation source code.

Also read and execute `instructions/Multi User Instructions/app-switcher-validation.md` after every successful login or role/context selection and again at the Home-page checkpoint. Apply its visibility condition: run and report the switching workflow only when an App Switcher is exposed.

Also read and execute `instructions/Multi User Instructions/stage-ml-application-launch.md` after every Passport authentication and before role scenarios. Follow its normal tile-click, final-tab discovery, launcher recovery, and responsive-application checks.

Also read and execute `instructions/Multi User Instructions/url-evidence-validation.md` at every workflow's final evidence checkpoint. Use its full-browser screenshot and URL warning rules.

## Employee credentials

1. Require the invocation to supply `OrgId` and confirm this controller is listed in `config/aes-stage.ml.<OrgId>.json` under `enabledControllers`.
2. Read the Stage ML URL and `testUsernames.employee` only from `config/aes-stage.ml.<OrgId>.json`.
3. Read `employee_password` only from `.secrets/aes-stage.ml.<OrgId>.credentials.json`.
4. If either value is missing or is a placeholder, create a **BLOCKED** report and stop before browser actions.
5. Use this same Employee identity for both numbered scenarios and the standalone Home menu workflow. Do not execute Employee workflows under another active role. After each post-selection Home or Dashboard landing, open the user-info menu and confirm Employee is active. If any other role is displayed, apply the one-time role reselection recovery in `role-scenario-matrix.md` and continue only after Employee is confirmed.
6. Never print, display, log, screenshot, report, or copy credentials or session secrets.

## Shared safety and execution rules

- Use only the Stage ML URL and approved hosts in `config/aes-stage.ml.<OrgId>.json`.
- Do not create, edit, approve, reconcile, assign, save, or delete data except for Scenario 14's temporary self-service absence create-and-cleanup fallback in `tests/navigation/absence-tab.md`.
- If the Employee has no viewable absence, use the supported self-service fallback for the currently authenticated configured Stage test identity. Mark the workflow **BLOCKED** only when creation, unique identification, reopening, or cleanup is unavailable or unsafe.
- Continue to the independent logout workflow after an absence-workflow failure or block when authentication remains safe.
- Start the logout workflow with a fresh Employee session.

## Required standalone supplemental workflow — My Staff Profile

After the first responsive Employee Home landing and Employee role confirmation, execute the Employee flow in `tests/navigation/standalone-home-menu-navigation.md` before Scenario 14. Validate only `My Staff Profile` as one independent supplemental result. Do not require or test `Staff Directory` or `Resource Library`, and do not inherit this workflow from a multi-role or multi-organization combination controller.

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

## Scenario 16 — Logout from React Home

Start a fresh Employee session and apply **Flow 1 — Logout from React Home** plus only the shared authentication, source-page, logout, and login-page checks from `tests/logout/logout-navigation-matrix.md` to the Employee React Home page.

Expected: Logout reaches and displays the approved login page. Do not click browser Back or test direct protected access.

## Result classification and reporting

Create the canonical report under `reports/full-suite/<OrgId>/<YYYYMMDD-HHMMSS>/roles/employee-user/` with linked scenario pages, screenshots, and the organization run's continuous video. Archive older runs only within `reports/full-suite/<OrgId>/old-reports/`. Include:

- Employee as the execution role
- One outcome card for scenario 14 and one for scenario 16
- One independent `Employee · Standalone Home menu navigation` outcome with destination-level steps, screenshot, and measured video range
- The discovered absence tabs and a result for each, without personal data
- Detailed action, expected result, actual result, and status rows
- PASS, FAIL, BLOCKED, and NOT TESTED totals
- Safe route observations and screenshot paths
- Numbered reproduction steps for failures
- Session termination and cleanup results

Mark each scenario independently. The overall result is **PASS** only when scenarios 14 and 16 and the required standalone Home menu navigation workflow all pass. Never include credentials, sensitive redirect data, or absence personal data.

## Invocation

`For OrgId <OrgId>, execute instructions/Multi User Instructions/employee-user-execution.md in unattended safe mode using only the matching organization-scoped configuration and credentials.`
