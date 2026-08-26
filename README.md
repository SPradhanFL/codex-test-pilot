# Prompt-Only Browser Automation with Codex

This project contains Markdown instructions only. Codex reads a selected scenario and performs its steps directly in a browser through Playwright MCP. It does not generate or run TypeScript Playwright tests.

## Structure

```text
AT-AI-Test-Automation/
├── .codex/
│   └── config.toml
├── instructions/
│   ├── project-instructions.md
│   ├── application-details.md
│   └── test-data.md
├── tests/
│   ├── employee/
│   │   ├── create-employee.md
│   │   └── delete-employee.md
│   └── login/
│       └── login.md
├── reports/
└── README.md
```

## Prerequisites

- Node.js 18 or later
- npm/npx
- Codex CLI, app, or IDE extension
- A permitted non-production application environment

## Playwright MCP configuration

The project-scoped `.codex/config.toml` starts Playwright MCP. Alternatively, register it through the CLI:

```powershell
codex mcp add playwright -- npx -y @playwright/mcp@latest --browser chrome --codegen none
```

Open this directory as a trusted Codex project, then restart or refresh Codex if the MCP server is not immediately available.

## Configure unattended AES Stage login

The unattended scenarios read the Stage URL and username from `config/aes-stage.json`. They resolve the password from `AES_STAGE_PASSWORD` first and fall back to the local `.secrets/aes-stage.credentials.json` file.

The real credentials file is ignored by Git. Never force-add it, copy its password into Markdown or reports, or replace the placeholder in the committed example file.

### Local credentials file setup

The repository contains the safe placeholder:

```text
.secrets/aes-stage.credentials.example.json
```

Each developer keeps their real local value in:

```text
.secrets/aes-stage.credentials.json
```

Expected local structure:

```json
{
  "password": "YOUR_LOCAL_AES_STAGE_PASSWORD"
}
```

`.gitignore` excludes the real credentials file while keeping the placeholder example available to the team.

### PowerShell session setup

Open PowerShell and enter the password through a masked prompt:

```powershell
$aesSecurePassword = Read-Host "AES Stage password" -AsSecureString
$aesCredential = [pscredential]::new("aes-stage", $aesSecurePassword)
$env:AES_STAGE_PASSWORD = $aesCredential.GetNetworkCredential().Password
```

Launch Codex from that same PowerShell environment so it inherits the variable. The value remains limited to that process/session and is not committed to Git.

For CI or a shared automation runner, define `AES_STAGE_PASSWORD` in the platform's encrypted secret store and inject it as an environment variable at runtime. Never print the variable or enable command tracing around credential setup.

If the environment variable and valid local credentials file are both absent, the scenario stops before opening the browser and generates a **BLOCKED** report.

## Configure the project

1. Fill in `instructions/application-details.md` with the non-production URL and page identifiers.
2. Fill in `instructions/test-data.md` with safe synthetic values and a secure password-entry method.
3. Review `instructions/project-instructions.md`.
4. Adjust the scenarios under `tests/` to match the application.

## Execute a scenario

Ask Codex from this project:

```text
Execute tests/login/login.md exactly as documented. Read every referenced instruction file, use Playwright MCP to perform the steps in the browser, do not generate test code, and save the execution report under reports/.
```

Other examples:

```text
Execute tests/employee/create-employee.md using Playwright MCP and save the report under reports/.
```

```text
Execute tests/employee/delete-employee.md using Playwright MCP and save the report under reports/.
```

Run the unattended Employee General Information validation with this one-line prompt:

```text
Execute tests/employee/general-information/add-employee-validation.md
```

That scenario automatically:

1. Reads the URL and username from `config/aes-stage.json`.
2. Resolves the password from `AES_STAGE_PASSWORD` or the ignored local credentials file without displaying or recording it.
3. Opens AES Stage in Chrome and allows the approved Stage authentication redirect.
4. Executes the documented positive, negative, and edge-case validations.
5. Avoids saving or creating an employee record.
6. Cancels the form after validation.
7. Creates the standard timestamped HTML dashboard and linked evidence pages in the scenario's dedicated report folder.

