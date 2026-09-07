# Multi-User Role Scenario Matrix

## Purpose

This file is the authoritative numbered scenario catalog and role-to-scenario routing matrix for every controller in this directory. Controllers must execute only the scenario IDs assigned to the active role. A combination account must execute each role block separately after selecting that role or organization context.

## Numbered scenario catalog

1. React Home → Extract / Import → legacy Import Data.
2. Legacy Import Data → Master Data → Employee → General Information.
3. React Home → Angular Daily Report.
4. Angular Daily Report → Master Data → Substitute → General Information.
5. Angular Daily Report → Extract / Import → legacy Import Data.
6. Legacy Import Data → Angular Daily Report.
7. Angular Daily Report → submit global search for `report` → confirm the Search page and navigation elements display → React Home.
8. React Home → submit global search for `report` → confirm the Search page and navigation elements display → Angular Daily Report.
9. Legacy Import Data → submit global search for `report` → confirm the Search page and navigation elements display → legacy Import Data.
10. React Home → Role Switcher → confirm every available role is displayed.
11. Angular Daily Report → Role Switcher → confirm every available role is displayed.
12. Legacy Import Data → Role Switcher → confirm every available role is displayed.
13. Organization 140462 configured Organization User only: React Employee General Information → Access → Manage Access. Execute the migrated-user and non-migrated-user cases independently.
14. Role-adapted absence validation: Organization/Campus/Employee open an absence and view every available tab; Substitute validates Available Jobs, Scheduled Jobs/Schedule, Past Jobs/History Jobs, and Non Work Days.
16. Successfully log out from React Home.
17. Successfully log out from Angular Daily Report.
18. Successfully log out from legacy Import Data.
19. Successfully log out from Employee maintenance.
20. Campus User React Home → Reports → Report Writer → confirm the Report Writer page and its primary controls load.
21. Campus User React Home → Settings → My Profile → Account Settings → confirm the page loads → return to the prior Campus page and React Home.

## Source test mapping

| Scenario IDs | Source Markdown test |
|---|---|
| 1, 3, 6, 7, 8, 9 | `tests/navigation/cross-application-navigation-matrix.md` |
| 2 | `tests/employee/general-information/add-employee-validation.md` navigation-only portion |
| 4 | `tests/navigation/angular-daily-report-to-substitute-general-information.md` |
| 5 | `tests/navigation/angular-daily-report-to-extract_import-to-import-data.md` |
| 10 | `tests/navigation/react-home-page-to-role-switcher-dropdown.md` |
| 11 | `tests/navigation/angular-daily-report-page-to-role-switcher-dropdown.md` |
| 12 | `tests/navigation/legacy-import-data-role-switcher.md` |
| 13 | `tests/navigation/manage-access.md` |
| 14 | `tests/navigation/absence-tab.md` |
| 16–19 | `tests/logout/logout-navigation-matrix.md`, flows 1–4 |
| 20–21 | `instructions/Multi User Instructions/campus-user-execution.md`, Campus User-only flows |

## Role authorization matrix

| Active role | Authorized scenario IDs |
|---|---|
| Organization User | 1–12, 14, 16–19; Scenario 13 only for the exact configured standalone Organization 140462 login |
| Campus User | 3, 7, 14, 16, 17, 20, 21 |
| Employee | 14, 16 |
| Substitute | 14, 16 |

Scenario 15 is retired and must not be executed or reported by any controller. Scenarios 20 and 21 are Campus User-only and must not run while Organization User, Employee, or Substitute is active. Do not execute scenario 8 for Campus User. Do not run Organization-only navigation, role-switcher, Manage Access, legacy Import, or Employee maintenance logout scenarios while the active role is Campus User, Employee, or Substitute.

## Scenario 13 per-login data gate

Scenario 13 executes only when all gates in `tests/navigation/manage-access.md` match: Organization `140462`, standalone `organization-user-execution.md`, active Organization User, and the exact configured `org_username` login.

- Execute both configured cases as independent workflow outcomes: migrated organization/migrated user and migrated organization/non-migrated user.
- Use only the exact search text, result identity, work ID, expected selected application, and Organization Details values from `scenarioData.manageAccess.cases`.
- For every other organization, controller login, or role, omit Scenario 13 entirely. Do not generate a NOT TESTED, BLOCKED, FAIL, or PASS result for it.
- Never borrow employee data from another organization or login.
- Continue with every independent Organization User scenario after the two cases or omission.

