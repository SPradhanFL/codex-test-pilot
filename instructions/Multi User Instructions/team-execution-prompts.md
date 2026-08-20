# Team Execution Prompts

## One-time setup after cloning or pulling

1. Open Codex from the repository root.
2. Confirm headed Chrome through Playwright MCP is available.
3. Keep `config/aes-stage.ml.json` committed with the Stage ML URL and approved usernames.
4. Create the ignored local credentials file from the committed placeholder:

   ```powershell
   Copy-Item .secrets/aes-stage.ml.credentials.example.json .secrets/aes-stage.ml.credentials.json
   ```

5. Replace every required placeholder locally. Never commit `.secrets/aes-stage.ml.credentials.json`.
6. For the standalone Campus User controller, configure `testUsernames.campusUser` or the `AES_STAGE_CAMPUS_USERNAME` environment variable. The current committed `campusUser` value is empty.

The prompts below authorize Codex to read the selected local password and enter it only into the configured AES Stage ML authentication flow. Passwords and session secrets must never appear in messages, terminal output, reports, screenshots, videos, or committed files.

Browser security still requires one action-time confirmation immediately before credentials are first transmitted. For a full-suite run, request one grouped confirmation covering all selected accounts and Frontline Stage authentication destinations. After that confirmation, do not ask again for the same accounts and destinations unless the data, destination, or execution scope changes.

## 1. Organization User

```text
From the repository root, execute instructions/Multi User Instructions/organization-user-execution.md in unattended safe mode. First run scripts/check-multi-user-run-readiness.ps1 with -Controller organization-user-execution.md and stop only if its preflight fails. I authorize reading the required password from .secrets/aes-stage.ml.credentials.json and entering it into the configured AES Stage ML login flow At the first credential-entry point, request one action-time confirmation for this account and destination; after I confirm, do not ask again for the same account and destination during this run. Use headed Chrome through Playwright MCP, apply the conditional App Switcher validation after login and at Home, continue through independent failures, and record one continuous 1280x720 video with no blur, masking, dimming, overlays, annotations, or chapter cards. Archive the previous Organization User run, then generate the canonical HTML dashboard, linked scenario pages, screenshots, timeline, totals, and failure reproduction steps under reports/role-executions/organization-user/<timestamp>/. Return the final report path and summary totals.
```

## 2. Campus User

Requires `testUsernames.campusUser` or `AES_STAGE_CAMPUS_USERNAME`.

```text
From the repository root, execute instructions/Multi User Instructions/campus-user-execution.md in unattended safe mode. First run scripts/check-multi-user-run-readiness.ps1 with -Controller campus-user-execution.md and stop only if its preflight fails. I authorize reading the required password from .secrets/aes-stage.ml.credentials.json and entering it into the configured AES Stage ML login flow At the first credential-entry point, request one action-time confirmation for this account and destination; after I confirm, do not ask again for the same account and destination during this run. Use headed Chrome through Playwright MCP, apply the conditional App Switcher validation after login and at Home, continue through independent failures, and record one continuous 1280x720 video with no blur, masking, dimming, overlays, annotations, or chapter cards. Archive the previous Campus User run, then generate the canonical HTML dashboard, linked scenario pages, screenshots, timeline, totals, and failure reproduction steps under reports/role-executions/campus-user/<timestamp>/. Return the final report path and summary totals.
```

## 3. Employee

```text
From the repository root, execute instructions/Multi User Instructions/employee-user-execution.md in unattended safe mode. First run scripts/check-multi-user-run-readiness.ps1 with -Controller employee-user-execution.md and stop only if its preflight fails. I authorize reading the required password from .secrets/aes-stage.ml.credentials.json and entering it into the configured AES Stage ML login flow At the first credential-entry point, request one action-time confirmation for this account and destination; after I confirm, do not ask again for the same account and destination during this run. Use headed Chrome through Playwright MCP, apply the conditional App Switcher validation after login and at Home, continue through independent failures, and record one continuous 1280x720 video with no blur, masking, dimming, overlays, annotations, or chapter cards. Archive the previous Employee run, then generate the canonical HTML dashboard, linked scenario pages, screenshots, timeline, totals, and failure reproduction steps under reports/role-executions/employee/<timestamp>/. Return the final report path and summary totals.
```

## 4. Substitute

```text
From the repository root, execute instructions/Multi User Instructions/substitute-user-execution.md in unattended safe mode. First run scripts/check-multi-user-run-readiness.ps1 with -Controller substitute-user-execution.md and stop only if its preflight fails. I authorize reading the required password from .secrets/aes-stage.ml.credentials.json and entering it into the configured AES Stage ML login flow At the first credential-entry point, request one action-time confirmation for this account and destination; after I confirm, do not ask again for the same account and destination during this run. Use headed Chrome through Playwright MCP, apply the conditional App Switcher validation after login and at Home, continue through independent failures, and record one continuous 1280x720 video with no blur, masking, dimming, overlays, annotations, or chapter cards. Archive the previous Substitute run, then generate the canonical HTML dashboard, linked scenario pages, screenshots, timeline, totals, and failure reproduction steps under reports/role-executions/substitute/<timestamp>/. Return the final report path and summary totals.
```

