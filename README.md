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

## Security

Use dedicated test accounts and synthetic data. Usernames for dedicated Stage accounts may be documented when approved, but never store passwords, tokens, cookies, authentication fragments, or production personal data in Git-tracked files. Review reports and screenshots before sharing or committing them.
