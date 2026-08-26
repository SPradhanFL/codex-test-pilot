# Campus User Execution Controller

## Purpose

Execute only Campus User scenarios **3, 7, 14, 16, 17, 20, and 21** from `role-scenario-matrix.md`. Scenarios 20 and 21 are Campus User-only navigation validations defined in this controller.

## Mandatory preparation

Before opening the browser, read completely:

1. `instructions/project-instructions.md`
2. `instructions/application-details.md`
3. `instructions/test-data.md`
4. `config/aes-stage.ml.<OrgId>.json`
5. `instructions/Multi User Instructions/role-scenario-matrix.md`
6. `tests/navigation/cross-application-navigation-matrix.md`
7. `tests/navigation/absence-tab.md`
8. `tests/logout/logout-navigation-matrix.md`

Execute directly in Chrome through Playwright MCP. Run unattended in safe mode, with only Scenario 14's temporary absence create-and-cleanup exception. Do not generate browser-automation source code.

Also read and execute `instructions/Multi User Instructions/app-switcher-validation.md` after every successful login or role/context selection and again at the Home-page checkpoint. Apply its visibility condition: run and report the switching workflow only when an App Switcher is exposed.

Also read and execute `instructions/Multi User Instructions/stage-ml-application-launch.md` after every Passport authentication and before role scenarios. Follow its normal tile-click, final-tab discovery, launcher recovery, and responsive-application checks.

Also read and execute `instructions/Multi User Instructions/url-evidence-validation.md` at every workflow's final evidence checkpoint. Use its full-browser screenshot and URL warning rules.

## Campus User credentials

1. Require the invocation to supply `OrgId` and confirm this controller is listed in `config/aes-stage.ml.<OrgId>.json` under `enabledControllers`.
2. Read the Stage ML URL and `testUsernames.campusUser` only from `config/aes-stage.ml.<OrgId>.json`.
3. Read `campus_password` only from `.secrets/aes-stage.ml.<OrgId>.credentials.json`.
4. If either value is missing or is a placeholder, create a **BLOCKED** report and stop before browser actions.
5. Use this same Campus User identity for all seven workflows. Do not fall back to the default Organization User.
6. Never print, display, log, screenshot, report, or copy credentials or session secrets.

## Shared safety and execution rules

- Use only the Stage ML URL and approved hosts in `config/aes-stage.ml.<OrgId>.json`.
- Do not create, edit, approve, reconcile, import, invite, or delete data except for Scenario 14's temporary absence create-and-cleanup fallback in `tests/navigation/absence-tab.md`.
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

Execute **Flow 2 — Angular Daily Report to Search to React Home** from `tests/navigation/cross-application-navigation-matrix.md`, including its shared Daily Report and Search-page navigation/element checks. Use the exact search term `report`; do not validate search-result data or counts.

Expected: Search results or the documented explicit zero-result state are shown, then React Home loads successfully.

## Scenario 20 — Campus React Home to Reports to Report Writer

1. Authenticate as the Campus User and wait for Campus React Home to become responsive.
2. Confirm the active role is Campus User and the `Reports` navigation control is visible, enabled, and interactable.
3. Open `Reports` and confirm the displayed submenu is responsive.
4. Confirm `Report Writer` is visible and enabled, then select it.
5. Wait for navigation and loading indicators to settle.
6. Confirm the Report Writer destination is displayed using its visible page heading/title and primary report workspace or control region.
7. Confirm the authenticated account control and global navigation remain visible and responsive. Do not create, edit, run, schedule, save, export, or delete a report.
8. Apply `url-evidence-validation.md` and capture a complete-browser-window screenshot showing the address bar and the Report Writer result state.

Expected: The Campus User can navigate through `Reports` → `Report Writer`; the destination and its primary controls load without authentication loss, access error, or application error.

If `Reports` or `Report Writer` is absent because this Campus User lacks the required entitlement, mark only Scenario 20 **BLOCKED** and continue. If the exposed control can be selected but navigation or the destination fails, mark the scenario **FAIL**.

## Scenario 21 — Campus React Home to Account Settings and back

1. Start from a responsive Campus React Home page with Campus User confirmed as the active role.
2. Confirm `Settings` is visible, enabled, and interactable, then open it.
3. Confirm `My Profile` is visible and enabled, then select it and wait for the profile destination/menu to settle.
4. Confirm `Account Settings` is visible and enabled, then select it.
5. Wait for navigation and loading indicators to settle.
6. Confirm the Account Settings destination is displayed using its visible heading/title and primary account-settings content or control region. Do not change or save any profile, security, notification, contact, or preference value.
7. Apply `url-evidence-validation.md` and capture a complete-browser-window screenshot showing the address bar and Account Settings result state.
8. Use the application's visible Back, breadcrumb, or supported browser Back action to return to the prior `My Profile` or `Settings` page. Confirm the previous page is visible, responsive, and still authenticated.
9. Use the supported Home navigation to return to Campus React Home. Confirm the Campus User role, global navigation, and account control remain visible.
10. Apply `url-evidence-validation.md` to the final Campus React Home state and capture complete-browser-window evidence of the successful return.

Expected: The Campus User can navigate through `Settings` → `My Profile` → `Account Settings`, view the page without modifying data, return to the prior page, and return to Campus React Home without authentication or context loss.

If a required menu is absent because this Campus User lacks the required entitlement, mark only Scenario 21 **BLOCKED** and continue. If the controls are exposed but the destination or return navigation fails, mark the scenario **FAIL**.

## Scenario 14 — View an Absence and every available detail tab

Use the read-only `Absences` → `Modify` navigation established by `tests/navigation/absence-tab.md`.

1. Navigate to `Absences` → `Modify` and wait for the page to become responsive.
2. Run a safe read-only search using the page's default permitted criteria.
3. If no absence is available, execute the temporary create → reopen → validate → delete/cancel → verify absent fallback in `tests/navigation/absence-tab.md`. Submit only when this Campus context exposes both safe creation and cleanup controls for a uniquely verified test target; otherwise mark the workflow **BLOCKED**.
4. Open the selected existing or newly created absence through its supported view/details action. Do not change an existing record. For a fallback record, retain its exact identifier for mandatory cleanup.
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

Create the canonical report under `reports/full-suite/<OrgId>/<YYYYMMDD-HHMMSS>/roles/campus-user/` with linked scenario pages, screenshots, and the organization run's continuous video. Archive older runs only within `reports/full-suite/<OrgId>/old-reports/`. Include:

- Campus User as the execution role
- One outcome card for each of scenarios 3, 7, 14, 16, 17, 20, and 21
- Detailed action, expected result, actual result, and status rows
- PASS, FAIL, BLOCKED, and NOT TESTED totals
- Safe route observations and screenshot paths
- Numbered reproduction steps for failures
- Restoration, session termination, and cleanup results

Mark each scenario independently. The overall result is **PASS** only when all seven authorized scenarios pass. Never include credentials, sensitive redirect data, or absence personal data.

## Invocation

`For OrgId <OrgId>, execute instructions/Multi User Instructions/campus-user-execution.md in unattended safe mode using only the matching organization-scoped configuration and credentials.`