## Conditional supplemental workflow — App Switcher

For every active role and organization context, apply `app-switcher-validation.md` immediately after successful authentication/context selection and again from the Home-page top-left area. This check is available to every role but is not numbered and does not change the assigned scenario IDs above.

- If no App Switcher is visible at either checkpoint, record the observation inside the existing login/Home step and do not add a supplemental result.
- If a switcher is visible, capture its actual application inventory and validate a complete round trip from Absence Management to every displayed, enabled alternate application and back to Absence Management. Do not require Time & Attendance, Frontline Central, or any other fixed application to be present.
- Add a separate workflow outcome, screenshots, and continuous-video range for every distinct role/organization context where the switcher is exposed.
- Applications not displayed are outside the scope of that context and require no result. A displayed application that cannot be selected, a failed destination, an access-denied state, or a failed return is a FAIL. Recover the same role/context safely and continue independent scenarios.

## Required standalone supplemental workflow — Home menu navigation

Apply `tests/navigation/standalone-home-menu-navigation.md` once for each exact standalone controller invocation. This workflow is not a numbered scenario and must not be inherited by a combination controller merely because it executes one of the same roles.

- Standalone Organization User: validate `Staff Directory`, `My Staff Profile`, and `Resource Library` → `Browse Library`, `My Resource History`, and `My Resources`.
- Standalone Campus User: validate the same three menus and three Resource Library submenus.
- Standalone Employee: validate only `My Staff Profile`.
- Standalone Substitute: validate only `My Staff Profile`.
- Apply the workflow to every `OrgId` where the corresponding standalone controller is enabled.
- Give the workflow its own PASS, FAIL, BLOCKED, or NOT TESTED result, full-browser screenshots, detailed destination steps, and measured continuous-video range.
- Do not require Employee or Substitute to expose `Staff Directory` or `Resource Library`; those menus are outside their navigation scope.
- A standalone controller passes only when both its numbered scenarios and this required supplemental workflow pass.

## Combination-account execution algorithm

1. Authenticate with the combination account once and capture every visible role and organization context.
2. Compare the discovered contexts with the roles required by the selected controller. A missing required context blocks only that role block; continue with other available role blocks.
3. Execute role blocks in the exact order documented by the controller.
4. Select the required role or organization context before beginning its block. After the Home or Dashboard page becomes responsive, open the user-info/account-role menu and read the active role and organization context shown there. Compare them with the exact role/context selected for the block. Also confirm the expected Home, permitted navigation, and account control. Apply the conditional App Switcher validation at the post-login and Home-page checkpoints.
   - If the user-info menu shows any role or organization context other than the one selected—including Campus User landing as Employee, Employee landing as Organization User, or any other mismatch—do not fail or block the role block at that first mismatch.
   - From the responsive Home or Dashboard page, keep or reopen the user-info/account-role menu and select the exact intended role or role/organization context one more time.
   - After the reselection, wait for the destination to stabilize and then reopen the user-info menu to confirm the intended active role and organization context. Also confirm the role-appropriate Home/navigation controls and account control. Begin the role's scenarios only after this confirmation succeeds.
   - Record `Role reselection recovery applied after active role/context mismatch` as an execution observation, including the unexpected role/context without exposing credentials. Do not add a separate scenario result or downgrade an otherwise successful flow.
   - Apply this one-reselection recovery after every authentication, controller selection, fresh-session reselection, repeated role/organization context, logout setup, App Switcher return, and any navigation that explicitly returns to Home or Dashboard before another scenario begins. Do not loop indefinitely.
   - If the intended entry is missing from the reopened role menu, classify only that role/context block **BLOCKED**. If the entry is selectable but the second selection still cannot establish the intended responsive context, apply the standard 120-second observation/recovery rule and classify the affected flow **FAIL**. Continue independent role blocks.
   - When the user-info menu already displays the exact intended role and organization context, continue normally without a redundant reselection.
5. Execute the complete authorized scenario set for that role. Shared scenario IDs are intentionally repeated in each role/context; do not deduplicate them across roles.
6. Execute all non-logout scenarios in the current role/context before its logout scenarios.
7. Every numbered logout scenario must begin with a fresh authenticated session in the required role/context and end when the stable approved login page displays. Do not click browser Back or test direct protected routes; re-authenticate with the same combination account and reselect the next required role/context.
8. For repeated roles, such as Employee + Employee, execute the Employee set separately in every distinguishable Employee context.
9. For multi-organization accounts, execute the applicable role set separately in every distinguishable organization/role context.
10. When the next role cannot be selected without returning to My Frontline, use the supported My Frontline or app-switcher route, then select the next documented context. Do not reuse a stale role label as proof of a successful switch.

