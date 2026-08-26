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
3. Require an explicit `OrgId`, then read the ML URL, usernames, approved hosts, and enabled controller list only from `config/aes-stage.ml.<OrgId>.json`.
4. Resolve ML passwords only from `.secrets/aes-stage.ml.<OrgId>.credentials.json`. Never mix configuration or credentials across organization IDs.
5. Never fall back from one role to another role's identity. Missing role credentials block only the affected role workflows.
6. Read `instructions/Multi User Instructions/role-scenario-matrix.md` before every ML role or combination execution. It is authoritative for the numbered scenario set assigned to each active role.
7. Use `testUsernames.userRoleSwitcher` and `roleswitcher_org_password` for the dedicated Campus User + Employee + Organization User combination controller only when that controller is enabled for the requested organization.
8. For a combination account, select each required role/context and execute that role's complete scenario set before advancing. Repeat shared scenarios in every applicable role/context.
9. The selected role controller determines which scenarios are in scope and whether a shared scenario must remain read-only. A role controller's narrower safety rule overrides a generic scenario's optional data-setup branch.
10. Never print, copy, log, report, screenshot, or record a resolved username/password combination, password, token, cookie, or session secret.

## Browser execution rules

- Use Playwright MCP for all browser navigation, interaction, inspection, and screenshots.
- For every Stage ML multi-user invocation, use only the project-scoped Playwright MCP server with its `--isolated` in-memory profile. First use the project Playwright MCP `browser_close` action to dispose any backend/context retained by the current task; never target a user-owned Chrome window. The next MCP browser action must navigate to the configured URL and create a new dedicated headed Chrome window. Do not use Chrome extension control, attach to a normal/user-owned Chrome tab, use a persistent profile or saved storage state, or reuse authenticated session state. Before credential entry, require the recorded context reset, one controlled tab, a successful Playwright MCP title write/read probe, and a successful `scripts/confirm-multi-user-browser-isolation.ps1` result. Use the same confirmed context for the complete selected-controller run.
- For Stage ML multi-user report evidence, use Playwright MCP for navigation, interaction, and URL inspection, but capture screenshots and video with the full-browser-window scripts required by `instructions/multi-user-full-suite-execution.md` so the address bar is visible.
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

### Mandatory 60-second failure observation

- Before marking any step or scenario **FAIL**, keep the affected destination, page, or target element under observation for a full **60 seconds** from the action that should have produced the expected result.
- Use observable Playwright waits or polling during that window. Keep the target scrolled into view when applicable, and do not repeat a create, save, delete, logout, or other state-changing action merely to fill the wait period.
- Do not finalize **FAIL** before the 60-second window expires. If the expected page, element, state, or navigation becomes available during the window, continue validation from that recovered state.
- If the expected result is still absent after 60 seconds, capture final evidence at or after the timeout and mark **FAIL** with the actual result stating that the full 60-second observation expired.
- An application error may be recorded as soon as it appears, but the failure is finalized only after the same 60-second observation window unless continuing would violate a safety, security, or environment boundary.
- This timeout applies only to a potential **FAIL**. Missing credentials, permissions, prerequisite data, unsafe targets, or intentionally unsupported coverage remain **BLOCKED** or **NOT TESTED** under the rules below and must not be converted to **FAIL** by waiting.
- Every failed report entry must include a timeout step showing the action that started the wait, the expected recovery state, the final observed state, and `60 seconds` as the elapsed failure-observation period.

- **PASS:** Every step completed and every expected result was observed.
- **FAIL:** A step completed but its expected result was not observed, or the application displayed an error.
- **BLOCKED:** Execution could not safely continue because of missing data, permissions, authentication, unavailable UI, or environment issues.
- **WARNING:** Supplemental evidence that does not replace a scenario status. For Stage ML multi-user runs, a missing configured URL substring is a warning when the documented navigation and elements still work.

## Reporting

Follow `instructions/html-reporting-standard.md` for every execution.

- Create an HTML dashboard and linked scenario-detail pages in a timestamped report folder.
- Use `reports/migrated-user-navigation-suite/20260819-175231/index.html` as the canonical visual and functional reference.
- Include summary counts, expected and actual results, executed steps, screenshots, failure reproduction steps, and scenario-specific playback ranges from one final video.
- Do not create a Markdown execution report unless the user explicitly requests one.

Never write passwords, tokens, session cookies, or secret values to reports.
