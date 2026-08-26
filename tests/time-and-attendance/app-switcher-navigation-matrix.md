# Time & Attendance App Switcher Navigation Matrix

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

Verify that each authorized role can establish Time & Attendance as the starting application, switch to Absence Management, and return to Time & Attendance without losing its authenticated role or organization context.

## Shared preconditions

- The selected role username and approved password source are configured.
- The role can authenticate through the shared Stage ML URL.
- Time & Attendance and Absence Management are expected entitlements for the selected account.
- Before each fresh session, clear only cookies/site data and cache for the approved Stage/MorpheusLite domains. Preserve history, saved passwords, and extensions; never inspect or report cookie/storage contents.
- Authentication evidence recording remains off until credential-bearing screens are gone.

## Shared flow

Run the following steps independently for each scenario and role:

1. Open the shared Stage ML URL and authenticate as the selected role.
   - Expected: Authentication succeeds without an error, CAPTCHA, MFA block, or unapproved redirect.
2. Establish Time & Attendance as the starting application using `instructions/time-and-attendance-details.md`.
   - Expected: Time & Attendance is responsive and the expected role/organization context is visible.
   - A first-launch redirect through the approved IDM `/logout` route is valid stale-session cleanup; follow it and record only its sanitized path and query-key names.
   - If Chrome shows `ERR_BLOCKED_BY_CLIENT`, capture the visible error and click its visible `Reload` control once. Treat a subsequent approved IDM/application navigation as a recoverable client event; fail only if the block persists or prevents the required destination.
3. Open the Time & Attendance application switcher.
   - Expected: The switcher is enabled, responsive, and fully visible.
4. Confirm unique enabled entries for `Time & Attendance` and `Absence Management`.
   - Expected: Neither required entry is blank, duplicated, disabled, or clipped beyond access.
5. Select `Absence Management` once.
   - Expected: The destination opens on an approved Stage host and retains the authenticated session.
6. Verify the Absence Management product identity and the same role/organization context.
   - Expected: The page is responsive and no access-denied or application error is visible.
7. Open the Absence Management application switcher and select `Time & Attendance` once.
   - Expected: Time & Attendance is restored on an approved Stage host.
8. Verify the restored Time & Attendance page.
   - Expected: The same role/organization context remains active and no authentication or application error appears.

If a target opens in a new tab, control the actual destination tab and close only the extra destination tab after the return path is proven. If return navigation fails, record the failure and recover the exact role/context safely before continuing an independent scenario.

## Scenario 29 - Organization User: Time & Attendance -> Absence Management -> Time & Attendance

TA ordinal: **1**. ROVO scenario: **not supplied**; this is the already implemented Organization User baseline.

Execute the shared flow as the configured Organization User with the following required checkpoints:

### A. MorpheusLite login and Frontline Central

1. Open the shared Stage ML URL from the selected `config/aes-stage.ml.<OrgId>.json`.
2. Select `Sign in with Frontline Passport`.
3. Enter the Organization User credentials through the approved secure mechanism.
4. If MFA appears, pause and ask the user to complete it; resume only after confirmation.
5. Confirm Frontline Central or the authenticated dashboard displays available applications.

Expected: Authentication succeeds, the dashboard is responsive, and no credential, MFA, or unapproved redirect remains blocking.

### B. Establish and baseline Time & Attendance

1. Select `Time & Attendance` from the dashboard or application switcher.
2. If the conditional organization selector appears, select the exact scenario 29 organization configured in `timeAttendanceScenarioContextSelections` and continue. For the current configured multi-role account this is the second visible organization option, but the exact organization label is authoritative and this behavior must not be generalized to other accounts or scenarios.
3. Record the selected organization/context separately from the role resolved by the destination. Do not block scenario 29 solely because the My Frontline card or selector metadata describes another available role.
4. Confirm Time & Attendance loads without another credential prompt.
5. Verify the destination visibly shows the configured organization and the Organization User role. The current Stage multi-role defect may resolve the selected context to the parent Organization User; this is permitted only for scenario 29 when `allowKnownParentUserResolution` is enabled. Record the defect accommodation explicitly.
6. If the conditional `Resource Center & Feedback Portal` announcement appears, capture it, dismiss it through its visible control, and continue. Do not require the overlay when it is absent.
7. Confirm the top navigation, side navigation, and a read-only Home-page content region are responsive. Do not open a configuration page or run a report merely as a stability check.
8. Capture the sanitized error-level console baseline using `instructions/time-and-attendance-details.md`.

Expected: Time & Attendance is fully responsive in the correct context with an authenticated session and a recorded console baseline.

### C. Time & Attendance -> Absence Management

1. Open the top application switcher in Time & Attendance.
2. Confirm `Absence Management` is unique and enabled, then select it once.
3. Confirm Absence Management loads without re-authentication on an approved Stage host.
4. Verify the same Organization User and organization context.
5. Confirm Absence Management Home is responsive, its primary navigation is enabled, and the application switcher remains accessible. Do not execute a separate Daily Report workflow inside this scenario.

Expected: Absence Management opens seamlessly with the same session and context and without an application, authorization, or loading error.

### D. Absence Management -> Time & Attendance regression check

1. Open the top application switcher in Absence Management.
2. Confirm `Time & Attendance` is unique and enabled, then select it once.
3. Confirm the destination requires no re-authentication and retains the Organization User role and organization context.
4. Confirm the final host is listed in `approvedHosts` and is not listed in `prohibitedHosts`.
5. Explicitly confirm the final host is not `qaestar.flqa.net`.

