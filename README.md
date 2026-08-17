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
7. Creates timestamped Markdown and standalone HTML reports in the scenario's dedicated report folder.

Codex reads the selected scenario and shared files, opens the application, performs the browser actions, verifies the expected results, and writes the requested reports. If required configuration is missing, it stops before making changes and reports what must be supplied.

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

## Security

Use dedicated test accounts and synthetic data. Usernames for dedicated Stage accounts may be documented when approved, but never store passwords, tokens, cookies, authentication fragments, or production personal data in Git-tracked files. Review reports and screenshots before sharing or committing them.
