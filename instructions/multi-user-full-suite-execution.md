# Multi-User Full-Suite Headed Execution

## Goal

Execute every `*-execution.md` controller under `instructions/Multi User Instructions/` as one ordered multi-user run. Produce one self-contained role/login-combination report folder for each controller, one consolidated dashboard, one continuous video, scenario-detail pages, screenshots, a video timeline, totals, and failure reproduction steps.

## Mandatory preparation

Before opening the browser, read completely:

1. `instructions/project-instructions.md`
2. `instructions/html-reporting-standard.md`
3. `instructions/Multi User Instructions/README.md`
4. `instructions/Multi User Instructions/role-scenario-matrix.md`
5. `instructions/Multi User Instructions/app-switcher-validation.md`
6. `config/aes-stage.ml.json`
7. Every discovered `instructions/Multi User Instructions/*-execution.md` controller

Resolve only the credential keys required by the selected controller. Never display or copy a resolved password. If one account is missing a username, password, role, organization, or permission, generate its **BLOCKED** role/login-combination report and continue with the next account.

At the first credential-entry point, request one grouped action-time confirmation covering every selected account and the configured Frontline Stage authentication destinations. After the user confirms, reuse that confirmation for the same accounts and destinations throughout the run; ask again only if the credential data, destination, or execution scope changes.

## Start and archive policy

Before browser execution, run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-multi-user-full-suite-run.ps1
```

Use the returned `runId`, `runDirectory`, and controller order for the entire execution.

The starter moves every previous top-level timestamped run and matching ZIP from `reports/full-suite/` into:

`reports/full-suite/old-reports/old-<previous-run-timestamp>/`

The new run then becomes the only current top-level timestamped report folder. Never mix current evidence with an archived run and never overwrite an archive.

## Required controller order

1. `organization-user-execution.md`
2. `campus-user-execution.md`
3. `employee-user-execution.md`
4. `substitute-user-execution.md`
5. `multi-role-campus-employee-organization-execution.md`
6. `multi-role-organization-employee-execution.md`
7. `multi-role-employee-employee-substitute-execution.md`
8. `multi-org-employee-substitute-execution.md`
9. `multi-org-employee-employee-execution.md`
10. `multi-org-organization-campus-execution.md`

The discovered and ordered controller sets must match exactly. Do not silently omit or add a controller.

To intentionally exclude a configured controller, pass its exact filename to the starter. For example, to run every configured controller except the standalone Campus User:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-multi-user-full-suite-run.ps1 -ExcludeController campus-user-execution.md
```

The manifest's `expectedRoleReports` value is derived from the selected controller count. With the current ten-controller catalog, excluding only standalone Campus User produces nine role/login-combination reports plus the consolidated dashboard.

## Browser and continuous video

- Use headed Chrome through Playwright MCP.
- Use one controlled browser session for the complete selected-controller run; re-authenticate with the next controller's account when required.
- Start one `1280x720` recording immediately before the first role/login-combination workflow and stop it only after the final selected controller reaches its final state.
- Save the final recording as `multi-user-full-suite-execution.webm` before finalization.
- Do not add blur, masking, overlays, dimming, action labels, annotations, or chapter cards.
- Do not record the desktop, terminal, configuration file, credentials file, or tool output.
- Password controls may appear only in their native masked state.
- Record exact continuous-video start and end offsets for every controller and every scenario/workflow. Authentication transitions may be omitted only when needed to prevent credential exposure; do not split the user-facing evidence into multiple videos.

## Execution rules

1. Execute each controller exactly as documented, including its identity, scenario selection, safety restrictions, and credential keys.
2. Do not reuse the previous controller's identity for the next account.
3. Scroll each target into view before interacting and before capturing evidence.
4. Capture at least one result screenshot for every workflow, plus screenshots proving failures or blocked states.
5. Continue to the next independent controller after PASS, FAIL, BLOCKED, or NOT TESTED.
6. Do not convert a failed or blocked result to PASS because a later account succeeds.
7. Keep read-only controllers read-only. Do not create test data when the selected controller prohibits it.
8. Restore any safe filters, searches, roles, and organization context before logout or controller completion.
9. After every successful login/context selection and again from the Home-page top-left area, apply the conditional App Switcher validation. When visible, report it as a supplemental workflow inside the current role folder; when absent at both checkpoints, record the observation without adding an outcome.

