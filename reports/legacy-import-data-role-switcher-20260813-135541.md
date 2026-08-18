# Legacy Import Data Role Switcher - Execution Report

- **Executed:** 2026-08-13 13:55 IST
- **Scenario:** `tests/navigation/legacy-import-data-role-switcher.md`
- **Environment:** AES Stage
- **User:** `report_139963`
- **Overall result:** **FAIL**

## Validation results

| Check | Result | Evidence |
|---|---|---|
| Sign in | PASS | Signed in as `Report 139963`. |
| Open Legacy Extract / Import > Import Data | PASS | URL was `https://aesstage.flqa.net/mvc.aspx/dataimport`; title was `Web Navigator (139963) Select Import Files`. |
| Import Data page loaded | PASS | The Upload Files interface, file input, Add File button, and Next button were present. No file was uploaded. |
| Open Role Switcher | PASS | The account/role menu opened from the current-role control. |
| Confirm all roles are showing | **FAIL** | Current active role was `Organization User`, but the role filter was empty, the selectable role list contained **0 roles**, and the control displayed `No Results Found`. The profile's `Your Roles` area also supplied no role baseline. |

## Safety and final state

- No role was selected or changed.
- No import file was added or submitted.
- The Import Data page was left open at `https://aesstage.flqa.net/mvc.aspx/dataimport`.

