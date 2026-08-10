# Login

## Execution directive

Before any browser action, read:

1. `instructions/project-instructions.md`
2. `instructions/application-details.md`
3. `instructions/test-data.md`

Execute this scenario directly with Playwright MCP. Do not generate test code. Save the execution report under `reports/`.

## Objective

Verify that the dedicated test user can sign in to the configured non-production application.

## Preconditions

- All required placeholders in the shared files are resolved.
- The test account is active and authorized.
- If manual password entry or MFA is required, pause and ask the user to complete it.

## Steps

1. Open the configured login page.
   - Expected: The configured login-page identifier is visible.
2. Enter the configured test username.
   - Expected: The username or email field contains the test username.
3. Enter the password through the approved secure mechanism without revealing or recording it.
   - Expected: The password field accepts the value.
4. Select the visible sign-in or login control.
   - Expected: Authentication is submitted once.
5. Wait for the authenticated landing page.
   - Expected: The URL no longer represents the login page and the configured post-login identifier is visible.
6. Confirm that no authentication error is displayed.
   - Expected: The user is signed in successfully.

## Cleanup

Sign out only if a selected follow-up scenario does not require the authenticated session.

