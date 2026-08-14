# Legacy Import Data to Role Switcher Validation

## Execution directive

Before any browser action, read:

1. `instructions/project-instructions.md`
2. `instructions/application-details.md`
3. `instructions/test-data.md`

Execute this scenario directly in Chrome using browser automation. Do not generate test code. Save the execution report under `reports/`.

Reuse the same authenticated Chrome session and controlled tab throughout the scenario whenever available. Do not create another browser session or tab between navigation and validation steps. If browser control is interrupted, reconnect to the existing Chrome session and reclaim the matching AES Stage tab before creating a replacement.

Do not write the password, tokens, cookies, or browser-session information to this file, screenshots, or the execution report.

## Objective

Verify that an authenticated AES Stage organization user can navigate from the Legacy ASP **Extract / Import** menu to the **Import Data** page and confirm that all expected roles are displayed in the role dropdown identified by `//select[@id='TargetId']`.

## Preconditions

- Chrome is available through the approved browser-control connection.
- Work only in AES Stage.
- Use the login account documented in `instructions/test-data.md`.
- Target URL: `https://aesstage.flqa.net/mvc.aspx/dataimport`.
- The account has permission to open **Extract / Import > Import Data**.
- This is a read-only validation scenario. Do not upload or import a file and do not change the active role.

## Expected role options

The dropdown `//select[@id='TargetId']` must be visible and enabled and contain these 12 non-empty options:

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

## Steps

1. Open `https://aesstage.flqa.net/` in Chrome.
   - Expected: AES Stage opens or redirects to the approved Frontline Stage sign-in page.
   - Expected: No production host, security warning, CAPTCHA, or access-control error appears.
2. Authenticate using the account documented in `instructions/test-data.md` when required.
   - Expected: The AES Stage home page opens.
   - Expected: The signed-in account is the expected organization user.
   - Expected: **Extract / Import** is visible in the navigation.
3. Select **Extract / Import** from the Legacy ASP navigation.
   - Expected: Its submenu opens.
   - Expected: **Import Data** is visible.
4. Select **Import Data**.
   - Expected: The browser opens `https://aesstage.flqa.net/mvc.aspx/dataimport` or an equivalent normalized URL on the same AES Stage host.
5. Verify the **Import Data** page.
   - Expected: The host is `aesstage.flqa.net`.
   - Expected: The URL contains `/mvc.aspx/dataimport`.
   - Expected: The page heading or primary page label identifies **Import Data**.
   - Expected: No application, server, permission, or access error is displayed.
   - Safety: Do not select a file, upload data, or start an import.
6. Locate the role dropdown using XPath `//select[@id='TargetId']`.
   - Expected: Exactly one matching `<select>` element is present.
   - Expected: The dropdown is visible and enabled.
7. Capture every option displayed in this dropdown without selecting a different option.
   - Expected: Every displayed role name is non-empty.
   - Expected: No duplicate role entries are present unless the UI clearly distinguishes them by organization or scope.
   - Record: Exact displayed role names and actual total count.
8. Compare the captured options with the 12-item expected list in this scenario.
    - Expected: Every expected role appears once, in the documented order.
    - Expected: No role is missing, blank, disabled, or unexpectedly duplicated.
    - Expected: The actual role count is 12.
9. Leave the selection unchanged.
    - Expected: The selected option is unchanged.
    - Expected: The **Import Data** page remains open and usable.

## Result classification

- **PASS:** Import Data opens successfully and `//select[@id='TargetId']` is visible, enabled, and contains all 12 expected role options exactly once.
- **FAIL:** The page or dropdown opens, but an expected role is missing, blank, disabled, unexpectedly duplicated, out of order, or the count is not 12.
- **BLOCKED:** Authentication, permissions, or browser availability prevents validation.

## Report requirements

Record:

- Start and finish timestamps
- Environment URL without credentials or tokens
- Signed-in account display name and organization context
- Legacy **Extract / Import > Import Data** navigation result
- Final Import Data URL, title, heading/label, and error check
- Expected roles from this scenario, in display order
- Expected role count
- Actual `TargetId` dropdown roles, in display order
- Actual role count
- Missing roles, unexpected roles, blank entries, and duplicates, if any
- Confirmation that the active role was not changed
- Overall status: PASS, FAIL, or BLOCKED
- Any safe error details

Never record passwords, tokens, cookies, or browser-session information.

## Cleanup

Leave the role selection unchanged. Leave the authenticated **Import Data** page open for operator verification. Do not sign out when another authenticated scenario may follow.
