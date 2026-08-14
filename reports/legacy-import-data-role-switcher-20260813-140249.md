# Legacy Import Data Role Dropdown - Corrected Execution Report

- **Executed:** 2026-08-13 14:02 IST
- **Scenario:** `tests/navigation/legacy-import-data-role-switcher.md`
- **Environment:** AES Stage
- **User:** `report_139963`
- **Dropdown XPath:** `//select[@id='TargetId']`
- **Overall result:** **PASS**

## Validation results

| Check | Result | Evidence |
|---|---|---|
| Sign in | PASS | Signed in with the approved Stage organization-user account. |
| Open Legacy Import Data | PASS | URL: `https://aesstage.flqa.net/mvc.aspx/dataimport`; title: `Web Navigator (139963) Select Import Files`. |
| Locate the correct role dropdown | PASS | Exactly one `<select id="TargetId">` was located using the supplied XPath. |
| Dropdown state | PASS | The dropdown was visible and enabled. |
| Validate every option | PASS | All 12 expected options were present, non-empty, enabled, unique, and in the expected order. |
| Preserve selection | PASS | The selected option remained `Employee`; no option was changed. |

## Roles displayed

1. Employee
2. Org/Campus User
3. School
4. Substitute
5. Vacancy Profile
6. Reference Data - Absence Reason Type
7. Reference Data - Accounting Code
8. Reference Data - Allocation Group
9. Reference Data - Budget Code
10. Reference Data - Employee Type
11. Reference Data - Pay Code
12. Reference Data - Skill

## Safety and final state

- No dropdown option was selected or changed.
- No import file was added or submitted.
- The authenticated Import Data page was left open for verification.
- This corrected report supersedes the earlier report generated from the wrong profile-menu control.

