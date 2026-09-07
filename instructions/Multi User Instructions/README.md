# Multi-User Execution Controllers

Use this directory as the authoritative scenario and credential-routing source for ML multi-user validation.

## Shared configuration

- URL and usernames: `config/aes-stage.ml.<OrgId>.json`
- Passwords: `.secrets/aes-stage.ml.<OrgId>.credentials.json`
- Report format: `instructions/html-reporting-standard.md`
- Role/scenario routing: `instructions/Multi User Instructions/role-scenario-matrix.md`
- Conditional cross-product switching: `instructions/Multi User Instructions/app-switcher-validation.md`
- Stage ML login-to-application handoff: `instructions/Multi User Instructions/stage-ml-application-launch.md`
- Full-browser URL evidence and warning policy: `instructions/Multi User Instructions/url-evidence-validation.md`
- Standalone Home menu navigation: `tests/navigation/standalone-home-menu-navigation.md`
- Copy/paste team prompts: `instructions/Multi User Instructions/team-execution-prompts.md`
- Consolidated multi-organization coverage and execution guide: `reports/multi-user-execution-guide/index.html`
- Credential placeholders: `.secrets/aes-stage.ml.140462.credentials.example.json` and `.secrets/aes-stage.ml.140463.credentials.example.json`
- Readiness check: `scripts/check-multi-user-run-readiness.ps1`
- Runtime browser-isolation confirmation: `scripts/confirm-multi-user-browser-isolation.ps1`

Never store a plaintext password in a committed Markdown or JSON configuration file. The `.secrets/` directory is local and ignored by Git.

After a new clone, copy the matching organization example to `.secrets/aes-stage.ml.<OrgId>.credentials.json`, replace the placeholders locally, and run `scripts/check-multi-user-run-readiness.ps1 -OrgId <OrgId>` before execution. The checker reports only presence/absence and never prints credential values.

The configuration's `enabledControllers` array is authoritative. Organization `140462` enables its nine configured login combinations. Organization `140463` currently enables the four supplied Organization User, Campus User, Employee, and Substitute accounts. Add a combination controller only after its organization-specific username and password have been configured.

## Controller mapping

| Execution identity | Controller | Username key | Local password key |
|---|---|---|---|
| Organization User | `organization-user-execution.md` | `org_username` | `org_password` |
| Campus User | `campus-user-execution.md` | `campusUser` | `campus_password` |
| Employee | `employee-user-execution.md` | `employee` | `employee_password` |
| Substitute | `substitute-user-execution.md` | `substitute` | `substitute_password` |
| Campus User + Employee + Organization User | `multi-role-campus-employee-organization-execution.md` | `userRoleSwitcher` | `roleswitcher_org_password` |
| Organization User + Employee | `multi-role-organization-employee-execution.md` | `multiRoleOrgEmployee` | `multi_role_org_employee_password` |
| Employee + Employee + Substitute | `multi-role-employee-employee-substitute-execution.md` | `multiRoleEmployeeEmployeeSubstitute` | `multi_role_employee_employee_substitute_password` |
| Multi-org Employee + Substitute | `multi-org-employee-substitute-execution.md` | `multiOrgEmployeeSubstitute` | `multi_org_employee_substitute_password` |
| Multi-org Employee + Employee | `multi-org-employee-employee-execution.md` | `multiOrgEmployeeEmployee` | `multi_org_employee_employee_password` |
| Multi-org Organization User + Campus User | `multi-org-organization-campus-execution.md` | `multiOrgOrgCampus` | `multi_org_org_campus_password` |

## Routing rules

1. Read the selected controller completely before opening the browser.
2. Run only the workflows authorized by that controller.
3. Use `role-scenario-matrix.md` as the authoritative role coverage:
   - Organization User: scenarios 1–12, 14, and 16–19; only the exact standalone Organization 140462 `org_username` login also executes the two Scenario 13 Manage Access cases
   - Campus User: scenarios 3, 7, 14, 16, 17, 20, and 21
   - Employee: scenarios 14 and 16
   - Substitute: scenarios 14 and 16
4. For a combination account, execute each role/context block in the controller's order. Repeat shared scenario IDs in every applicable role/context; do not deduplicate them.
5. End every numbered logout scenario when the stable approved login page displays, then re-authenticate with the same combination account and select the next required role/context. Do not click browser Back or test direct protected routes in numbered logout scenarios.
6. Do not fall back to another identity when a username, password, role, organization, or permission is missing.
7. A controller's read-only restriction overrides optional creation or cleanup branches in a shared scenario.
8. Record role and organization labels only to the extent necessary to prove context switching; omit credentials and personal data.
9. After every successful login/context selection and at the Home-page top-left checkpoint, apply `app-switcher-validation.md`. Execute its switching loops only when an App Switcher is visible.
10. For each exact standalone Organization User, Campus User, Employee, or Substitute controller, execute `tests/navigation/standalone-home-menu-navigation.md` once and report it independently. Never inherit this supplemental workflow in a combination controller.
11. After Passport authentication, apply `stage-ml-application-launch.md`. Treat the `absence.stage-k12.ss.frontlineeducation.com` launcher as intermediate, rescan Chrome tabs after activating the Absence Management tile, and continue from the approved responsive tab whose URL contains `requiredUrlContains`. If the launch falls back to `idgatewayawsstage.flqa.net`, do not enter credentials there; re-navigate to the configured ML Passport URL, use `applicationHubUrl` for an already-authenticated session when needed, and retry the supported tile launch once.
12. At every workflow's final evidence checkpoint, apply `url-evidence-validation.md`, capture the complete Chrome window including the address bar, and report a configured URL mismatch as a separate warning unless it also causes a functional failure.
13. Before any controller finalizes a **FAIL**, apply the shared 120-second failure-observation policy in `instructions/project-instructions.md`. Poll the expected UI state for the full interval, capture evidence at or after timeout, and state the 120-second expiration in the failed workflow. For transient overlays or missing page/account shells, use the same 120-second readiness window with one safe refresh after 60 seconds before BLOCKED. Do not delay or reclassify genuine missing-data, permission, safety, or unsupported prerequisites.
14. After every navigation, application switch, role/context change, or refresh, apply the unexpected-popup recovery in `instructions/project-instructions.md`. Safely dismiss unrelated announcements, tours, coach marks, or modal overlays—including `New: Resource Center & Feedback Portal` in Time & Attendance—wait for the backdrop to disappear, and continue. Never dismiss a confirmation required by the selected scenario.
15. Do not execute retired Scenario 15, Security → Manage User Access. For every organization/login other than the exact standalone Organization 140462 Scenario 13 gate, omit Manage Access entirely rather than reporting it as NOT TESTED or BLOCKED.
16. Execute `tests/logout/organization-user-browser-back-after-logout.md` once only for the standalone Organization User controller in each selected organization. Across organizations 140462, 140463, and 140466, this produces exactly three Browser Back validations. Never inherit it in Campus, Employee, Substitute, or combination controllers.

## Run every controller

Use `instructions/multi-user-full-suite-execution.md` to close any Playwright MCP context retained by the current task, start a fresh isolated headed Chrome automation context and new test window, confirm it before credential entry, then run every controller enabled for one organization with one continuous full-browser-window video, address-bar-visible screenshots, URL warnings, and one self-contained report folder per role/login-combination controller. Never reuse an existing user tab or authenticated session from a prior run. The report folders are created under `reports/full-suite/<OrgId>/<runId>/roles/` and use the canonical migrated-user navigation dashboard format:

`For OrgId <OrgId>, execute instructions/multi-user-full-suite-execution.md in unattended safe mode.`
