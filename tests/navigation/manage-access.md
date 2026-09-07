# Employee Manage Access Validation — Organization 140462

## Purpose and scope

Validate **Employee General Information → Access → Manage Access** only for Organization `140462`, the configured standalone Organization User login, and the two exact employee records in `config/aes-stage.ml.140462.json` → `scenarioData.manageAccess.cases`.

This is Scenario 13. It is not the retired **Security → Manage User Access** scenario. Do not execute this test for another organization, controller login, role, or employee. When the exact gate below does not match, omit Scenario 13 from the run; do not create a PASS, FAIL, BLOCKED, or NOT TESTED result.

## Exact execution gate

Proceed only when every condition is true:

1. The selected `OrgId` is `140462`.
2. `scenarioData.manageAccess.enabled` is `true`.
3. The active controller is `organization-user-execution.md`.
4. The active role is **Organization User**.
5. `loginUsernameKey` is `org_username`, and the active login exactly matches `testUsernames.org_username` from the same organization-scoped config.
6. The config contains the two complete `cases` entries described below.

If any gate condition is false, omit Scenario 13 entirely and continue with the next authorized scenario. Never borrow this data for a combination account or another organization.

## Safety and shared behavior

- Resolve the URL and username from `config/aes-stage.ml.140462.json` and the password from `.secrets/aes-stage.ml.140462.credentials.json`.
- Never expose the username, password, tokens, cookies, or authentication query fragments in evidence or reports.
- Keep both cases read-only. Do not edit access, send invitations, save, or submit business data.
- Before every action, scroll the target element into view and verify it is visible, enabled, and interactable.
- Dismiss an unrelated popup safely when it obstructs a documented control, then continue.
- After selecting **Manage Access**, refresh the controlled-tab inventory, select the newly opened tab, and wait up to 120 seconds for loading overlays to disappear and the Person Management page to become responsive. After 60 seconds, one safe refresh is permitted.
- A destination URL must contain `stage-k12.ss`. Apply the shared URL-evidence warning rule, but fail the case when the wrong destination also prevents the required Person Management validations.

## Case A — migrated organization and migrated user

Configuration expectations:

- Search text: `EmployeeUser`
- Exact result name: `EmployeeUser, SSD`
- Employee identifier: `ssdemp`
- Expected work ID: `9343911`
- Expected selected application: `Frontline Administration`
- Organization Details must contain both `SSD Patty EmployeeUser` and `Manualsetup86 SSD`

Steps:

1. Authenticate through the configured Stage ML flow and establish the **Organization User** context.
   - Expected: Responsive Absence Management Home with the intended Organization User context.
2. Select **Find Employee**.
   - Expected: Employee search opens with a visible and enabled search control.
3. Search for `EmployeeUser`.
   - Expected: The result `EmployeeUser, SSD (ssdemp)` is displayed.
4. Select only that exact result and verify the stable employee record identifies work ID `9343911`.
   - Expected: Employee General Information opens for `EmployeeUser, SSD (ssdemp)`.
5. Scroll **Access** into view and select **Manage Access**.
   - Expected: Exactly one new browser tab opens for this employee.
6. Select the new tab and wait for the Person Management page to become responsive.
   - Expected: Person Management loads without access denied, page not found, or a persistent loading overlay.
7. Open or inspect the application switcher without changing the selected application.
   - Expected: `Frontline Administration` is selected.
8. Inspect **Organization Details**.
   - Expected: The visible details contain `SSD Patty EmployeeUser` and `Manualsetup86 SSD`.
9. Inspect the complete destination URL in the Chrome address bar.
   - Expected: The URL contains `stage-k12.ss`.
10. Confirm the validation remained read-only, capture full-browser evidence, close the Person Management tab, and return to the original employee tab.
    - Expected: No data changed and the same Employee General Information record remains available.

## Case B — migrated organization and non-migrated user

Configuration expectations:

- Search text: `DontmigrateSSD0EMP`
- Exact result name: `DontmigrateSSD0EMP, SSD`
- Employee identifier: `DontMigemp0`
- Expected work ID: `9343914`
- Expected selected application: `Absence Management`
- Organization Details must contain both `SSD DontmigrateSSD0EMP` and `Manualsetup86 SSD`

Steps:

1. Restore or establish the same configured **Organization User** context, then select **Find Employee**.
   - Expected: Employee search is responsive.
2. Search for `DontmigrateSSD0EMP`.
   - Expected: The result `DontmigrateSSD0EMP, SSD (DontMigemp0)` is displayed.
3. Select only that exact result and verify the stable employee record identifies work ID `9343914`.
   - Expected: Employee General Information opens for `DontmigrateSSD0EMP, SSD (DontMigemp0)`.
4. Scroll **Access** into view and select **Manage Access**.
   - Expected: Exactly one new browser tab opens for this employee.
5. Select the new tab and wait for the Person Management page to become responsive.
   - Expected: Person Management loads without access denied, page not found, or a persistent loading overlay.
6. Open or inspect the application switcher without changing the selected application.
   - Expected: `Absence Management` is selected.
7. Inspect **Organization Details**.
   - Expected: The visible details contain `SSD DontmigrateSSD0EMP` and `Manualsetup86 SSD`.
8. Inspect the complete destination URL in the Chrome address bar.
   - Expected: The URL contains `stage-k12.ss`.
9. Confirm the validation remained read-only and capture full-browser evidence.
   - Expected: No invitation, access edit, or save action occurred.

## Independent outcomes and classification

Create two independent Scenario 13 workflow outcomes:

- `organization-scenario-13-migrated-organization-migrated-user`
- `organization-scenario-13-migrated-organization-non-migrated-user`

For each case:

- **PASS:** The exact employee is found, Employee General Information opens, Manage Access opens a responsive Person Management tab, the expected application is selected, both expected Organization Details values are present, the URL contains `stage-k12.ss`, and no data changes.
- **FAIL:** The exact search returns the wrong or ambiguous record, the exposed navigation fails after the 120-second recovery rule, the expected selected application or Organization Details values are wrong, a functional destination error remains, or the stable URL does not contain `stage-k12.ss` and the required destination cannot be validated.
- **BLOCKED:** Authentication, entitlement, missing required UI, unavailable browser control, or incomplete configured case data prevents safe execution.

Do not use **NOT TESTED** for unrelated accounts because Scenario 13 must be omitted from those runs.

## Report requirements

For each case, record its migration context, search text, exact result identity and identifier, observed work ID, sanitized Employee General Information origin/path, Manage Access link state, new-tab behavior, sanitized Person Management origin/path, selected application, observed Organization Details checks, URL-substring result, recovery action if used, read-only confirmation, screenshots, video range, and final status.

Do not place a full login username, password, token, cookie, session ID, or query string in the report.

## Cleanup

Close the Person Management tab after Case B and leave the original authenticated Employee General Information tab unchanged for the next scenario.
