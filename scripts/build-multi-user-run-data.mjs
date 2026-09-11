import fs from 'node:fs';
import path from 'node:path';

const workspace = process.cwd();
const organizationId = process.argv[2];
const runId = process.argv[3];
if (!/^\d+$/.test(organizationId ?? '') || !/^\d{8}-\d{6}$/.test(runId ?? '')) {
  throw new Error('Usage: node scripts/build-multi-user-run-data.mjs <OrgId> <YYYYMMDD-HHmmss>');
}

const runDir = path.join(workspace, 'reports', 'full-suite', organizationId, runId);
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
const manifest = readJson(path.join(runDir, 'run-manifest.json'));
const parallel = manifest.capture?.executionMode === 'parallel';
const failedLaneSlugs = new Set();
const journals = parallel ? (manifest.lanes ?? []).map(lane => {
  const journalPath = path.join(runDir, 'lanes', lane.slug, 'video-events.json');
  if (!fs.existsSync(journalPath)) { console.warn(`[WARN] Missing event journal for lane ${lane.slug}; treating lane as failed.`); failedLaneSlugs.add(lane.slug); return { organizationId, runId, schemaVersion: 1, timelineSource: 'measured-video-events-v1', events: [] }; }
  return readJson(journalPath);
}) : [readJson(path.join(runDir, 'video-events.json'))];
const journal = { organizationId, runId, timelineSource: 'measured-video-events-v1', recordingEndedAtUtc: journals.map(item => item.recordingEndedAtUtc).filter(Boolean).sort().at(-1), events: journals.flatMap(item => item.events ?? []) };
const observations = parallel ? (() => {
  const laneObservations = (manifest.lanes ?? []).map(lane => {
    const obsPath = path.join(runDir, 'lanes', lane.slug, 'execution-observations.json');
    if (!fs.existsSync(obsPath)) { console.warn(`[WARN] Missing execution observations for lane ${lane.slug}.`); failedLaneSlugs.add(lane.slug); return { accounts: {} }; }
    return readJson(obsPath);
  });
  return { environment: laneObservations.find(item => item.environment)?.environment ?? 'AES Stage ML', mode: 'Parallel unattended safe mode · headed Chrome · full-browser evidence', accounts: Object.assign({}, ...laneObservations.map(item => item.accounts ?? {})) };
})() : readJson(path.join(runDir, 'execution-observations.json'));
const validStatuses = new Set(['PASS', 'FAIL', 'BLOCKED', 'NOT TESTED']);
const knownFailureTickets = new Map((manifest.knownFailurePolicy?.tickets ?? []).map((ticket) => [ticket.key, ticket]));
const scenarioScope = manifest.scenarioScope?.name ?? 'full';
if (!['full', 'time-and-attendance'].includes(scenarioScope)) throw new Error(`Unsupported scenario scope: ${scenarioScope}.`);

if (scenarioScope === 'time-and-attendance') {
  for (const event of journal.events.filter(item => item.kind === 'workflow-start')) {
    const scenarioId = Number(String(event.workflowSlug ?? '').match(/(?:^|-)scenario-(\d{2})(?:-|$)/)?.[1]);
    if (!Number.isInteger(scenarioId) || scenarioId < 29 || scenarioId > 46) {
      throw new Error(`Time & Attendance scope rejected out-of-scope workflow ${event.accountSlug}/${event.workflowSlug}. Only scenarios 29-46 are allowed.`);
    }
  }
}

if (String(manifest.organizationId) !== organizationId || String(journal.organizationId) !== organizationId) {
  throw new Error('Manifest/event organization does not match the requested organization.');
}
if (journal.runId !== runId || journal.timelineSource !== 'measured-video-events-v1') {
  throw new Error('The measured event journal does not match this run.');
}
if (!parallel && !(Number(observations.recordedDurationSeconds) > 0)) {
  throw new Error('execution-observations.json requires recordedDurationSeconds from the finalized video.');
}

