# Project Execution Instructions

## Purpose

Execute the selected Markdown scenario directly in a browser using Playwright MCP. Do not generate Playwright source code, TypeScript files, automation frameworks, or reusable code.

## Mandatory preparation

1. Read this file completely.
2. Read `instructions/application-details.md`.
3. Read `instructions/test-data.md`.
4. Read the selected scenario completely.
5. Resolve every named value before opening the browser.

If a required URL, credential reference, test value, or expected result is missing or still contains a placeholder, stop before performing browser actions. State exactly what is missing. Never invent credentials or business data.

## Browser execution rules

- Use Playwright MCP for all browser navigation, interaction, inspection, and screenshots.
- Execute steps in their documented order.
- Prefer elements by accessible role, label, placeholder, visible text, or test ID.
- Wait for observable UI states instead of arbitrary delays.
- Do not bypass security warnings, CAPTCHA, MFA, or access controls.
- Do not perform actions outside the selected scenario.
- Use only the non-production environment in `application-details.md`.
- For create, update, or delete scenarios, verify the target record before submitting.
- Stop when continuing could affect the wrong record, environment, or user.
- Do not change project files except for reports and useful screenshots under `reports/`.

## Result classification

- **PASS:** Every step completed and every expected result was observed.
- **FAIL:** A step completed but its expected result was not observed, or the application displayed an error.
- **BLOCKED:** Execution could not safely continue because of missing data, permissions, authentication, unavailable UI, or environment issues.

## Reporting

Create `reports/<scenario-name>-<YYYYMMDD-HHMMSS>.md` containing:

- Scenario name and start/finish times
- Environment URL without credentials or tokens
- Overall status: PASS, FAIL, or BLOCKED
- Step number, action, expected result, actual result, and status
- Safe error details and screenshot paths
- Cleanup performed or still required

Never write passwords, tokens, session cookies, or secret values to reports.

