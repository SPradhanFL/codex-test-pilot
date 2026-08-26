# Time & Attendance Execution Details

## Purpose

Provide the shared environment, navigation, safety, and role-context rules for Time & Attendance scenarios. These scenarios use the same Stage ML login URL and credential routing as the existing multi-user controllers.

## Environment

- URL source: the selected `config/aes-stage.ml.<OrgId>.json` property `url`.
- Environment: Stage ML / non-production only.
- Approved hosts: use only hosts listed in the selected organization configuration's `approvedHosts` property.
- Prohibited legacy hosts: fail closed on any host listed in the selected organization configuration's `prohibitedHosts` property.
- Authentication: use the selected controller's username and password sources. Never fall back to another role.
- Do not require or add a separate Time & Attendance login URL.

## Establishing the starting application

`Login to Time & Attendance` means:

1. Start the project-scoped Playwright MCP in its configured disposable Chrome mode (`--browser chrome --isolated`). Before the run's first navigation, call the MCP browser-close operation once so any earlier isolated session is discarded; the next navigation starts the run's clean in-memory profile. This is the authoritative fresh-session boundary: it contains no prior cookies, site data, or cache. Do not use or clear the developer's persistent Chrome profile. If disposable mode cannot be verified by `scripts/check-disposable-playwright-profile.ps1`, stop before authentication and mark the run **BLOCKED**.
2. Open the shared Stage ML URL and authenticate as the selected role.
3. Select `Sign in with Frontline Passport` when that control is displayed.
4. Enter credentials only through the selected controller's approved secure mechanism.
5. If MFA appears, pause and ask the user to complete it. Do not automate MFA, request an MFA value in chat, or bypass it.
6. Confirm Frontline Central or the authenticated dashboard displays the selected role/organization context and available applications.
7. If the first application is not Time & Attendance, select `Time & Attendance` from the visible application list or switcher.
8. When an organization/context selector appears, use the exact scenario-specific entry in the selected `config/aes-stage.ml.<OrgId>.json` property `timeAttendanceScenarioContextSelections`. Do not apply a configured selection to another scenario or account. When no selector appears or no entry is configured for the active scenario, continue with the single available context and record that no explicit selection was required.
9. Treat the selector choice and the role/context visible after launch as separate observations. The application card or selector metadata is not proof of the destination role for a multi-role account; validate the destination header after Time & Attendance loads.
10. Confirm the destination visibly identifies `Time & Attendance`, is responsive, remains on an approved Stage host, retains the required destination role/context, and shows no access-denied or application error.

### First-launch IDM logout and Chrome client-block handling

- On the first selection of Time & Attendance after MorpheusLite authentication, a one-time navigation through the approved IDM host's `/logout` route is valid. The route may include an opaque `id` query value; record only the query-key name (`id`) and redact its value. Continue following the visible redirect until the approved Time & Attendance destination or the next expected Passport step is reached. Do not classify this logout hop as re-authentication or a failure by itself.
- If Chrome displays its visible `ERR_BLOCKED_BY_CLIENT` page for an approved Stage application host, capture the page as client-environment evidence and use the visible `Reload` control once. Classify the block as a recoverable browser-client event when the reload proceeds to an approved IDM/application route; do not attribute the block to the application. If the block persists after the single reload or prevents the required destination, record the scenario as **FAIL** with the browser-client limitation explicitly separated from application behavior.

If Time & Attendance is unavailable, disabled, or inaccessible for the selected role, mark only that role's affected scenario **BLOCKED** or **FAIL** according to the observed state. Do not substitute another identity.

## Conditional multi-role context selection

- Multi-role or multi-organization selectors are conditional UI. Do not require them for accounts that launch directly into Time & Attendance.
- When a scenario-specific selection is configured, select the exact organization label rather than relying on its ordinal position. Record its visible ordinal as supporting evidence when useful, but do not make `second option` a global rule.
- For scenario 29 only, `allowKnownParentUserResolution: true` documents the current Stage defect in which a multi-role selection resolves to the parent Organization User. This allowance permits scenario 29 to continue only when the loaded Time & Attendance header visibly shows the configured organization and Organization User role. It does not permit Campus User, Employee, Substitute, or any other scenario to accept an unexpected role.
- If the selector changes, the configured organization is absent, or the loaded destination does not match the scenario's `expectedDestinationRole`, stop and report the affected scenario as **FAIL** or **BLOCKED** based on the observed condition.

## Conditional informational overlays

- Time & Attendance may display a `Resource Center & Feedback Portal` announcement after launch. This overlay is conditional and must not be expected in every run.
- When present, capture it as launch evidence, dismiss it using its visible `Dismiss` or close control, and continue the read-only scenario. Do not open the feedback portal, submit feedback, or treat the informational overlay as an application failure.
- When absent, continue without adding a missing-overlay check or changing the scenario result.