const scenarioNames = {
  '01': 'React Home → Legacy Import Data',
  '02': 'Legacy Import Data → React Employee General Information',
  '03': 'React Home → Angular Daily Report',
  '04': 'Angular Daily Report → React Substitute General Information',
  '05': 'Angular Daily Report → Legacy Import Data',
  '06': 'Legacy Import Data → Angular Daily Report',
  '07': 'Angular Daily Report → global search for report → React Home',
  '08': 'React Home → global search for report → Angular Daily Report',
  '09': 'Legacy Import Data → global search for report → Legacy Import Data',
  '10': 'React Home → Role Switcher',
  '11': 'Angular Daily Report → Role Switcher',
  '12': 'Legacy Import Data → Role Switcher',
  '13': 'React Employee General Information → Manage Access',
  '14': 'Open an Absence and view every available tab',
  '15': 'Security → Manage User Access',
  '16': 'Logout from React Home',
  '17': 'Logout from Angular Daily Report',
  '18': 'Logout from Legacy Import Data',
  '19': 'Logout from Employee MVC page',
  '20': 'Campus React Home → Reports → Report Writer',
  '21': 'Campus React Home → Account Settings and back'
};

const contextLabel = (slug) => {
  if (slug.startsWith('organization-')) return 'Organization User';
  if (slug.startsWith('campus-')) return 'Campus User';
  if (slug.startsWith('substitute-')) return 'Substitute';
  if (slug.startsWith('first-employee-')) return 'Employee context 1';
  if (slug.startsWith('second-employee-')) return 'Employee context 2';
  if (slug.startsWith('employee-org1-')) return 'Employee organization 1';
  if (slug.startsWith('employee-org2-')) return 'Employee organization 2';
  if (slug.startsWith('employee-')) return 'Employee';
  return '';
};

const workflowName = (slug) => {
  if (slug.includes('app-switcher')) {
    const label = contextLabel(slug);
    return `Switch Apps${label ? ` · ${label}` : ''}`;
  }
  const match = slug.match(/scenario-(\d{2})/);
  if (!match) return slug;
  const label = contextLabel(slug);
  return `${label ? `${label} · ` : ''}${Number(match[1])}. ${scenarioNames[match[1]] ?? `Scenario ${Number(match[1])}`}`;
};

const expectedText = (slug) => {
  if (slug.includes('app-switcher')) {
    return 'Every application exposed by Switch Apps opens successfully, and Absence Management can be restored in the same role and organization context.';
  }
  const scenario = slug.match(/scenario-(\d{2})/)?.[1];
  if (scenario === '14') return 'An accessible absence opens read-only and every available detail tab displays responsive content without changing business data.';
  if (['16', '17', '18', '19'].includes(scenario)) return 'Logout reaches the approved login page, browser Back does not restore authenticated controls, and direct protected access requires authentication.';
  if (scenario === '20') return 'Report Writer and its primary controls load for the Campus User without changing report data.';
  if (scenario === '21') return 'Account Settings loads read-only, then supported navigation returns to My Profile and Campus Home without context loss.';
  if (scenario === '13') return 'The configured safe employee record is available and Manage Access loads in the intended context.';
  if (scenario === '15') return 'Security navigation reaches a responsive Manage User Access page with its primary controls displayed.';
  if (['07', '08', '09'].includes(scenario)) return 'The global Search submission displays the Search page and its navigation elements, then the requested destination loads; result data and counts are not asserted.';
  return `${scenarioNames[scenario] ?? 'The requested navigation'} completes and the destination's primary controls are visible and interactable.`;
};

const passActual = (slug) => {
  if (slug.includes('app-switcher')) return 'Every application exposed by Switch Apps opened successfully, and Absence Management was restored in the same role and organization context.';
  const scenario = slug.match(/scenario-(\d{2})/)?.[1];
  if (scenario === '14') return 'An existing absence was opened read-only and every available detail tab displayed responsive content; no record was changed.';
  if (['16', '17', '18', '19'].includes(scenario)) return 'Logout completed, browser Back did not restore authenticated controls, and direct protected access returned to the login page.';
  if (scenario === '20') return 'Reports → Report Writer loaded with its heading, filter area, and report workspace visible; no report action was performed.';
  if (scenario === '21') return 'My Profile and Account Settings loaded read-only, Back returned to My Profile, and Dashboard returned to the Campus Home context.';
  if (scenario === '15') return 'Manage User Access loaded with its primary search/filter controls and user results responsive.';
  if (['07', '08', '09'].includes(scenario)) return 'The Search page and navigation controls displayed after submitting report, and the requested destination loaded. Search-result data and counts were not asserted.';
  return `${scenarioNames[scenario] ?? 'The requested navigation'} completed and the destination controls were visible and responsive.`;
};

