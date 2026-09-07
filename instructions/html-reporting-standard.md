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

Keep only the current run in its timestamped folder. Move older runs and intermediate recording segments into the suite's `old-runs/` folder. The current report must expose only one consolidated video.

## Dashboard requirements

The main `index.html` must use the same responsive dashboard style as the canonical reference and contain:

- A blue gradient report header with the suite name, run ID, environment, organization context, and recorded duration.
- Summary cards for total role reports, total scenario/context validations, passed, failed, blocked, and not-tested scenario/context validations.
- A separate warning total. Warnings are supplemental observations and must not be counted as PASS, FAIL, BLOCKED, or NOT TESTED.
- For multi-user dashboards, calculate outcome totals from every workflow under every login combination. Do not use aggregate login-combination statuses as the Passed/Failed/Blocked totals.
- In each multi-user execution row and outcome card, show the login combination's numeric result breakdown (for example, `18 Passed`, `1 Failed`, `1 Blocked`) instead of only one aggregate PASS/FAIL/BLOCKED label.
- One embedded HTML5 video player for the complete execution.
- An execution timeline table with scenario number, linked scenario name, status, video range, and a **Play range** control.
- Scenario outcome cards with clear PASS, FAIL, and BLOCKED color treatment.
- A separate **Failures and blocked flows** section.
- Numbered reproduction steps for each failure or blocked scenario.
- Relative links so the complete run folder or ZIP remains portable.

## Scenario-page requirements

Each scenario name on the dashboard must open a separate HTML page containing:

- Scenario name, number, source Markdown file, status, and video range.
- Expected result and observed actual result.
- Every executed step in order.
- Failure or blocked reason with numbered reproduction steps when applicable.
- For every FAIL, a visible `Failure observation: 120 seconds` statement and an executed timeout step showing that the expected UI state was polled for the full interval before the failure was finalized.
- One or more full, readable screenshot evidence images.
- URL warnings, when present, with the affected validation step, expected/actual result, and linked screenshot.
- The shared execution video with a button that seeks to the scenario start and stops at the scenario end.
- A link back to the main dashboard.

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
6. A credential and token scan of all text artifacts returns no findings.
7. A shareable ZIP contains the dashboard, all scenario pages, screenshots, and the single final video.
8. Multi-user `run-data.json` and `timeline.json` declare `measured-video-events-v1`, and every account/workflow range comes from `video-events.json` rather than an equal-time estimate.
9. The video and every multi-user screenshot include the complete Chrome window and address bar, while excluding surrounding desktop content.
10. Warning totals match all workflow `warnings` arrays, and each warning screenshot resolves.
11. Every failed workflow records `failureObservationSeconds: 120`, includes its 120-second observation in the executed-step evidence, and has a final screenshot captured at or after timeout.
