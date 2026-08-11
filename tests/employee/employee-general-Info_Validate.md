# Employee General Information Validation — AES Stage

## Execution directive

Before any browser action, read completely:

1. `instructions/project-instructions.md`
2. `instructions/application-details.md`
3. `instructions/test-data.md`

Execute this scenario directly in Chrome using Playwright MCP. Do not generate Playwright or TypeScript code. Run unattended without pausing for password entry or routine confirmation. Save both Markdown and standalone HTML execution reports under `reports/`.

## Objective

Log in to AES Stage, navigate to Employee General Information, open Add Employee, and validate the available positive, negative, and edge-case behavior without creating an employee record.

## Preconditions and safety

- Playwright MCP is available.
- Work only on AES Stage at `https://aesstage.flqa.net`; the authentication redirect to `https://idgatewayawsstage.flqa.net` is approved.
- Before opening the browser, read the AES Stage password from the `AES_STAGE_PASSWORD` environment variable without printing, displaying, logging, or writing its value anywhere.
- `AES_STAGE_PASSWORD` must be configured securely on the machine running this scenario. Never fall back to a password embedded in this file, another repository file, a prompt, command output, or a report.
- Do not pause or ask the operator for password entry. If `AES_STAGE_PASSWORD` is unavailable, mark the run **BLOCKED**, generate both reports, and stop without opening the browser.
- For this scenario, the environment-variable rules above replace the manual-password-entry instruction in `instructions/test-data.md`.
- Do not record, display, repeat, or screenshot the password.
- Do not select `Apply Changes` when the form contains a complete valid employee because that could create a record.
- If validation requires a save attempt, use incomplete or intentionally invalid data so creation cannot succeed.
- During authentication, `idgatewayawsstage.flqa.net` is an approved login host. After authentication, continue only in the AES Stage application.
- For this scenario, the approved authentication redirect above is the explicit exception to the general different-host stop rule in the shared instructions.

## Steps

### 1. Launch and authenticate

1. Launch Chrome through Playwright MCP and open `https://aesstage.flqa.net`.
   - Expected: The AES Stage login page displays visible username and password fields.
2. Enter username `report_139963`.
   - Expected: The username field contains `report_139963`.
3. Automatically fill the password field from `AES_STAGE_PASSWORD` without displaying, recording, echoing, or validating its literal value. Do not pause for user input.
   - Expected: The password field is populated automatically and the secret is not exposed in tool output, project files, screenshots, or reports.
4. Select the visible login or sign-in button once and wait for navigation.
   - Expected: The application home page is displayed and `Master Data` is available.

### 2. Navigate to Add Employee

5. Navigate through `Master Data` → `Employee` → `General Information` in that order.
   - Expected: The Employee General Information page is displayed.
6. Confirm the `Add Employee` link is visible.
   - Expected: The page is ready for employee maintenance.
7. Select `Add Employee`.
   - Expected: The Add Employee form is displayed with its input controls and `Apply Changes` action.

### 3. Positive validation

8. Identify all visible fields, required indicators, field types, dropdown options, date controls, and action buttons.
   - Expected: The form structure is observable and enabled as appropriate.
9. Enter the valid synthetic values from `instructions/test-data.md` into the matching fields, selecting exact dropdown or autocomplete options when applicable.
   - Expected: Each form control accepts and displays the intended valid value without a client-side validation error.
10. Verify the date fields accept `Birth Date: 03/05/1993`, `Start Date: 09/24/2019`, and `End Date: 09/25/2020` or an equivalent normalized display representing the same dates.
    - Expected: All valid dates are accepted, and the end date is later than the start date.
11. Verify the valid email `automationUser@gmail.com`, phone `3788069839`, PIN `69839`, and identifier `7618` are accepted.
    - Expected: No format validation error is displayed for valid values.
12. Do not submit the completed valid form. Clear or reset the form before negative testing.
    - Expected: No employee record is created.

### 4. Negative validation

13. Attempt validation with all fields empty by selecting `Apply Changes` once only if the action is available.
    - Expected: Required-field validation is displayed and no employee is created.
