# React Employee General Information to Manage User Access — Execution Report

- **Executed:** 2026-08-13 20:11 IST
- **Environment:** AES Stage
- **Search value:** `manage789`
- **Overall result:** **PASS**

| Step | Validation | Actual result | Status |
|---|---|---|---|
| 1 | Authenticate and open AES Stage | Signed in as the approved organization user in `Global Logic Stage Org 2`. | PASS |
| 2 | Navigate to Employee General Information | `Master Data > Employee > General Information` opened the employee selection page. | PASS |
| 3 | Search `manage789` | Search opened employee `sumit access`, identifier `manage789`, work ID `9344210`. | PASS |
| 4 | Verify Employee General Information | Title was `Employee | General Information (139963)` and Access Granted was checked. | PASS |
| 5 | Locate supplied XPath | `//a[contains(text(),'Manage User’s Access')]` resolved to the Stage Manage Access URL for user key `2-9344210`. | PASS |
| 6 | Open destination | The first application initialization displayed a transient route error; one reload was performed as a recovery check. | PASS |
| 7 | Verify Manage User Access | Visible page content showed `sumit access`, `Ext. ID: manage789`, `Global Logic Stage Org 2`, `Absence Management`, `Employee`, and `Granted`. No visible error remained. | PASS |
| 8 | Preserve read-only state | No invitation was sent and no employee or access data was changed. | PASS |

## Final URL

`https://supersuitawsstage.flqa.net/absmgmt-useraccess/user/abs_time_employee_stage/2-9344210`

## Cleanup

The verified Manage User Access page was left open for operator review. No cleanup change was required.
