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

Codex reads the selected scenario and shared files, opens the application, performs the browser actions, verifies the expected results, and writes a Markdown report. If required configuration is missing, it stops before making changes and reports what must be supplied.

## Security

Use dedicated test accounts and synthetic data. Never store passwords, tokens, cookies, or production personal data in these files. Review reports and screenshots before sharing or committing them.