14. Enter an invalid email such as `invalid-email`, while leaving at least one required field empty to prevent creation, and trigger validation safely.
    - Expected: The invalid email is rejected or a clear validation error is displayed; no employee is created.
15. Test invalid date input using a non-date value such as `not-a-date`, while keeping the form incomplete.
    - Expected: The invalid date is rejected, normalized away, or produces a clear validation error; no employee is created.
16. Test an impossible date such as `02/30/2020`, while keeping the form incomplete.
    - Expected: The impossible date is rejected or produces a clear validation error; no employee is created.
17. Test an end date earlier than the start date using `Start Date: 09/25/2020` and `End Date: 09/24/2020`, while keeping the form incomplete.
    - Expected: The invalid date range is rejected or produces a clear validation error; no employee is created.
18. Test alphabetic characters in numeric-looking Phone, PIN, and Identifier fields one field at a time, keeping the form incomplete.
    - Expected: Each field either blocks unsupported characters or displays a clear validation error; no employee is created.

### 5. Edge-case validation

19. Test leading and trailing spaces in editable text fields using a synthetic value such as `  Emp_Auto_7618  `, without submitting a complete form.
    - Expected: Spaces are handled consistently by trimming, preserving, or validating them; observed behavior is recorded.
20. Test the smallest safely enterable value (one character or one digit) in editable text and numeric-looking fields, one at a time.
    - Expected: The field accepts the value when allowed or displays a documented validation constraint without breaking the page.
21. Test a long synthetic value by typing until the UI stops accepting characters or reaches a visible maximum, without bypassing browser controls.
    - Expected: The field enforces a maximum length or remains stable; the observed limit is recorded. Do not paste an excessively large payload.
22. Test special characters such as `O'Neil-Test` in a name field and `+1 (555) 010-7618` in the phone field, one at a time, while keeping the form incomplete.
    - Expected: Supported characters are accepted; unsupported formats receive clear validation feedback; the page remains stable.
23. Test date-boundary behavior with a leap date `02/29/2020` and a non-leap date `02/29/2019`, one at a time.
    - Expected: The valid leap date is accepted and the invalid non-leap date is rejected or flagged.
24. Verify keyboard focus and tab navigation across visible form controls and actions.
    - Expected: Focus moves in a logical order and focused controls remain operable.

### 6. Final verification and cleanup

25. Confirm the browser is on the AES Stage application after the approved authentication redirect and the Add Employee page is responsive.
    - Expected: No unapproved redirect, unhandled error, or broken layout is present.
26. Clear/reset all entered test values or navigate away without saving.
    - Expected: No employee record is created and no cleanup record is required.

## Result classification

- Mark **PASS** only if navigation succeeds and every executed validation behaves as expected.
- Mark **FAIL** for application errors, missing required validation, accepted invalid values that can be safely demonstrated, or unstable UI behavior.
- Mark **BLOCKED** for authentication, permission, environment, unavailable-control, or safety restrictions.
- Mark an individual case **NOT TESTED** when the visible form lacks the relevant control or safely triggering validation is impossible.

## Reporting

Create both files with the same timestamp:

1. `reports/employee-general-Info_Validate-<YYYYMMDD-HHMMSS>.md`
2. `reports/employee-general-Info_Validate-<YYYYMMDD-HHMMSS>.html`

Both reports must contain start/finish times, environment URL, overall status, every case's action/expected/actual/status, safe error details, screenshot paths, and cleanup status.

The HTML report must be a polished, standalone, responsive document that opens directly in a browser without external dependencies. Include:

- Overall status and Pass/Fail/Not Tested totals
- Executive summary and highlighted failures
- Searchable and status-filterable test-results table
- Observed boundary or maximum-length comparisons
- Safety and cleanup summary
- Print-friendly styling

Never include the password, environment-variable value, tokens, cookies, authentication fragments, or other secrets in either report.

## One-line invocation

After `AES_STAGE_PASSWORD` is configured securely, the operator only needs to request:

`Execute tests/employee/employee-general-Info_Validate.md`