## 5. Campus User + Employee + Organization User

```text
From the repository root, execute instructions/Multi User Instructions/multi-role-campus-employee-organization-execution.md in unattended safe mode. First run scripts/check-multi-user-run-readiness.ps1 with -Controller multi-role-campus-employee-organization-execution.md and stop only if its preflight fails. I authorize reading the required password from .secrets/aes-stage.ml.credentials.json and entering it into the configured AES Stage ML login flow At the first credential-entry point, request one action-time confirmation for this account and destination; after I confirm, do not ask again for the same account and destination during this run. Use headed Chrome through Playwright MCP, execute every documented role block separately, and apply the conditional App Switcher validation in every exposed role context. Continue through independent failures and record one continuous 1280x720 video with no blur, masking, dimming, overlays, annotations, or chapter cards. Archive the previous run for this combination and generate the canonical HTML dashboard, role-grouped scenario pages, screenshots, timeline, totals, and failure reproduction steps under reports/role-executions/multi-role-campus-employee-organization/<timestamp>/. Return the final report path and summary totals.
```

## 6. Organization User + Employee

```text
From the repository root, execute instructions/Multi User Instructions/multi-role-organization-employee-execution.md in unattended safe mode. First run scripts/check-multi-user-run-readiness.ps1 with -Controller multi-role-organization-employee-execution.md and stop only if its preflight fails. I authorize reading the required password from .secrets/aes-stage.ml.credentials.json and entering it into the configured AES Stage ML login flow At the first credential-entry point, request one action-time confirmation for this account and destination; after I confirm, do not ask again for the same account and destination during this run. Use headed Chrome through Playwright MCP, execute every documented role block separately, and apply the conditional App Switcher validation in every exposed role context. Continue through independent failures and record one continuous 1280x720 video with no blur, masking, dimming, overlays, annotations, or chapter cards. Archive the previous run for this combination and generate the canonical HTML dashboard, role-grouped scenario pages, screenshots, timeline, totals, and failure reproduction steps under reports/role-executions/multi-role-org-employee/<timestamp>/. Return the final report path and summary totals.
```

## 7. Employee + Employee + Substitute

```text
From the repository root, execute instructions/Multi User Instructions/multi-role-employee-employee-substitute-execution.md in unattended safe mode. First run scripts/check-multi-user-run-readiness.ps1 with -Controller multi-role-employee-employee-substitute-execution.md and stop only if its preflight fails. I authorize reading the required password from .secrets/aes-stage.ml.credentials.json and entering it into the configured AES Stage ML login flow At the first credential-entry point, request one action-time confirmation for this account and destination; after I confirm, do not ask again for the same account and destination during this run. Use headed Chrome through Playwright MCP, execute both Employee contexts and the Substitute context separately, and apply the conditional App Switcher validation in every exposed context. Continue through independent failures and record one continuous 1280x720 video with no blur, masking, dimming, overlays, annotations, or chapter cards. Archive the previous run for this combination and generate the canonical HTML dashboard, context-grouped scenario pages, screenshots, timeline, totals, and failure reproduction steps under reports/role-executions/multi-role-employee-employee-substitute/<timestamp>/. Return the final report path and summary totals.
```

## 8. Multi-organization Employee + Substitute

```text
From the repository root, execute instructions/Multi User Instructions/multi-org-employee-substitute-execution.md in unattended safe mode. First run scripts/check-multi-user-run-readiness.ps1 with -Controller multi-org-employee-substitute-execution.md and stop only if its preflight fails. I authorize reading the required password from .secrets/aes-stage.ml.credentials.json and entering it into the configured AES Stage ML login flow At the first credential-entry point, request one action-time confirmation for this account and destination; after I confirm, do not ask again for the same account and destination during this run. Use headed Chrome through Playwright MCP, execute every documented organization/role context separately, and apply the conditional App Switcher validation in every exposed context. Continue through independent failures and record one continuous 1280x720 video with no blur, masking, dimming, overlays, annotations, or chapter cards. Archive the previous run for this combination and generate the canonical HTML dashboard, context-grouped scenario pages, screenshots, timeline, totals, and failure reproduction steps under reports/role-executions/multi-org-employee-substitute/<timestamp>/. Return the final report path and summary totals.
```

## 9. Multi-organization Employee + Employee

