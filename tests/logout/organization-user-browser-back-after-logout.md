# Organization User Browser Back After Logout

## Scope

Run this supplemental session-security workflow exactly once for the standalone Organization User controller in each configured organization:

- Organization `140462`
- Organization `140463`
- Organization `140466`

This produces exactly one workflow outcome per organization and three outcomes across a complete three-organization execution. Do not run it for Campus User, Employee, Substitute, combination accounts, repeated role contexts, or individual logout scenarios 16–19.

## Workflow slug

Use `organization-user-logout-browser-back-after-logout` inside each organization-scoped run. Organization report separation makes the three outcomes unique.

## Preconditions

- Use `organization-user-execution.md` with the selected organization’s configured `org_username` and `org_password` sources.
- Start with a fresh authenticated Organization User session on responsive React Home.
- Use the visible account-menu logout action.
- Do not inspect cookies, storage, tokens, or authentication fragments.

## Steps

1. Authenticate as the selected organization’s standalone **Organization User** and wait for React Home to become responsive.
   - Expected: React Home, Organization User context, primary navigation, and the account control display.
2. Capture the sanitized React Home origin and pathname for evidence.
   - Expected: The route belongs to the selected approved Stage environment.
3. Open the account menu, scroll the visible logout action into view, and select it once.
   - Expected: Logout begins without an application error.
4. Wait up to 120 seconds for all redirects and loading states to finish.
   - Expected: A stable approved login page displays a responsive Passport email/Next step or legacy username/password/Sign In form; authenticated controls are absent.
5. Click browser **Back** exactly once and wait for navigation and loading states to settle.
   - Expected: Previously authenticated content is not restored as an active usable session. The browser remains on, or returns to, an approved login page.
6. Inspect the stable page without interacting with protected business controls.
   - Expected: The authenticated account menu and application navigation are unavailable, and the login controls remain responsive.
7. Capture full-browser evidence with the address bar visible and end the workflow.
   - Expected: Evidence shows the stable post-Back state without credentials or sensitive query data.

## Result classification

- **PASS:** Logout reaches the approved login page and one browser Back action does not restore usable authenticated content or controls.
- **FAIL:** Browser Back restores an active authenticated page, account menu, or usable protected navigation after the 120-second observation rule.
- **BLOCKED:** Authentication, logout, browser history control, or environment availability prevents the Back check from being performed safely.

If browser Back returns only a cached visual shell, verify whether authenticated controls are usable before classifying. A usable restored session is FAIL; a non-interactive shell that redirects to login after settling is PASS.

## Reporting

Record the organization ID, Organization User role, sanitized pre-logout route, observed login-page type, post-Back URL origin/path, whether authenticated controls were usable, full-browser screenshots before logout and after Back, exact video range, 120-second observation details for a failure, and final status. Never include the username, password, tokens, cookies, or sensitive redirect fragments.
