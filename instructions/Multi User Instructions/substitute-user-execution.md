# Substitute User Execution Controller

## Purpose

Execute only Substitute scenarios **14 and 16** from `role-scenario-matrix.md` plus the required standalone `My Staff Profile` navigation workflow in `tests/navigation/standalone-home-menu-navigation.md`: validate the Substitute schedule/history views, then verify logout from React Home. Scenario 14 is role-adapted for the Substitute portal and does not require opening an individual absence or job-detail page.

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

Execute directly in Chrome through Playwright MCP. Run unattended in safe, read-only mode. Do not generate browser-automation source code.

Also read and execute `instructions/Multi User Instructions/app-switcher-validation.md` after every successful login or role/context selection and again at the Home-page checkpoint. Apply its visibility condition: run and report the switching workflow only when an App Switcher is exposed.

Also read and execute `instructions/Multi User Instructions/stage-ml-application-launch.md` after every Passport authentication and before role scenarios. Follow its normal tile-click, final-tab discovery, launcher recovery, and responsive-application checks.

Also read and execute `instructions/Multi User Instructions/url-evidence-validation.md` at every workflow's final evidence checkpoint. Use its full-browser screenshot and URL warning rules.

## Substitute credentials

1. Require the invocation to supply `OrgId` and confirm this controller is listed in `config/aes-stage.ml.<OrgId>.json` under `enabledControllers`.
2. Read the Stage ML URL and `testUsernames.substitute` only from `config/aes-stage.ml.<OrgId>.json`.
3. Read `substitute_password` only from `.secrets/aes-stage.ml.<OrgId>.credentials.json`.
4. If either value is missing or is a placeholder, create a **BLOCKED** report and stop before browser actions.
5. Use this same Substitute identity for both numbered scenarios and the standalone Home menu workflow. Do not execute Substitute workflows under another active role. After each post-selection Home or Dashboard landing, open the user-info menu and confirm Substitute is active. If any other role is displayed, apply the one-time role reselection recovery in `role-scenario-matrix.md` and continue only after Substitute is confirmed.
6. Never print, display, log, screenshot, report, or copy credentials or session secrets.

## Shared safety and execution rules

- Use only the Stage ML URL and approved hosts in `config/aes-stage.ml.<OrgId>.json`.
- Do not accept, reject, cancel, create, edit, assign, save, or delete an absence or job. Never create or accept work to manufacture Scenario 14 data.
- Scenario 14 validates navigation and visible page content only. Empty job lists, zero-result states, and the absence of an individual job-detail link are acceptable when the required Substitute schedule/history views load successfully.
- Continue to the independent logout workflow after an absence-workflow failure or block when authentication remains safe.
- Start the logout workflow with a fresh Substitute session.

## Required standalone supplemental workflow — My Staff Profile

After the first responsive Substitute Home landing and Substitute role confirmation, execute the Substitute flow in `tests/navigation/standalone-home-menu-navigation.md` before Scenario 14. Validate only `My Staff Profile` as one independent supplemental result. Do not require or test `Staff Directory` or `Resource Library`, and do not inherit this workflow from a multi-role or multi-organization combination controller.

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

Classification: Mark **PASS** when all four required views work, including valid empty states. Mark **FAIL** after the mandatory 120-second failure observation when an exposed view cannot be selected or render correctly. Mark **BLOCKED** only when authentication, role selection, entitlement, or environment restrictions prevent access to a required Substitute view.

## Scenario 16 — Logout from React Home

Start a fresh Substitute session and apply **Flow 1 — Logout from React Home** plus only the shared authentication, source-page, logout, and login-page checks from `tests/logout/logout-navigation-matrix.md` to the Substitute React Home page.

Expected: Logout reaches and displays the approved login page. Do not click browser Back or test direct protected access.

## Result classification and reporting

Create the canonical report under `reports/full-suite/<OrgId>/<YYYYMMDD-HHMMSS>/roles/substitute-user/` with linked scenario pages, screenshots, and the organization run's continuous video. Archive older runs only within `reports/full-suite/<OrgId>/old-reports/`. Include:

- Substitute as the execution role
- One outcome card for scenario 14 and one for scenario 16
- One independent `Substitute · Standalone Home menu navigation` outcome with destination-level steps, screenshot, and measured video range
- The four Substitute schedule/history views and a result for each, without personal data
- Detailed action, expected result, actual result, and status rows
- PASS, FAIL, BLOCKED, and NOT TESTED totals
- Safe route observations and screenshot paths
- Numbered reproduction steps for failures
- Session termination and cleanup results

Mark each scenario independently. The overall result is **PASS** only when scenarios 14 and 16 and the required standalone Home menu navigation workflow all pass. Never include credentials, sensitive redirect data, or absence personal data.

## Invocation

`For OrgId <OrgId>, execute instructions/Multi User Instructions/substitute-user-execution.md in unattended safe mode using only the matching organization-scoped configuration and credentials.`
