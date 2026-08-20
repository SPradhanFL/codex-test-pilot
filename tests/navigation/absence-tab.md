# Absences Menu -> Tab Validation — AES Stage

## Execution directive

Before any browser action, read completely:

1. `instructions/project-instructions.md`
2. `instructions/application-details.md`
3. `instructions/test-data.md`

Execute this scenario directly in Chrome using Playwright MCP. Do not generate Playwright or TypeScript code. Run unattended without pausing for password entry or routine confirmation. Generate the standard HTML evidence report defined by `instructions/html-reporting-standard.md`.

## Objective

Log in to AES Stage, find an existing absence that can be viewed safely, open it, and validate every visible absence tab. If no absence is available, create one fresh absence for the verified synthetic employee, use it for the tab validation, and clean up only that exact record after validation.

## Preconditions and safety

- Playwright MCP is available.
- Work only on AES Stage at `https://aesstage.flqa.net`; the authentication redirect to `https://adminwebstage2.flqa.net/` is approved.
- For this scenario, the environment-variable rules above replace the manual-password-entry instruction in `instructions/test-data.md`.
- Do not record, display, repeat, or screenshot the password.
- Persistent creation is authorized only for the fallback setup described in this scenario and only for a verified synthetic employee in AES Stage.
- Never create an absence for a realistic-looking, unverified, or production employee.
- Before creating the fallback record, find the exact synthetic employee using the verification key in `instructions/test-data.md` and verify its name and identifier.
- Record the created absence confirmation number or assigned ID immediately after creation. Use that exact identifier for validation and cleanup.
- Prefer an absence that does not require a substitute. Do not assign, notify, call, or contact a substitute.
- Do not edit an existing absence. Existing records are read-only for this scenario.
- During authentication, `idgatewayawsstage.flqa.net` is an approved login host. After authentication, continue only in the AES Stage application.
- For this scenario, the approved authentication redirect above is the explicit exception to the general different-host stop rule in the shared instructions.

## Steps

### 1. Launch and authenticate

1. Read the Stage URL and username from `config/aes-stage.json`.
2. Use `AES_STAGE_PASSWORD` when the environment variable is configured.
3. Otherwise, read `password` from `.secrets/aes-stage.credentials.json`.
4. If neither password source is available or the local value is still a placeholder, mark all flows **BLOCKED**, generate the HTML report, and stop before opening the browser.

### 2. Find an absence to view

5. Navigate through `Absences` → `Modify`.
   - Expected: The absence search or modify page is displayed without an error.
6. Search the default date range and any safe adjacent date range supported by the page.
   - Expected: The application returns matching absence rows or a clear zero-result state.
7. If one or more rows are returned, select one record that can be opened read-only and record its identifier for evidence. Do not change it.
   - Expected: The selected existing absence opens successfully and the scenario continues at step 14.
8. If no absence is returned, record the zero-result state and execute the fallback creation steps below. A zero-result search is not a blocker by itself.

### 3. Fallback setup — create a fresh absence only when needed

9. Navigate through `Absences` → `Create Absence`.
   - Expected: The Create Absence page is displayed with employee, date, reason, and continuation controls appropriate to the organization.
10. Search for the exact synthetic employee using the Last Name and Identifier from `instructions/test-data.md`. Before selection, verify both values match the intended synthetic record.
    - Expected: Exactly the intended synthetic employee is identifiable. If it is unavailable or cannot be verified, mark the scenario **BLOCKED** and do not use another employee.
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
