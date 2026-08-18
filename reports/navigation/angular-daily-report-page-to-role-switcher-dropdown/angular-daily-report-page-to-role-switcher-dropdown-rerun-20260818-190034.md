# Angular Daily Report to Role Switcher — Evidence Rerun

| Field | Result |
|---|---|
| Environment | AES Stage |
| Account | `report_139963` |
| Started | 2026-08-18 19:00:34 +05:30 |
| Finished | 2026-08-18 19:05:56 +05:30 |
| Overall status | **BLOCKED** |
| Video evidence | [role-switcher-blocked-evidence.webm](evidence-20260818-190034/role-switcher-blocked-evidence.webm) |
| Data changes | None |

## Exact Blocking Steps

| Step | Required behavior | Actual behavior | Result |
|---|---|---|---|
| **6** | Opening the Profile Icon displays the user's assigned roles. | The menu opened, but displayed only **Your Frontline Account**, **Account Settings**, and **Sign Out**. The **Your Roles** section was absent. | **FAIL — primary blocking point** |
| **7** | Select **Campus User (Campus User)**. | Campus User was not displayed or selectable. | **BLOCKED** |
| **8** | Select **Employee (Employee)**. | Employee was not displayed or selectable. | **BLOCKED** |
| **9** | Select **Substitute**. | Substitute was not displayed or selectable. | **BLOCKED** |
| **10** | Confirm each selected role becomes active and its home page responds. | No required role could be selected. | **BLOCKED** |
| **11** | Reopen **Your Roles** and verify exactly four assigned roles. | **Your Roles** was unavailable; zero role entries were present. | **BLOCKED** |
| **14** | Select the currently active role from **Your Roles**. | Active Organization User was not listed inside a Your Roles section. | **NOT TESTED** |
| **15** | Refresh after a successful role switch and verify persistence. | A successful role switch could not be performed. Refresh preserved the existing Organization User context and responsive Daily Report. | **PARTIAL / BLOCKED** |

## Checks That Passed

- Authentication succeeded using the configured secure password source.
- Daily Report loaded at `https://adminwebstage2.flqa.net/reports/absence/daily-report`.
- Page title was `Aesop - Daily Report`; the **Daily Report** heading was visible.
- Profile control displayed `Report 139963 - Organization User`.
- The account menu opened and dismissed without changing the URL or active role.
- No unknown, duplicate, or blank visible role entry was present.
- Browser refresh retained the responsive Daily Report and Organization User context.
- Two repeated menu dismissal checks preserved the same role and URL.
- No browser-console errors were observed.
- No record was created, changed, saved, or deleted.

## Video Evidence Sequence

The 1280x720 WebM clip is assembled from browser-only frames captured during this rerun; login and credentials are excluded.

1. Daily Report loaded with Organization User active.
2. Profile menu opened, showing account options but no Your Roles section.
3. Menu dismissed with no navigation or role change.
4. Menu reopened with the same missing-role state.
5. Page refreshed successfully.
6. Menu reopened after refresh; roles were still absent.
7. Final profile-menu state reproduced for cross-verification.

## Evidence Files

- [Video](evidence-20260818-190034/role-switcher-blocked-evidence.webm)
- [Blocking screenshot](evidence-20260818-190034/frames/02-role-menu-missing-roles.png)
- [Post-refresh screenshot](evidence-20260818-190034/frames/06-after-refresh-menu-still-missing-roles.png)

## Conclusion

The scenario is blocked by account-role availability, not authentication or Daily Report navigation. Assign the expected Organization User, Campus User, Employee, and Substitute roles to `report_139963`, or use another Stage account containing all four roles, then rerun the role-switch steps.