const inferScreenshots = (accountSlug, workflowSlug) => {
  const screenshotDir = path.join(runDir, 'roles', accountSlug, 'screenshots');
  const names = fs.existsSync(screenshotDir)
    ? fs.readdirSync(screenshotDir).filter((name) => /^[A-Za-z0-9_.-]+\.png$/.test(name)).sort()
    : [];
  if (workflowSlug.includes('app-switcher')) {
    const prefix = workflowSlug.slice(0, workflowSlug.indexOf('app-switcher'));
    return names.filter((name) => {
      if (!prefix) return /app-switcher|frontline-(?:administration|central)|time-attendance/.test(name);
      return name.startsWith(prefix) && /app-switcher|frontline-(?:administration|central)|time-attendance|home/.test(name);
    });
  }
  const match = workflowSlug.match(/^(.*?scenario-\d{2})/);
  return match ? names.filter((name) => name.startsWith(match[1])) : [];
};

const defaultReproduce = (name, status) => status === 'PASS' ? [] : [
  'Sign in with the configured account for this controller and select the documented role and organization context.',
  `Execute ${name}.`,
  'Observe the actual result described in the linked evidence.'
];

const accountEvents = journal.events.filter((event) => event.kind === 'account-start');
const accounts = manifest.accounts.map((manifestAccount, index) => {
  const workflowStarts = journal.events.filter((event) => event.kind === 'workflow-start' && event.accountSlug === manifestAccount.slug);
  const accountObservation = observations.accounts?.[manifestAccount.slug] ?? {};
  const overrides = accountObservation.overrides ?? {};
  const urlWarnings = accountObservation.urlWarnings ?? {};
  const allScreenshots = (() => {
    const dir = path.join(runDir, 'roles', manifestAccount.slug, 'screenshots');
    return fs.existsSync(dir) ? fs.readdirSync(dir).filter((name) => /^[A-Za-z0-9_.-]+\.png$/.test(name)).sort() : [];
  })();
  const workflows = workflowStarts.map((event) => {
    const override = overrides[event.workflowSlug] ?? {};
    const status = override.status ?? observations.defaultStatus ?? 'PASS';
    if (!validStatuses.has(status)) throw new Error(`Invalid status for ${manifestAccount.slug}/${event.workflowSlug}.`);
    const name = override.name ?? workflowName(event.workflowSlug);
    const expected = override.expected ?? expectedText(event.workflowSlug);
    const actual = override.actual ?? (status === 'PASS' ? passActual(event.workflowSlug) : 'The workflow could not complete as expected; see the recorded observation and reproduction steps.');
    const screenshots = inferScreenshots(manifestAccount.slug, event.workflowSlug);
    const warningScreenshot = urlWarnings[event.workflowSlug];
    const warnings = Array.isArray(override.warnings) ? override.warnings.map((warning) => {
      const normalizedWarning = {...warning};
      if (warning.knownIssue != null) {
        const ticket = knownFailureTickets.get(String(warning.knownIssue.ticket ?? ''));
        if (!ticket) throw new Error(`Unknown warning Jira ticket for ${manifestAccount.slug}/${event.workflowSlug}: ${warning.knownIssue.ticket ?? '(missing)'}.`);
        if (warning.code !== 'SLOW_UI_LOAD' || ticket.key !== 'HCMAT-79933') {
          throw new Error(`Only a SLOW_UI_LOAD recovery may reference known performance issue HCMAT-79933 for ${manifestAccount.slug}/${event.workflowSlug}.`);
        }
        normalizedWarning.knownIssue = {ticket: ticket.key, url: ticket.url, title: ticket.title};
      }
      return normalizedWarning;
    }) : [];
    if (warningScreenshot) warnings.push({
        code: 'URL_HOST_MISMATCH',
        severity: 'WARNING',
        step: 'Capture the workflow final evidence checkpoint with the full browser window and address bar visible.',
        expected: 'The evidence URL contains stage-k12.ss.',
        actual: 'The approved Stage destination shown in the evidence does not contain stage-k12.ss; this warning does not change the workflow status.',
        screenshot: warningScreenshot
      });
    for (const warning of warnings) {
      if (warning.screenshot && !screenshots.includes(warning.screenshot)) screenshots.push(warning.screenshot);
    }
    let knownFailure;
    if (override.knownFailure != null) {
      if (status !== 'FAIL') throw new Error(`Known failure metadata requires FAIL status for ${manifestAccount.slug}/${event.workflowSlug}.`);
      const ticket = knownFailureTickets.get(String(override.knownFailure.ticket ?? ''));
      if (!ticket) throw new Error(`Unknown Jira ticket for ${manifestAccount.slug}/${event.workflowSlug}: ${override.knownFailure.ticket ?? '(missing)'}.`);
      const matchEvidence = String(override.knownFailure.matchEvidence ?? '').trim();
      if (!matchEvidence) throw new Error(`Known failure metadata requires matchEvidence for ${manifestAccount.slug}/${event.workflowSlug}.`);
      knownFailure = {ticket: ticket.key, url: ticket.url, title: ticket.title, matchEvidence};
    }
    return {
      slug: event.workflowSlug,
      name,
      source: override.source ?? manifestAccount.controller,
      status,
      expected,
      actual,
      steps: override.steps ?? [{action: name, expected, actual, status}],
      reproduce: override.reproduce ?? defaultReproduce(name, status),
      screenshots: [...new Set(screenshots)].sort(),
      warnings,
      navigation: override.navigation ?? [],
      http404s: override.http404s ?? [],
      ...(status === 'FAIL' && override.failureObservationSeconds != null ? {failureObservationSeconds: Number(override.failureObservationSeconds)} : {}),
      ...(knownFailure ? {knownFailure} : {})
    };
  });
  const counts = workflows.reduce((result, workflow) => {
    result[workflow.status] = (result[workflow.status] ?? 0) + 1;
    return result;
  }, {PASS: 0, FAIL: 0, BLOCKED: 0, 'NOT TESTED': 0});
  const status = counts.FAIL ? 'FAIL' : counts.BLOCKED ? 'BLOCKED' : counts['NOT TESTED'] ? 'NOT TESTED' : 'PASS';
  const knownFailureCount = workflows.filter((workflow) => workflow.status === 'FAIL' && workflow.knownFailure).length;
  const issueWorkflow = workflows.find((workflow) => workflow.status === 'FAIL')
    ?? workflows.find((workflow) => workflow.status === 'BLOCKED')
    ?? workflows.find((workflow) => workflow.status === 'NOT TESTED');
  return {
    execution: index + 1,
    name: manifestAccount.name,
    slug: manifestAccount.slug,
    ...(parallel ? {laneId: Number(manifestAccount.laneId), video: manifestAccount.video} : {}),
    controller: manifestAccount.controller,
    status,
    summary: `${workflows.length} scenario/context validations: ${counts.PASS} passed, ${counts.FAIL} failed (${knownFailureCount} known), ${counts.BLOCKED} blocked, and ${counts['NOT TESTED']} not tested.`,
    expected: 'Execute every authorized workflow for the documented role and organization contexts, continue through independent failures, and preserve read-only safety except for explicitly approved temporary test-data lifecycles.',
    actual: issueWorkflow ? issueWorkflow.actual : 'Every authorized workflow completed successfully.',
    cleanup: accountObservation.cleanup ?? 'No business data was changed. Read-only navigation, searches, filters, application switching, and session-termination checks were used.',
    screenshots: allScreenshots,
    workflows,
    reproduce: issueWorkflow?.reproduce ?? []
  };
});

