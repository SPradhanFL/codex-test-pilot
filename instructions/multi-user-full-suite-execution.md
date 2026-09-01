# Multi-User Full-Suite Headed Execution

## Goal

Execute every controller enabled for the requested Stage ML organization as one ordered multi-user run. The caller must supply `OrgId`; configuration, credentials, archiving, and reports remain isolated under that organization. Produce one self-contained role/login-combination report folder for each selected controller, one consolidated dashboard, one continuous video, scenario-detail pages, screenshots, a video timeline, totals, and failure reproduction steps.

## Mandatory preparation

Before opening the browser, read completely:

1. `instructions/project-instructions.md`
2. `instructions/html-reporting-standard.md`
3. `instructions/Multi User Instructions/README.md`
4. `instructions/Multi User Instructions/role-scenario-matrix.md`
5. `instructions/Multi User Instructions/time-and-attendance-multi-context-scope.md`
6. `instructions/Multi User Instructions/app-switcher-validation.md`
7. `instructions/Multi User Instructions/stage-ml-application-launch.md`
8. `instructions/Multi User Instructions/url-evidence-validation.md`
9. `config/aes-stage.ml.<OrgId>.json`
10. Every discovered `instructions/Multi User Instructions/*-execution.md` controller

Read passwords only from `.secrets/aes-stage.ml.<OrgId>.credentials.json`, resolving only the keys required by the enabled controllers. Never display or copy a resolved password. If one selected account is missing a role, organization, or permission after readiness passes, generate its **BLOCKED** role/login-combination report and continue with the next account.

At the first credential-entry point, request one grouped action-time confirmation covering every selected account and the configured Frontline Stage authentication destinations. After the user confirms, reuse that confirmation for the same accounts and destinations throughout the run; ask again only if the credential data, destination, or execution scope changes.

## Start and archive policy

Before browser execution, run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-multi-user-run-readiness.ps1 -OrgId <OrgId>
powershell -ExecutionPolicy Bypass -File scripts/start-multi-user-full-suite-run.ps1 -OrgId <OrgId>
```

Use the returned `runId`, `runDirectory`, and controller order for the entire execution.

The starter moves every previous timestamped run and matching ZIP for only the selected organization from `reports/full-suite/<OrgId>/` into:

`reports/full-suite/<OrgId>/old-reports/old-<previous-run-timestamp>/`

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

The discovered controller catalog must match exactly. Execute only the controller filenames listed in the selected organization configuration's `enabledControllers`, preserving the catalog order. Do not run a controller that is not enabled for the requested organization.

To intentionally exclude a configured controller, pass its exact filename to the starter. For example, to run every configured controller except the standalone Campus User:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-multi-user-full-suite-run.ps1 -OrgId <OrgId> -ExcludeController campus-user-execution.md
```

The manifest's `expectedRoleReports` value is derived from the organization configuration and any explicit controller selection/exclusion. Organization `140462` currently enables nine controllers; organization `140463` currently enables the Organization User, Campus User, Employee, and Substitute controllers.

## Browser and continuous video

- Run `scripts/check-disposable-playwright-profile.ps1`, close any prior MCP browser session once, and let the first navigation create a clean isolated Chrome profile for the complete selected-controller run.
- Use headed Chrome through Playwright MCP.
- Start every suite invocation in a fresh isolated headed Chrome automation context and a newly opened dedicated test window. Do not claim or reuse a user-owned tab, an earlier automation tab/window, browser history, cookies, or authenticated session state from a prior run.
- Open the configured organization URL as the first navigation in that fresh context. If it is not possible to establish a genuinely fresh controllable context, stop before credential entry and report the browser-isolation blocker; do not sign out, clear data from, or otherwise modify a user-owned browser session.
- Use the same fresh controlled browser context for the complete selected-controller run; re-authenticate with the next controller's account when required.
- Use one test tab in the dedicated Chrome window except when the application itself opens a required destination tab. Hide bookmarks/sidebar UI, suppress notifications, keep Chrome foreground and unobstructed, and do not place another window over it.
- After Chrome reaches a safe Stage login page, start `scripts/start-browser-window-video.ps1`. It fixes Chrome's outer-window size at `1280x720` and records the exact Chrome rectangle, including tabs and the address bar. Do not use Playwright's native page-only video.
- Immediately record `RecordingStart` after the full-browser recorder starts. Record `RecordingEnd` only after the final selected controller's stable browser state, then run `scripts/stop-browser-window-video.ps1`.
- Save the final recording as `videos/multi-user-full-suite-execution.webm` before report finalization.
- Do not add blur, masking, overlays, dimming, action labels, annotations, or chapter cards.
- After stopping and finalizing the continuous recording and collecting the final browser evidence, close the MCP browser to discard the complete run's in-memory profile.
- Do not record the desktop, terminal, configuration file, credentials file, or tool output.
- Capture only Chrome's exact outer-window rectangle. Do not expose the surrounding desktop, terminal, configuration file, credentials file, notifications, or tool output.
- Password controls may appear only in their native masked state.
- Record exact continuous-video start and end offsets for every controller and every scenario/workflow. Authentication transitions may be omitted only when needed to prevent credential exposure; do not split the user-facing evidence into multiple videos.
- Capture a sanitized URL-navigation trail for every scenario/workflow. Follow `instructions/time-and-attendance-details.md` for Time & Attendance flows and the equivalent scheme/host/sanitized-path/query-key-only format for other flows. Never persist query values, URL fragments, authorization/session values, personal identifiers, or tokenized path segments.
- Keep all browser navigation, masked credential entry, authentication transitions, role/context selection, waits, retries, and scenario actions inside the one recording. Do not split the user-facing evidence into multiple videos.
- Do not estimate, evenly divide, or reconstruct scenario ranges after execution. Capture measured events at each controller and workflow boundary.