## Required standalone supplemental workflow — Browser Back after logout

Execute `tests/logout/organization-user-browser-back-after-logout.md` exactly once for the standalone Organization User controller in each selected organization.

- It is separate from scenarios 16–19 and is not a numbered scenario.
- It runs once in Organization 140462, once in Organization 140463, and once in Organization 140466: three validations total across the three organizations.
- Do not execute it for Campus User, Employee, Substitute, combination accounts, repeated roles, or additional source pages.
- The workflow logs out from a fresh Organization User React Home session, confirms the stable login page, clicks browser Back once, and verifies authenticated content is not restored as a usable session.
- Give it an independent status, full-browser screenshots, exact continuous-video range, and reproduction steps when failed.

## Scenario 14 safety by role

- Before generic searching or temporary creation, resolve and use any exact existing-absence mapping under `config/aes-stage.ml.<OrgId>.json` → `scenarioData.absenceTabs`. Match the active login username key, role, and organization context. Search the role-appropriate scheduled/list view by configured date and confirmation, then use the Dashboard Quick Action confirmation search when the record is not visible. Never delete a configured existing record.
- Honor an exact configured `executionDirective: NOT TESTED` without searching for or creating replacement data. Continue with independent scenarios.
- Scenario 14 has one narrow exception to unattended safe mode: when no existing viewable absence is available, execute the temporary create → reopen → validate every available tab → delete/cancel → verify absent lifecycle in `tests/navigation/absence-tab.md`.
- Organization User: prefer an existing absence read-only. Otherwise create the fallback only for the uniquely verified synthetic employee, then delete it and verify cleanup before continuing.
- Campus User: prefer an existing absence read-only. Otherwise use the fallback only when the Campus portal exposes both a supported creation path and a supported cleanup path for a uniquely verified test target. If either control or safe target verification is unavailable, mark scenario 14 **BLOCKED** without submitting.
- Employee: prefer an existing absence read-only. Otherwise use the Employee portal's self-service Create Absence flow for the currently authenticated configured Stage test identity, validate the created record, then delete/cancel that exact record and verify it is absent.
- Substitute: do not require an individual assignment, job, absence, confirmation link, or detail-tab page. Validate the four read-only portal views **Available Jobs**, **Scheduled Jobs/Schedule**, **Past Jobs/History Jobs**, and **Non Work Days**. Scroll each control into view, select it, and confirm its corresponding list, calendar, content, or explicit empty state loads. Never create, accept, assign, reject, cancel, edit, or delete work for this validation. A missing individual job is not a blocker; mark BLOCKED only when authentication, role, entitlement, or environment restrictions prevent access to a required view.
- Controller-specific exception: `multi-role-employee-employee-substitute-execution.md` uses its documented Substitute profile-reselection recovery and History navigation check, then returns Home for Scenario 16. That controller-specific flow overrides the generic four-view requirement for its Substitute context.
- Never create when the target is ambiguous, a substitute could be contacted, cleanup is unavailable, or the record cannot be uniquely identified. A created fallback cannot pass until post-cleanup search proves the exact temporary record is gone.

## Reporting requirements

1. Report the active role and organization context for every role block without exposing usernames or credentials.
2. Give every authorized scenario ID an independent PASS, FAIL, BLOCKED, or NOT TESTED result. For the exact configured Scenario 13 gate, give each configured case an independent outcome; omit Scenario 13 elsewhere.
3. For combination accounts, group outcomes first by role/context and then by scenario ID.
4. Include screenshots and exact continuous-video ranges for every executed scenario.
5. Include numbered reproduction steps for every FAIL and the exact dependency or missing permission for every BLOCKED result.
6. Report logout results separately because each logout uses a fresh session.
7. The controller passes only when every required role/context exists and every authorized scenario in every role/context passes.
8. When the App Switcher is exposed, include its supplemental outcome in that context and require it to pass. When it is not exposed at both checkpoints, include only the visibility observation and do not alter the controller result.
9. For an exact standalone controller, include the required Home menu navigation supplemental outcome. Do not add it to a combination controller.
10. Apply `url-evidence-validation.md` to every executed workflow. Capture the complete Chrome window and report a missing configured URL substring as a warning unless the unexpected destination also causes a functional FAIL.
