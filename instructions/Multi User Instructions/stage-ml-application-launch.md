# Stage ML and IDM Application Launch

Use this procedure after authentication and before executing any role scenario. It applies to every organization-scoped multi-user controller. Read `environment`, `authenticationMode`, and `applicationLaunchMode` from `config/aes-stage.ml.<OrgId>.json` before choosing a branch.

## IDM direct launch flow

Use this branch only when `environment` is `stageIDM`, `authenticationMode` is `IDM`, and `applicationLaunchMode` is `direct`.

1. In the fresh isolated headed Chrome automation context, open the configured `url` directly. Do not open the My Frontline Passport URL or require an application tile.
2. Complete the normal AES Stage IDM login flow using only the selected controller's configured username and credential key. A redirect to `idgatewayawsstage.flqa.net` is an approved part of this IDM authentication branch.
3. Wait for redirects and loading states to settle, then confirm the role-appropriate AES Stage page, authenticated account control, and permitted navigation are responsive.
4. Inspect the final controlled tab and continue only on a host listed in `approvedHosts` whose stable URL contains `requiredUrlContains`.
5. If the authenticated route is temporarily unavailable, navigate back to the exact configured IDM `url` once and wait for the same responsive application proof. Do not use the My Frontline tile recovery in this branch.
6. Record only the sanitized final `origin + pathname`; never record authentication query strings, fragments, tokens, cookies, or session identifiers.

Expected: The direct IDM login flow finishes on a responsive approved AES Stage application route whose URL contains the configured IDM marker.

The remaining **Required Stage ML launch flow** and **Recovery when the launcher is blocked or falls back to IDM** sections apply only to the Stage ML/Passport branch.

## Required Stage ML launch flow

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
   - attach to and explicitly select the exact newly opened or focused approved Stage tab whose URL contains the configured `requiredUrlContains` value; and
   - verify that this selected destination is the visibly active tab in the recorded Chrome window before interacting with it or capturing evidence.
6. Continue only after the selected tab reaches a stable approved application route and visible role-appropriate controls confirm the application is responsive. For an Organization User Home page, acceptable proof includes the application header plus primary navigation such as **Web Navigator**, **Daily Report**, **Master Data**, or **Absences**. Use equivalent visible Home/navigation controls for Campus, Employee, or Substitute roles.
7. Record the sanitized final application URL and use the attached final application tab for the controller's scenarios, screenshots, and video evidence.

Expected: the supported My Frontline tile flow finishes on an approved responsive Absence Management application tab whose stable URL contains the selected organization's `requiredUrlContains` value.

## Recovery when the launcher is blocked or falls back to IDM

If the originally controlled tab displays `ERR_BLOCKED_BY_CLIENT`, a blank launcher page, remains on the intermediate launcher host, or navigates to `idgatewayawsstage.flqa.net`:

1. Do not immediately classify the controller as blocked.
2. Refresh the Chrome open-tab inventory and look for an approved responsive tab whose URL contains `requiredUrlContains`. The supported tile can complete in a different tab even when the launcher tab is unusable.
3. If found, attach to that exact tab, confirm the expected application controls, and continue. Do not close a user-owned tab merely because the launcher tab failed.
4. If the current or newly opened tab is on `idgatewayawsstage.flqa.net`, do not enter a username or password there. This legacy IDM destination is not an approved authentication endpoint for an organization-scoped Stage ML execution.
5. Navigate the controlled test tab back to the exact configured ML `url` from `config/aes-stage.ml.<OrgId>.json`. Complete or reuse Frontline Passport authentication with the same controller account. If an already-authenticated Passport session immediately redirects that login URL back to IDM, navigate to the configured `applicationHubUrl` from the same organization configuration. Continue only when My Frontline is responsive and the active account/context is verified, then activate the visible **Absence Management** tile with one normal click.
6. Refresh the Chrome tab inventory again and attach to the approved responsive application tab whose URL contains `requiredUrlContains`.
7. Apply this ML re-navigation recovery once per authentication/application-launch attempt. Do not loop between Passport, the launcher, and IDM.
8. After the single supported ML retry, classify the affected setup or workflow as **BLOCKED** when no approved responsive Absence Management tab exists or the launch returns to IDM again. Record `ML application launch returned to legacy IDM after one Passport retry`, the sanitized hosts, visible state, and numbered reproduction steps. Never enter ML credentials into IDM as part of this recovery.

## Reporting

- Do not treat the intermediate launcher URL as a URL warning checkpoint.
- Take workflow evidence only after the final application tab is stable, or take blocker evidence after the recovery procedure is exhausted.
- Never expose credentials, query strings containing session data, tokens, cookies, or authentication fragments in screenshots or report text.
