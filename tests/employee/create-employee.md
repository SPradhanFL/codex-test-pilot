# Create Employee — AES Stage

## Execution directive

Before any browser action, read completely:

1. `instructions/project-instructions.md`
2. `instructions/application-details.md`
3. `instructions/test-data.md`

Execute this scenario directly in Chrome using Playwright MCP. Do not generate Playwright or TypeScript code. Save the execution report under `reports/`.

## Objective

Log in to AES Stage, create the specified employee, apply the changes, and verify the employee through Last Name search.

## Preconditions

- Playwright MCP is available.
- `https://aesstage.flqa.net` is reachable and is confirmed as the Stage environment.
- The operator is available to enter the password securely when requested.
- Do not continue if redirected to a host other than `aesstage.flqa.net`.

## Steps

### 1. Launch and authenticate

1. Launch Chrome through Playwright MCP and open `https://aesstage.flqa.net`.
   - Expected: The AES Stage login page displays visible username and password fields.
2. Enter username `report_139963`.
   - Expected: The username field contains `report_139963`.
3. Focus the password field, pause, and ask the operator to enter the password manually. Never read, expose, log, or screenshot it.
   - Expected: The operator confirms that password entry is complete.
4. Select the visible login or sign-in button once.
   - Expected: Login is submitted without a validation error.
5. Wait for navigation to finish.
   - Expected: The user is redirected away from the login page, the application home page is visible, and `Master Data` is available.

### 2. Navigate to employee general information

6. Navigate through `Master Data` → `Employee` → `General Information` in that order.
   - Expected: The Employee General Information page is displayed.
7. Confirm the `Add Employee` link is visible.
   - Expected: The page is ready for employee maintenance.

### 3. Prevent accidental duplicates

8. If the page provides search before creation, search Last Name for the exact value `Emp_Auto_7618`.
   - Expected: No existing employee with both Last Name `Emp_Auto_7618` and Identifier `7618` is present.
   - If an exact match already exists, stop without creating a duplicate and mark the scenario **BLOCKED**.

### 4. Create the employee

9. Select the `Add Employee` link.
   - Expected: The add-employee form is displayed.
10. Populate the form with these exact values:

| Field | Value |
|---|---|
| First Name | `7618` |
| Last Name | `Emp_Auto_7618` |
| Email | `automationUser@gmail.com` |
| Gender | `Male` |
| Start Date | `09/24/2019` |
| End Date | `09/25/2020` |
| Birth Date | `03/05/1993` |
| Employee | `Security Guard` |
| Phone | `3788069839` |
| Pin | `69839` |
| Identifier | `7618` |
| School | `Global Logic STAGE Org 2 11AB025A-EE18-43D5-9082-4` |

   - Select exact dropdown/autocomplete options for Gender, Employee, and School when applicable.
   - For date controls, enter the documented values and accept an equivalent UI-normalized display only if it represents the same dates.
   - Expected: Every visible field contains or displays the intended value.
11. Review all values and reconfirm the host is `aesstage.flqa.net`.
   - Expected: The form contains the exact requested data in the Stage environment.
12. Select `Apply Changes` once.
   - Expected: The application displays a successful save confirmation or returns to a saved employee detail/list view with no validation errors.

### 5. Verify through search

13. Return to the Employee General Information search/list view if needed.
   - Expected: The employee search option is available.
14. Search using Last Name `Emp_Auto_7618`.
   - Expected: At least one result matching the exact Last Name is displayed.
15. Open or inspect the result whose Identifier is `7618`.
   - Expected: Exactly one record matches both Last Name `Emp_Auto_7618` and Identifier `7618`.
16. Verify the saved record against all available submitted values, especially First Name, Last Name, Email, Employee, Phone, Pin, Identifier, and School.
   - Expected: The displayed employee data matches the submitted test data.

## Final result

- Mark **PASS** only if creation succeeds and the exact employee is found through Last Name search.
- Mark **FAIL** if submission or verification produces an application/validation error or values do not match.
- Mark **BLOCKED** if authentication, secure password entry, permissions, environment validation, or duplicate protection prevents safe completion.

## Cleanup

Do not delete the employee. Record Last Name `Emp_Auto_7618` and Identifier `7618` in the report for a later delete flow. Never record the password.

