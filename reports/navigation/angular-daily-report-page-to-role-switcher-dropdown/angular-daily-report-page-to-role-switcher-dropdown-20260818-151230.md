# Angular Daily Report Page to Role Switcher Dropdown

| Field | Result |
|---|---|
| Application | AES Stage |
| Environment | `https://aesstage.flqa.net` |
| Account | `report_139963` |
| Execution window | 2026-08-18 15:07 to 15:12:30 +05:30 |
| Overall status | **BLOCKED** |
| Data changes | None |

## Summary

| Metric | Count |
|---|---:|
| Total flows | 4 |
| Flows passed | 0 |
| Flows failed | 1 |
| Flows blocked | 3 |
| Detailed checks passed | 13 |
| Detailed checks failed | 1 |
| Detailed checks blocked/not tested | 5 |

## Scenario Outcomes

### 1. Angular Daily Report Page to Role Switcher Dropdown — FAIL

The Angular Daily Report page loaded and the profile control opened successfully. The menu displayed **Your Frontline Account**, **Account Settings**, and **Sign Out**, but the required **Your Roles** section and its four assigned-role entries were absent.

### 2. Switch to Campus User — BLOCKED

No **Campus User (Campus User)** role entry was displayed or selectable, so the Campus User switch and destination validation could not be executed.

### 3. Switch to Employee — BLOCKED

No **Employee (Employee)** role entry was displayed or selectable, so the Employee switch and destination validation could not be executed.

### 4. Switch to Substitute — BLOCKED

No **Substitute** role entry was displayed or selectable, so the Substitute switch and destination validation could not be executed.

## Detailed Results

| Step | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1-4 | Resolve Stage configuration and authenticate. | Valid Stage credentials authenticate without manual entry. | Stage configuration and the configured password source were resolved; login succeeded. | **PASS** |
| 5 | Navigate through Daily Report. | Angular Daily Report is displayed. | URL was `https://adminwebstage2.flqa.net/reports/absence/daily-report`; title was `Aesop - Daily Report`; level-one **Daily Report** was visible. | **PASS** |
| 6 | Open the top-right profile control. | Role list is displayed. | Profile control `Report 139963 - Organization User` opened an active menu. | **PASS** |
| 6, 11 | Inspect Your Roles. | Exactly Organization User, Campus User, Employee, and Substitute are listed. | **Your Roles** was absent. The visible menu contained only **Your Frontline Account**, **Account Settings**, and **Sign Out**. | **FAIL** |
| 7 | Select Campus User. | Campus User becomes active and its home page responds. | Role entry unavailable. | **BLOCKED** |
| 8 | Select Employee. | Employee becomes active and its home page responds. | Role entry unavailable. | **BLOCKED** |
| 9 | Select Substitute. | Substitute becomes active and its home page responds. | Role entry unavailable. | **BLOCKED** |
| 10 | Validate each selected role. | Each selected role is shown as active with a responsive home page. | No role could be selected because no role entries were exposed. | **BLOCKED** |
| 12 | Dismiss the menu using the profile control. | Menu closes without role or route change. | Menu closed; URL, title, Daily Report heading, and Organization User profile remained unchanged. | **PASS** |
| 13 | Inspect unassigned, duplicate, and blank roles. | No unexpected, duplicate, or blank role is selectable. | No role entries of any kind were exposed; no duplicate or blank visible menu entries were found. | **PASS** |
| 14 | Select the active role. | Current role reloads cleanly or remains active. | Active Organization User role was not available inside a Your Roles list. | **NOT TESTED** |
| 15 | Refresh after a role selection. | Selected role persists and page remains responsive. | A successful new-role selection was impossible. A refresh in Organization User context retained the profile label and responsive Daily Report page. | **PARTIAL PASS** |
| 16 | Open and dismiss twice. | Each cycle shows one identical role list and closes without changing role. | Both menus opened and closed cleanly, without navigation or active-role change. Both consistently lacked Your Roles. | **PASS** |
| 17 | Confirm approved host and responsive final page. | Approved Stage role application is responsive with no error. | Final URL remained on approved `adminwebstage2.flqa.net`; Daily Report and the profile control were responsive. | **PASS** |
| 18 | Cleanup. | No saved data or cleanup record. | No record was created or modified; no cleanup was required. | **PASS** |

## Interaction Evidence

- Authenticated profile: `Report 139963 - Organization User`
- Daily Report route: `https://adminwebstage2.flqa.net/reports/absence/daily-report`
- Daily Report title: `Aesop - Daily Report`
- Visible opened-menu text: `YOUR FRONTLINE ACCOUNT Account Settings Sign Out`
- Visible assigned-role entries: none
- Menu dismissal preserved the same URL and active Organization User profile.
- Browser refresh preserved the responsive Daily Report page and Organization User profile.
- Two consecutive open/dismiss cycles completed without navigation or duplicate visible entries.
- Browser console errors observed during the validation: none.

## Reproduction

1. Sign in to AES Stage as `report_139963`.
2. Open **Daily Report**.
3. Select the top-right `Report 139963 - Organization User` profile control.
4. Observe that the menu contains account options but no **Your Roles** section or assigned roles.

## Route and Safety Notes

Authentication used only approved Stage hosts. The final page remained on the approved Angular Daily Report host. No records were created, edited, saved, or deleted, and no test-value cleanup was required. The page was left open with the profile menu expanded for cross-verification.

## Conclusion

The role switcher container is interactive, stable across refresh, and dismisses correctly, but this account does not expose the role entries required by the scenario. Supply or assign the four expected roles to `report_139963`, then rerun to validate Campus User, Employee, Substitute, and active-role edge cases.