Codex reads the selected scenario and shared files, opens the application, performs the browser actions, verifies the expected results, and writes the requested reports. If required configuration is missing, it stops before making changes and reports what must be supplied.

Before any scenario is marked **FAIL**, the runner observes or polls the missing expected page, element, navigation, or state for a full 60 seconds. If it remains unavailable, the runner captures final evidence at or after the timeout and records the 60-second expiration in the report. This wait does not change genuine **BLOCKED** or **NOT TESTED** prerequisite outcomes.

## Execute the complete suite with one video

The full-suite coordinator is:

`instructions/full-suite-headed-video-execution.md`

At the beginning of every full-suite execution, `scripts/start-full-suite-run.ps1` automatically moves previous timestamped runs to:

`reports/full-suite/old-runs/old-<timestamp>/`

At the end of the run, finalize and generate the shareable artifacts with:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/finalize-full-suite-artifacts.ps1 -RunId <YYYYMMDD-HHMMSS>
node scripts/generate-full-suite-report.mjs <YYYYMMDD-HHMMSS>
```

This keeps one continuous video, its execution timeline, current screenshots, the dashboard, and detailed scenario pages together under the current timestamped run folder.

The recording keeps every application page fully visible. Full-screen chapter cards, blur effects, dimming, masking, and action-callout overlays are disabled; scenario boundaries are provided by the clickable HTML timeline instead.

The new report, continuous video, timeline, and screenshots remain in a new top-level timestamped folder under `reports/full-suite/`.

For a zero-routine-prompt, non-destructive run:

```text
Execute all scenarios using instructions/full-suite-headed-video-execution.md in unattended safe mode. Use the configured AES Stage credentials, keep one headed Chrome session and one continuous video, generate the timeline and standalone HTML reports, and continue through independent failures.
```

Unattended safe mode never submits persistent create, update, remove, delete, approval, reconciliation, or import actions. Those steps are reported as **NOT TESTED**, so mutation-focused scenarios cannot be marked PASS.

For the complete staging create/delete lifecycle:

```text
Execute all scenarios using instructions/full-suite-headed-video-execution.md in full destructive mode. Use the configured AES Stage credentials, keep one headed Chrome session and one continuous video, generate the timeline and standalone HTML reports, and continue through independent failures.
```

Full destructive mode avoids routine questions and groups exact cleanup targets when possible. Permanent browser deletions may still require a narrow action-time confirmation; this safeguard cannot be disabled by storing approval in a project file or prompt.

Each completed run contains one user-facing video:

`reports/full-suite/<timestamp>/videos/full-suite-execution.webm`

The dashboard and every scenario report show the exact range for that execution, for example `Execution 1: 0:00–5:21`. Selecting the range seeks the shared video to that scenario.

## Standard report format

All future executions must generate HTML reports according to `instructions/html-reporting-standard.md`. The canonical reference is:

`reports/migrated-user-navigation-suite/20260819-175231/index.html`

The standard provides a summary dashboard, linked scenario-detail pages, expected and actual results, screenshot evidence, a separate failure/blocked section with reproduction steps, and scenario-specific playback ranges from one continuous video. Markdown execution reports are created only when explicitly requested.

## Execute the multi-user suite

Use `instructions/multi-user-full-suite-execution.md` with an explicit organization ID to execute the controllers enabled in `config/aes-stage.ml.<OrgId>.json`. The catalog contains ten possible controllers; each organization configuration enables only the login combinations available for that organization.

Role coverage is defined in `instructions/Multi User Instructions/role-scenario-matrix.md`: Organization User runs scenarios 1–19; Campus User runs 3, 7, 14, 16, 17, 20, and 21, including Campus-only Report Writer and Account Settings navigation; and Employee/Substitute run 14 and 16. Combination controllers execute each role/context separately and repeat shared scenario IDs instead of deduplicating them.

Choose the organization by passing only its ID to the readiness and start commands. The organization configuration supplies the enabled login combinations:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-multi-user-run-readiness.ps1 -OrgId 140462
powershell -ExecutionPolicy Bypass -File scripts/start-multi-user-full-suite-run.ps1 -OrgId 140462
```