Expected: Time & Attendance returns through the MorpheusLite session without session loss, role change, or legacy-host regression.

### E. Final Time & Attendance stability and console comparison

1. Confirm the top navigation, side navigation, application switcher, and the same read-only Home-page checkpoint remain responsive.
2. Capture error-level console entries again and compare them with the initial baseline.
3. Confirm no new unexpected authentication, authorization, navigation, loading, or unhandled application error was introduced by the switching loop.

Expected: The restored Time & Attendance session is functionally equivalent to the initial state and introduces no unexpected console error beyond the sanitized baseline.

Scenario 29 passes only when sections A–E all pass. A redirect to `qaestar.flqa.net`, another prohibited/unapproved host, re-authentication prompt, role/context change, failed product load, or new relevant console error is a **FAIL**.

## Scenario 30 - Campus User: Time & Attendance -> Absence Management -> Time & Attendance

TA ordinal: **2**. ROVO scenario: **1**.

Execute the shared flow as the configured Campus User with these additional checkpoints:

1. Authenticate through the shared MorpheusLite URL using only the Campus User credential routing.
2. From My Frontline, select `Time & Attendance` and confirm the visible Campus User role plus the expected campus/school context when the UI exposes it.
3. Confirm a read-only Campus User home/navigation region is responsive. `Approvals`, campus absences, or an equivalent campus-scoped region may be used when visibly available; do not fail solely because ROVO's example label is absent.
4. Switch from Time & Attendance to Absence Management without re-authentication.
5. Confirm the Campus User role and the same campus/school or organization context in Absence Management. Use a visible campus dashboard, Daily Report, or equivalent read-only campus-scoped checkpoint when available.
6. Switch back to Time & Attendance and confirm the same role/context, responsive navigation, approved final host, and no `qaestar.flqa.net` redirect.
7. Compare sanitized error-level console entries before and after the switching loop.

Expected: The Campus User completes both product transitions and returns to a responsive Time & Attendance page with the same context.

## Scenario 31 - Employee: Time & Attendance -> Absence Management -> Time & Attendance

TA ordinal: **3**. ROVO scenario: **2**.

Execute the shared flow as the configured Employee with these additional checkpoints:

1. Authenticate through the shared MorpheusLite URL using only the Employee credential routing.
2. From My Frontline, select `Time & Attendance` and confirm the visible Employee role and self-service context.
3. Confirm one read-only employee-scoped home/navigation region is responsive. ROVO examples such as scheduled or past items are optional evidence only when the live T&A UI exposes them; do not assume Absence Management tab names exist in T&A.
4. Switch from Time & Attendance to Absence Management without re-authentication.
5. Confirm the Employee role remains active and only the authenticated employee's self-service view is presented. Do not open another person's record, create an absence, select a substitute, or change data.
6. Switch back to Time & Attendance and confirm the same Employee context, responsive navigation, approved final host, and no `qaestar.flqa.net` redirect.
7. Compare sanitized error-level console entries before and after the switching loop.

Expected: The Employee completes both product transitions and returns to a responsive Time & Attendance page with the same context.

## Scenario 32 - Substitute: Time & Attendance -> Absence Management -> Time & Attendance

TA ordinal: **4**. ROVO scenario: **3**.

Execute the shared flow as the configured Substitute with these additional checkpoints:

1. Authenticate through the shared MorpheusLite URL using only the Substitute credential routing.
2. From My Frontline, select `Time & Attendance` and confirm the visible Substitute role and substitute self-service context.
3. Confirm one read-only substitute-scoped home/navigation region is responsive. ROVO examples such as available, scheduled, past, or non-working-day items are optional evidence only when visibly exposed; do not accept a job or create a non-working day.
4. Switch from Time & Attendance to Absence Management without re-authentication.
5. Confirm the Substitute role remains active and the destination is a substitute-scoped view. Inspect only read-only visible content; do not accept, reject, cancel, or create work.
6. Switch back to Time & Attendance and confirm the same Substitute context, responsive navigation, approved final host, and no `qaestar.flqa.net` redirect.
7. Compare sanitized error-level console entries before and after the switching loop.

Expected: The Substitute completes both product transitions and returns to a responsive Time & Attendance page with the same context.

## Evidence and reporting

For every role, report an independent outcome with:

- the exact configured test username used for authentication, labeled `Test username` in the dashboard and scenario HTML;
- the role and non-sensitive organization context;
- the established Time & Attendance starting state;
- the open switcher with both required applications;
- the Absence Management destination;
- the restored Time & Attendance destination;
- expected and observed results for every step;
- one scenario-specific continuous-video range; and
- a sanitized redirect sequence following `instructions/time-and-attendance-details.md`, including any expected/inferred IDM authorization hop and every observed stable product/bootstrap route; and
- an `HTTP 404 observations` table following `instructions/time-and-attendance-details.md`, with each 404's sanitized origin/path, query-key names, phase, and impact, or the explicit no-404 state; and
- numbered reproduction steps for every FAIL or the exact dependency for every BLOCKED result.

Embed the scenario's credential-free video evidence in both the dashboard and scenario page. Do not combine outcomes across roles. The configured Stage test username is required in the HTML only; never include its password, a username/password pairing, personal data, raw authorization URLs, query values, tokenized path values, or sensitive redirect fragments.
