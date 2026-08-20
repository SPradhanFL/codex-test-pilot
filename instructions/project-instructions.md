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

## Multi-user execution routing

For ML multi-user execution, treat `instructions/Multi User Instructions/` as the authoritative role-routing source.

1. Determine the requested execution identity or role combination before selecting scenarios. If it is not stated and cannot be safely inferred, ask which controller under `instructions/Multi User Instructions/` should be used.
2. Use the matching controller only:
   - Organization User: `instructions/Multi User Instructions/organization-user-execution.md`
   - Campus User: `instructions/Multi User Instructions/campus-user-execution.md`
   - Employee: `instructions/Multi User Instructions/employee-user-execution.md`
   - Substitute: `instructions/Multi User Instructions/substitute-user-execution.md`
   - Multi-role Campus User + Employee + Organization User: `instructions/Multi User Instructions/multi-role-campus-employee-organization-execution.md`
   - Multi-role Organization User + Employee: `instructions/Multi User Instructions/multi-role-organization-employee-execution.md`
   - Multi-role Employee + Employee + Substitute: `instructions/Multi User Instructions/multi-role-employee-employee-substitute-execution.md`
   - Multi-org Employee + Substitute: `instructions/Multi User Instructions/multi-org-employee-substitute-execution.md`
   - Multi-org Employee + Employee: `instructions/Multi User Instructions/multi-org-employee-employee-execution.md`
   - Multi-org Organization User + Campus User: `instructions/Multi User Instructions/multi-org-organization-campus-execution.md`
3. Read the ML URL and usernames only from `config/aes-stage.ml.json`.
4. Resolve ML passwords only from the matching environment variable or `.secrets/aes-stage.ml.credentials.json`.
5. Never fall back from one role to another role's identity. Missing role credentials block only the affected role workflows.
6. Read `instructions/Multi User Instructions/role-scenario-matrix.md` before every ML role or combination execution. It is authoritative for the numbered scenario set assigned to each active role.
7. Use `testUsernames.userRoleSwitcher` and `roleswitcher_org_password` for the dedicated Campus User + Employee + Organization User combination controller.
8. For a combination account, select each required role/context and execute that role's complete scenario set before advancing. Repeat shared scenarios in every applicable role/context.
9. The selected role controller determines which scenarios are in scope and whether a shared scenario must remain read-only. A role controller's narrower safety rule overrides a generic scenario's optional data-setup branch.
10. Never print, copy, log, report, screenshot, or record a resolved username/password combination, password, token, cookie, or session secret.

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

Follow `instructions/html-reporting-standard.md` for every execution.

- Create an HTML dashboard and linked scenario-detail pages in a timestamped report folder.
- Use `reports/migrated-user-navigation-suite/20260819-175231/index.html` as the canonical visual and functional reference.
- Include summary counts, expected and actual results, executed steps, screenshots, failure reproduction steps, and scenario-specific playback ranges from one final video.
- Do not create a Markdown execution report unless the user explicitly requests one.

Never write passwords, tokens, session cookies, or secret values to reports.