Replace `140462` with `140463` to execute the four accounts configured for that organization. Reports and ZIPs are isolated under the matching `reports/full-suite/<OrgId>/` folder.

```text
For OrgId 140463, execute instructions/multi-user-full-suite-execution.md in unattended safe mode. Start a fresh isolated headed Chrome automation context and new test window, then run every controller enabled in config/aes-stage.ml.140463.json with one continuous 1280x720 full-browser-window video including the address bar, apply URL warning validation at every workflow checkpoint, archive only that organization's previous run, continue through independent failures, and generate the standard HTML evidence package.
```

Each run creates one consolidated dashboard and one self-contained folder per selected role/login-combination controller under `reports/full-suite/<OrgId>/<timestamp>/roles/`. Every role folder contains its own report, scenario-detail pages, and complete-Chrome-window screenshots; all folders use the same continuous full-browser video stored once under the run's `videos/` folder. A combination login remains one folder and its report separates the active role/organization contexts.

At each workflow's final checkpoint, the runner compares the stable browser URL with `requiredUrlContains` from the selected organization configuration. Both current Stage ML configurations use the shared case-insensitive marker `stage-k12.ss`, so role-specific Stage ML hosts are accepted without requiring one product hostname. A mismatch is shown as a separate **WARNING** with its validation step and full-browser screenshot when the functional navigation still works; it does not replace or alter the workflow's PASS/FAIL/BLOCKED/NOT TESTED status.

Every Stage ML multi-user run must begin in a fresh isolated headed Chrome automation context and a newly opened test window. Existing user tabs, prior automation tabs, browser history, cookies, and authenticated sessions must not be reused.

The project configuration launches Playwright MCP with `--isolated`, which keeps the browser profile in memory. At the beginning of every suite invocation, the runner closes the prior project Playwright MCP backend/context and makes the configured Stage URL its next browser navigation. The multi-user starter leaves browser isolation in `PENDING` state. Before credentials or recording begin, the runner must verify the context reset, one Playwright-controlled tab, complete a unique page-title write/read probe, tag the dedicated Chrome window, and run `scripts/confirm-multi-user-browser-isolation.ps1`. That command creates `browser-isolation.json` and binds video and screenshots to the exact confirmed window. Report generation, finalization, and packaging reject a run that lacks this runtime evidence, so a normal Chrome profile or extension-controlled tab cannot be labeled as a fresh browser context.

The HTML generator uses the fixed visual structure of the 2026-08-19 migrated-user navigation report. Starting a new run moves only the selected organization's prior timestamped run and matching ZIP to `reports/full-suite/<OrgId>/old-reports/old-<timestamp>/`, so organizations and current/historical evidence never mix.

Team members can use the ready-to-copy organization-scoped prompts in `instructions/Multi User Instructions/team-execution-prompts.md`. Before running, copy the matching `.secrets/aes-stage.ml.<OrgId>.credentials.example.json` to the ignored `.secrets/aes-stage.ml.<OrgId>.credentials.json` and fill the required local password values. Run `scripts/check-multi-user-run-readiness.ps1 -OrgId <OrgId>` to verify configuration without displaying secrets.

## Security

Use dedicated test accounts and synthetic data. Usernames for dedicated Stage accounts may be documented when approved, but never store passwords, tokens, cookies, authentication fragments, or production personal data in Git-tracked files. Review reports and screenshots before sharing or committing them.
