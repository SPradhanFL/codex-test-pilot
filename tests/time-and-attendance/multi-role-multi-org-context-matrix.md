# Time & Attendance Multi-Role and Multi-Organization Context Matrix

## Execution directive

Before browser action, read completely:

1. `instructions/project-instructions.md`
2. `instructions/application-details.md`
3. `instructions/test-data.md`
4. `instructions/time-and-attendance-details.md`
5. `instructions/Multi User Instructions/role-scenario-matrix.md`
6. the selected multi-role or multi-organization controller
7. `config/aes-stage.ml.<OrgId>.json`
8. `instructions/html-reporting-standard.md`

Execute directly in the fresh isolated headed Chrome context required by the multi-user suite. Do not generate test code. Keep every validation read-only and save the standard HTML evidence under the selected controller's report folder.

## Objective

Verify that a configured account with multiple role, identity, or organization contexts can discover, select, and preserve each supported Time & Attendance context without leaking data, permissions, navigation, or session state from a previously active context.

The switcher is a context selector, not proof that a switch succeeded. At every checkpoint verify the loaded product, visible role, visible organization, role-appropriate navigation, and one non-sensitive read-only content region together.

## Shared preconditions and safety

- Use only controllers explicitly enabled in `config/aes-stage.ml.<OrgId>.json`.
- Discover context labels from the live selector; do not invent `Org A`, `Org B`, or numbered role labels.
- Treat repeated same-type roles as separate only when the UI exposes a stable, non-sensitive differentiator such as organization, campus, identity label, or distinct selector entry.
- Never infer a missing role or organization from stale page content, a URL value, or another account's configuration.
- Do not create, edit, grant, revoke, migrate, invite, run, schedule, export, or delete data.
- Do not inspect cookies, local storage, tokens, or raw authorization URLs.
- If fewer contexts are exposed than the selected controller requires, mark only the missing context-dependent scenario **BLOCKED** and continue independent work.
- Apply the approved-host, sanitized navigation, HTTP 404, console-baseline, 120-second UI-recovery, measured >30-second load-warning, known-failure, screenshot, and continuous-video requirements from the shared instructions.

## Shared context proof

For every selected context capture:

1. the selector entry's visible role and organization/identity label;
2. the Time & Attendance product identity after selection;
3. the loaded page's active role and organization labels;
4. one role-authorized navigation item and one role-restricted item when the restriction is observable without direct URL guessing; and
5. one non-sensitive, read-only content-region identity or explicit empty state.

The proof fails if the selector changed but the destination retained a previous role, organization, permission set, or content region.

## Scenario 40 - Inventory and validate Time & Attendance multi-role contexts

Applies once to every enabled `multi-role-*` controller.

1. Authenticate with the controller's configured combination account and establish Time & Attendance.
2. Open the supported role/context selector and capture every visible selectable entry in displayed order.
3. Verify every controller-required role is present exactly as many times as the controller requires.
4. When the same role type appears more than once, verify the entries have a stable visible differentiator. Do not select ambiguous duplicate entries by position alone.
5. Select each required entry once and collect the shared context proof.
6. Return to the controller's first required role context and prove it is responsive.

Expected: Every required role/identity context is independently selectable, uniquely distinguishable, and resolves to matching Time & Attendance role and organization/identity evidence. When Absence and Time assignments that share an IDM role identifier are surfaced together, they remain application-qualified and do not collapse into an ambiguous selector entry.

## Scenario 41 - Switch roles mid-session and verify permission and content isolation

Applies once to every enabled `multi-role-*` controller after scenario 40.

1. Begin in the controller's first required role context and capture the shared context proof.
2. Select the next required role/identity context without logging out.
3. Wait for the destination to become stable, then collect the shared context proof again.
4. Verify navigation and read-only content match the new role and that previous-role-only navigation or content is absent when the restriction is observable.
5. Repeat until every required role/identity context has been selected.
6. Switch back to the original role context and verify its original role-authorized surface is restored without stale content from the last context.

Expected: Each switch atomically replaces the active role/identity context. No previous-role-only navigation, content, or permissions remain visible after the destination stabilizes, and the original context can be restored consistently.

Do not probe guessed restricted URLs. Organization-only `Manage User Access` and Report Writer coverage remains in scenarios 33/35 and Campus Report Writer coverage remains in scenario 20.

## Scenario 42 - Preserve the selected role through Time & Attendance -> Absence Management -> Time & Attendance

Applies once to every enabled `multi-role-*` controller after scenario 41.

