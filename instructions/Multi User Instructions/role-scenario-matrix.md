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
7. Angular Daily Report → global search for `report` → confirm matching results or the explicit `0 results` state → React Home.
8. React Home → global search for `report` → confirm matching results or the explicit `0 results` state → Angular Daily Report.
9. Legacy Import Data → global search for `report` → confirm matching results or the explicit `0 results` state → legacy Import Data.
10. React Home → Role Switcher → confirm every available role is displayed.
11. Angular Daily Report → Role Switcher → confirm every available role is displayed.
12. Legacy Import Data → Role Switcher → confirm every available role is displayed.
13. React Employee General Information → Manage Access.
14. Open an existing absence and successfully view every available tab.
15. Security → Manage User Access → confirm the page loads successfully.
16. Successfully log out from React Home.
17. Successfully log out from Angular Daily Report.
18. Successfully log out from legacy Import Data.
19. Successfully log out from Employee maintenance.

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

## Role authorization matrix

| Active role | Authorized scenario IDs |
|---|---|
| Organization User | 1–19 |
| Campus User | 3, 7, 14, 16, 17 |
| Employee | 14, 16 |
| Substitute | 14, 16 |

Do not execute scenario 8 for Campus User. Do not run Organization-only navigation, role-switcher, Manage Access, Manage User Access, legacy Import, or Employee maintenance logout scenarios while the active role is Campus User, Employee, or Substitute.

## Conditional supplemental workflow — App Switcher

For every active role and organization context, apply `app-switcher-validation.md` immediately after successful authentication/context selection and again from the Home-page top-left area. This check is available to every role but is not numbered and does not change the assigned scenario IDs above.

- If no App Switcher is visible at either checkpoint, record the observation inside the existing login/Home step and do not add a supplemental result.
- If a switcher is visible, validate Absence Management → Time & Attendance → Absence Management and Absence Management → Frontline Central → Absence Management.
- Add a separate workflow outcome, screenshots, and continuous-video range for every distinct role/organization context where the switcher is exposed.
- A visible switcher with a missing application, failed destination, access-denied state, or failed return is a FAIL. Recover the same role/context safely and continue independent scenarios.

## Combination-account execution algorithm

1. Authenticate with the combination account once and capture every visible role and organization context.
2. Compare the discovered contexts with the roles required by the selected controller. A missing required context blocks only that role block; continue with other available role blocks.
3. Execute role blocks in the exact order documented by the controller.
4. Select the required role or organization context before beginning its block. Confirm the active role label, organization label when applicable, expected home, permitted navigation, and account control. Apply the conditional App Switcher validation at the post-login and Home-page checkpoints.
5. Execute the complete authorized scenario set for that role. Shared scenario IDs are intentionally repeated in each role/context; do not deduplicate them across roles.
6. Execute all non-logout scenarios in the current role/context before its logout scenarios.
7. Every logout scenario must begin with a fresh authenticated session in the required role/context. After logout and session-termination checks, re-authenticate with the same combination account and reselect the next required role/context.
8. For repeated roles, such as Employee + Employee, execute the Employee set separately in every distinguishable Employee context.
9. For multi-organization accounts, execute the applicable role set separately in every distinguishable organization/role context.
10. When the next role cannot be selected without returning to My Frontline, use the supported My Frontline or app-switcher route, then select the next documented context. Do not reuse a stale role label as proof of a successful switch.

## Scenario 14 safety by role

- Organization User: follow `tests/navigation/absence-tab.md`; in unattended safe mode use an existing absence. If none exists, mark scenario 14 **BLOCKED** unless the invocation explicitly authorizes the documented create-and-cleanup fallback.
- Campus User: use an existing absence read-only. If none exists or the role lacks access, mark scenario 14 **BLOCKED** and do not create data.
- Employee: use an existing absence from the Employee portal read-only. If none exists, mark scenario 14 **BLOCKED** and do not create data.
- Substitute: use an existing assignment, job, or absence available to the Substitute portal read-only. Traverse every available detail tab; when the portal exposes inline details instead of tabs, validate the complete inline detail region and explicitly report that no separate tabs were presented. If no item exists, mark scenario 14 **BLOCKED** and do not accept or create work.

## Reporting requirements

1. Report the active role and organization context for every role block without exposing usernames or credentials.
2. Give every authorized scenario ID an independent PASS, FAIL, BLOCKED, or NOT TESTED result.
3. For combination accounts, group outcomes first by role/context and then by scenario ID.
4. Include screenshots and exact continuous-video ranges for every executed scenario.
5. Include numbered reproduction steps for every FAIL and the exact dependency or missing permission for every BLOCKED result.
6. Report logout results separately because each logout uses a fresh session.
7. The controller passes only when every required role/context exists and every authorized scenario in every role/context passes.
8. When the App Switcher is exposed, include its supplemental outcome in that context and require it to pass. When it is not exposed at both checkpoints, include only the visibility observation and do not alter the controller result.
