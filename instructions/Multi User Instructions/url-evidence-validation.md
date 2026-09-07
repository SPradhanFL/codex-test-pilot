# URL Evidence Validation

## Goal

At every workflow's final evidence checkpoint, validate the stable browser URL against the selected organization's `requiredUrlContains` value. Capture evidence of the complete Chrome window so the tabs and address bar are visible together with the application result.

## Required value

Read `requiredUrlContains` only from `config/aes-stage.ml.<OrgId>.json` and compare it case-insensitively. The environment policies are:

- `stageML`: `stage-k12.ss`
- `stageIDM`: `flqa.net`

These shared markers cover the approved role-specific application hosts for their respective authentication environments. Do not substitute a marker from another organization or environment and do not require one product-specific hostname.

Do not hard-code a different environment or infer a host from a previous account.

## Evidence checkpoint

For every executed workflow:

1. Finish the documented workflow and wait until navigation, loading indicators, and redirects are stable.
2. Scroll the result control or page heading into view.
3. Read the current URL through browser automation and compare it case-insensitively with `requiredUrlContains`.
4. Record only the sanitized `origin + pathname` in result data. Never record a query string, fragment, token, authorization code, cookie, or session identifier.
5. Bring the dedicated Chrome test window to the foreground, with no other window covering it.
6. Capture the complete Chrome window with `scripts/capture-browser-window-screenshot.ps1`. The PNG must include the tab strip, address bar, and application result. Add its filename to the workflow's `screenshots` list.

Do not capture an authentication redirect URL. Wait for a stable application or safe login route before taking evidence.

## Result classification

- **PASS, no warning:** the workflow succeeds and the stable URL contains the required substring.
- **PASS with WARNING:** the documented navigation and expected elements work, but the stable URL does not contain the required substring. Keep the workflow as `PASS` and add the URL warning below.
- **FAIL:** the URL points to an unexpected destination and the documented navigation or required result elements do not work. Record the functional mismatch as the failure; a URL warning may also be attached.
- **BLOCKED:** authentication, authorization, an unavailable page, or another prerequisite prevents both the workflow and its final URL from being evaluated. Explain the blocker. Do not invent a URL warning when no stable URL could be inspected.
- **NOT TESTED:** the workflow was intentionally outside the selected role/controller scope. Do not add a URL warning.

A warning is supplemental evidence, not a fifth scenario status. It never changes an otherwise correct `PASS`, `FAIL`, `BLOCKED`, or `NOT TESTED` classification.

## Warning data

When the stable URL does not contain the configured substring, add this object to the workflow's `warnings` array:

```json
{
  "code": "URL_SUBSTRING_MISSING",
  "severity": "WARNING",
  "step": "Validate the stable browser URL at the final evidence checkpoint.",
  "expected": "The URL contains the organization configuration's requiredUrlContains value.",
  "actual": "The sanitized stable URL did not contain the required substring.",
  "screenshot": "workflow-url-warning.png"
}
```

The warning screenshot must also be listed in the workflow's `screenshots` array. The report generator shows warning totals separately, the affected step, expected/actual result, and the linked full-browser screenshot.

## Capture safety

- Start every suite invocation in a fresh isolated headed Chrome automation context and a newly opened dedicated test window. Do not claim or reuse an existing user tab, an earlier automation tab, or an authenticated browser session from a prior run.
- Use that dedicated headed Chrome window at `1280x720` outer-window size for the continuous run.
- Capture only Chrome's exact window rectangle; do not include the surrounding desktop, terminal, configuration files, credentials files, notifications, or other applications.
- Keep Chrome foreground and unobstructed for the entire recording and every screenshot.
- Use native masked password controls. Never expose a password or secret in the address bar, page, evidence, logs, or filenames.
- Do not use Playwright's native page-only screenshot or page-only video as the report evidence for these runs.
