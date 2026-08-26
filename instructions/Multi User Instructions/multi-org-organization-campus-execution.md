# Multi-Organization Organization User + Campus User Execution Controller

## Purpose

Execute the clubbed Organization User and Campus User scenario sets across multiple organizations. Run Organization User scenarios **1–19** in every Organization User context, then run Campus User scenarios **3, 7, 14, 16, 17, 20, and 21** in every Campus User context.

## Mandatory preparation

Read completely before opening the browser:

1. `instructions/project-instructions.md`
2. `instructions/html-reporting-standard.md`
3. `config/aes-stage.ml.<OrgId>.json`
4. `instructions/Multi User Instructions/role-scenario-matrix.md`
5. `instructions/Multi User Instructions/campus-user-execution.md`, using only its Scenario 20 and Scenario 21 definitions
6. Every source test mapped to Organization User scenarios 1–19
7. `tests/navigation/cross-application-navigation-matrix.md`
8. `tests/navigation/absence-tab.md`
9. `tests/logout/logout-navigation-matrix.md`

Execute directly in headed Chrome through Playwright MCP. Keep the run read-only except for Scenario 14's temporary absence create-and-cleanup lifecycle, and do not generate automation source code.

Also read and execute `instructions/Multi User Instructions/app-switcher-validation.md` after every successful login or role/context selection and again at the Home-page checkpoint. Apply its visibility condition separately to every Organization User and Campus User organization context: run and report the switching workflow only when an App Switcher is exposed.

Also read and execute `instructions/Multi User Instructions/stage-ml-application-launch.md` after every Passport authentication and before role scenarios. Apply its final-tab discovery and launcher recovery checks in every role/organization context.

Also read and execute `instructions/Multi User Instructions/url-evidence-validation.md` at every workflow's final evidence checkpoint. Use its full-browser screenshot and URL warning rules in every role/organization context.

## Credentials

- Require `OrgId` and confirm this controller is enabled in `config/aes-stage.ml.<OrgId>.json`.
- Username source: `testUsernames.multiOrgOrgCampus` in the organization-scoped configuration.
- Password source: `multi_org_org_campus_password` in `.secrets/aes-stage.ml.<OrgId>.credentials.json`.
- Never place the password or session secrets in this file, a report, screenshot, video, log, or response.

## Context-block execution order

### Preparation — discover contexts

1. Authenticate and verify the initial organization/role context is visible and responsive.
2. Open the organization/role switcher and capture all visible context entries.
3. Verify Organization User and Campus User contexts appear with distinguishable organization labels. A missing context blocks only that context's role block.

### Organization User context blocks

For every Organization User organization context, in visible order:

1. Select the context and verify React Home, active organization/role labels, global navigation, and account control.
2. Execute Organization User scenarios **1–15** in numerical and dependency-safe order.
3. Execute scenarios **16, 17, 18, and 19** independently. Each logout begins with a fresh login to this same account and the exact Organization User organization context reselected.
4. Record all 19 results separately for this context. Do not merge them with another organization.

### Campus User context blocks

After all Organization User contexts, for every Campus User organization context, in visible order:

1. Re-authenticate with the same account, select the Campus User context, and verify Campus Dashboard, active organization/role labels, permitted navigation, and account control.
2. Execute Campus User scenario **3**: React Home to Angular Daily Report.
3. Execute Campus User scenario **7**: Angular Daily Report to global search for `report`, confirm the Search page and navigation elements display, then navigate to React Home. Do not validate search-result data or counts.
4. Execute Campus-only scenario **20** exactly as defined in `campus-user-execution.md`: React Home → `Reports` → `Report Writer`; confirm the destination and primary controls load without modifying report data.
5. Execute Campus-only scenario **21** exactly as defined in `campus-user-execution.md`: React Home → `Settings` → `My Profile` → `Account Settings`; validate the destination, return to the prior page, and return to Campus React Home without modifying account data.
6. Execute Campus User scenario **14**. Prefer an existing absence read-only; if none is accessible, execute the temporary create-and-cleanup fallback in `tests/navigation/absence-tab.md` when this exact Campus context exposes safe creation and cleanup controls.
7. Execute Campus User scenario **16** from a fresh login with this Campus context reselected.
8. Execute Campus User scenario **17** from another fresh login with this Campus context reselected.
9. Record all seven Campus User results separately for this context. Do not run Campus scenario 8 and do not deduplicate IDs shared with Organization User.

For every role switch, confirm the destination, active role, and organization together. A changed label on the wrong portal does not count as a successful switch.

Do not create, edit, approve, reconcile, import, invite, or delete business data except for Scenario 14's exact temporary absence create-and-cleanup lifecycle.

## Reporting

Follow `instructions/html-reporting-standard.md`. Create the role report under `reports/full-suite/<OrgId>/<YYYYMMDD-HHMMSS>/roles/multi-org-organization-campus/`. Group results by organization and role, include all 19 outcomes for every Organization User context and all seven outcomes for every Campus User context, screenshots, one continuous video, expected/actual results, and failure reproduction steps without credentials or personal data.

## Invocation

`For OrgId <OrgId>, execute instructions/Multi User Instructions/multi-org-organization-campus-execution.md in unattended safe mode using only the matching organization-scoped configuration and credentials.`