## Measured video event journal

The event journal is mandatory. It supplies the real scenario boundaries used by every **Play range** control.

1. Open the newly created dedicated headed Chrome window in its fresh isolated automation context on the configured safe Stage login page. Bring it to the foreground, then start full-browser recording:

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/start-browser-window-video.ps1 -OrgId <OrgId> -RunId <runId>
   ```

   Immediately after the recorder starts and before the first test action, run:

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/write-multi-user-video-event.ps1 -OrgId <OrgId> -RunId <runId> -Event RecordingStart
   ```

2. At the exact start and end of every controller/login combination, run `AccountStart` and `AccountEnd` with the account slug from `run-manifest.json`.
3. Give every workflow a stable slug in `run-data.json`. Immediately before its first browser action record `WorkflowStart`; immediately after its final stable result/evidence state record `WorkflowEnd`.

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/write-multi-user-video-event.ps1 -OrgId <OrgId> -RunId <runId> -Event AccountStart -AccountSlug <account-slug>
   powershell -ExecutionPolicy Bypass -File scripts/write-multi-user-video-event.ps1 -OrgId <OrgId> -RunId <runId> -Event WorkflowStart -AccountSlug <account-slug> -WorkflowSlug <workflow-slug>
   powershell -ExecutionPolicy Bypass -File scripts/write-multi-user-video-event.ps1 -OrgId <OrgId> -RunId <runId> -Event WorkflowEnd -AccountSlug <account-slug> -WorkflowSlug <workflow-slug>
   powershell -ExecutionPolicy Bypass -File scripts/write-multi-user-video-event.ps1 -OrgId <OrgId> -RunId <runId> -Event AccountEnd -AccountSlug <account-slug>
   ```

4. After the final browser result is stable, run:

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/write-multi-user-video-event.ps1 -OrgId <OrgId> -RunId <runId> -Event RecordingEnd
   ```

   Then stop and finalize the full-browser recording:

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/stop-browser-window-video.ps1 -OrgId <OrgId> -RunId <runId>
   ```

5. Populate `recordedDurationSeconds` from the finalized WebM. Run `scripts/apply-multi-user-video-timeline.mjs` to scale measured elapsed events onto the actual video duration. The script writes the final `startSeconds` and `endSeconds`; never enter them manually.
6. If an event is missing, duplicated, overlapping, or out of order, stop report generation and correct or rerun the affected capture. Never substitute estimated ranges.

## Execution rules

1. Execute each controller exactly as documented, including its identity, scenario selection, safety restrictions, and credential keys.
2. After every authentication, follow `stage-ml-application-launch.md` before executing scenarios. Activate the supported My Frontline tile with a normal click, treat the launcher host as intermediate, refresh the Chrome open-tab inventory, and attach to the approved responsive application tab whose URL contains `requiredUrlContains`. Do not classify an intermediate launcher error as a blocker until the documented alternate-tab check and one supported retry are exhausted.
3. Do not reuse the previous controller's identity for the next account.
4. Scroll each target into view before interacting and before capturing evidence.
5. At every final evidence checkpoint, follow `url-evidence-validation.md`. Capture at least one complete-browser-window screenshot for every workflow, plus screenshots proving failures, blocked states, or URL warnings. Use:

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/capture-browser-window-screenshot.ps1 -OrgId <OrgId> -RunId <runId> -AccountSlug <account-slug> -EvidenceName <safe-evidence-name.png>
   ```
