# Manage Access

## Execution directive

Before any browser action, read:

1. `instructions/project-instructions.md`
2. `instructions/application-details.md`
3. `instructions/test-data.md`
4. `config/aes-stage.ml.<OrgId>.json`

Execute this scenario directly in the controlled Stage browser. Do not generate test code. This is a read-only validation: do not edit the employee, change access, send an invitation, or submit an access form.

## Objective

Verify that an explicitly configured Stage ML Organization User can find the configured employee, open **Manage User Access**, and confirm that the destination belongs to the selected employee.

## Per-login data gate

Read `scenarioData.manageAccess` only from `config/aes-stage.ml.<OrgId>.json`.

Execute Scenario 13 only when all of the following are true:

1. `scenarioData.manageAccess.enabled` is `true`.
2. `loginUsernameKey` resolves to a non-placeholder entry in `testUsernames`.
3. The active login username exactly matches that resolved configured username.
4. `employeeFirstName` and `employeeLastName` are both present.

When any condition is not satisfied, do not search for a substitute employee and do not reuse another login's data. Record Scenario 13 as **NOT TESTED** with the reason: `No safe Manage Access employee data is configured for this login.` Continue with independent scenarios.

For Organization `140463`, the configured data is:

- Login key: `org_username`
- Employee first name: `Employee_sub`
- Employee last name: `Employee_sub_last`

Do not copy a username or password into this scenario file or its report.

## Preconditions

- Work only in the selected Stage ML organization and approved linked Stage applications.
- The active role is **Organization User**.
- The **Find Employee** or **Master Data > Employee > General Information** search page is available.
- The configured first and last name identify exactly one safe test employee.
- Do not select **Send Invitation**, edit access, or save any change.

## Steps

1. Authenticate with the selected organization's configured Organization User and wait for Home to become responsive.
   - Expected: Authenticated Absence Management navigation and the Organization User context are visible.
2. Apply the per-login data gate above.
   - Expected: Only the explicitly configured matching login proceeds; every other login records **NOT TESTED**.
3. Select **Find Employee**. If that control is not exposed, navigate through **Master Data > Employee > General Information**.
   - Expected: The Employee search page opens with enabled employee-search controls.
4. Enter the configured `employeeFirstName` and `employeeLastName`, then select the visible **Search** or **Go** control.
   - Expected: Exactly one matching employee result is displayed.
5. Open the matching employee and verify the record before continuing.
   - Expected: The displayed first and last name exactly match the configured values.
   - Expected: The Employee General Information page is responsive and its stable URL identifies a specific employee record.
6. Scroll the access section into view and locate the visible **Manage User Access**, **Manage User’s Access**, or equivalent Manage Access link.
   - Expected: Exactly one enabled access-management link for the selected employee is visible.
   - Expected: Its destination is an approved Stage host.
7. Select the Manage Access link and wait for loading indicators to disappear.
   - Expected: The Stage Manage User Access destination opens successfully.
   - Recovery: If a transient loading or route error appears, reload once, wait for loading to finish, and reassess the stable visible state.
8. Verify the Manage User Access destination without changing data.
   - Expected: A **Manage User Access** heading or primary access-management region is visible.
   - Expected: The displayed employee identity matches the employee selected in step 5.
   - Expected: Visible application, role/type, and access-status details load without an access-denied, page-not-found, or persistent application error.
9. Confirm the validation remained read-only.
   - Expected: No invitation was sent and no employee or access value was edited or submitted.
10. Return to the original Employee General Information page using browser **Back**.
    - Recovery: If browser Back cannot restore the cross-application page, use the exact sanitized Employee General Information URL captured in step 5. Do not guess an employee identifier.
    - Expected: The same configured employee record is restored and remains unchanged.

## Result classification

- **PASS:** The configured employee opens, the Manage Access link works, the destination belongs to that employee, the primary access details load, and the flow returns without changing data.
- **FAIL:** Search returns the wrong or ambiguous employee, the exposed Manage Access navigation fails, required access details do not load after one recovery reload, or a persistent application error remains.
- **BLOCKED:** Authentication, authorization, browser availability, or missing configured data for the otherwise enabled matching login prevents safe validation.
- **NOT TESTED:** The active login is not the explicitly configured Manage Access login, or the selected organization intentionally has `manageAccess.enabled` set to `false`.

## Report requirements

Record:

- Selected organization ID and active role, without the login username
- Whether the per-login data gate allowed execution
- Configured employee first and last name
- Employee search result count and identity match
- Sanitized Employee General Information origin and pathname
- Manage Access link text and approved destination host
- Sanitized Manage User Access origin and pathname
- Visible access-management heading and available application/role/status details
- Whether one recovery reload was required
- Visible-error check
- Successful return to the same employee record
- Confirmation that no invitation was sent and no data was changed
- Overall status: PASS, FAIL, BLOCKED, or NOT TESTED

Never record passwords, full login usernames, tokens, query strings, cookies, or browser-session information.

## Cleanup

Return to and leave the original Employee General Information page open. Do not change access, send an invitation, edit the employee, or sign out when another authenticated scenario may follow.