## Run data

Maintain `reports/full-suite/<runId>/run-data.json` with this structure:

```json
{
  "runId": "YYYYMMDD-HHMMSS",
  "executedAt": "local timestamp with timezone",
  "environment": "AES Stage ML",
  "mode": "multi-user unattended safe mode",
  "video": "videos/multi-user-full-suite-execution.webm",
  "recordedDurationSeconds": 0,
  "accounts": [
    {
      "execution": 1,
      "slug": "organization-user",
      "name": "Organization User",
      "controller": "instructions/Multi User Instructions/organization-user-execution.md",
      "status": "PASS",
      "startSeconds": 0,
      "endSeconds": 0,
      "summary": "Observed result summary",
      "expected": "Account-level expected result",
      "actual": "Account-level actual result",
      "screenshots": ["evidence.png"],
      "workflows": [
        {
          "slug": "workflow-name",
          "name": "Workflow name",
          "source": "tests/navigation/example.md",
          "status": "PASS",
          "startSeconds": 0,
          "endSeconds": 0,
          "screenshots": ["workflow-evidence.png"],
          "steps": [
            {
              "action": "Executed action",
              "expected": "Expected result",
              "actual": "Observed result",
              "status": "PASS"
            }
          ],
          "reproduce": []
        }
      ],
      "reproduce": [],
      "cleanup": "Read-only execution; no persistent data changed."
    }
  ]
}
```

Use only `PASS`, `FAIL`, `BLOCKED`, or `NOT TESTED`. A workflow `slug`, `source`, `screenshots`, and `reproduce` list are optional, but workflow-specific screenshots are strongly preferred. When they are omitted, the generator creates a stable slug and uses the role-level screenshot list. Every selected controller must receive a report even when authentication is blocked.

## Finalization and report generation

After stopping the recording and completing `run-data.json`, run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/finalize-multi-user-full-suite-run.ps1 -RunId <YYYYMMDD-HHMMSS>
node scripts/generate-multi-user-full-suite-report.mjs <YYYYMMDD-HHMMSS>
powershell -ExecutionPolicy Bypass -File scripts/package-multi-user-full-suite-report.ps1 -RunId <YYYYMMDD-HHMMSS>
```

The completed structure must be:

```text
reports/full-suite/<runId>/
├── index.html
├── run-data.json
├── timeline.json
├── report-format.json
├── roles/
│   └── <role-or-login-combination-slug>/
│       ├── index.html
│       ├── scenarios/
│       │   └── <scenario-slug>.html
│       └── screenshots/
│           └── <evidence>.png
└── videos/
    └── multi-user-full-suite-execution.webm
```

The consolidated dashboard must link to the exact number of role/login-combination reports declared by the run manifest and show total reports, PASS, FAIL, BLOCKED, NOT TESTED, recorded duration, and video count `1`. Each role folder is self-contained except for the single shared video. A combination login receives one folder; its report separates scenarios by active role/organization context. Each role report and scenario page must use the visual structure of the canonical migrated-user reference and include detailed steps, expected/actual results, screenshots, exact video ranges, controller structure, cleanup, and numbered failure reproduction steps.

## Delivery validation

Before handoff:

1. Confirm the role-report count exactly equals `run-manifest.json.expectedRoleReports`.
2. Confirm all dashboard, screenshot, controller, and video links resolve.
3. Fully decode the final video and confirm every account range fits within its duration.
4. Confirm the current run contains one user-facing video only.
5. Scan all text artifacts for passwords, tokens, cookies, authorization headers, and session identifiers.
6. Confirm summary totals equal all selected account statuses.
7. Create a portable ZIP beside the current run folder.

## Invocation

`Execute instructions/multi-user-full-suite-execution.md in unattended safe mode. Run all configured role/login-combination controllers in headed Chrome with one continuous video, archive the previous run, continue through independent failures, and generate the standard HTML evidence package.`