1. Switch from the original role to a different controller-required role/identity context and collect the shared context proof.
2. Open the Time & Attendance application switcher and select `Absence Management` once.
3. Verify Absence Management opens on an approved Stage host without re-authentication and displays the newly selected role/organization or its supported product-equivalent context.
4. Return through the Absence Management application switcher to Time & Attendance.
5. Verify the role/identity context selected in step 1 is restored; the role active before step 1 must not reappear as active or leak role-only navigation/content.
6. Compare sanitized error-level console evidence with the Time & Attendance baseline.

Expected: The application round-trip preserves the most recently selected role/identity context and never restores the prior role merely because it was active at login.

## Scenario 43 - Inventory and validate Time & Attendance multi-organization contexts

Applies once to every enabled `multi-org-*` controller.

1. Authenticate with the controller's configured multi-organization account and establish Time & Attendance.
2. Open the supported organization/role selector and capture all visible selectable entries in displayed order.
3. Verify the controller-required organization/role contexts are present and distinguishable by stable visible labels.
4. Select each required organization context once and collect the shared context proof.
5. Verify each loaded organization label matches its selected entry and the role is valid for that organization.

Expected: Every required organization/role context is independently selectable and resolves to matching Time & Attendance evidence. An organization with no selectable assignment is not treated as an executable context.

## Scenario 44 - Switch organizations and verify role availability and data isolation

Applies once to every enabled `multi-org-*` controller after scenario 43.

1. Begin in the first required organization/role context and capture its shared context proof.
2. Switch to the next required organization context without logging out.
3. Verify the active role is one of the roles visibly offered for the destination organization. If the same role exists there, verify whether the supported selector retains it; otherwise select the controller-required destination role.
4. Collect the destination shared context proof and verify no source-organization label, read-only content identity, or role-only navigation remains.
5. Use browser Back once only when a stable source route was captured safely.
   - Expected: stale source-organization content is not exposed; the page refreshes in the current context, redirects safely, or requires a supported context selection.
6. Return through the supported selector to the original organization/role context and verify its original evidence is restored without destination-organization data.
7. Repeat for every required organization context.

Expected: Organization changes atomically update both data scope and the roles available in that organization. Forward, return, and browser-history navigation never expose stale data from another organization.

## Scenario 45 - Preserve the selected organization and role through an application round-trip

Applies once to every enabled `multi-org-*` controller after scenario 44.

1. Switch from the initial context to a different required organization/role context and collect the shared context proof.
2. From Time & Attendance, select `Absence Management` once through the visible application switcher.
3. Verify Absence Management opens without re-authentication in the selected destination organization and supported role-equivalent context.
4. Return to Time & Attendance through the visible application switcher.
5. Verify the exact organization/role context selected in step 1 is restored and no initial-context data or navigation is visible.
6. Compare the final sanitized console evidence with the Time & Attendance baseline.

Expected: The most recently selected organization/role context survives both product transitions without context drift, mixed-organization data, or fallback to the login-default context.

## Scenario 46 - Logout after multiple context switches clears the authenticated session

Applies once to every enabled multi-role or multi-organization controller after its context-switching scenarios.

1. Authenticate and perform at least two supported context changes, ending in a context different from the initial context.
2. From Time & Attendance, use the visible account control to sign out once.
3. Verify the approved Passport/MorpheusLite login experience appears and authenticated product content is absent.
4. Use browser Back once.
   - Expected: No previously visited role or organization context is restored.
5. Navigate directly to one safely captured Time & Attendance route from the switching sequence.
   - Expected: Authentication is required and no prior context content appears.
6. Navigate to the configured Stage ML entry.
   - Expected: Credential entry is required; no context is silently restored.

Expected: Logout terminates the shared authenticated session after multiple context changes. No role, organization, or application context remains accessible through browser history or direct safe-route navigation.

Scenario 46 does not require a selector to appear before credential entry on the next login. A product may legitimately remember a preference after successful authentication; only authenticated pre-login restoration is a failure here.

## Evidence and reporting

Report scenarios 40-46 independently when assigned by the selected controller. Include:

- repository scenario ID and source file;
- exact configured login username only in the labeled HTML `Test username` field;
- every non-sensitive selector entry required to prove coverage;
- before/after role and organization proof for each switch;
- observable navigation/content isolation evidence;
- approved application destinations and restored Time & Attendance state;
- sanitized navigation and HTTP 404 observations;
- scenario-specific full-browser screenshots and measured continuous-video ranges; and
- numbered reproduction steps for every FAIL or the exact missing context/entitlement for every BLOCKED result.

Never include passwords, personal data, tokens, raw authorization URLs, query values, tokenized path values, cookies, or session identifiers.
