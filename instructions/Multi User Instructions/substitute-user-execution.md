# Substitute User Execution Controller

## Purpose

Execute only Substitute scenarios **14, 16, 32, and 39** from `role-scenario-matrix.md`: validate the Substitute schedule/history views, validate Time & Attendance application switching, and verify logout from React Home and Time & Attendance. Scenario 14 is role-adapted for the Substitute portal and does not require opening an individual absence or job-detail page.

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

Execute directly in Chrome through Playwright MCP. Run unattended in safe, read-only mode. Do not generate browser-automation source code.

Also read and execute `instructions/Multi User Instructions/app-switcher-validation.md` after every successful login or role/context selection and again at the Home-page checkpoint. Apply its visibility condition: run and report the switching workflow only when an App Switcher is exposed.

Also read and execute `instructions/Multi User Instructions/stage-ml-application-launch.md` after every Passport authentication and before role scenarios. Follow its normal tile-click, final-tab discovery, launcher recovery, and responsive-application checks.

Also read and execute `instructions/Multi User Instructions/url-evidence-validation.md` at every workflow's final evidence checkpoint. Use its full-browser screenshot and URL warning rules.

## Substitute credentials

1. Require the invocation to supply `OrgId` and confirm this controller is listed in `config/aes-stage.ml.<OrgId>.json` under `enabledControllers`.
2. Read the Stage ML URL and `testUsernames.substitute` only from `config/aes-stage.ml.<OrgId>.json`.
3. Read `substitute_password` only from `.secrets/aes-stage.ml.<OrgId>.credentials.json`.
4. If either value is missing or is a placeholder, create a **BLOCKED** report and stop before browser actions.
5. Use this same Substitute identity for all four workflows. Do not fall back to the default Organization User.
6. Never print, display, log, screenshot, report, or copy credentials or session secrets.

## Shared safety and execution rules

- Use only the Stage ML URL and approved hosts in `config/aes-stage.ml.<OrgId>.json`.
- Do not accept, reject, cancel, create, edit, assign, save, or delete an absence or job. Never create or accept work to manufacture Scenario 14 data.
- Scenario 14 validates navigation and visible page content only. Empty job lists, zero-result states, and the absence of an individual job-detail link are acceptable when the required Substitute schedule/history views load successfully.
- Continue to the independent logout workflow after an absence-workflow failure or block when authentication remains safe.
- Start the logout workflow with a fresh Substitute session.

## Scenario 14 — Validate Substitute schedule and history views

This Substitute-specific flow overrides the individual-absence and detail-tab branches in `tests/navigation/absence-tab.md`. Do not require an existing job, confirmation link, absence-details page, or temporary record.

1. Authenticate as the Substitute and confirm the authenticated React Home page is responsive.
2. Identify the visible controls that expose these four required views, allowing the documented equivalent labels:
   - **Available Jobs**
   - **Scheduled Jobs** or **Schedule**
   - **Past Jobs** or **History → Jobs**
   - **Non Work Days** or **History → Non Work Days**
3. For each required view, scroll its menu item or tab into view before interaction and click it once.
4. Wait for the selected state, route, heading, list/calendar, or explicit empty state to stabilize.
5. Confirm the selected control is visible and interactive, the corresponding page content is displayed, and no unhandled error or broken layout is present. Zero jobs or an empty state is acceptable.
6. Capture full-browser screenshot evidence for every view with its selected control and content visible.
7. Return to the initially selected Substitute view and confirm navigation remains responsive.
8. Do not open, accept, reject, cancel, assign, create, edit, save, or delete a job or absence.

Expected: Available Jobs, Scheduled Jobs/Schedule, Past Jobs/History Jobs, and Non Work Days can each be selected and display responsive content without changing business data. An individual job-detail page or detail-tab set is not required.

Classification: Mark **PASS** when all four required views work, including valid empty states. Mark **FAIL** after the mandatory 120-second UI recovery observation when an exposed view cannot be selected or render correctly. Add a measured slow-load warning when a view takes more than 30 seconds. Mark **BLOCKED** only when authentication, role selection, entitlement, or environment restrictions prevent access to a required Substitute view.

## Scenario 32 — Time & Attendance to Absence Management and back

Execute the Substitute flow from `tests/time-and-attendance/app-switcher-navigation-matrix.md`.

Expected: Time & Attendance is established as the starting application, Absence Management opens with the same Substitute context, and Time & Attendance is restored successfully.

## Scenario 16 — Logout from React Home

Start a fresh Substitute session and apply **Flow 1 — Logout from React Home** plus the shared authentication, logout, and session-termination checks from `tests/logout/logout-navigation-matrix.md` to the Substitute React Home page.

Expected: Logout reaches the approved login page, browser Back does not restore an authenticated session, and direct access to the captured React Home route requires authentication.

## Scenario 39 — Logout from Time & Attendance

Start a fresh Substitute session and execute the Substitute flow from `tests/time-and-attendance/logout-navigation-matrix.md`.

Expected: Logout reaches the approved login page, browser Back does not restore Time & Attendance, and direct access requires authentication.

## Result classification and reporting

Create the canonical report under `reports/full-suite/<OrgId>/<YYYYMMDD-HHMMSS>/roles/substitute-user/` with linked scenario pages, screenshots, and the organization run's continuous video. Archive older runs only within `reports/full-suite/<OrgId>/old-reports/`. Include:

- Substitute as the execution role
- One outcome card for each of scenarios 14, 16, 32, and 39
- The four Substitute schedule/history views and a result for each, without personal data
- Detailed action, expected result, actual result, and status rows
- PASS, FAIL, BLOCKED, and NOT TESTED totals
- Safe route observations and screenshot paths
- Numbered reproduction steps for failures
- Session termination and cleanup results

Mark each scenario independently. The overall result is **PASS** only when scenarios 14, 16, 32, and 39 pass. Never include credentials, sensitive redirect data, or absence personal data.

## Invocation

`For OrgId <OrgId>, execute instructions/Multi User Instructions/substitute-user-execution.md in unattended safe mode using only the matching organization-scoped configuration and credentials.`
