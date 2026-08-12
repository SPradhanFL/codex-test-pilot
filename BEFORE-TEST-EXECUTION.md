# Before AES Stage Test Execution

Use this guide before running the AES Stage browser-automation scenarios in this repository.

## 1. Prerequisites

- Pull the latest project changes from Git.
- Open the repository as a trusted project in Codex.
- Ensure Chrome and Playwright MCP browser automation are available.
- Use only the approved AES Stage test environment and test account.

The Stage URL and username are already configured in:

`config/aes-stage.json`

## 2. Configure the local password

Copy:

`.secrets/aes-stage.credentials.example.json`

to:

`.secrets/aes-stage.credentials.json`

PowerShell command:

```powershell
Copy-Item .secrets/aes-stage.credentials.example.json .secrets/aes-stage.credentials.json
```

Open the new local file and replace the placeholder with the AES Stage password:

```json
{
  "password": "<AES_STAGE_PASSWORD>"
}
```

Obtain the password through the team's approved secure channel. Do not place the real password in chat, test Markdown, reports, screenshots, or Git-tracked files.

The local `.secrets/aes-stage.credentials.json` file is excluded by `.gitignore` and must never be force-added or committed.

As an alternative, define `AES_STAGE_PASSWORD` in the process environment before starting Codex. The scenarios check that environment variable first and then fall back to the ignored local credentials file.

## 3. Execute all three test suites

Open Codex from the repository root and paste this prompt:

```text
Execute all three AES Stage test files using the configuration and local credentials provided by the project:

1. tests/employee/general-information/add-employee-validation.md
2. tests/navigation/cross-application-navigation-matrix.md
3. tests/logout/logout-navigation-matrix.md

Follow every step and expected result in each Markdown file. Generate timestamped HTML reports in their respective report folders. Include total passed and failed flows, individual scenario outcomes, and a separate failure section containing steps to reproduce. Do not expose credentials in the reports. At the end, provide a consolidated execution summary with links to all generated HTML reports.
```

To execute only one suite, use one of these prompts:

```text
Execute tests/employee/general-information/add-employee-validation.md
```

```text
Execute tests/navigation/cross-application-navigation-matrix.md
```

```text
Execute tests/logout/logout-navigation-matrix.md
```

## 4. View the reports

Timestamped reports are generated in these dedicated folders:

- `reports/employee/general-information/add-employee-validation/`
- `reports/navigation/cross-application-navigation-matrix/`
- `reports/logout/logout-navigation-matrix/`

Open the newest `.html` file in each folder with a browser. Each report includes overall execution status, passed and failed totals, scenario outcomes, and failure reproduction steps where applicable.

## 5. Test coverage

### Add Employee General Information

- React Home to Extract / Import → Import Data.
- Import Data to Master Data → Employee → General Information.
- Add Employee positive, negative, required-field, boundary, and edge-case validation.
- Cleanup without creating an employee record.

### Cross-application navigation

- Import Data to Angular Daily Report.
- Angular Daily Report to global Search for `report`, then React Home.
- React Home to global Search for `report`, then Angular Daily Report.
- Import Data to global Search for `report`, then back to Import Data.
- Dropdown, filter, checkbox, date, navigation, and page-interactivity checks.
- A matching result list or an explicit `0 results` / `No Records Found` state is accepted.

### Logout and session security

- Logout from React Home.
- Logout from Angular Daily Report.
- Logout from Import Data.
- Logout from Employee maintenance.
- Browser Back, direct protected-route access, clean re-authentication, and multi-tab session invalidation checks.

## 6. Important execution rules

- Allow redirects only among the approved Stage hosts configured in `config/aes-stage.json`.
- The current Import Data implementation may use `/mvc.aspx/dataimport`; do not require a `.asp` URL.
- Do not upload or import a file during navigation validation.
- Do not submit a valid Add Employee form or create an employee record.
- Do not expose passwords, tokens, cookies, or sensitive authentication URL fragments.
- If neither `AES_STAGE_PASSWORD` nor a valid local credentials file is available, stop before browser execution and report the run as **BLOCKED**.

