# Organization User Execution Controller

## Purpose

Execute all 19 numbered Organization User scenarios in `role-scenario-matrix.md`. This file is an execution controller; it does not replace or modify the mapped source tests.

## Mandatory preparation

Before opening the browser, read completely:

1. `instructions/project-instructions.md`
2. `instructions/application-details.md`
3. `instructions/test-data.md`
4. `instructions/full-suite-headed-video-execution.md`
5. `config/aes-stage.ml.<OrgId>.json`
6. `instructions/Multi User Instructions/role-scenario-matrix.md`
7. Every source Markdown test mapped to scenarios 1–19 in that matrix

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

1. The Organization User authorization set is exactly scenarios **1–19** in `role-scenario-matrix.md`.
2. Execute non-logout scenarios 1–15 in numerical order unless a source test requires a dependency-safe navigation prerequisite.
3. Execute logout scenarios 16–19 last. Each logout scenario begins with a fresh authenticated Organization User session and completes its Back and direct-route checks before the next login.
4. Use the source test mapped to each scenario ID for its detailed steps, interaction checks, expected results, safety rules, and reporting requirements.
5. Before Scenario 13, apply the per-login data gate in `tests/navigation/manage-access.md`. Execute it only for an enabled organization-scoped mapping whose `loginUsernameKey` exactly matches the active login. For every other login, record Scenario 13 as **NOT TESTED**, state that no safe Manage Access employee data is configured, and continue.
6. Do not execute unrelated Markdown tests merely because they exist under `tests/`. New files enter this controller only after they are assigned a numbered Organization User scenario in `role-scenario-matrix.md`.
7. Unless the invocation explicitly authorizes destructive mode, use unattended safe mode and do not submit a persistent create, update, delete, import, approval, reconciliation, or invitation action. Scenario 14 is the sole exception: when no existing absence is available, execute the temporary create-and-cleanup fallback in `tests/navigation/absence-tab.md` and require verified deletion before continuing.

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
- A complete outcome for each numbered scenario 1–19 in resolved execution order
- PASS, FAIL, BLOCKED, and NOT TESTED totals
- A detailed result for every discovered test and every documented step
- Screenshots and video evidence when required by the full-suite instruction
- Numbered reproduction steps for every failure
- Safety, restoration, and cleanup results

The overall Organization User result is **PASS** only when all 19 required scenarios pass. Never include secrets or sensitive identity data in an artifact.

## Invocation

`For OrgId <OrgId>, execute instructions/Multi User Instructions/organization-user-execution.md in unattended safe mode using only the matching organization-scoped configuration and credentials.`
