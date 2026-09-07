# Absences Menu -> Tab Validation — AES Stage

## Execution directive

Before any browser action, read completely:

1. `instructions/project-instructions.md`
2. `instructions/application-details.md`
3. `instructions/test-data.md`

Execute this scenario directly in Chrome using Playwright MCP. Do not generate Playwright or TypeScript code. Run unattended without pausing for password entry or routine confirmation. Generate the standard HTML evidence report defined by `instructions/html-reporting-standard.md`.

## Objective

Log in to AES Stage, resolve and open the exact organization-scoped configured absence when one exists, and validate every visible absence tab. When no fixed mapping exists, find another existing absence that can be viewed safely. Only when neither a fixed mapping nor another existing absence is available may the test create one fresh absence for the verified synthetic employee, validate it, and clean up only that exact current-run record.

## Preconditions and safety

- Playwright MCP is available.
- For standalone execution, work only on AES Stage at `https://aesstage.flqa.net`; the authentication redirect to `https://adminwebstage2.flqa.net/` is approved. For Multi User execution, use the Stage ML URL and `approvedHosts` from `config/aes-stage.ml.<OrgId>.json`.
- For a Multi User invocation, the organization-scoped credential file replaces the manual-password-entry instruction in `instructions/test-data.md`.
- When this file is invoked by a Multi User execution controller, that controller's Stage ML URL, credential keys, active role, and organization context replace the standalone URL and credential sources below. Do not change identity or organization merely to obtain easier test data.
- For a Multi User invocation, first resolve an exact `scenarioData.absenceTabs.entries` mapping from `config/aes-stage.ml.<OrgId>.json` using the active login's username key, active role, and organization context. A configured confirmation number is the preferred read-only record and must be tried before generic searching or temporary creation.
- Treat `absenceDate` as the scheduled date of the configured absence, not as an expiration date. A configured record is read-only and must never be deleted or cleaned up by this test.
- Do not record, display, repeat, or screenshot the password.
- Persistent creation and deletion are authorized only for the temporary fallback setup described in this scenario. This narrow create-and-cleanup lifecycle is also authorized during unattended safe-mode runs.
- Never create an absence for a realistic-looking, unverified, or production employee.
- In an Organization User or Campus User flow that exposes an employee selector, find the exact synthetic employee using the verification key in `instructions/test-data.md` and verify its name and identifier before creation.
- In an Employee self-service flow that does not expose an employee selector, create only for the currently authenticated configured Stage test identity and confirm the active role and organization before submission.
- For a Stage ML Substitute role, use the Substitute-specific Scenario 14 override in `instructions/Multi User Instructions/substitute-user-execution.md`: validate Available Jobs, Scheduled Jobs/Schedule, Past Jobs/History Jobs, and Non Work Days. Do not require an individual absence/job detail page or run the create fallback. Never accept, assign, reject, cancel, create, edit, save, or delete work.
- Record the created absence confirmation number or assigned ID immediately after creation. Use that exact identifier for validation and cleanup.
- Prefer an absence that does not require a substitute. Do not assign, notify, call, or contact a substitute.
- Do not edit an existing absence. Existing records are read-only for this scenario.
- During standalone authentication, `idgatewayawsstage.flqa.net` is an approved login host. During Multi User authentication, use only hosts approved by the invoking controller's Stage ML configuration. After authentication, continue only in the configured AES Stage application.
- For this scenario, the approved authentication redirect above is the explicit exception to the general different-host stop rule in the shared instructions.

## Steps

### 1. Launch and authenticate

1. For standalone execution, read the Stage URL and username from `config/aes-stage.json`. For Multi User execution, retain the URL, login combination, role, and organization selected by the invoking controller.
2. For standalone execution, use `AES_STAGE_PASSWORD` when the environment variable is configured. For Multi User execution, use the invoking controller's documented credential key.
3. Otherwise, read the applicable password from the local secrets file documented by the standalone test or invoking controller.
4. If neither password source is available or the local value is still a placeholder, mark all flows **BLOCKED**, generate the HTML report, and stop before opening the browser.

### 2. Find an absence to view