6. Continue to the next independent controller after PASS, FAIL, BLOCKED, or NOT TESTED.
7. Do not convert a failed or blocked result to PASS because a later account succeeds.
8. Keep read-only controllers read-only except for Scenario 14's explicitly authorized temporary absence fallback. When no existing absence is available, follow `tests/navigation/absence-tab.md` to create one uniquely identifiable Stage test absence, validate it, delete/cancel that exact record, and verify it is absent before continuing. No other test-data creation is authorized.
9. Restore any safe filters, searches, roles, and organization context before logout or controller completion.
10. After every successful login/context selection and again from the Home-page top-left area, apply the conditional App Switcher validation. When visible, report it as a supplemental workflow inside the current role folder; when absent at both checkpoints, record the observation without adding an outcome.
11. Validate the sanitized stable URL at every workflow's final checkpoint. A missing configured substring is a separate `WARNING` and does not change a working flow's status. If the unexpected destination also breaks the documented workflow, classify it as FAIL; if execution cannot reach a stable inspectable state, classify it as BLOCKED without inventing a warning.
12. Apply the mandatory **60-second failure observation** from `instructions/project-instructions.md` to every potential FAIL in every controller and role/context. Do not finalize FAIL until the expected page, element, navigation, or state has been observed or polled for the full 60 seconds. Capture the final full-browser screenshot at or after timeout and add a report step that explicitly records the 60-second elapsed observation. Do not use this rule to delay or reclassify a genuine BLOCKED or NOT TESTED prerequisite.

## Run data

Maintain `reports/full-suite/<OrgId>/<runId>/run-data.json` with this structure:

```json
{
  "organizationId": "<OrgId>",
  "runId": "YYYYMMDD-HHMMSS",
  "executedAt": "local timestamp with timezone",
  "environment": "AES Stage ML",
  "mode": "multi-user unattended safe mode",
  "video": "videos/multi-user-full-suite-execution.webm",
  "recordedDurationSeconds": 0,
  "timelineSource": "measured-video-events-v1",
  "sourceElapsedMilliseconds": 0,
  "accounts": [
    {
      "execution": 1,
      "slug": "organization-user",
      "name": "Organization User",
      "controller": "instructions/Multi User Instructions/organization-user-execution.md",
      "status": "PASS",
      "timelineMeasured": true,
      "sourceStartElapsedMilliseconds": 0,
      "sourceEndElapsedMilliseconds": 0,
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
          "timelineMeasured": true,
          "sourceStartElapsedMilliseconds": 0,
          "sourceEndElapsedMilliseconds": 0,
          "startSeconds": 0,
          "endSeconds": 0,
          "screenshots": ["workflow-evidence.png"],
          "warnings": [
            {
              "code": "URL_SUBSTRING_MISSING",
              "severity": "WARNING",
              "step": "Validate the stable browser URL at the final evidence checkpoint.",
              "expected": "The URL contains the configured requiredUrlContains value.",
              "actual": "The sanitized stable URL did not contain the required substring.",
              "screenshot": "workflow-evidence.png"
            }
          ],
          "steps": [
            {
              "action": "Executed action",
              "expected": "Expected result",
              "actual": "Observed result",
              "status": "PASS"
            }
          ],
          "navigation": [
            {
              "evidence": "Observed",
              "action": "Selected the application",
              "origin": "https://stage-host.example",
              "path": "/sanitized/path",
              "queryKeys": ["state"],
              "result": "Destination loaded; the state value was redacted."
            }
          ],
          "http404s": [
            {
              "evidence": "Observed",
              "action": "Loaded the required destination",
              "status": 404,
              "origin": "https://stage-host.example",
              "path": "/sanitized/path",
              "queryKeys": [],
              "impact": "Required data did not load; workflow failed."
            }
          ],
          "failureObservationSeconds": 60,
          "reproduce": []
        }
      ],
      "reproduce": [],
      "cleanup": "Read-only execution; no persistent data changed."
    }
  ]
}
```

Use only `PASS`, `FAIL`, `BLOCKED`, or `NOT TESTED` for workflow status. `WARNING` is supplemental and belongs only in a workflow's `warnings` array; it is not a fifth status. Account and workflow slugs are mandatory before recording their events. A workflow `source`, `reproduce`, and `warnings` list are optional. Give every workflow its own `screenshots` list, using an empty list when no screenshot exists; every warning screenshot must also appear in that list. Scenario pages never inherit unrelated role-level screenshots.

