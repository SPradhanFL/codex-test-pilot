# Standard HTML Execution Report

## Canonical reference

All future execution reports in this repository must follow the visual structure and behavior of the 2026-08-19 migrated-user navigation report:

`reports/migrated-user-navigation-suite/20260819-175231/index.html`

The portable implementation of that reference for role-based runs is `scripts/generate-multi-user-full-suite-report.mjs`. It fixes the blue-gradient header, summary cards, continuous-video player, timeline, outcome cards, failure section, scenario-detail layout, responsive styling, and relative-link behavior so reports generated on another machine remain visually identical. Do not create a Markdown execution report unless the user explicitly requests one.

For Stage ML multi-user runs, require an explicit organization ID and create the timestamped run under `reports/full-suite/<OrgId>/<YYYYMMDD-HHMMSS>/`. Put each login-combination report, its scenario pages, and its screenshots inside `roles/<role-or-login-combination-slug>/`. A multi-role or multi-organization login is one login-combination folder whose report separates the active role/organization contexts. Never mix artifacts from different organization IDs.

## Required run structure

```text
reports/<suite-name>/<YYYYMMDD-HHMMSS>/
├── index.html
├── scenarios/
│   └── <scenario-slug>.html
├── screenshots/
│   └── <evidence>.png
└── videos/
    └── <suite-name>.webm
```

Keep only the current run in its timestamped folder. Move older runs and intermediate recording segments into the suite's `old-runs/` folder. The current report must expose only one consolidated user-facing video. The `.webm` filename in the example is preferred for native continuous recording; a verified `.mp4` is allowed when the applicable execution instructions permit frame-based rendering.

## Dashboard requirements

The main `index.html` must use the same responsive dashboard style as the canonical reference and contain:

- A blue gradient report header with the suite name, run ID, environment, organization context, and recorded duration.
- Summary cards for total role reports, total scenario/context validations, passed, failed, blocked, and not-tested scenario/context validations.
- A separate warning total. Warnings are supplemental observations and must not be counted as PASS, FAIL, BLOCKED, or NOT TESTED.
- A separate known-failed total. Known failures remain included in the failed total and display as `KNOWN FAILED — <Jira ticket>` with a link and match evidence.
- For multi-user dashboards, calculate outcome totals from every workflow under every login combination. Do not use aggregate login-combination statuses as the Passed/Failed/Blocked totals.
- In each multi-user execution row and outcome card, show the login combination's numeric result breakdown (for example, `18 Passed`, `1 Failed`, `1 Blocked`) instead of only one aggregate PASS/FAIL/BLOCKED label.
- One embedded HTML5 video player for the complete execution.
- An execution timeline table with scenario number, linked scenario name, status, video range, and a **Play range** control.
- Scenario outcome cards with clear PASS, FAIL, and BLOCKED color treatment.
- A separate **Failures and blocked flows** section.
- Numbered reproduction steps for each failure or blocked scenario.
- Relative links so the complete run folder or ZIP remains portable.
- Any generated Markdown/Slack handoff summary must use the same `KNOWN FAILED — <Jira ticket>` label and preserve the canonical FAIL count; it must not flatten known failures back to unlabeled failures.

## Scenario-page requirements

Each scenario name on the dashboard must open a separate HTML page containing:

- Scenario name, number, source Markdown file, status, and video range.
- Expected result and observed actual result.
- Every executed step in order.
- Failure or blocked reason with numbered reproduction steps when applicable.
- For every FAIL, a visible `Failure observation: 120 seconds` statement and an executed timeout step showing that the expected UI state was polled for the full interval before the failure was finalized.
- For a catalog-matched failure, a visible `KNOWN FAILED — <Jira ticket>` badge, Jira link, catalog title, and observation-specific match evidence.
- One or more full, readable screenshot evidence images.
- URL warnings, when present, with the affected validation step, expected/actual result, and linked screenshot.
- The shared execution video with a button that seeks to the scenario start and stops at the scenario end.
- A link back to the main dashboard.

For every Time & Attendance scenario, also include:

