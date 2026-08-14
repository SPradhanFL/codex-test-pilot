# Security to Manage User Access Validation — AES Stage

## Execution directive

Before any browser action, read completely:

1. `instructions/project-instructions.md`
2. `instructions/application-details.md`
3. `instructions/test-data.md`

Execute this scenario directly in Chrome using Playwright MCP. Do not generate Playwright or TypeScript code. Run unattended without pausing for password entry or routine confirmation. Save both Markdown and standalone HTML execution reports under `reports/`.

## Objective

Log in to AES Stage, navigate to Security and then navigate to Manage User Access Page, and validate the available positive, negative, and edge-case behavior without creating any record.

## Preconditions and safety

- Playwright MCP is available.
- Work only on AES Stage at `https://aesstage.flqa.net`; the authentication redirect to `https://adminwebstage2.flqa.net/` or `https://supersuitawsstage.flqa.net/` is approved.
- For this scenario, the environment-variable rules above replace the manual-password-entry instruction in `instructions/test-data.md`.
- Do not record, display, repeat, or screenshot the password.
- If validation requires a save attempt, use incomplete or intentionally invalid data so creation cannot succeed.
- During authentication, `idgatewayawsstage.flqa.net` is an approved login host. After authentication, continue only in the AES Stage application.
- For this scenario, the approved authentication redirect above is the explicit exception to the general different-host stop rule in the shared instructions.

## Steps

### 1. Launch and authenticate

1. Read the Stage URL and username from `config/aes-stage.json`.
2. Use `AES_STAGE_PASSWORD` when the environment variable is configured.
3. Otherwise, read `password` from `.secrets/aes-stage.credentials.json`.
4. If neither password source is available or the local value is still a placeholder, mark all flows **BLOCKED**, generate the HTML report, and stop before opening the browser.

### 2. Navigate to Manage User Access from Security Menu

5. Navigate through `Security` Menu.
   - Expected: The submenu should be visible
6. Click on `Manage User Access` submenu
   - Expected: The Manage User Access should be shown

### 3. Positive validation

8. Identify all visible fields, required indicators, field types, dropdown options, date controls, and action buttons.
   - Expected: The form structure is observable and enabled as appropriate.
9. Do not submit the completed valid form. Clear or reset the form before negative testing.
    - Expected: No employee record is created.

### 4. Negative validation

10. On Manage User Access, leave every user-search or lookup field empty and select the read-only search action once only when such a control is visible and enabled.
    - Expected: The page displays required-field validation, an empty state, or permitted default results without changing user access. Mark the case `NOT TESTED` when no safe search control is available.

11. Search for the clearly nonexistent value `__no_such_user_access_139963__` only when a read-only user-search field is available.
    - Expected: No matching user is returned, no access-change controls are applied, and no unhandled error occurs. Clear the value afterward. Mark the case `NOT TESTED` when no safe search control is available.

12. Open the `Security` menu and dismiss it by selecting the current page area or the menu control again without choosing a submenu.
    - Expected: The menu closes, the current page and URL remain unchanged, and no security action is submitted.


### 5. Edge-case validation

13. Open and dismiss the `Security` menu twice consecutively without selecting a submenu.
    - Expected: Each open shows one copy of `Manage User Access`, each dismissal closes the menu, and the current page remains unchanged.

14. Re-select `Manage User Access` once from the Security menu.
    - Expected: The page remains stable or reloads cleanly on the approved Stage host without duplicate content, an access change, or an unhandled error.

15. Refresh Manage User Access once without entering or submitting data.
    - Expected: The page remains on the approved Stage host, its visible structure is consistent, and no access state is changed.



### 6. Final verification and cleanup

16. Confirm the browser is on an approved AES Stage application host after the approved authentication redirect and Manage User Access is responsive.
    - Expected: No unapproved redirect, unhandled error, or broken layout is present.
17. Clear/reset all entered test values or navigate away without saving.
    - Expected: No record is created and no cleanup record is required.

## Result classification

- Mark **PASS** only if navigation succeeds and every executed validation behaves as expected.
- Mark **FAIL** for application errors, missing required validation, accepted invalid values that can be safely demonstrated, or unstable UI behavior.
- Mark **BLOCKED** for authentication, permission, environment, unavailable-control, or safety restrictions.
- Mark an individual case **NOT TESTED** when the visible form lacks the relevant control or safely triggering validation is impossible.

## Reporting

Create `reports/navigation/security-manage_user_access_page/security-manage_user_access_page-<YYYYMMDD-HHMMSS>.html` as a polished standalone report containing scenario totals, detailed results, interaction evidence, accepted zero-result behavior, failures with reproduction steps, route observations, and safety/cleanup status. Create the report directory when it does not exist.

At the top of the report, show separate summary cards for:

- Total flows
- Flows passed
- Flows failed
- Flows blocked
- Detailed checks passed/failed, shown separately from flow totals

Include a visually distinct **Scenario outcomes** section containing one card for each of the four flows. Every card must contain:

1. Flow number and complete flow name
2. A short actual-result summary stating whether the navigation and interaction checks worked
3. A prominent final status: **PASS**, **FAIL**, or **BLOCKED**

Example:

> **1 · Security → Manage User Access**
>
> Security and Manager User Aceess controls were interactive; navigation completed.
>
> **PASS**

Determine each flow independently. Mark a flow **PASS** only when all required steps and shared checks used by that flow pass. Mark it **FAIL** when any required step fails, and **BLOCKED** when it cannot be completed safely. The overall report status is **PASS** only when every flow passes. Never include credentials or authentication secrets.