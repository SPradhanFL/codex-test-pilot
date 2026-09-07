# Standalone Home Menu Navigation Validation

## Purpose

Validate that the role-appropriate Home-page menus are visible, interactable, and navigate to responsive destinations without an application, authentication, access, or page-loading error.

This is one required supplemental workflow for the four standalone controllers only:

- `organization-user-execution.md`
- `campus-user-execution.md`
- `employee-user-execution.md`
- `substitute-user-execution.md`

Do not execute this workflow from a multi-role or multi-organization combination controller. Apply it to every organization where one of the four standalone controllers is enabled.

## Required menu coverage

| Standalone role | Required Home menus | Required Resource Library submenus |
|---|---|---|
| Organization User | `Staff Directory`, `My Staff Profile`, `Resource Library` | `Browse Library`, `My Resource History`, `My Resources` |
| Campus User | `Staff Directory`, `My Staff Profile`, `Resource Library` | `Browse Library`, `My Resource History`, `My Resources` |
| Employee | `My Staff Profile` | Not applicable |
| Substitute | `My Staff Profile` | Not applicable |

Do not require Employee or Substitute to expose `Staff Directory` or `Resource Library`, and do not add a negative assertion for those non-applicable menus. Validate only the required menu set for the active standalone role.

## Preconditions

1. Authenticate with the identity assigned to the active standalone controller for the requested `OrgId`.
2. Complete the configured Stage application-launch flow.
3. Establish the exact standalone role and organization context.
4. Wait for Home or Dashboard and its global navigation to become responsive.
5. Open the user-info menu and confirm the expected standalone role is active. Apply the documented one-time role-reselection recovery before beginning this workflow when required.
6. Start this workflow from Home or Dashboard. Record its own `WorkflowStart` event before the first menu interaction.

## Shared navigation checks

For every required menu or submenu:

1. Return to a responsive Home or Dashboard using the application's supported Home navigation.
2. Wait for loading indicators and overlays to disappear.
3. Scroll the target control into view.
4. Confirm the target is visible, enabled, and interactable.
5. Select it once and wait for navigation to settle.
6. Confirm the destination using a visible page heading, title, primary content region, or role-appropriate page controls.
7. Confirm the destination does not display `Page Not Found`, `Access Denied`, an authentication prompt, an unhandled application error, or a permanently loading blank state.
8. Confirm the authenticated application shell or a supported route back to Home remains available.
9. Apply `instructions/Multi User Instructions/url-evidence-validation.md` and capture a complete-browser-window screenshot with the address bar visible.
10. Do not create, edit, upload, download, share, delete, save, or submit data on any destination.

Prefix every screenshot filename with the active workflow slug. Use destination suffixes such as `-staff-directory.png`, `-my-staff-profile.png`, `-browse-library.png`, `-my-resource-history.png`, `-my-resources.png`, and `-return-home.png` so the report builder can attach only this workflow's evidence.

## Organization User and Campus User flow

1. From Home, select `Staff Directory` and complete every shared navigation check.
2. Return to Home, select `My Staff Profile`, and complete every shared navigation check.
3. Return to Home and open `Resource Library`.
4. Confirm `Browse Library`, `My Resource History`, and `My Resources` are all visible, enabled, and interactable.
5. Select `Browse Library` and complete every shared navigation check.
6. Return to Home, reopen `Resource Library`, select `My Resource History`, and complete every shared navigation check.
7. Return to Home, reopen `Resource Library`, select `My Resources`, and complete every shared navigation check.
8. Return to Home and confirm the expected role and organization context remain active.

Expected: All three Home menus and all three Resource Library submenus are available, every required destination loads responsively, and the authenticated role/context remains intact.

## Employee and Substitute flow

1. From Home, select `My Staff Profile`.
2. Complete every shared navigation check.
3. Return to Home and confirm the expected standalone role remains active.

Expected: `My Staff Profile` is available and its destination loads responsively without authentication, access, navigation, or application errors.

## Result classification

- Record one supplemental workflow named `<Role> · Standalone Home menu navigation` in the standalone controller's report.
- Use one stable workflow slug:
  - `organization-home-menu-navigation`
  - `campus-home-menu-navigation`
  - `employee-home-menu-navigation`
  - `substitute-home-menu-navigation`
- **PASS** only when every required destination for the active standalone role completes all shared checks and the workflow returns to the correct Home context.
- Before finalizing a potential **FAIL**, apply the shared 120-second failure-observation policy, including one safe refresh after 60 seconds for a transient missing menu, loading overlay, or incomplete application shell.
- **FAIL** when a required menu is missing after the observation window, a visible control cannot be used, an expected destination fails to load, an error page appears, or the authenticated role/context is lost.
- **BLOCKED** only when authentication, the required standalone role/context, Home/Dashboard, or an environment prerequisite cannot be established, preventing the menu validation from starting.
- Continue with independent numbered scenarios after recording the result.
- Record `WorkflowEnd` only after final full-browser evidence and the return-to-Home check are complete.
