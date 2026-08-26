# Stage ML Application Launch

Use this procedure after Frontline Passport authentication and before executing any role scenario. It applies to every organization-scoped multi-user controller.

## Required launch flow

1. In the fresh isolated headed Chrome automation context created for this suite invocation, open only the configured `url` from `config/aes-stage.ml.<OrgId>.json` and complete authentication with the controller's configured account. Never claim or reuse a pre-existing user tab or an authenticated tab from an earlier run.
2. If authentication lands on My Frontline, wait until the application tiles are visible and interactive.
3. Find the visible, enabled **Absence Management** application tile and activate it with one normal user-style left click.
   - Do not navigate directly to the tile's `href`.
   - Do not assign `window.location`, execute the link through JavaScript, or construct/guess an Absence Management URL.
4. Treat `absence.stage-k12.ss.frontlineeducation.com` as an intermediate launcher/legacy host, not as proof that the React application has loaded.
5. The tile may navigate the current tab or open/focus another Chrome tab. After the click:
   - wait for the browser transition to settle;
   - inspect the current controlled tab;
   - refresh the Chrome open-tab inventory; and
   - attach to the exact newly opened or focused approved Stage tab whose URL contains the configured `requiredUrlContains` value.
6. Continue only after the selected tab reaches a stable approved application route and visible role-appropriate controls confirm the application is responsive. For an Organization User Home page, acceptable proof includes the application header plus primary navigation such as **Web Navigator**, **Daily Report**, **Master Data**, or **Absences**. Use equivalent visible Home/navigation controls for Campus, Employee, or Substitute roles.
7. Record the sanitized final application URL and use the attached final application tab for the controller's scenarios, screenshots, and video evidence.

Expected: the supported My Frontline tile flow finishes on an approved responsive Absence Management application tab whose stable URL contains the selected organization's `requiredUrlContains` value.

## Recovery when the launcher tab is blocked

If the originally controlled tab displays `ERR_BLOCKED_BY_CLIENT`, a blank launcher page, or remains on the intermediate launcher host:

1. Do not immediately classify the controller as blocked.
2. Refresh the Chrome open-tab inventory and look for an approved responsive tab whose URL contains `requiredUrlContains`. The supported tile can complete in a different tab even when the launcher tab is unusable.
3. If found, attach to that exact tab, confirm the expected application controls, and continue. Do not close a user-owned tab merely because the launcher tab failed.
4. If no final application tab exists, return to or reload the supported My Frontline application launcher once, wait for the tile to become interactive, and retry one normal click.
5. After the single supported retry, classify the controller as **BLOCKED** only when no approved responsive Absence Management tab exists. Include the launcher state, sanitized URL, visible error, and numbered reproduction steps in the report.

## Reporting

- Do not treat the intermediate launcher URL as a URL warning checkpoint.
- Take workflow evidence only after the final application tab is stable, or take blocker evidence after the recovery procedure is exhausted.
- Never expose credentials, query strings containing session data, tokens, cookies, or authentication fragments in screenshots or report text.
