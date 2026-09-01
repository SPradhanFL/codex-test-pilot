# Time & Attendance Organization User Navigation

## Execution directive

Before browser action, read completely:

1. `instructions/project-instructions.md`
2. `instructions/application-details.md`
3. `instructions/test-data.md`
4. `instructions/time-and-attendance-details.md`
5. `instructions/Multi User Instructions/role-scenario-matrix.md`
6. `instructions/Multi User Instructions/organization-user-execution.md`
7. `config/aes-stage.ml.<OrgId>.json`
8. `instructions/html-reporting-standard.md`

Execute directly in headed Chrome through Playwright MCP. Do not generate test code. Use the Organization User credential routing and save the standard HTML report under `reports/`.

This file is read-only. Do not edit a user, change access, send an invitation, run or schedule a report, export data, or submit any form.

## Shared preconditions

- Authenticate as the configured Organization User through the shared Stage ML URL.
- Establish Time & Attendance as the starting application.
- Confirm the expected Organization User and organization context.
- For scenarios 33 and 34, resolve all target-user values required by `instructions/time-and-attendance-details.md` before browser action.
- Verify the exact target user before opening an access or cross-product action.

## Shared target-user navigation

For scenarios 33 and 34, read the target only from
`scenarioData.timeAttendanceOrganizationUserNavigation` in the selected
`config/aes-stage.ml.<OrgId>.json`.

Proceed only when the mapping is enabled, `loginUsernameKey` resolves to the
active Organization User login, all expected target fields are present, and
`expectedOrganizationId` matches the selected configuration's top-level
`organizationId`. If any condition fails, mark scenarios 33 and 34 **BLOCKED**
before searching. Do not fall back to another organization's target data.

1. From Time & Attendance, select the visible `Users` navigation.
   - Expected: A responsive user search or list page opens.
2. Search using the configured `searchIdentifier`.
   - Expected: The search result uniquely identifies the configured `expectedDisplayName`.
3. Verify the target's non-sensitive expected attributes before continuing.
   - Expected: Display name, organization, and role/user type match `expectedDisplayName`, `expectedOrganizationId`, and `expectedRoleUserType` from the selected organization configuration.

If the result is absent, ambiguous, or mismatched, stop the affected scenario. Do not select another user.

## Scenario 33 - Users -> Manage User Access

TA ordinal: **5**. ROVO scenario: **4**.

1. Complete the shared target-user navigation.
2. Locate the visible `Manage User Access` control for the verified target.
   - Expected: Exactly one enabled control is associated with the target.
3. Inspect the destination label or host when visible, then select the control once.
   - Expected: A Stage access-management destination opens in the same or a new tab.
4. Verify the Manage User Access page.
   - Expected: The page visibly identifies the verified user, expected organization, application access, role/type, and current access state without an error. Search, permission, revoke, or equivalent access controls may be recorded as visible evidence but must not be changed or submitted.
5. Confirm the validation remained read-only.
   - Expected: No invitation, grant, revoke, edit, save, or submission occurred.
6. Return to the original Time & Attendance target-user page.
   - Expected: The same verified target and Organization User context are restored.

## Scenario 34 - Users -> View in Absence Management

TA ordinal: **6**. ROVO scenario: **5**.

1. Complete the shared target-user navigation in a fresh or safely restored Time & Attendance state.
2. Locate the visible `View in Absence Management` control for the verified target.
   - Expected: Exactly one enabled control is associated with the target.
3. Inspect the destination when visible, then select the control once.
   - Expected: Absence Management opens on an approved Stage host in the same or a new tab.
4. Verify the Absence Management destination belongs to the same configured target.
   - Expected: Product identity and the target's non-sensitive identity proof match; no access-denied, not-found, or application error appears. Record only non-sensitive fields visibly available in both products. Do not require ROVO example fields such as schedules, employee type, or assignments unless configured target data defines their expected values.
5. Confirm no user or access data was changed.
6. Return to the original Time & Attendance target-user page.
   - Expected: The same verified target and Organization User context are restored.

## Scenario 35 - Reports -> Report Writer

TA ordinal: **7**. ROVO scenario: **6**.

1. From a responsive Time & Attendance Organization User page, open `Reports`.
   - Expected: The Reports navigation expands or opens successfully.
2. Select `Report Writer` once.
   - Expected: A responsive Report Writer destination opens on an approved Stage host.
3. Verify the visible Report Writer identity and safe controls.
   - Expected: The page title or heading, authenticated account control, available templates/categories, filters, and read-only report navigation are visible without an application or permission error. Record which categories and filters are actually visible; do not assume every ROVO example exists.
4. Confirm the validation remained read-only.
   - Expected: No report was created, changed, run, scheduled, printed, exported, or saved.
5. Return to Time & Attendance Home through visible navigation.
   - Expected: The Organization User context is restored and responsive.

## Evidence and reporting

Report scenarios 33, 34, and 35 independently. Include the repository ID, TA ordinal, ROVO number, exact configured login username labeled `Test username`, verified non-sensitive target proof for scenarios 33 and 34, each destination, the restored Time & Attendance state, expected and actual results, continuous-video ranges, sanitized redirect sequences, an `HTTP 404 observations` table with sanitized URL evidence or an explicit no-404 state, and failure reproduction steps. The configured Stage test username is required in HTML only. Do not include its password, a username/password pairing, personal data, target URLs containing identifiers, tokens, query values, tokenized path values, or session values.

ROVO's optional instruction to run a report is intentionally excluded from safe execution. Opening and inspecting Report Writer is sufficient; running, exporting, scheduling, or saving a report requires separate explicit authorization and a dedicated data-safe test.
