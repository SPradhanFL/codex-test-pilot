# Execute the multi-user suite with Claude Code in VS Code

## One-time machine setup

1. Install the official Claude Code VS Code extension and sign in with an eligible Anthropic account.
2. Install the standalone Claude Code CLI if you want to manage MCP servers or run Claude from VS Code's integrated terminal.
3. From the repository root, run `npm install` if `node_modules` is absent.
4. Start Claude Code from this repository. Approve the trusted project-scoped Playwright MCP server in `.mcp.json` once, then use `/mcp` to confirm `playwright` is connected.
5. Keep each real password only in the matching ignored `.secrets/aes-stage.ml.<OrgId>.credentials.json` file. Do not paste passwords into Claude chat.

## Preflight

From the VS Code PowerShell terminal, run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-multi-user-run-readiness.ps1 -OrgId <OrgId>
```

Do not start the browser run unless preflight passes.

## Copy-ready Claude prompt for one organization

```text
From the repository root, execute instructions/multi-user-full-suite-execution.md for organization <OrgId> in unattended safe mode. Read CLAUDE.md and every referenced instruction first. Run the organization readiness check and stop only if preflight fails. I authorize reading the required passwords from the matching ignored .secrets file and entering them only into the configured Frontline Stage login flows; never display or report them. Use the project Playwright MCP server with a fresh isolated headed Chrome context, execute enabled controllers in manifest order, continue through independent failures, and follow the documented role recovery, popup handling, 120-second timeout, fixed absence-data, cleanup, logout, Browser Back, URL-warning, screenshot, and reporting rules. Start the organization run so its previous current report and ZIP are archived. Record one continuous 1280x720 full-browser-window video without blur or overlays. When complete, finalize artifacts, generate the canonical dashboard and role reports, validate links and totals, create the portable ZIP, and return the report path, ZIP path, role count, PASS/FAIL/BLOCKED/NOT TESTED totals, and video duration.
```

## Sequential run for all configured organizations

Use one organization at a time so browser state, evidence, and reports cannot mix:

```text
Execute the full organization suite sequentially for 140462, then 140463, then 140466. Apply the complete one-organization procedure in CLAUDE.md and instructions/multi-user-full-suite-execution.md separately to each organization. Use a fresh isolated headed Chrome context and separate continuous video for each organization. Do not start the next organization until the previous report, link validation, and ZIP are complete. Continue through independent scenario failures without changing expected results or test instructions.
```

After all organizations finish, generate the comparison report:

```powershell
node scripts/generate-day-wise-comparison-report.mjs
```

## Cost-conscious project agents

Use the full browser runner directly as the session agent so a parent conversation does not duplicate browser context:

```powershell
claude --agent browser-suite-runner
```

Then prompt it with:

```text
Execute Organization <OrgId> in unattended safe mode using the organization configuration and matching ignored credentials file. Perform preflight, fresh isolated headed-Chrome execution, continuous video, reporting, link validation, and ZIP packaging exactly as documented. Do not edit the framework during this run.
```

For an already completed run, start a fresh low-cost finalization session:

```powershell
claude --agent report-finalizer
```

```text
Finalize Organization <OrgId>, RunId <RunId>. Generate and validate the canonical dashboard, role reports, totals, relative links, continuous-video metadata, and portable ZIP. Do not reopen the application.
```

For failure analysis, start another fresh session:

```powershell
claude --agent failure-analyst
```

```text
Analyze Organization <OrgId>, RunId <RunId>. Inspect only FAIL, BLOCKED, NOT TESTED, and warning results. Group common causes and return usernames, roles, scenario names, reproduction steps, actual results, evidence links, video ranges, and a supported classification. Do not rerun or edit anything.
```

For an explicitly requested framework change:

```powershell
claude --agent instruction-maintainer
```

```text
Implement this requested framework change only: <change>. Trace every affected controller, matrix, config, reporting script, and guide; preserve unrelated work; run static validation; and do not launch a live browser execution.
```
