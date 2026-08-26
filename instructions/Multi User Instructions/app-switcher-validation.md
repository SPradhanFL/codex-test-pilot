# Conditional App Switcher Validation

## Purpose

Validate every application that is actually available in the authenticated account's App Switcher. Do not require a fixed application list: application visibility is entitlement-dependent and may differ by user, role, and organization. Run this shared validation for every single-role, multi-role, and multi-organization login controller in this directory.

This is a conditional supplemental workflow, not one of the numbered scenarios 1–19 in `role-scenario-matrix.md`.

## Execution checkpoints

Check for an App Switcher at both of these locations after every successful authentication or role/context selection:

1. **Post-login landing checkpoint:** immediately after authentication finishes and the first authorized page is responsive.
2. **Home-page checkpoint:** after the selected role's Home page is responsive. Inspect the top-left header/navigation area for an App Switcher, product launcher, grid/waffle icon, or equivalent control.

If both checkpoints resolve to the same page and the same switcher instance, record both visibility observations but execute the full switching loop once. If they are distinct switcher instances, execute the full loop at each visible checkpoint.

## Conditional rule

1. Scroll or move the visible App Switcher into view before interacting.
2. If no App Switcher is visible at a checkpoint, record `App Switcher not exposed at this checkpoint` in the existing authentication or Home-page step and continue. Do not create a separate PASS, FAIL, BLOCKED, or NOT TESTED outcome for an absent optional switcher.
3. If no App Switcher is visible at either checkpoint, do not add an App Switcher workflow to `run-data.json`.
4. If an App Switcher is visible at either checkpoint, add one supplemental App Switcher workflow for that role/organization context and execute every step below.
5. Once the switcher is visible, inventory only the entries that are actually displayed. Do not search for, compare, or report applications that are not shown.
6. Execute the switching loop for every visible, enabled alternate application. A displayed application that is represented as available but cannot be selected, a broken destination, an access-denied result, or failure to return to Absence Management is a **FAIL** result. Continue the parent controller only after safely recovering the required role/context.
7. If the switcher contains only the current application and no enabled alternate application, record `No alternate application is assigned for this context`. Treat the supplemental workflow as **PASS** when the switcher itself is responsive and no broken or misleading entry is displayed.

## Safety and evidence rules

- Use headed Chrome through Playwright MCP and keep this activity inside the parent run's single continuous video.
- Do not enter credentials into any unexpected page. Authentication may continue only through the existing approved Frontline session or the normal masked login flow documented by the parent controller.
- Do not click settings, administration, setup, edit, save, submit, approve, import, or delete controls in any product.
- Before following a switcher entry, inspect its visible label and destination when available. Do not continue to production, an unrelated third-party host, a browser warning, or an unrecognized environment.
- A target may open in the same tab or a new tab/window. Detect and use the actual active target, and close only an extra target tab after the return path has been validated.
- Scroll each switcher, application entry, destination identity element, and return control into view before interaction and before taking evidence.
- Capture screenshots of each visible switcher menu, each destination application, and the restored Absence Management page. Never capture credentials, tokens, cookies, personal data, or sensitive redirect fragments.
- At every destination and return checkpoint, apply `url-evidence-validation.md` and use complete-browser-window evidence. A missing configured URL substring is a warning when switching and required elements still work.

## Switching loop

Use **Absence Management** as the starting and return product for each target application.

### A. Inspect the App Switcher

1. Record the current role/organization context and the current Absence Management route without recording personal data.
2. Open the App Switcher and confirm it is enabled, responsive, keyboard/mouse interactable, and fully visible.
3. Capture the exact visible application labels in display order.
4. Identify the current application and every visible, enabled alternate application.
5. Confirm each displayed entry has a non-blank, unique label and that every entry represented as available is enabled and interactable.
6. Do not compare the menu with a fixed expected list. Applications that are not displayed are outside the scope of this context and require no validation result.

Expected: The switcher is responsive, its displayed entries are valid, and every enabled alternate application is available for switching. No specific application name is required to be present.

### B. Switch to every available alternate application and return

For each visible, enabled alternate application, in the order displayed:

1. Record the target application's exact visible label.
2. Scroll the target entry into view and select it once.
3. Wait for the same-tab navigation or new target tab/window to settle.
4. Confirm the destination visibly identifies the selected application, remains in a non-production Frontline environment, is responsive, and retains an authenticated session without an application error or access-denied state.
5. Capture screenshot evidence of the destination without exposing credentials, personal data, or sensitive authentication fragments.
6. Use the destination's App Switcher to select `Absence Management` when that return entry is available.
7. If the destination does not expose a return switcher, use the supported My Frontline application launcher or the recovery procedure below. Do not construct or guess an application URL.
8. Wait for navigation to settle and confirm Absence Management is restored with the same authorized role/organization context.
9. Reopen the App Switcher and continue with the next enabled alternate application from the original inventory.

Expected: Every enabled alternate application displayed for the current account/context opens successfully and returns to a responsive Absence Management page without losing the selected context.

### C. Reconcile the final inventory

1. After all enabled alternate applications have been tested, reopen the App Switcher from Absence Management.
2. Confirm the visible application labels still match the original inventory for the same role/organization context.
3. Confirm no duplicate, blank, unexpectedly disabled, or broken entry was introduced during switching.

Expected: The switcher remains stable after all available application round trips.

## Recovery

If a destination opens but its return switcher is missing or unusable:

1. Record the failure and capture safe evidence.
2. If the destination opened a separate tab, close only that destination tab and return to the existing Absence Management tab.
3. Otherwise, re-authenticate through the parent controller's configured Stage ML URL and reselect the exact role/organization context.
4. Confirm the recovered Absence Management page is responsive before continuing the parent controller.

Recovery allows later independent scenarios to continue; it does not convert the App Switcher failure to PASS.

## Result and reporting

When the switcher is present, report the supplemental workflow once per distinct role/organization context with:

- checkpoint visibility results for post-login and Home-page locations;
- the complete discovered application inventory and each entry's enabled/interactable state;
- a separate result for every enabled alternate application that was displayed;
- confirmation that no comparison against a fixed expected-application list was performed;
- exact continuous-video start/end offsets;
- screenshot evidence for the switcher, every tested destination application, and every return to Absence Management;
- expected and actual results for every step;
- numbered reproduction steps for FAIL or BLOCKED results; and
- recovery and final active-context confirmation.

Suggested workflow name: `Conditional App Switcher — validate every available application`.

The workflow is **PASS** only when the switcher is responsive and every displayed, enabled alternate application completes its round trip back to Absence Management. An application that is not displayed for the selected account/context is outside that context's entitlement inventory and does not fail the workflow. Never include credentials or sensitive identity/session data in the report.
