# Team Execution Prompts — Organization-Scoped Stage ML

## One-time setup after cloning or pulling

1. Open Codex from the repository root.
2. Confirm the project-scoped Playwright MCP server can close its prior task context and create a fresh `--isolated` headed Chrome context and new test window. Chrome extension control, normal Chrome profiles, persistent user-data directories, saved storage state, and existing tabs are not allowed. Every run must pass the runtime browser-isolation confirmation in `instructions/multi-user-full-suite-execution.md` before credentials are entered.
3. Choose the Stage ML organization ID you want to execute.
4. Confirm the committed organization configuration exists:
   - `config/aes-stage.ml.140462.json`
   - `config/aes-stage.ml.140463.json`
5. Create the ignored local credentials file from the matching committed example when it is not already present:

```powershell
Copy-Item .secrets/aes-stage.ml.<OrgId>.credentials.example.json .secrets/aes-stage.ml.<OrgId>.credentials.json
```

6. Replace the placeholders locally. Never commit `.secrets/aes-stage.ml.<OrgId>.credentials.json`.
7. Run the organization readiness check:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-multi-user-run-readiness.ps1 -OrgId <OrgId>
```

The configuration's `enabledControllers` list determines which login combinations run. Organization `140462` currently enables nine controllers. Organization `140463` currently enables Organization User, Campus User, Employee, and Substitute.

Passwords and session secrets must never appear in messages, terminal output, reports, screenshots, videos, or committed files. At the first credential-entry point, request one grouped action-time confirmation for the selected organization accounts and Frontline Stage destinations. After confirmation, do not ask again for the same accounts and destinations unless the data, destination, or execution scope changes.

Every execution applies a 60-second failure-observation window: before a scenario can be marked **FAIL**, the runner must poll the missing expected page, element, navigation, or state for the full 60 seconds, then capture final evidence and record the timeout. Genuine **BLOCKED** and **NOT TESTED** prerequisites keep their original classifications.

## Run every configured login combination for organization 140462

```text
Start a fresh isolated headed Chrome automation context and a newly opened test window for this invocation. Do not claim or reuse an existing user tab, an earlier automation tab/window, browser history, cookies, or prior authenticated session state.
Use only the project-scoped Playwright MCP server. First close its prior task context, then complete the mandatory one-tab, page-title write/read, tagged-window isolation confirmation before credential entry. Stop before login if confirmation fails.
From the repository root, for OrgId 140462 execute instructions/multi-user-full-suite-execution.md in unattended safe mode. First run scripts/check-multi-user-run-readiness.ps1 -OrgId 140462 and stop only if preflight fails. Read usernames only from config/aes-stage.ml.140462.json and passwords only from .secrets/aes-stage.ml.140462.credentials.json. Execute every controller enabled by that organization configuration in manifest order, including every documented role/organization context and conditional App Switcher workflow. Use headed Chrome through Playwright MCP, continue through independent failures, and create one continuous 1280x720 full-browser-window video, including tabs and the address bar, with no blur, masking, dimming, overlays, annotations, or chapter cards. Before finalizing any FAIL, poll the missing expected page, element, navigation, or state for a full 60 seconds, capture final evidence at or after timeout, and record the 60-second expiration in the report; do not reclassify genuine BLOCKED or NOT TESTED prerequisites. At every workflow checkpoint validate requiredUrlContains, take a full-browser screenshot, and report a mismatch as a separate warning when the functional flow works. Run scripts/start-multi-user-full-suite-run.ps1 -OrgId 140462 so only organization 140462's previous current run and ZIP are archived. Generate the canonical dashboard, per-login reports, detailed scenario pages, screenshots, measured video timeline, status and warning totals, reproduction steps, and portable ZIP under reports/full-suite/140462/<timestamp>/. Return the master report path, ZIP path, role-report count, scenario totals, PASS/FAIL/BLOCKED/NOT TESTED/WARNING totals, and video duration.
```

## Run every configured login combination for organization 140463

```text
Start a fresh isolated headed Chrome automation context and a newly opened test window for this invocation. Do not claim or reuse an existing user tab, an earlier automation tab/window, browser history, cookies, or prior authenticated session state.
Use only the project-scoped Playwright MCP server. First close its prior task context, then complete the mandatory one-tab, page-title write/read, tagged-window isolation confirmation before credential entry. Stop before login if confirmation fails.
From the repository root, for OrgId 140463 execute instructions/multi-user-full-suite-execution.md in unattended safe mode. First run scripts/check-multi-user-run-readiness.ps1 -OrgId 140463 and stop only if preflight fails. Read usernames only from config/aes-stage.ml.140463.json and passwords only from .secrets/aes-stage.ml.140463.credentials.json. Execute every controller enabled by that organization configuration in manifest order, including every documented role/organization context and conditional App Switcher workflow. Use headed Chrome through Playwright MCP, continue through independent failures, and create one continuous 1280x720 full-browser-window video, including tabs and the address bar, with no blur, masking, dimming, overlays, annotations, or chapter cards. Before finalizing any FAIL, poll the missing expected page, element, navigation, or state for a full 60 seconds, capture final evidence at or after timeout, and record the 60-second expiration in the report; do not reclassify genuine BLOCKED or NOT TESTED prerequisites. At every workflow checkpoint validate requiredUrlContains, take a full-browser screenshot, and report a mismatch as a separate warning when the functional flow works. Run scripts/start-multi-user-full-suite-run.ps1 -OrgId 140463 so only organization 140463's previous current run and ZIP are archived. Generate the canonical dashboard, per-login reports, detailed scenario pages, screenshots, measured video timeline, status and warning totals, reproduction steps, and portable ZIP under reports/full-suite/140463/<timestamp>/. Return the master report path, ZIP path, role-report count, scenario totals, PASS/FAIL/BLOCKED/NOT TESTED/WARNING totals, and video duration.
```

## Run every configured login combination for any organization

Replace `<OrgId>` with the required configured organization ID.

```text
Start a fresh isolated headed Chrome automation context and a newly opened test window for this invocation. Do not claim or reuse an existing user tab, an earlier automation tab/window, browser history, cookies, or prior authenticated session state.
Use only the project-scoped Playwright MCP server. First close its prior task context, then complete the mandatory one-tab, page-title write/read, tagged-window isolation confirmation before credential entry. Stop before login if confirmation fails.
From the repository root, for OrgId <OrgId> execute instructions/multi-user-full-suite-execution.md in unattended safe mode. First run scripts/check-multi-user-run-readiness.ps1 -OrgId <OrgId> and stop only if preflight fails. Read usernames only from config/aes-stage.ml.<OrgId>.json and passwords only from .secrets/aes-stage.ml.<OrgId>.credentials.json. Execute every controller enabled by that organization configuration in manifest order and apply conditional App Switcher validation wherever exposed. Use headed Chrome through Playwright MCP, continue through independent failures, and record one continuous 1280x720 full-browser-window video, including tabs and the address bar, with no blur, masking, dimming, overlays, annotations, or chapter cards. Before finalizing any FAIL, poll the missing expected page, element, navigation, or state for a full 60 seconds, capture final evidence at or after timeout, and record the 60-second expiration in the report; do not reclassify genuine BLOCKED or NOT TESTED prerequisites. At every workflow checkpoint validate requiredUrlContains, take a full-browser screenshot, and report a mismatch as a separate warning when the functional flow works. Run scripts/start-multi-user-full-suite-run.ps1 -OrgId <OrgId>, then finalize and package the canonical evidence under reports/full-suite/<OrgId>/<timestamp>/. Return the master report path, ZIP path, login-report count, scenario totals, PASS/FAIL/BLOCKED/NOT TESTED/WARNING totals, and video duration.
```

## Run one login combination for an organization

Replace `<OrgId>` and `<controller-file>` with values enabled in the selected organization configuration.

```text
Start a fresh isolated headed Chrome automation context and a newly opened test window for this invocation. Do not claim or reuse an existing user tab, an earlier automation tab/window, browser history, cookies, or prior authenticated session state.
Use only the project-scoped Playwright MCP server. First close its prior task context, then complete the mandatory one-tab, page-title write/read, tagged-window isolation confirmation before credential entry. Stop before login if confirmation fails.
From the repository root, for OrgId <OrgId> execute instructions/Multi User Instructions/<controller-file> in unattended safe mode. First run scripts/check-multi-user-run-readiness.ps1 -OrgId <OrgId> -Controller <controller-file> and stop only if preflight fails. Read the username and password only from the matching organization-scoped config and credentials files. Use headed Chrome through Playwright MCP, execute every role/organization context documented by this controller, and apply conditional App Switcher validation wherever exposed. Continue through independent failures and record one continuous 1280x720 full-browser-window video, including tabs and the address bar, with no blur, masking, dimming, overlays, annotations, or chapter cards. Before finalizing any FAIL, poll the missing expected page, element, navigation, or state for a full 60 seconds, capture final evidence at or after timeout, and record the 60-second expiration in the report; do not reclassify genuine BLOCKED or NOT TESTED prerequisites. At every workflow checkpoint validate requiredUrlContains, take a full-browser screenshot, and report a mismatch as a separate warning when the functional flow works. Run scripts/start-multi-user-full-suite-run.ps1 -OrgId <OrgId> -Controller <controller-file>, then finalize and package the canonical evidence under reports/full-suite/<OrgId>/<timestamp>/. Return the report path, scenario totals, warning total, and video duration.
```

## Controller filenames

1. `organization-user-execution.md`
2. `campus-user-execution.md`
3. `employee-user-execution.md`
4. `substitute-user-execution.md`
5. `multi-role-campus-employee-organization-execution.md`
6. `multi-role-organization-employee-execution.md`
7. `multi-role-employee-employee-substitute-execution.md`
8. `multi-org-employee-substitute-execution.md`
9. `multi-org-employee-employee-execution.md`
10. `multi-org-organization-campus-execution.md`

Do not request a controller that is absent from the selected organization's `enabledControllers` list. Readiness will reject that mismatch before browser execution.
