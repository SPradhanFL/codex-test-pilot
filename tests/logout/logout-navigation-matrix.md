# AES Logout Navigation Matrix

## Execution directive

Execute each authorized flow directly in headed Chrome through Playwright MCP. Each flow is independent and begins with a fresh authenticated session. Resolve the selected organization/login from its controller and organization-scoped configuration. Never expose a password, token, cookie, or sensitive authentication fragment.

## Scope

These flows validate only that selecting the visible logout action reaches a stable approved login page:

1. Logout from React Home.
2. Logout from Angular Daily Report.
3. Logout from legacy Import Data.
4. Logout from Employee maintenance.

Do not click browser Back, navigate directly to a protected route, perform multi-tab invalidation, or make any other post-logout session-security assertion in these four flows. Browser Back after logout is a separate Organization User-only supplemental workflow defined in `tests/logout/organization-user-browser-back-after-logout.md`.

## Safety and readiness

- Do not change records, settings, filters, imports, employee data, roles, or organizations.
- Accept visible logout labels such as `Logout`, `Log Out`, or `Sign Out`.
- Before evidence or interaction, wait for loading overlays, spinners, skeletons, and transition masks to disappear.
- Before selecting logout, scroll the account control and logout action into view and verify they are visible, enabled, and interactable.
- Dismiss only unrelated popups that obstruct the documented action.
- Wait up to 120 seconds for logout redirects and the login page to stabilize. After 60 seconds, one safe refresh is permitted only for a transient loading state.

## Shared authentication and logout steps

1. Open the configured Stage URL and authenticate with the controller’s configured identity.
   - Expected: The intended role/context Home page is responsive.
2. Navigate to the destination required by the selected flow.
   - Expected: The destination’s primary elements and authenticated account control are visible.
3. Open the account menu.
   - Expected: A visible enabled logout action is available.
4. Select the logout action once and wait for all redirects and loading states to finish.
   - Expected: A stable approved Frontline login experience appears.
5. Validate the login page.
   - Expected: Either a visible enabled Passport email field with its **Next** action or a legacy username/password form with its **Sign In** action is displayed. Authenticated navigation and the account menu are absent.
6. Capture post-logout full-browser evidence and end the flow.
   - Expected: The login page remains visible and responsive.

## Flow 1 — Logout from React Home

1. Complete shared authentication with the required role/context.
2. Confirm React Home and its primary navigation are responsive.
3. Perform the shared logout steps and stop after validating the login page.

Expected: Logout succeeds from React Home and the approved login page displays.

## Flow 2 — Logout from Angular Daily Report

1. Complete shared authentication with the required role/context.
2. Open **Daily Report** and confirm its heading, primary controls, and account control are responsive.
3. Perform the shared logout steps and stop after validating the login page.

Expected: Logout succeeds from Angular Daily Report and the approved login page displays.

## Flow 3 — Logout from legacy Import Data

1. Complete shared authentication with the required role/context.
2. Navigate through **Extract / Import → Import Data** and confirm its primary controls and account control are responsive.
3. Perform the shared logout steps without selecting a file or starting an import, then stop after validating the login page.

Expected: Logout succeeds from Import Data and the approved login page displays.

## Flow 4 — Logout from Employee maintenance

1. Complete shared authentication with the required Organization User context.
2. Navigate through **Master Data → Employee → General Information** and confirm the page, **Add Employee**, and account control are responsive.
3. Perform the shared logout steps without opening or changing an employee, then stop after validating the login page.

Expected: Logout succeeds from Employee maintenance and the approved login page displays.

## Result classification

- **PASS:** The required source page is responsive, logout is selectable, and a stable approved login page displays.
- **FAIL:** Logout does not complete, authenticated controls remain on the stable destination, a functional application error appears, or the expected login controls do not display after the 120-second recovery rule.
- **BLOCKED:** Authentication, entitlement, browser control, missing source navigation, or a missing logout control prevents safe execution.

Do not fail or block these flows based on browser Back behavior because browser Back is outside their scope.

## Reporting

For each authorized flow, record the role/context, source page, visible logout label, stable login-page type, loading/recovery observation, full-browser screenshot, video range, and PASS/FAIL/BLOCKED result. Failure reproduction steps must end with the missing or incorrect login-page behavior.

Never report credentials, tokens, cookies, sensitive redirect fragments, or full authentication query strings.