- the exact configured non-production login username in a clearly labeled `Test username` field on both the dashboard and scenario page;
- a `Sanitized redirect sequence` table containing sequence, evidence classification, action/source, approved origin and sanitized path, query-key names only, and result;
- an `HTTP 404 observations` table containing evidence classification, action/product phase, HTTP status, approved origin and sanitized path, query-key names only, and functional impact; show an explicit no-404 state when none were observed;
- a clear assessment of whether any IDM authorization hop was silent and expected or caused re-authentication;
- the initial application/role context, every cross-product destination, and the final application/role context;
- an explicit prohibited-host result for `qaestar.flqa.net`; and
- measured performance or console observations that did not change the functional result. Every screen or required-control load over 30 seconds must show its actual elapsed seconds in a `SLOW_UI_LOAD` warning.
- a recovered HCMAT-79933 Sidekick delay as `PASS` when all assertions succeed, with the exact load time and linked Jira ticket in the warning description.

## Evidence rules

- For Stage ML multi-user runs, capture Chrome's complete outer window for every scenario so the tab strip, address bar, and application result are visible together. Use `scripts/capture-browser-window-screenshot.ps1`; do not use a page-only screenshot for report evidence.
- Validate the sanitized stable URL at every workflow checkpoint using `instructions/Multi User Instructions/url-evidence-validation.md`.
- Scroll the target element into view before interacting with it and before capturing evidence.
- Keep application screens fully visible. Do not add blur, masking, dimming, annotations, chapter cards, or overlays.
- Use one continuous final video and capture measured start/end events for each scenario while it executes. Never evenly divide account time or estimate scenario ranges afterward.
- Keep masked authentication and all browser transitions inside the continuous multi-user recording. Limit capture to Chrome's exact outer-window rectangle; never expose the surrounding desktop, terminal, configuration, secrets file, notifications, other applications, or unmasked credentials.
- Scenario pages may use only screenshots explicitly assigned to that scenario. Do not fall back to every screenshot from the account or role.
- Never include passwords, tokens, cookies, authorization headers, session identifiers, or sensitive redirect fragments in HTML, JSON, filenames, screenshots, or video.
- Record failures honestly even if the flow succeeds later; document the recovery separately.
- Use PASS only when every required functional expectation was observed, FAIL when an expectation was not met, and BLOCKED when execution could not safely proceed. Record a missing configured URL substring as a separate WARNING when the functional flow still works; do not downgrade that PASS.

## Delivery checks

Before sharing a report, verify:

1. Every scenario link opens its detailed page.
2. Every screenshot and video reference resolves using relative paths.
3. The dashboard counts match the detailed workflow/scenario statuses across every role and login combination; login-combination summary statuses must not be counted as scenario outcomes.
4. Every video range is within the final video duration.
5. The final video decodes successfully and the current run contains only one user-facing video.
6. A credential and token scan of all text artifacts returns no password, token, cookie, session secret, or unapproved identity finding. The exact configured Stage test username is required and must be allowlisted only in HTML `Test username` fields.
7. A shareable ZIP contains the dashboard, all scenario pages, screenshots, and the single final video.
8. No HTML, JSON, filename, screenshot, or video contains raw `state`, `nonce`, authorization code, token, sign-in handle, session identifier, query value, tokenized URL path segment, or password. The configured Stage test username may appear only in the required HTML `Test username` fields; no other username is permitted.
9. Multi-user `run-data.json` and `timeline.json` declare `measured-video-events-v1`, and every account/workflow range comes from `video-events.json` rather than an equal-time estimate.
10. The video and every multi-user screenshot include the complete Chrome window and address bar, while excluding surrounding desktop content.
11. Warning totals match all workflow `warnings` arrays, and each warning screenshot resolves.
12. Every failed workflow records `failureObservationSeconds: 120`, includes its 120-second observation in the executed-step evidence, and has a final screenshot captured at or after timeout.
13. Every `SLOW_UI_LOAD` warning records `thresholdSeconds: 30`, an actual measured `elapsedSeconds` value greater than 30, and linked full-browser evidence.
14. Every `knownFailure` references a ticket in `config/known-failures.json`, keeps canonical status `FAIL`, and includes concise evidence proving the exact signature match.
15. Every recovered HCMAT-79933 Sidekick warning links that Jira ticket in its description and does not alter a successful functional result.
