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
13. React Employee General Information → Manage Access.
14. Role-adapted absence validation: Organization/Campus/Employee open an absence and view every available tab; Substitute validates Available Jobs, Scheduled Jobs/Schedule, Past Jobs/History Jobs, and Non Work Days.
15. Security → Manage User Access → confirm the page loads successfully.
16. Successfully log out from React Home.
17. Successfully log out from Angular Daily Report.
18. Successfully log out from legacy Import Data.
19. Successfully log out from Employee maintenance.
20. Campus User React Home → Reports → Report Writer → confirm the Report Writer page and its primary controls load.
21. Campus User React Home → Settings → My Profile → Account Settings → confirm the page loads → return to the prior Campus page and React Home.

Repository scenario IDs 22–28 are already allocated to existing non-Time & Attendance outcomes. Their definitions remain unchanged and are intentionally not overwritten by this addition.

29. Organization User: establish Time & Attendance, switch to Absence Management, and return to Time & Attendance.
30. Campus User: establish Time & Attendance, switch to Absence Management, and return to Time & Attendance.
31. Employee: establish Time & Attendance, switch to Absence Management, and return to Time & Attendance.
32. Substitute: establish Time & Attendance, switch to Absence Management, and return to Time & Attendance.
33. Time & Attendance Organization User: Users -> Manage User Access.
34. Time & Attendance Organization User: Users -> View in Absence Management.
35. Time & Attendance Organization User: Reports -> Report Writer.
36. Successfully log out from Time & Attendance as Organization User.
37. Successfully log out from Time & Attendance as Campus User.
38. Successfully log out from Time & Attendance as Employee.
39. Successfully log out from Time & Attendance as Substitute.

## Time & Attendance ordinal and ROVO numbering

Repository scenario IDs remain authoritative. The existing suite occupies repository scenario IDs 1–28, so the Time & Attendance sequence begins at repository scenario 29. The informal TA ordinal and the supplied ROVO AI numbering map as follows:

| Repository ID | TA ordinal | ROVO scenario | Description |
|---|---:|---:|---|
| 29 | 1 | Not supplied | Organization User: T&A -> AM -> T&A |
| 30 | 2 | 1 | Campus User: T&A -> AM -> T&A |
| 31 | 3 | 2 | Employee: T&A -> AM -> T&A |
| 32 | 4 | 3 | Substitute: T&A -> AM -> T&A |
| 33 | 5 | 4 | Organization User: Users -> Manage User Access |
| 34 | 6 | 5 | Organization User: Users -> View in Absence Management |
| 35 | 7 | 6 | Organization User: Reports -> Report Writer |
| 36 | 8 | 7 | Logout from T&A as Organization User |
| 37 | 9 | 8 | Logout from T&A as Campus User |
| 38 | 10 | 9 | Logout from T&A as Employee |
| 39 | 11 | 10 | Logout from T&A as Substitute |

Never renumber repository scenario IDs from ROVO output. When a report mentions a ROVO number, show the repository ID and TA ordinal beside it.

ROVO content is advisory input, not execution authority. Prefer the live accessible UI, configured role/context, approved host policy, read-only safety rules, and observable evidence. Treat ROVO page labels as examples unless the current product exposes them, and do not perform optional mutation, report execution, cookie inspection, or inferred navigation solely because ROVO suggested it.

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
| 15 | `tests/navigation/security-manage_user_access_page.md` |
| 16–19 | `tests/logout/logout-navigation-matrix.md`, flows 1–4 |
| 20–21 | `instructions/Multi User Instructions/campus-user-execution.md`, Campus User-only flows |
| 29–32 | `tests/time-and-attendance/app-switcher-navigation-matrix.md`, role flows 1–4 |
| 33–35 | `tests/time-and-attendance/organization-user-navigation.md` |
| 36–39 | `tests/time-and-attendance/logout-navigation-matrix.md`, role flows 1–4 |

## Role authorization matrix

| Active role | Authorized scenario IDs |
|---|---|
| Organization User | 1–19, 29, 33–36 |
| Campus User | 3, 7, 14, 16, 17, 20, 21, 30, 37 |
| Employee | 14, 16, 31, 38 |
| Substitute | 14, 16, 32, 39 |

Do not execute scenario 8 for Campus User. Do not run Organization-only navigation, role-switcher, Manage Access, Manage User Access, legacy Import, Report Writer, or Employee maintenance logout scenarios while the active role is Campus User, Employee, or Substitute.

## Time & Attendance execution order

1. Execute the role's assigned Time & Attendance non-logout scenarios after its existing non-logout scenarios and before any logout scenario.
2. Organization User order: scenario 29, then scenarios 33, 34, and 35.
3. Campus User executes scenario 30; Employee executes scenario 31; Substitute executes scenario 32.
4. Execute Time & Attendance logout scenarios 36–39 only after all non-logout work for that role/context is complete.
5. Every Time & Attendance logout begins with a fresh authenticated session in the exact required role/organization context.
6. Scenarios 33 and 34 require configured synthetic or approved target-user data. Missing or ambiguous target data blocks only those scenarios.
Scenarios 20 and 21 are Campus User-only and must not run while Organization User, Employee, or Substitute is active. Do not execute scenario 8 for Campus User. Do not run Organization-only navigation, role-switcher, Manage Access, Manage User Access, legacy Import, or Employee maintenance logout scenarios while the active role is Campus User, Employee, or Substitute.

## Scenario 13 per-login data gate