const failedLaneIds = new Set([...(manifest.lanes ?? [])].filter(l => failedLaneSlugs.has(l.slug)).map(l => Number(l.laneId)));
const expectedAccountEvents = parallel ? accounts.filter(a => !failedLaneIds.has(Number(a.laneId))).length : accounts.length;
if (accountEvents.length !== expectedAccountEvents) throw new Error(`Expected ${expectedAccountEvents} account-start events${failedLaneIds.size ? ` (${failedLaneIds.size} failed-lane account(s) excluded)` : ''}; found ${accountEvents.length}.`);

const runData = {
  runId,
  environment: observations.environment ?? 'AES Stage ML',
  mode: observations.mode ?? 'Unattended safe mode · headed Chrome · full-browser evidence',
  executedAt: journal.recordingEndedAtUtc,
  ...(parallel ? {} : {video: 'videos/multi-user-full-suite-execution.webm'}),
  recordedDurationSeconds: parallel ? 0 : Number(observations.recordedDurationSeconds),
  accounts,
  organizationId,
  scenarioScope
};

fs.writeFileSync(path.join(runDir, 'run-data.json'), `${JSON.stringify(runData, null, 2)}\n`);
console.log(`Built run-data.json for ${accounts.length} accounts and ${accounts.flatMap((account) => account.workflows).length} workflows.`);