## Page identification

Prefer visible accessible names over routes. During execution, record the actual Stage route without query strings, tokens, or session identifiers.

- Time & Attendance home: the product identity and authenticated home/navigation are visible.
- Application switcher: a visible product control exposes `Time & Attendance` and `Absence Management` as unique enabled entries.
- Users destination: the Organization User can open the visible `Users` navigation and a user search/list experience loads.
- Manage User Access: the selected user's access-management destination visibly identifies the user and access details.
- View in Absence Management: the selected user's action opens the matching user in the Stage Absence Management application.
- Report Writer: `Reports` -> `Report Writer` opens a responsive report-writer destination.

If the live UI uses an equivalent accessible label, record the observed label and use it consistently. Do not guess a hidden route or bypass visible navigation.

## MorpheusLite route and legacy-host regression

- The shared login starts from the configured MorpheusLite Stage URL, but launched applications may use another host from `approvedHosts`. Do not require the browser to remain on the login hostname after product launch.
- After every Time & Attendance -> Absence Management -> Time & Attendance return, confirm the final host is approved and is not listed in `prohibitedHosts`.
- A redirect to `qaestar.flqa.net`, another prohibited host, production, or an unapproved host is a **FAIL**. Stop navigation and preserve safe evidence without query strings or session data.
- Do not add a newly observed product host to `approvedHosts` during execution. Stop and request review first.

## Expected IDM authorization redirects

- A temporary navigation through `idgatewayawsstage.flqa.net/connect/authorize` is an expected OpenID Connect exchange for a MorpheusLite application launch.
- A first-launch navigation through `idgatewayawsstage.flqa.net/logout` is also an expected stale-session cleanup hop when it immediately continues through the approved launch flow. Treat it as `Observed` or `Expected/inferred` according to the evidence available, and retain only sanitized path/query-key data.
- The IDM exchange is successful only when it uses the existing approved Passport session, returns to the selected application, and does not display a credential form, role picker, access-denied page, or application error.
- Do not fail merely because the browser temporarily leaves a `stage-k12.ss.frontlineeducation.com` application host for the approved IDM host.
- Fail when the authorization exchange stops at an IDM login page, requests credentials again, returns to a prohibited or production host, changes the role/organization context, or never returns to the selected application.
- A fast IDM exchange may not persist as a top-level history entry. Record it as `observed` only when the current URL or focused run history proves it. Otherwise label it `expected/inferred OIDC hop`; never claim it was directly observed.

## Sanitized URL-navigation evidence

Capture a sanitized navigation trail for every Time & Attendance scenario, including login/application launch, every cross-product action, callbacks or bootstrap routes, the stable destination, return navigation, and logout redirects when applicable.

1. Start URL sampling only after credential-bearing screens are gone. Authentication may remain outside the recording.
2. During each navigation, sample the active tab URL frequently enough to catch short-lived redirects. After the destination stabilizes, a single focused browser-history query limited to the run window and known Stage hosts may supplement missed top-level transitions.
3. Record only:
   - timestamp or relative sequence;
   - source product and user action;
   - scheme and approved host;
   - path after replacing tokenized or identifier-bearing segments with `{REDACTED}`; and
   - query-parameter names, never their values.
4. Redact all values for `state`, `nonce`, `code`, `id_token`, `access_token`, `token`, `signin`, `session`, `redirect_uri`, organization/domain selectors, user identifiers, and any other opaque value. Redact opaque values embedded in path segments, including `/token/{REDACTED}/`.
5. Do not store or report URL fragments, authorization responses, cookies, request/response bodies, or headers.
6. Classify every row as `Observed`, `Expected/inferred`, or `Not observed`. User-supplied or ROVO traces are context, not direct evidence from the current run.
7. Confirm the stable final host against `approvedHosts` and `prohibitedHosts` after every application launch and return.

The HTML scenario page must contain a `Sanitized redirect sequence` table with sequence number, evidence classification, action/source, sanitized URL, and observed result. The dashboard must summarize whether re-authentication occurred and link to the detailed table.

## Video evidence for every TA scenario

- Record every Time & Attendance scenario after credentials and MFA are no longer visible.
- Keep the complete application viewport visible and include the starting checkpoint, visible action, redirect/loading interval, destination identity/context, and final checkpoint.
- Use one continuous final video for a multi-scenario run and exact scenario ranges. For a single-scenario run, one scenario-specific MP4 or WebM is acceptable when the Chrome connection cannot expose a native continuous recorder.
- A frame-based MP4 is acceptable only when it uses real chronological browser captures, preserves loading delays, contains no credential screen, and is identified accurately in the report.
- The HTML dashboard and scenario page must embed the final video with relative links and provide a direct download link.
- Keep screenshots for the start, each cross-product destination, and the final return or logout state.

