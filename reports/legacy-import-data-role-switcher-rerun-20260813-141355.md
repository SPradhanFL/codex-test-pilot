# Legacy Import Data Role Dropdown - Cross-Verification Rerun

- **Executed:** 2026-08-13 14:13 IST
- **Scenario:** `tests/navigation/legacy-import-data-role-switcher.md`
- **Environment:** AES Stage
- **User:** `report_139963`
- **Dropdown XPath:** `//select[@id='TargetId']`
- **Overall result:** **PASS**

## Results

| Check | Result | Evidence |
|---|---|---|
| Import Data page | PASS | `https://aesstage.flqa.net/mvc.aspx/dataimport?x=x`; title `Web Navigator (139963) Select Import Files`. |
| Correct dropdown located | PASS | Exactly one `select#TargetId` matched the supplied XPath. |
| Dropdown opened | PASS | The exact matching control was clicked successfully. |
| Dropdown state | PASS | Visible and enabled. |
| Role validation | PASS | 12 options were present; every option was non-empty, enabled, unique, and in the expected order. |
| Selection unchanged | PASS | `Employee` remained selected at index 0. |

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

- No role option was changed.
- No file was selected, uploaded, or imported.
- The authenticated Import Data tab was left available for operator cross-verification.