`navigation` is required for every workflow that reaches browser navigation; use an empty list only when execution is blocked before a browser destination is reached. Each navigation object must keep origin and path separate and contain query-key names only. Every Time & Attendance workflow must also include `http404s`: use one sanitized object per observed HTTP 404, or `[]` when none was observed. Each 404 object must contain status `404`, an approved Stage origin, a sanitized path, query-key names only, evidence classification, triggering action/source, and impact. Do not place the username in `run-data.json`; the report generator resolves it from the selected controller and `config/aes-stage.ml.<OrgId>.json`, with its supported environment-variable override taking precedence. The timeline application script supplies the measured timeline fields shown above. Every selected controller must receive a report even when authentication is blocked.

Set `failureObservationSeconds` to `60` for every failed workflow and include the corresponding timeout step in `steps`. Omit that field for PASS, BLOCKED, and NOT TESTED workflows.

## Finalization and report generation

After stopping the recording and completing `run-data.json`, run:

```powershell
node scripts/apply-multi-user-video-timeline.mjs <OrgId> <YYYYMMDD-HHMMSS>
powershell -ExecutionPolicy Bypass -File scripts/finalize-multi-user-full-suite-run.ps1 -OrgId <OrgId> -RunId <YYYYMMDD-HHMMSS>
node scripts/generate-multi-user-full-suite-report.mjs <OrgId> <YYYYMMDD-HHMMSS>
powershell -ExecutionPolicy Bypass -File scripts/package-multi-user-full-suite-report.ps1 -OrgId <OrgId> -RunId <YYYYMMDD-HHMMSS>
```

The generated master dashboard must report totals from all workflow/scenario results, not from the aggregate status of each controller. Its summary cards must show total scenario/context validations and the numeric Passed, Failed, Blocked, Not Tested, and supplemental Warning counts. Every login-combination row and outcome card must show its own numeric result breakdown rather than only one aggregate status label. `scripts/generate-multi-user-full-suite-report.mjs` applies this format automatically for every future run.

The completed structure must be:

```text
reports/full-suite/<OrgId>/<runId>/
├── index.html
├── run-data.json
├── video-events.json
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

The consolidated dashboard must link to the exact number of role/login-combination reports declared by the run manifest and show total reports, PASS, FAIL, BLOCKED, NOT TESTED, recorded duration, and video count `1`. Each role folder is self-contained except for the single shared video. A combination login receives one folder; its report separates scenarios by active role/organization context. Each role report and scenario page must use the visual structure of the canonical migrated-user reference and include detailed steps, expected/actual results, screenshots, exact video ranges, sanitized URL-navigation sequences, controller structure, cleanup, and numbered failure reproduction steps. For Time & Attendance, the consolidated dashboard, role dashboard, and each TA scenario page must show the exact configured `Test username`; each TA scenario page must also show the sanitized HTTP 404 table or the explicit no-404 state.
Create the portable package beside the run folder as `reports/full-suite/<OrgId>/multi-user-full-suite-<OrgId>-<runId>.zip`.

The consolidated dashboard must link to the exact number of role/login-combination reports declared by the run manifest and show total reports, PASS, FAIL, BLOCKED, NOT TESTED, WARNING, recorded duration, and video count `1`. Each role folder is self-contained except for the single shared video. A combination login receives one folder; its report separates scenarios by active role/organization context. Each role report and scenario page must use the visual structure of the canonical migrated-user reference and include detailed steps, expected/actual results, full-browser screenshots, URL warnings, exact video ranges, controller structure, cleanup, and numbered failure reproduction steps.

## Delivery validation

Before handoff:

1. Confirm the role-report count exactly equals `run-manifest.json.expectedRoleReports`.
2. Confirm all dashboard, screenshot, controller, and video links resolve.
3. Fully decode the final video and confirm every account and workflow range fits within its duration.
4. Confirm the current run contains one user-facing video only.
5. Scan all text artifacts for passwords, tokens, cookies, authorization headers, and session identifiers.
6. Confirm summary totals equal all selected workflow/scenario statuses and the dashboard identifies the requested organization.
7. Create a portable ZIP beside the current run folder.
8. Confirm `run-data.json` and `timeline.json` both declare `measured-video-events-v1`, every account/workflow has `timelineMeasured: true`, and no scenario ranges were evenly divided or estimated.
9. Confirm the continuous video and every screenshot show the complete Chrome window, including the address bar, without surrounding desktop content.
10. Confirm every URL warning includes its step, expected/actual result, and linked screenshot, and that warning totals do not alter status totals.

## Invocation

`For OrgId <OrgId>, execute instructions/multi-user-full-suite-execution.md in unattended safe mode. Start a fresh isolated headed Chrome automation context and new test window, run every controller enabled by config/aes-stage.ml.<OrgId>.json with one continuous video, archive only that organization's previous run, continue through independent failures, and generate the standard HTML evidence package under reports/full-suite/<OrgId>/<timestamp>.`
