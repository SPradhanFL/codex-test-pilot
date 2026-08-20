# Multi-Organization Organization User + Campus User Execution Controller

## Purpose

Execute the clubbed Organization User and Campus User scenario sets across multiple organizations. Run Organization User scenarios **1–19** in every Organization User context, then run Campus User scenarios **3, 7, 14, 16, and 17** in every Campus User context.

## Mandatory preparation

Read completely before opening the browser:

1. `instructions/project-instructions.md`
2. `instructions/html-reporting-standard.md`
3. `config/aes-stage.ml.json`
4. `instructions/Multi User Instructions/role-scenario-matrix.md`
5. Every source test mapped to Organization User scenarios 1–19
6. `tests/navigation/cross-application-navigation-matrix.md`
7. `tests/navigation/absence-tab.md`
8. `tests/logout/logout-navigation-matrix.md`

Execute directly in headed Chrome through Playwright MCP. Keep the run read-only and do not generate automation source code.

Also read and execute `instructions/Multi User Instructions/app-switcher-validation.md` after every successful login or role/context selection and again at the Home-page checkpoint. Apply its visibility condition separately to every Organization User and Campus User organization context: run and report the switching workflow only when an App Switcher is exposed.

## Credentials

- Expected username: `vtqamail+stageSSDMultiOrgOUCU@dev.frontlineed.com`
- Username source: `testUsernames.multiOrgOrgCampus` in `config/aes-stage.ml.json`
- Password source: `AES_STAGE_MULTI_ORG_ORG_CAMPUS_PASSWORD`, otherwise `multi_org_org_campus_password` in `.secrets/aes-stage.ml.credentials.json`
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
3. Execute Campus User scenario **7**: Angular Daily Report to global search for `report`, accept results or the explicit `0 results` state, then navigate to React Home.
4. Execute Campus User scenario **14** read-only. If no existing absence is accessible, mark only this scenario **BLOCKED** and do not create data.
5. Execute Campus User scenario **16** from a fresh login with this Campus context reselected.
6. Execute Campus User scenario **17** from another fresh login with this Campus context reselected.
7. Record all five Campus User results separately for this context. Do not run Campus scenario 8 and do not deduplicate IDs shared with Organization User.

For every role switch, confirm the destination, active role, and organization together. A changed label on the wrong portal does not count as a successful switch.

Do not create, edit, approve, reconcile, import, invite, or delete business data.

## Reporting

Follow `instructions/html-reporting-standard.md`. Create the run under `reports/role-executions/multi-org-org-campus/<YYYYMMDD-HHMMSS>/`. Group results by organization and role, include all 19 outcomes for every Organization User context and all five outcomes for every Campus User context, screenshots, one continuous video, expected/actual results, and failure reproduction steps without credentials or personal data.

## Invocation

`Execute instructions/Multi User Instructions/multi-org-organization-campus-execution.md in unattended safe mode.`