```text
From the repository root, execute instructions/Multi User Instructions/multi-org-employee-employee-execution.md in unattended safe mode. First run scripts/check-multi-user-run-readiness.ps1 with -Controller multi-org-employee-employee-execution.md and stop only if its preflight fails. I authorize reading the required password from .secrets/aes-stage.ml.credentials.json and entering it into the configured AES Stage ML login flow At the first credential-entry point, request one action-time confirmation for this account and destination; after I confirm, do not ask again for the same account and destination during this run. Use headed Chrome through Playwright MCP, execute every documented Employee organization context separately, and apply the conditional App Switcher validation in every exposed context. Continue through independent failures and record one continuous 1280x720 video with no blur, masking, dimming, overlays, annotations, or chapter cards. Archive the previous run for this combination and generate the canonical HTML dashboard, context-grouped scenario pages, screenshots, timeline, totals, and failure reproduction steps under reports/role-executions/multi-org-employee-employee/<timestamp>/. Return the final report path and summary totals.
```

## 10. Multi-organization Organization User + Campus User

```text
From the repository root, execute instructions/Multi User Instructions/multi-org-organization-campus-execution.md in unattended safe mode. First run scripts/check-multi-user-run-readiness.ps1 with -Controller multi-org-organization-campus-execution.md and stop only if its preflight fails. I authorize reading the required password from .secrets/aes-stage.ml.credentials.json and entering it into the configured AES Stage ML login flow At the first credential-entry point, request one action-time confirmation for this account and destination; after I confirm, do not ask again for the same account and destination during this run. Use headed Chrome through Playwright MCP, execute every documented Organization User and Campus User organization context separately, and apply the conditional App Switcher validation in every exposed context. Continue through independent failures and record one continuous 1280x720 video with no blur, masking, dimming, overlays, annotations, or chapter cards. Archive the previous run for this combination and generate the canonical HTML dashboard, context-grouped scenario pages, screenshots, timeline, totals, and failure reproduction steps under reports/role-executions/multi-org-org-campus/<timestamp>/. Return the final report path and summary totals.
```

## One-shot run — all nine currently configured login combinations

This excludes only the optional standalone Campus User controller. Campus coverage still runs through the configured Campus User + Employee + Organization User and multi-organization Organization User + Campus User combinations.

```text
From the repository root, execute instructions/multi-user-full-suite-execution.md in unattended safe mode for every configured login combination except campus-user-execution.md. First run scripts/check-multi-user-run-readiness.ps1 with -ExcludeController campus-user-execution.md and stop only if its preflight fails. I authorize reading every required password from .secrets/aes-stage.ml.credentials.json and entering each password only into its configured AES Stage ML login flow At the first credential-entry point, request one grouped action-time confirmation covering all selected accounts and Frontline Stage destinations; after I confirm, do not ask again for the same accounts and destinations during this run. Use headed Chrome through Playwright MCP, execute the nine selected controllers in manifest order, execute every role/organization context documented by each controller, and apply the conditional App Switcher validation wherever it is exposed. Continue through independent failures. Use one continuous 1280x720 video for the entire nine-login run with no blur, masking, dimming, overlays, annotations, or chapter cards. Run scripts/start-multi-user-full-suite-run.ps1 with -ExcludeController campus-user-execution.md so the previous current run and ZIP are archived. When execution is complete, finalize artifacts, generate the canonical dashboard, create one separate report folder under roles/ for each selected login combination, create the master index.html with links and video ranges for all combinations, validate all relative links and totals, and create the portable ZIP. Return the master report path, ZIP path, role-report count, scenario totals, PASS/FAIL/BLOCKED/NOT TESTED totals, and continuous-video duration.
```

## One-shot run — all ten controllers

Use this only after configuring the standalone Campus User username.

```text
From the repository root, execute instructions/multi-user-full-suite-execution.md in unattended safe mode for all ten controllers. First run scripts/check-multi-user-run-readiness.ps1 with no exclusions and stop only if its preflight fails. I authorize reading every required password from .secrets/aes-stage.ml.credentials.json and entering each password only into its configured AES Stage ML login flow At the first credential-entry point, request one grouped action-time confirmation covering all selected accounts and Frontline Stage destinations; after I confirm, do not ask again for the same accounts and destinations during this run. Use headed Chrome through Playwright MCP, execute every controller in manifest order, execute every role/organization context documented by each controller, and apply the conditional App Switcher validation wherever it is exposed. Continue through independent failures. Use one continuous 1280x720 video for the complete run with no blur, masking, dimming, overlays, annotations, or chapter cards. Run scripts/start-multi-user-full-suite-run.ps1 so the previous current run and ZIP are archived. When execution is complete, finalize artifacts, generate the canonical dashboard, create one separate report folder under roles/ for each selected login combination, create the master index.html with links and video ranges for all combinations, validate all relative links and totals, and create the portable ZIP. Return the master report path, ZIP path, role-report count, scenario totals, PASS/FAIL/BLOCKED/NOT TESTED totals, and continuous-video duration.
```

