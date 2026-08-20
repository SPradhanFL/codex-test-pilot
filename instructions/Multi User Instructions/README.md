# Multi-User Execution Controllers

Use this directory as the authoritative scenario and credential-routing source for ML multi-user validation.

## Shared configuration

- URL and usernames: `config/aes-stage.ml.json`
- Passwords: environment variables first, then `.secrets/aes-stage.ml.credentials.json`
- Report format: `instructions/html-reporting-standard.md`
- Role/scenario routing: `instructions/Multi User Instructions/role-scenario-matrix.md`
- Conditional cross-product switching: `instructions/Multi User Instructions/app-switcher-validation.md`
- Copy/paste team prompts: `instructions/Multi User Instructions/team-execution-prompts.md`
- Credential placeholder: `.secrets/aes-stage.ml.credentials.example.json`
- Readiness check: `scripts/check-multi-user-run-readiness.ps1`

Never store a plaintext password in a committed Markdown or JSON configuration file. The `.secrets/` directory is local and ignored by Git.

After a new clone, copy `.secrets/aes-stage.ml.credentials.example.json` to `.secrets/aes-stage.ml.credentials.json`, replace the placeholders locally, and run the readiness check before execution. The checker reports only presence/absence and never prints credential values.

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
   - Organization User: scenarios 1–19
   - Campus User: scenarios 3, 7, 14, 16, and 17
   - Employee: scenarios 14 and 16
   - Substitute: scenarios 14 and 16
4. For a combination account, execute each role/context block in the controller's order. Repeat shared scenario IDs in every applicable role/context; do not deduplicate them.
5. Complete each logout's session-termination checks, then re-authenticate with the same combination account and select the next required role/context.
6. Do not fall back to another identity when a username, password, role, organization, or permission is missing.
7. A controller's read-only restriction overrides optional creation or cleanup branches in a shared scenario.
8. Record role and organization labels only to the extent necessary to prove context switching; omit credentials and personal data.
9. After every successful login/context selection and at the Home-page top-left checkpoint, apply `app-switcher-validation.md`. Execute its switching loops only when an App Switcher is visible.

## Run every controller

Use `instructions/multi-user-full-suite-execution.md` to run all configured controllers in headed Chrome with one continuous video and one self-contained report folder per role/login-combination controller. The report folders are created under `reports/full-suite/<runId>/roles/` and use the canonical migrated-user navigation dashboard format:

`Execute instructions/multi-user-full-suite-execution.md in unattended safe mode.`
