# Organization User Execution Controller

## Purpose

Execute the 17 standard Organization User scenarios **1–12, 14, and 16–19** in `role-scenario-matrix.md`, the required standalone Home menu navigation workflow, and one separate Browser Back-after-logout workflow. For the exact configured Organization 140462 standalone login only, also execute both Scenario 13 Manage Access cases independently. Scenario 15 is retired. This file is an execution controller; it does not replace or modify the mapped source tests.

## Mandatory preparation

Before opening the browser, read completely:

1. `instructions/project-instructions.md`
2. `instructions/application-details.md`
3. `instructions/test-data.md`
4. `instructions/full-suite-headed-video-execution.md`
5. `config/aes-stage.ml.<OrgId>.json`
6. `instructions/Multi User Instructions/role-scenario-matrix.md`
7. Every source Markdown test mapped to the active Organization User scenarios in that matrix
8. `tests/navigation/standalone-home-menu-navigation.md`
9. `tests/logout/organization-user-browser-back-after-logout.md`

Execute the scenarios directly in Chrome through Playwright MCP. Do not generate Playwright, TypeScript, or reusable automation source code.

Also read and execute `instructions/Multi User Instructions/app-switcher-validation.md` after every successful login or role/context selection and again at the Home-page checkpoint. Apply its visibility condition: run and report the switching workflow only when an App Switcher is exposed.

Also read and execute `instructions/Multi User Instructions/stage-ml-application-launch.md` after every Passport authentication and before role scenarios. Follow its normal tile-click, final-tab discovery, launcher recovery, and responsive-application checks.

Also read and execute `instructions/Multi User Instructions/url-evidence-validation.md` at every workflow's final evidence checkpoint. Use its full-browser screenshot and URL warning rules.

## Organization User credentials

Resolve credentials before opening the browser:

1. Require the invocation to supply `OrgId` and confirm this controller is listed in `config/aes-stage.ml.<OrgId>.json` under `enabledControllers`.
2. Read the Stage ML URL and `testUsernames.org_username` only from `config/aes-stage.ml.<OrgId>.json`.
3. Read `org_password` only from `.secrets/aes-stage.ml.<OrgId>.credentials.json`.
4. For a role-switcher-specific workflow only, use `testUsernames.userRoleSwitcher` and `roleswitcher_org_password` from the same organization-scoped files. Other scenario-level special-purpose credential rules take precedence only for their documented test.
5. If a required username or password cannot be resolved, mark the affected scenario **BLOCKED** and continue with independent scenarios that have valid credentials.
6. Never print, display, log, screenshot, report, or copy a password, token, cookie, or authentication fragment.

## Scenario selection and execution order

1. The standard Organization User authorization set is scenarios **1–12, 14, and 16–19** in `role-scenario-matrix.md`. Scenario 15 is retired.
2. After the first responsive Organization User Home landing and role confirmation, execute `tests/navigation/standalone-home-menu-navigation.md` as one required supplemental workflow. Validate `Staff Directory`, `My Staff Profile`, and all three `Resource Library` submenus before Scenario 1.
3. Execute non-logout scenarios **1–12 and 14** in numerical order unless a source test requires a dependency-safe navigation prerequisite.
4. Execute logout scenarios 16–19 last. Each logout scenario begins with a fresh authenticated Organization User session and ends as soon as a stable approved login page is validated. Do not click browser Back or test direct protected access within these numbered logout scenarios.
5. Use the source test mapped to each scenario ID for its detailed steps, interaction checks, expected results, safety rules, and reporting requirements.
6. Between scenarios 12 and 14, apply the exact gate in `tests/navigation/manage-access.md`. Only the standalone Organization 140462 `org_username` login executes Scenario 13, and it produces two independent case outcomes. Every other login and organization omits Scenario 13 entirely without a result.
7. Do not execute unrelated Markdown tests merely because they exist under `tests/`. The standalone Home menu test is the only required unnumbered test for this controller; other new files enter only after explicit routing in `role-scenario-matrix.md`.
8. Unless the invocation explicitly authorizes destructive mode, use unattended safe mode and do not submit a persistent create, update, delete, import, approval, reconciliation, or invitation action. Scenario 14 is the sole exception: when no existing absence is available, execute the temporary create-and-cleanup fallback in `tests/navigation/absence-tab.md` and require verified deletion before continuing.
9. After scenarios 16–19, execute `tests/logout/organization-user-browser-back-after-logout.md` once as a separate required supplemental workflow. This is the only Browser Back-after-logout check for the organization and must not be repeated for individual pages, roles, or combination accounts.

## Isolation and continuation rules

1. Use the Organization User for all tests except an explicit scenario-level special-purpose credential override.
2. Restore filters, forms, dropdowns, dates, and navigation state after each safe test.
3. Re-authenticate when a test logs out or invalidates the session.
4. Continue after a **FAIL** or **BLOCKED** when the next test is independent and safe to execute.
5. Block a dependent test when its prerequisite data or cleanup is unavailable; state the dependency in the report.
6. Do not convert a failed, blocked, or not-tested scenario to **PASS** merely because later scenarios succeed.

## Reporting

Follow the full-suite artifact and dashboard rules in `instructions/full-suite-headed-video-execution.md`. The consolidated result must include:

For a standalone Organization User invocation, use the organization-scoped full-suite pipeline and create the canonical role report under `reports/full-suite/<OrgId>/<YYYYMMDD-HHMMSS>/roles/organization-user/`. Archive older runs only within `reports/full-suite/<OrgId>/old-reports/`.

- Organization User as the execution role
- A complete outcome for scenarios 1–12, 14, and 16–19, plus two independent Scenario 13 case outcomes only when the exact Organization 140462 gate matches
- One independent `Organization User · Standalone Home menu navigation` outcome with destination-level steps, screenshots, and measured video range
- One independent `Organization User · Browser Back after logout` outcome for the selected organization
- PASS, FAIL, BLOCKED, and NOT TESTED totals
- A detailed result for every discovered test and every documented step
- Screenshots and video evidence when required by the full-suite instruction
- Numbered reproduction steps for every failure
- Safety, restoration, and cleanup results

The overall Organization User result is **PASS** only when every workflow authorized for the resolved organization/login gate and the required standalone Home menu navigation workflow pass. Never include secrets or sensitive identity data in an artifact.

## Invocation

`For OrgId <OrgId>, execute instructions/Multi User Instructions/organization-user-execution.md in unattended safe mode using only the matching organization-scoped configuration and credentials.`
