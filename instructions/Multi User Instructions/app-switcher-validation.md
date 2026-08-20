# Conditional App Switcher Validation

## Purpose

Validate cross-product switching among **Absence Management**, **Time & Attendance**, and **Frontline Central** whenever the authenticated account exposes an App Switcher. Run this shared validation for every single-role, multi-role, and multi-organization login controller in this directory.

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
5. Once the switcher is visible, missing required applications, disabled entries, broken navigation, access-denied results, or failure to return to Absence Management are **FAIL** results. Continue the parent controller only after safely recovering the required role/context.

## Safety and evidence rules

- Use headed Chrome through Playwright MCP and keep this activity inside the parent run's single continuous video.
- Do not enter credentials into any unexpected page. Authentication may continue only through the existing approved Frontline session or the normal masked login flow documented by the parent controller.
- Do not click settings, administration, setup, edit, save, submit, approve, import, or delete controls in any product.
- Before following a switcher entry, inspect its visible label and destination when available. Do not continue to production, an unrelated third-party host, a browser warning, or an unrecognized environment.
- A target may open in the same tab or a new tab/window. Detect and use the actual active target, and close only an extra target tab after the return path has been validated.
- Scroll each switcher, application entry, destination identity element, and return control into view before interaction and before taking evidence.
- Capture screenshots of each visible switcher menu, each destination application, and the restored Absence Management page. Never capture credentials, tokens, cookies, personal data, or sensitive redirect fragments.

## Switching loop

Use **Absence Management** as the starting and return product for each target application.

### A. Inspect the App Switcher

1. Record the current role/organization context and the current Absence Management route without recording personal data.
2. Open the App Switcher and confirm it is enabled, responsive, keyboard/mouse interactable, and fully visible.
3. Confirm the menu contains unique, enabled entries for:
   - `Absence Management`
   - `Time & Attendance`
   - `Frontline Central`
4. Confirm no required entry is blank, duplicated, clipped beyond access, or disabled.

Expected: All three required application entries are visible and interactable.

### B. Absence Management → Time & Attendance → Absence Management

1. From the open App Switcher, select `Time & Attendance`.
2. Wait for the same-tab navigation or new target tab/window to settle.
3. Confirm the destination visibly identifies **Time & Attendance**, remains in a non-production Frontline environment, is responsive, and retains an authenticated session without an application error or access-denied state.
4. Open the destination App Switcher and select `Absence Management`.
5. Wait for navigation to settle and confirm Absence Management is restored with the same authorized role/organization context.

Expected: Time & Attendance opens successfully and the App Switcher returns to a responsive Absence Management page without losing the selected context.

### C. Absence Management → Frontline Central → Absence Management

1. Reopen the App Switcher from the restored Absence Management page.
2. Select `Frontline Central`.
3. Wait for the same-tab navigation or new target tab/window to settle.
4. Confirm the destination visibly identifies **Frontline Central**, remains in a non-production Frontline environment, is responsive, and retains an authenticated session without an application error or access-denied state.
5. Open the destination App Switcher and select `Absence Management`.
6. Wait for navigation to settle and confirm Absence Management is restored with the same authorized role/organization context.

Expected: Frontline Central opens successfully and the App Switcher returns to a responsive Absence Management page without losing the selected context.

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
- all three application entries and their enabled/interactable state;
- separate results for the Time & Attendance loop and the Frontline Central loop;
- exact continuous-video start/end offsets;
- screenshot evidence for the switcher, both destination applications, and both returns to Absence Management;
- expected and actual results for every step;
- numbered reproduction steps for FAIL or BLOCKED results; and
- recovery and final active-context confirmation.

Suggested workflow name: `Conditional App Switcher — Absence Management, Time & Attendance, and Frontline Central`.

The workflow is **PASS** only when every visible-checkpoint loop completes and both target applications return successfully to Absence Management. Never include credentials or sensitive identity/session data in the report.
