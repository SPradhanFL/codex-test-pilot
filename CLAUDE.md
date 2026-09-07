# Claude Code project instructions

This repository contains prompt-driven browser validation. Read and follow the selected Markdown controller; do not generate TypeScript Playwright tests unless the user explicitly requests that migration.

## Required execution rules

- Use the project-scoped `playwright` MCP server in `.mcp.json`.
- Use a fresh isolated headed Chrome context for every organization run.
- Read `instructions/project-instructions.md`, `instructions/multi-user-full-suite-execution.md`, and every file referenced by the selected controller before executing it.
- Resolve non-secret settings from `config/aes-stage.ml.<OrgId>.json`.
- Resolve passwords only from the matching ignored `.secrets/aes-stage.ml.<OrgId>.credentials.json` file. Never print, quote, copy into prompts, or write passwords to reports.
- Run `scripts/check-multi-user-run-readiness.ps1 -OrgId <OrgId>` before browser work. Stop only when preflight fails.
- Start the run with `scripts/start-multi-user-full-suite-run.ps1 -OrgId <OrgId>` so the previous current report and ZIP are archived.
- Execute enabled controllers in manifest order, continue through independent failures, and follow all documented role, organization, wait, recovery, test-data, popup, logout, URL-warning, and cleanup rules.
- Capture one continuous full-browser-window video with no blur, masking, dimming, overlays, annotations, or chapter cards.
- Finalize the run, generate the canonical dashboard and role reports, validate relative links and totals, and create the portable ZIP exactly as documented.
- Do not change test instructions, configuration, credentials, or expected results during an execution unless the user separately asks for an implementation change.

## Organization selection

Supported configurations currently include `140462`, `140463`, and `140466`. Always use the exact organization ID supplied by the user and keep artifacts under `reports/full-suite/<OrgId>/<timestamp>/`.

## Recommended execution prompt

Use the copy-ready prompt in `instructions/claude-vscode-execution.md`, replacing `<OrgId>` with the requested organization.

## Project agents

Reusable Claude Code agents live under `.claude/agents/`.

- Run a full browser suite as a direct `browser-suite-runner` session. It must be the only agent controlling Chrome, screenshots, the continuous video, and current-run report state.
- Use `report-finalizer` only after browser execution has ended.
- Use `failure-analyst` for read-only analysis of completed reports.
- Use `instruction-maintainer` only when the user explicitly requests repository changes.
- Never run multiple browser agents concurrently against the same organization or report folder.
