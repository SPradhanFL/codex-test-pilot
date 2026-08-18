# Full Suite Headed Video Execution

## Scope

Execute the 15 Markdown scenarios currently stored under `tests/`. The files are scenario definitions, not generated Playwright source code. Follow every scenario and its referenced shared instructions directly through Playwright MCP.

## Start a run and archive older artifacts

Before opening the browser, run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-full-suite-run.ps1
```

Use the returned `runId` and `runDirectory` for every artifact created during the execution.

The script moves each previous top-level timestamped run into:

`reports/full-suite/old-runs/old-<previous-run-timestamp>/`

After the browser run finishes, move the single recording and all named screenshots into the current run, then generate the timeline, 15 detailed reports, and dashboard:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/finalize-full-suite-artifacts.ps1 -RunId <YYYYMMDD-HHMMSS>
node scripts/generate-full-suite-report.mjs <YYYYMMDD-HHMMSS>
```

The current run stays at `reports/full-suite/<YYYYMMDD-HHMMSS>/`; no older video, screenshot, or HTML report remains mixed with it.

It preserves the entire previous report, video, screenshot, timeline, and source-segment structure. The new run remains at:

`reports/full-suite/<new-run-timestamp>/`

Do not mix evidence from old and new runs. Do not overwrite an archived run.

## Execution modes and confirmations

Choose one mode before opening the browser:

### Unattended safe mode

- Runs without routine questions or action-time deletion prompts.
- Does not submit any create, update, remove, delete, approval, reconciliation, import, or other persistent data-changing action.
- Executes every safe navigation, visibility, interaction, validation, search, authentication, logout, session-security, and form-without-submit check.
- Marks persistent mutation steps **NOT TESTED — unattended safe mode**. A scenario whose required purpose is the persistent mutation cannot be reported as PASS.

### Full destructive mode

- Executes the complete documented staging create/delete lifecycle.
- Never deletes a realistic-looking or insufficiently verified record.
- Collect exact synthetic target names, assigned IDs, and identifiers before cleanup and group confirmations when the execution surface permits.
- A permanent browser deletion can require action-time confirmation even when the initial prompt pre-authorizes the suite. Do not bypass that safeguard or promise a zero-prompt destructive run.
- Do not ask routine ready, password, navigation, or reporting questions.

## Browser and single continuous video

- Run Chrome in headed mode. The project MCP configuration intentionally omits `--headless`.
- Use one isolated browser context and one controlled tab for the entire suite. Reset logical application state between scenarios and re-authenticate when a scenario logs out.
- Start one `1280x720` recording before scenario 1 and stop it only after scenario 15 reaches its final state.
- Save the finalized recording as `videos/full-suite-execution.webm`.
- Do not add video chapter cards. They blur and cover the application while the recording is running.
- Do not enable recording overlays, action callouts, dimming, masking, or blur effects. Keep the native application screen fully visible throughout execution.
- Use recorded start/end offsets and the HTML report timeline to identify scenario boundaries instead of placing overlays in the video.
- Record the monotonic elapsed-video start and end offsets for each scenario. Pauses outside the recording do not count as execution time.
- Do not start or stop per-scenario recordings during a normal full-suite run.
- Do not record the desktop, terminal, credential file, or tool output. Browser video may show only the masked password control during authentication.

## Credentials

1. Read URL and username from `config/aes-stage.json`.
2. Resolve the password from `AES_STAGE_PASSWORD` first.
3. If the environment variable is unavailable, read `password` from `.secrets/aes-stage.credentials.json`.
4. For the Substitute lifecycle scenario, generate a fresh 10-digit synthetic phone number and a separate 5-digit PIN in execution memory. Use a nonzero first digit as defined by that scenario, and do not persist either value.
5. Never print, return, annotate, copy, or write the resolved password, generated phone number, or Phone PIN into a report, screenshot annotation, video filename, or generated metadata.
6. Stop before browser execution when no valid password source exists.

## Safe execution order

Run sequentially in this order:

1. `tests/login/login.md`
2. `tests/navigation/absence-tab.md`
3. `tests/navigation/cross-application-navigation-matrix.md`
4. `tests/navigation/angular-daily-report-to-extract_import-to-import-data.md`
5. `tests/navigation/legacy-import-data-role-switcher.md`
6. `tests/navigation/security-manage_user_access_page.md`
7. `tests/navigation/manage-access.md`
8. `tests/navigation/react-home-page-to-role-switcher-dropdown.md`
9. `tests/navigation/angular-daily-report-page-to-role-switcher-dropdown.md`
10. `tests/employee/general-information/add-employee-validation.md`
11. `tests/employee/create-employee.md`
12. `tests/employee/delete-employee.md`
13. `tests/employee/employee-substitute.md`
14. `tests/navigation/angular-daily-report-to-substitute-general-information.md`
15. `tests/logout/logout-navigation-matrix.md`

Create Employee must precede Delete Employee. Logout runs last because it intentionally invalidates sessions. In full destructive mode, every create/delete scenario must verify its exact synthetic target and complete its documented cleanup. In unattended safe mode, persistent create/delete submissions are not performed and must be reported as NOT TESTED.

## Per-scenario artifacts

Create this structure for every run:

```text
reports/full-suite/<YYYYMMDD-HHMMSS>/
├── index.html
├── timeline.json
├── scenarios/
│   └── <scenario-slug>.html
├── videos/
│   └── full-suite-execution.webm
└── screenshots/
    └── <scenario-slug>/
```

Every scenario HTML file must include:

- Scenario name and source Markdown path
- Start time, finish time, and duration
- Overall PASS, FAIL, or BLOCKED
- Flow and detailed-check totals
- Every documented step with action, expected result, actual result, and status
- Screenshot evidence
- The scenario's video start offset, end offset, and formatted range
- An embedded HTML5 player for `full-suite-execution.webm` that seeks to the scenario start and stops at its end
- A separate failed-scenarios section with numbered reproduction steps
- Safety and cleanup results
- A `Complete scenario structure` section using an expanded/collapsible `<details>` element that reproduces the scenario headings and steps without execution secrets

## Consolidated dashboard

Generate `index.html` as a standalone, responsive, printable dashboard. Include summary cards for total scenarios, passed, failed, blocked, total recorded duration, and video count. The video count must be `1`. Include a searchable and status-filterable results table.

The execution name in every dashboard row must link to `scenarios/<scenario-slug>.html`. Add a **Video range** column using a readable format such as `0:00–5:21`, and link that range to `videos/full-suite-execution.webm#t=<start-seconds>,<end-seconds>`. The individual scenario report must provide the complete source structure, results, screenshots, and the same time-bounded video evidence. Use relative links so the full run directory can be shared as one folder.

Create `timeline.json` with one ordered object per scenario:

- execution number
- scenario name and source path
- status
- start seconds and end seconds
- formatted start, end, and range

Use recorded media duration rather than overall wall-clock duration when computing ranges.

## Result and failure rules

- Apply each scenario's own PASS, FAIL, BLOCKED, and NOT TESTED rules.
- Continue to the next independent scenario after a failure when doing so is safe.
- Block dependent scenarios when required data or cleanup is unavailable.
- Do not claim a step or scenario passed without observable browser evidence.
- Do not include credentials, tokens, cookies, sensitive redirect fragments, generated phone numbers, Phone PINs, or browser-session information in any artifact.