5. For Multi User execution, resolve the exact configured absence entry before navigating:
   - Match `loginUsernameKey` to the configuration key that supplied the active username.
   - Match `role` to the confirmed active role.
   - When `organizationContext` is present, require the exact active organization context.
   - Never borrow a confirmation number from another login, role, organization, or `OrgId`.
   - Expected: At most one exact entry matches. If multiple entries match, mark the workflow **BLOCKED** as ambiguous and do not open or create a record.
6. If the exact entry contains `executionDirective: NOT TESTED`, record Scenario 14 as **NOT TESTED** using its configured reason and continue with independent scenarios. Do not search for or create an absence for that context.
7. When the exact entry contains a confirmation number, find that record in this order:
   1. Start from the responsive role-appropriate Home or Dashboard page and locate the header Search input by accessible role/name or placeholder: `textbox` with accessible name `Search` or placeholder `Search`. The currently observed markup is `<input class="search" type="text" placeholder="Search" aria-label="Search">`; use `input.search` only as a fallback when it resolves to exactly one visible element.
   2. Scroll the header Search input into view, focus it, clear any existing value, and enter only the configured confirmation number. Confirm the input contains the complete number.
   3. Wait for the search suggestion/results UI. Select the result containing the exact confirmation number. If the control requires submission and no suggestion is available, press `Enter` once, wait for the Search results page, and select only the exact confirmation-number match. Do not select a partial or ambiguous result.
   4. If the header Search is unavailable or does not return the exact record, open the role-appropriate `Scheduled Absences`, `Absences` → `Modify`, or Campus absence/reconciliation view named by the visible navigation.
   5. When `absenceDate` is configured, set the list/search date to that exact scheduled date and search for the configured confirmation number. When the date is not configured, search by confirmation number without treating the default date-range zero state as proof that the record is missing.
   6. If the list does not expose the record or a usable confirmation search, return to Dashboard/Home and locate the **Quick Action** text box. Search using only the configured confirmation number.
   7. If an approved `detailsUrl` is configured and header Search, normal list, and Quick Action discovery do not open the record, navigate to that URL only in the already authenticated matching role/context and only when its host is in `approvedHosts`.
   8. Confirm the opened record displays the exact configured confirmation number before traversing tabs.
   - Expected: The configured absence opens read-only in the correct role and organization context. If it cannot be found after every supported route, mark Scenario 14 **BLOCKED**, record the missing configured confirmation, and do not create a replacement automatically.
8. When no exact configured entry exists, navigate through the role-appropriate absence list or `Absences` → `Modify`, search the default date range and safe adjacent range, and select one record that can be opened read-only. If no absence is returned, record the zero-result state and execute the fallback creation steps below. A zero-result search is not a blocker by itself when no fixed mapping exists.

### 3. Fallback setup — create a fresh absence only when needed

9. Navigate through `Absences` → `Create Absence`.
   - Expected: The Create Absence page is displayed with employee, date, reason, and continuation controls appropriate to the organization.
10. Resolve the safe target according to the active role:
    - Organization User or Campus User with an employee selector: search for the exact synthetic employee using the Last Name and Identifier from `instructions/test-data.md`; verify both values before selection.
    - Employee self-service without an employee selector: confirm the active configured Stage test identity, role, and organization and create only for that signed-in identity.
    - Substitute: this fallback step is not applicable. Follow the four-view Substitute override and do not create, accept, assign, or manufacture a job.
    - Expected: The intended test target is uniquely identifiable. If the target cannot be verified or the same role cannot later remove the exact record, mark the scenario **BLOCKED** and do not submit.
11. Select the verified synthetic employee and enter the minimum valid absence data:
    - Use the application-local current date for both start and end when selectable; otherwise use the next selectable working date.
    - Keep the duration to one day or the smallest valid duration supported by the form.
    - Select the organization default or first enabled non-placeholder absence reason when no dedicated test reason is available.
    - Set substitute required to `No`, `Not Required`, or the equivalent when that choice is available.
    - Leave optional notes and unrelated fields empty.
    - Expected: All required data is valid and no substitute assignment or notification is initiated.
12. Review the employee name, identifier, dates, duration, reason, and substitute requirement, then submit the absence once.
    - Expected: The absence is created successfully without an unhandled error.
13. Capture the confirmation page and record the assigned absence ID or confirmation number in execution memory and the secure report evidence. Navigate to `Absences` → `Modify`, search by that identifier or the exact employee/date combination, and open the newly created record.
    - Expected: Exactly one matching newly created absence is found and opened. If the record cannot be uniquely identified, stop mutation actions and mark cleanup as requiring manual attention.

