# Time & Attendance Logout Navigation Matrix

## Execution directive

Before browser action, read completely:

1. `instructions/project-instructions.md`
2. `instructions/application-details.md`
3. `instructions/test-data.md`
4. `instructions/time-and-attendance-details.md`
5. `instructions/Multi User Instructions/role-scenario-matrix.md`
6. the selected role controller
7. `config/aes-stage.ml.<OrgId>.json`
8. `instructions/html-reporting-standard.md`

Execute directly in headed Chrome through Playwright MCP. Do not generate test code. Use the selected controller's credential routing and save the standard HTML report under `reports/`.

## Objective

Verify that logging out from Time & Attendance terminates the authenticated session for each configured role.

## Shared logout flow

Run every role scenario from a fresh authenticated session:

1. Authenticate through the shared Stage ML URL as the selected role.
2. Establish Time & Attendance as the starting application.
   - Expected: Time & Attendance is responsive and the selected role/organization context is visible.
3. Capture the current Time & Attendance route without query strings, tokens, or session identifiers.
4. Open the authenticated account control and select the visible `Sign Out` or `Log Out` control once.
   - Expected: The configured MorpheusLite/Frontline Passport login experience appears, authenticated Time & Attendance content is absent, and the browser does not silently restore an IDM-mode session.
5. Use browser Back once.
   - Expected: Authenticated Time & Attendance content is not restored.
6. Navigate directly to the safe Time & Attendance route captured in step 3.
   - Expected: Authentication is required or the approved login page appears; the prior session is not silently restored.
7. Navigate once to the configured MorpheusLite Stage URL.
   - Expected: A login action is required. My Frontline, Time & Attendance, and Absence Management must not become authenticated without credential entry.

Do not clear cookies, local storage, or browser profiles as a substitute for application logout.
Do not inspect browser cookies or session storage as evidence. Prove termination only through the visible logout destination, browser Back, direct safe-route access, and configured MorpheusLite entry behavior.

## Scenario 36 - Logout from Time & Attendance as Organization User

TA ordinal: **8**. ROVO scenario: **7**.

Execute the shared logout flow as the configured Organization User.

Before logout, confirm the visible Organization User and organization context plus one responsive read-only T&A region.

## Scenario 37 - Logout from Time & Attendance as Campus User

TA ordinal: **9**. ROVO scenario: **8**.

Execute the shared logout flow as the configured Campus User.

Before logout, confirm the visible Campus User and campus/school or organization context plus one responsive read-only campus-scoped T&A region when available.

## Scenario 38 - Logout from Time & Attendance as Employee

TA ordinal: **10**. ROVO scenario: **9**.

Execute the shared logout flow as the configured Employee.

Before logout, confirm the visible Employee role plus one responsive read-only employee self-service region. Do not create or change an absence.

## Scenario 39 - Logout from Time & Attendance as Substitute

TA ordinal: **11**. ROVO scenario: **10**.

Execute the shared logout flow as the configured Substitute.

Before logout, confirm the visible Substitute role plus one responsive read-only substitute self-service region. Do not accept, reject, cancel, or create work.

## Evidence and reporting

Report every role independently. Include the repository ID, TA ordinal, ROVO number, exact configured login username labeled `Test username`, authenticated Time & Attendance checkpoint, approved login destination, Back result, direct-route result, configured MorpheusLite-entry result, expected and actual results, scenario-specific continuous-video range, sanitized redirect sequence, and an `HTTP 404 observations` table with sanitized URL evidence or an explicit no-404 state. Explicitly report whether IDM appeared and whether it silently restored an authenticated session. The configured Stage test username is required in HTML only. Never include its password, a username/password pairing, personal data, raw authorization URLs, query values, tokenized path values, or session identifiers.