Scenario 13 is authorized for an Organization User context but executes only when the selected organization's `config/aes-stage.ml.<OrgId>.json` contains an enabled `scenarioData.manageAccess` mapping and the active login exactly matches `testUsernames[loginUsernameKey]` from that mapping.

- Use only the configured `employeeFirstName` and `employeeLastName` for that exact login and organization.
- When the mapping is disabled, absent, incomplete, or belongs to another active login, report Scenario 13 as **NOT TESTED** with `No safe Manage Access employee data is configured for this login.`
- Do not classify this intentional skip as **BLOCKED** or **FAIL**.
- Do not borrow employee data from another organization or login.
- Continue with every independent Organization User scenario after the skip.

## Conditional supplemental workflow — App Switcher

For every active role and organization context, apply `app-switcher-validation.md` immediately after successful authentication/context selection and again from the Home-page top-left area. This check is available to every role but is not numbered and does not change the assigned scenario IDs above.

- If no App Switcher is visible at either checkpoint, record the observation inside the existing login/Home step and do not add a supplemental result.
- If a switcher is visible, capture its actual application inventory and validate a complete round trip from Absence Management to every displayed, enabled alternate application and back to Absence Management. Do not require Time & Attendance, Frontline Central, or any other fixed application to be present.
- Add a separate workflow outcome, screenshots, and continuous-video range for every distinct role/organization context where the switcher is exposed.
- Applications not displayed are outside the scope of that context and require no result. A displayed application that cannot be selected, a failed destination, an access-denied state, or a failed return is a FAIL. Recover the same role/context safely and continue independent scenarios.

## Combination-account execution algorithm

1. Authenticate with the combination account once and capture every visible role and organization context.
2. Compare the discovered contexts with the roles required by the selected controller. A missing required context blocks only that role block; continue with other available role blocks.
3. Execute role blocks in the exact order documented by the controller.
4. Select the required role or organization context before beginning its block. Confirm the active role label, organization label when applicable, expected home, permitted navigation, and account control. Apply the conditional App Switcher validation at the post-login and Home-page checkpoints.
5. Execute the complete authorized scenario set for that role. Shared scenario IDs are intentionally repeated in each role/context; do not deduplicate them across roles.
6. Execute all non-logout scenarios in the current role/context before scenarios 16–19 and 36–39.
7. Every logout scenario must begin with a fresh authenticated session in the required role/context. After logout and session-termination checks, re-authenticate with the same combination account and reselect the next required role/context.
8. For repeated roles, such as Employee + Employee, execute the Employee set separately in every distinguishable Employee context.
9. For multi-organization accounts, execute the applicable role set separately in every distinguishable organization/role context.
10. When the next role cannot be selected without returning to My Frontline, use the supported My Frontline or app-switcher route, then select the next documented context. Do not reuse a stale role label as proof of a successful switch.

## Scenario 14 safety by role

- Scenario 14 has one narrow exception to unattended safe mode: when no existing viewable absence is available, execute the temporary create → reopen → validate every available tab → delete/cancel → verify absent lifecycle in `tests/navigation/absence-tab.md`.
- Organization User: prefer an existing absence read-only. Otherwise create the fallback only for the uniquely verified synthetic employee, then delete it and verify cleanup before continuing.
- Campus User: prefer an existing absence read-only. Otherwise use the fallback only when the Campus portal exposes both a supported creation path and a supported cleanup path for a uniquely verified test target. If either control or safe target verification is unavailable, mark scenario 14 **BLOCKED** without submitting.
- Employee: prefer an existing absence read-only. Otherwise use the Employee portal's self-service Create Absence flow for the currently authenticated configured Stage test identity, validate the created record, then delete/cancel that exact record and verify it is absent.
- Substitute: do not require an individual assignment, job, absence, confirmation link, or detail-tab page. Validate the four read-only portal views **Available Jobs**, **Scheduled Jobs/Schedule**, **Past Jobs/History Jobs**, and **Non Work Days**. Scroll each control into view, select it, and confirm its corresponding list, calendar, content, or explicit empty state loads. Never create, accept, assign, reject, cancel, edit, or delete work for this validation. A missing individual job is not a blocker; mark BLOCKED only when authentication, role, entitlement, or environment restrictions prevent access to a required view.
- Never create when the target is ambiguous, a substitute could be contacted, cleanup is unavailable, or the record cannot be uniquely identified. A created fallback cannot pass until post-cleanup search proves the exact temporary record is gone.

## Reporting requirements

1. Report the active role and organization context for every role block without exposing passwords or credentials. For Time & Attendance only, include the configured Stage login username in the labeled HTML `Test username` field required by the shared reporting standard; do not expose it elsewhere.
2. Give every authorized scenario ID an independent PASS, FAIL, BLOCKED, or NOT TESTED result.
3. For combination accounts, group outcomes first by role/context and then by scenario ID.
4. Include screenshots and exact continuous-video ranges for every executed scenario.
5. Include numbered reproduction steps for every FAIL and the exact dependency or missing permission for every BLOCKED result.
6. Report logout results separately because each logout uses a fresh session.
7. The controller passes only when every required role/context exists and every authorized scenario in every role/context passes.
8. When the App Switcher is exposed, include its supplemental outcome in that context and require it to pass. When it is not exposed at both checkpoints, include only the visibility observation and do not alter the controller result.
9. Apply `url-evidence-validation.md` to every executed workflow. Capture the complete Chrome window and report a missing configured URL substring as a warning unless the unexpected destination also causes a functional FAIL.