### 4. View the absence and validate every tab

14. On the opened absence, enumerate every visible tab before clicking any of them. Record the tab names and initial selected tab.
    - Expected: The tab set is visible, contains no blank or duplicate tab names, and exactly one tab is selected initially.
15. For each visible tab, in left-to-right order:
    1. Scroll the tab into view.
    2. Click the tab once.
    3. Wait for its selected state and content area to stabilize.
    4. Verify the selected styling or accessibility state matches the clicked tab.
    5. Verify the tab content is visible, responsive, and free of an unhandled error or broken layout.
    6. Capture screenshot evidence with the selected tab and its content visible.
    - Expected: Every visible tab can be opened and displays the correct corresponding content.
16. Re-select the first tab, then the last tab, and finally return to the initially selected tab.
    - Expected: Boundary tabs and return navigation remain stable, no duplicate content appears, and the absence record does not change.
17. When a tab contains dropdowns, links, expandable sections, or read-only controls, verify that each visible control is enabled or disabled as designed without submitting an update.
    - Expected: Controls are visible and interactable as appropriate, and no data is changed.

### 5. Final verification and cleanup

18. Confirm the browser remains on the approved AES Stage application and the opened absence is responsive.
    - Expected: No unapproved redirect, unhandled error, or broken layout is present.
19. If an existing absence was used, navigate away without saving.
    - Expected: The existing absence remains unchanged and no cleanup is needed.
20. If the fallback absence was created, verify its exact employee, dates, and assigned absence ID immediately before cleanup. Use the supported cancel/delete action to remove only that exact record and accept its confirmation.
    - Expected: The exact newly created absence is removed; no other absence is changed.
21. Search again using the created absence ID or exact employee/date combination.
    - Expected: The created absence is no longer returned. If cleanup cannot be completed or verified, mark the scenario **FAIL** and clearly report the exact record requiring manual cleanup.
22. Do not begin another role, organization context, scenario, or logout until cleanup has passed. If cleanup fails, preserve the identifier in the secure execution notes, mark the scenario **FAIL**, and stop additional mutation actions while allowing independent read-only scenarios to continue.

## Result classification

- Mark **PASS** only if an absence is opened, every visible tab is validated successfully, and any fallback record created by the run is cleaned up and verified absent.
- Mark **FAIL** for application errors, a tab that does not open or render correctly, unstable UI behavior, or failed/unverified cleanup of a fallback record.
- Mark **BLOCKED** for authentication, permission, environment, unavailable-control, or safety restrictions.
- Mark an individual case **NOT TESTED** when the visible form lacks the relevant control or safely triggering validation is impossible.

## Reporting

Follow `instructions/html-reporting-standard.md` and create the report under `reports/navigation/absence-tab/<YYYYMMDD-HHMMSS>/`. Include `index.html`, linked scenario details, screenshot evidence for every tab, and the scenario video range. Create the report directory when it does not exist.

The report must state whether an existing absence or a newly created fallback absence was used. When the fallback branch runs, include the safe absence identifier, creation result, cleanup result, and post-cleanup search result. Never include credentials, tokens, session values, or unrelated employee data.

At the top of the report, show separate summary cards for:

- Total flows
- Flows passed
- Flows failed
- Flows blocked
- Detailed checks passed/failed, shown separately from flow totals

Include a visually distinct **Scenario outcomes** section containing these four flow cards:

1. Find an existing absence or determine that fallback setup is required
2. Create and reopen the fallback absence when no existing absence is available
3. Open and validate every visible absence tab
4. Preserve the existing record or clean up and verify the fallback record

Every card must contain:

1. Flow number and complete flow name
2. A short actual-result summary stating whether the navigation and interaction checks worked
3. A prominent final status: **PASS**, **FAIL**, or **BLOCKED**

Example:

> **3 · Open and validate every visible absence tab**
>
> Every visible tab was scrolled into view, opened successfully, and displayed responsive content without changing the absence.
>
> **PASS**

Determine each flow independently. Mark a flow **PASS** only when all required steps and shared checks used by that flow pass. Mark it **FAIL** when any required step fails, and **BLOCKED** when it cannot be completed safely. The overall report status is **PASS** only when every flow passes. Never include credentials or authentication secrets.
