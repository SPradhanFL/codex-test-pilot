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

The Employee General Information validation runs without pausing for password entry. Its username is stored in `tests/employee/employee-general-Info_Validate.md`, while its password must be supplied through the `AES_STAGE_PASSWORD` environment variable.

Never add the password to Markdown, `.env`, configuration, source-control, prompt, or report files.

### PowerShell session setup

Open PowerShell and enter the password through a masked prompt:

```powershell
$aesSecurePassword = Read-Host "AES Stage password" -AsSecureString
$aesCredential = [pscredential]::new("aes-stage", $aesSecurePassword)
$env:AES_STAGE_PASSWORD = $aesCredential.GetNetworkCredential().Password
```

Launch Codex from that same PowerShell environment so it inherits the variable. The value remains limited to that process/session and is not committed to Git.

For CI or a shared automation runner, define `AES_STAGE_PASSWORD` in the platform's encrypted secret store and inject it as an environment variable at runtime. Never print the variable or enable command tracing around credential setup.

If the variable is absent, the validation scenario stops before opening the browser and generates a **BLOCKED** Markdown and HTML report.

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
Execute tests/employee/employee-general-Info_Validate.md
```

That scenario automatically:

1. Reads the password from `AES_STAGE_PASSWORD` without displaying or recording it.
2. Opens AES Stage in Chrome and allows the approved Stage authentication redirect.
3. Executes the documented positive, negative, and edge-case validations.
4. Avoids saving or creating an employee record.
5. Cancels the form after validation.
6. Creates timestamped Markdown and standalone HTML reports under `reports/`.

Codex reads the selected scenario and shared files, opens the application, performs the browser actions, verifies the expected results, and writes the requested reports. If required configuration is missing, it stops before making changes and reports what must be supplied.

## Security

Use dedicated test accounts and synthetic data. Usernames for dedicated Stage accounts may be documented when approved, but never store passwords, tokens, cookies, authentication fragments, or production personal data in Git-tracked files. Review reports and screenshots before sharing or committing them.