## Console-error comparison

1. After the initial Time & Attendance page is responsive, capture a baseline of current browser-console entries at error level.
2. Do not copy raw console messages into reports when they contain identifiers, URLs with query strings, tokens, or personal data. Report sanitized fingerprints or counts only.
3. After the final return to Time & Attendance, capture error-level entries again and compare them with the baseline.
4. Existing baseline errors do not fail the scenario by themselves. A new unexpected error introduced during application switching is a **FAIL** when it indicates navigation, authentication, authorization, loading, or unhandled application failure.
5. Warnings may be recorded separately but do not fail the scenario unless the source test explicitly promotes a warning to an error condition.

### HTTP 404 evidence

- For every observed HTTP 404 during a Time & Attendance scenario, record the request's sanitized URL in the HTML scenario report, even when the 404 does not change the functional result.
- Record only the scheme, approved host, sanitized path, and query-parameter names. Never record query values, fragments, request/response bodies, headers, authorization data, or opaque identifier-bearing path segments.
- Replace tokenized or identifier-bearing path segments with `{REDACTED}` using the same rules as the sanitized navigation trail.
- Include the action or product phase that produced the 404, the HTTP status, evidence classification, and observed functional impact.
- When no 404 is observed, show `No HTTP 404 responses observed` in the scenario report.
- A 404 is evaluated under the console-error comparison rule: fail it when it indicates a required navigation, authentication, authorization, data, or page-loading failure; otherwise retain it as a non-failing observation with the rationale.

## Test username evidence

- Resolve the exact non-production test username through the selected controller's approved credential routing before browser action.
- Record that username as `Test username` in the HTML dashboard and every Time & Attendance scenario-detail page executed with that login.
- For a combination account, record the login username separately from the visible destination role and organization context; repeat it on each applicable TA scenario page.
- This is a narrow reporting exception for the configured Stage test username. Never include the password, a username/password pairing, credentials from an unexpected prompt, or usernames discovered from application records.
- Do not add the username to screenshots, video annotations, filenames, URLs, navigation JSON, console fingerprints, or failure reproduction URLs.

## Organization User target data

Scenarios that open a user require all of the following before browser actions:

- a synthetic or approved user search identifier;
- the expected display name or other non-sensitive identity proof;
- the expected organization context; and
- the expected role or user type when the destination displays it.

The invocation, controller, or a future non-secret configuration entry may supply these values. If any required target value is missing, mark scenarios 33 and 34 **BLOCKED** before selecting a user. Never invent a user or use a production/personally sensitive record.

## Shared safety rules

- Execute directly in headed Chrome through Playwright MCP. Do not generate browser-automation source code.
- Use only the project-scoped disposable Playwright MCP Chrome instance for fresh-session execution. Do not substitute a connected Chrome-extension profile, a saved storage state, or a persistent user-data directory.
- After the final screenshot/video capture and browser-dependent evidence collection, call the MCP browser-close operation. In isolated mode this discards the run's complete in-memory storage state. Record this disposal in the report's cleanup result.
- Keep all Time & Attendance navigation read-only.
- Do not create, edit, save, submit, grant, revoke, invite, approve, schedule, run, print, export, or delete data.
- Before opening a user, verify the search result matches the configured target.
- Before following a cross-product action, inspect its visible label and destination when available.
- A destination may open in the same tab or a new tab. Detect the actual target and retain the original context until return navigation is proven.
- Stop on production, an unapproved host, a browser warning, MFA, CAPTCHA, or an unexpected credential request.
- For MFA, stop and hand control to the user; resume only after the user confirms completion.
- Capture evidence only after credential-bearing screens are gone. Never record credentials, tokens, cookies, session URLs, personal data, or sensitive redirect fragments.
- The configured Stage test username may appear only in the required HTML `Test username` field. It is not permitted in screenshots, video, filenames, navigation evidence, or raw diagnostic output.
- Do not copy a raw authorization URL into any report or diagnostic artifact, even when the user or ROVO supplied it. Preserve only the sanitized structure defined above.

## Result classification

- **PASS:** Every required destination, role/context check, return path, and safety expectation succeeds.
- **FAIL:** An expected visible control or application is present but broken, disabled, incorrect, access denied, or loses the required context.
- **BLOCKED:** Missing credentials, target data, role permission, application entitlement, or unavailable UI prevents safe execution.
