# Standard HTML Execution Report

## Canonical reference

All future execution reports in this repository must follow the visual structure and behavior of the 2026-08-19 migrated-user navigation report:

`reports/migrated-user-navigation-suite/20260819-175231/index.html`

The portable implementation of that reference for role-based runs is `scripts/generate-multi-user-full-suite-report.mjs`. It fixes the blue-gradient header, summary cards, continuous-video player, timeline, outcome cards, failure section, scenario-detail layout, responsive styling, and relative-link behavior so reports generated on another machine remain visually identical. Do not create a Markdown execution report unless the user explicitly requests one.

For multi-user runs, create `roles/<role-or-login-combination-slug>/` under the timestamped run. Put that role report, its scenario pages, and its screenshots inside the folder. A multi-role or multi-organization login is one login-combination folder whose report separates the active role/organization contexts.

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
- Summary cards for total, passed, failed, and blocked scenarios.
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
- One or more full, readable screenshot evidence images.
- The shared execution video with a button that seeks to the scenario start and stops at the scenario end.
- A link back to the main dashboard.

## Evidence rules

- Capture a screenshot for every scenario at the state that proves its result.
- Scroll the target element into view before interacting with it and before capturing evidence.
- Keep application screens fully visible. Do not add blur, masking, dimming, annotations, chapter cards, or overlays.
- Use one continuous final video and record exact start/end offsets for each scenario.
- Authentication may be excluded from the evidence recording when necessary to prevent credential exposure.
- Never include passwords, tokens, cookies, authorization headers, session identifiers, or sensitive redirect fragments in HTML, JSON, filenames, screenshots, or video.
- Record failures honestly even if the flow succeeds later; document the recovery separately.
- Use PASS only when every required expectation was observed, FAIL when an expectation was not met, and BLOCKED when execution could not safely proceed.

## Delivery checks

Before sharing a report, verify:

1. Every scenario link opens its detailed page.
2. Every screenshot and video reference resolves using relative paths.
3. The dashboard counts match the detailed scenario statuses.
4. Every video range is within the final video duration.
5. The final video decodes successfully and the current run contains only one user-facing video.
6. A credential and token scan of all text artifacts returns no findings.
7. A shareable ZIP contains the dashboard, all scenario pages, screenshots, and the single final video.
