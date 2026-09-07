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
const journal = readJson(path.join(runDir, 'video-events.json'));
const observations = readJson(path.join(runDir, 'execution-observations.json'));
const validStatuses = new Set(['PASS', 'FAIL', 'BLOCKED', 'NOT TESTED']);

if (String(manifest.organizationId) !== organizationId || String(journal.organizationId) !== organizationId) {
  throw new Error('Manifest/event organization does not match the requested organization.');
}
if (journal.runId !== runId || journal.timelineSource !== 'measured-video-events-v1') {
  throw new Error('The measured event journal does not match this run.');
}
if (!(Number(observations.recordedDurationSeconds) > 0)) {
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
  if (slug.endsWith('organization-user-logout-browser-back-after-logout')) {
    return 'Organization User · Browser Back after logout';
  }
  if (slug.endsWith('scenario-13-migrated-organization-migrated-user')) {
    return 'Organization User · 13A. Manage Access — migrated organization and migrated user';
  }
  if (slug.endsWith('scenario-13-migrated-organization-non-migrated-user')) {
    return 'Organization User · 13B. Manage Access — migrated organization and non-migrated user';
  }
  if (slug.includes('app-switcher')) {
    const label = contextLabel(slug);
    return `Switch Apps${label ? ` · ${label}` : ''}`;
  }
  if (slug.endsWith('home-menu-navigation')) {
    const label = contextLabel(slug);
    return `${label ? `${label} · ` : ''}Standalone Home menu navigation`;
  }
  const match = slug.match(/scenario-(\d{1,2})/);
  if (!match) return slug;
  const label = contextLabel(slug);
  const scenario = match[1].padStart(2, '0');
  return `${label ? `${label} · ` : ''}${Number(scenario)}. ${scenarioNames[scenario] ?? `Scenario ${Number(scenario)}`}`;
};

const expectedText = (slug) => {
  if (slug.endsWith('organization-user-logout-browser-back-after-logout')) {
    return 'Logout reaches the approved login page, and one browser Back action does not restore usable authenticated content or controls.';
  }
  if (slug.endsWith('scenario-13-migrated-organization-migrated-user')) {
    return 'EmployeeUser, SSD (ssdemp) opens in Person Management; Frontline Administration is selected, the configured employee and organization details display, and the URL contains stage-k12.ss.';
  }
  if (slug.endsWith('scenario-13-migrated-organization-non-migrated-user')) {
    return 'DontmigrateSSD0EMP, SSD (DontMigemp0) opens in Person Management; Absence Management is selected, the configured employee and organization details display, and the URL contains stage-k12.ss.';
  }
  if (slug.includes('app-switcher')) {
    return 'Every application exposed by Switch Apps opens successfully, and Absence Management can be restored in the same role and organization context.';
  }
  if (slug.endsWith('home-menu-navigation')) {
    if (slug.startsWith('organization-') || slug.startsWith('campus-')) {
      return 'Staff Directory, My Staff Profile, Browse Library, My Resource History, and My Resources each open a responsive destination, then Home is restored in the same role and organization context.';
    }
    return 'My Staff Profile opens a responsive destination, then Home is restored in the same standalone role context.';
  }
  const scenario = slug.match(/scenario-(\d{1,2})/)?.[1]?.padStart(2, '0');
  if (scenario === '14') return 'An accessible absence opens read-only and every available detail tab displays responsive content without changing business data.';
  if (['16', '17', '18', '19'].includes(scenario)) return 'Logout completes and a stable approved login page displays with responsive login controls.';
  if (scenario === '20') return 'Report Writer and its primary controls load for the Campus User without changing report data.';
  if (scenario === '21') return 'Account Settings loads read-only, then supported navigation returns to My Profile and Campus Home without context loss.';
  if (scenario === '13') return 'The configured safe employee record is available and Manage Access loads in the intended context.';
  if (['07', '08', '09'].includes(scenario)) return 'The global Search submission displays the Search page and its navigation elements, then the requested destination loads; result data and counts are not asserted.';
  return `${scenarioNames[scenario] ?? 'The requested navigation'} completes and the destination's primary controls are visible and interactable.`;
};

const passActual = (slug) => {
  if (slug.endsWith('organization-user-logout-browser-back-after-logout')) {
    return 'Logout reached the approved login page, and browser Back did not restore usable authenticated content or controls.';
  }
  if (slug.endsWith('scenario-13-migrated-organization-migrated-user')) {
    return 'The exact migrated employee opened in Person Management, Frontline Administration was selected, both configured Organization Details values displayed, and the Stage URL check passed without changing data.';
  }
  if (slug.endsWith('scenario-13-migrated-organization-non-migrated-user')) {
    return 'The exact non-migrated employee opened in Person Management, Absence Management was selected, both configured Organization Details values displayed, and the Stage URL check passed without changing data.';
  }
  if (slug.includes('app-switcher')) return 'Every application exposed by Switch Apps opened successfully, and Absence Management was restored in the same role and organization context.';
  if (slug.endsWith('home-menu-navigation')) {
    if (slug.startsWith('organization-') || slug.startsWith('campus-')) {
      return 'Staff Directory, My Staff Profile, and all three Resource Library destinations loaded without error; Home was restored in the same role and organization context.';
    }
    return 'My Staff Profile loaded without error, and Home was restored in the same standalone role context.';
  }
  const scenario = slug.match(/scenario-(\d{1,2})/)?.[1]?.padStart(2, '0');
  if (scenario === '14') return 'An existing absence was opened read-only and every available detail tab displayed responsive content; no record was changed.';
  if (['16', '17', '18', '19'].includes(scenario)) return 'Logout completed and the approved login page displayed with responsive login controls.';
  if (scenario === '20') return 'Reports → Report Writer loaded with its heading, filter area, and report workspace visible; no report action was performed.';
  if (scenario === '21') return 'My Profile and Account Settings loaded read-only, Back returned to My Profile, and Dashboard returned to the Campus Home context.';
  if (['07', '08', '09'].includes(scenario)) return 'The Search page and navigation controls displayed after submitting report, and the requested destination loaded. Search-result data and counts were not asserted.';
  return `${scenarioNames[scenario] ?? 'The requested navigation'} completed and the destination controls were visible and responsive.`;
};

const inferScreenshots = (accountSlug, workflowSlug) => {
  const screenshotDir = path.join(runDir, 'roles', accountSlug, 'screenshots');
  const names = fs.existsSync(screenshotDir)
    ? fs.readdirSync(screenshotDir).filter((name) => /^[A-Za-z0-9_.-]+\.png$/.test(name)).sort()
    : [];
  if (workflowSlug.endsWith('organization-user-logout-browser-back-after-logout')) {
    return names.filter((name) => name.startsWith(`${workflowSlug}-`));
  }
  if (workflowSlug.includes('scenario-13-migrated-organization-')) {
    return names.filter((name) => name.startsWith(`${workflowSlug}-`));
  }
  if (workflowSlug.includes('app-switcher')) {
    const prefix = workflowSlug.slice(0, workflowSlug.indexOf('app-switcher'));
    return names.filter((name) => {
      if (!prefix) return /app-switcher|frontline-(?:administration|central)|time-attendance/.test(name);
      return name.startsWith(prefix) && /app-switcher|frontline-(?:administration|central)|time-attendance|home/.test(name);
    });
  }
  if (workflowSlug.endsWith('home-menu-navigation')) {
    return names.filter((name) => name.startsWith(`${workflowSlug}-`));
  }
  const match = workflowSlug.match(/^(.*?scenario-)(\d{1,2})/);
  if (!match) return [];
  const normalizedPrefix = `${match[1]}${match[2].padStart(2, '0')}`;
  return names.filter((name) => name.startsWith(normalizedPrefix));
};

const defaultReproduce = (name, status) => status === 'PASS' ? [] : [
  'Sign in with the configured account for this controller and select the documented role and organization context.',
  `Execute ${name}.`,
  'Observe the actual result described in the linked evidence.'
];

const retiredScenario = journal.events.find((event) => event.kind === 'workflow-start' && /scenario-0?15(?:\D|$)/i.test(event.workflowSlug));
if (retiredScenario) {
  throw new Error(`Retired Scenario 15 cannot be included in a new run: ${retiredScenario.workflowSlug}`);
}

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
    const requiredUrlContains = String(manifest.urlValidation?.requiredContains ?? 'configured URL marker');
    const warnings = warningScreenshot ? [{
      code: 'URL_HOST_MISMATCH',
      severity: 'WARNING',
      step: 'Capture the workflow final evidence checkpoint with the full browser window and address bar visible.',
      expected: `The evidence URL contains ${requiredUrlContains}.`,
      actual: `The approved Stage destination shown in the evidence does not contain ${requiredUrlContains}; this warning does not change the workflow status.`,
      screenshot: warningScreenshot
    }] : [];
    if (warningScreenshot && !screenshots.includes(warningScreenshot)) screenshots.push(warningScreenshot);
    const baseSteps = override.steps ?? [{action: name, expected, actual, status}];
    const observationSeconds = Number(override.failureObservationSeconds);
    const steps = status === 'FAIL' && observationSeconds > 0 && !baseSteps.some((step) =>
      new RegExp(`\\b${observationSeconds}\\s*seconds?\\b`, 'i').test(`${step.action ?? ''} ${step.expected ?? ''} ${step.actual ?? ''}`)
    ) ? [...baseSteps, {
      action: `Observe the failed state for the required ${observationSeconds} seconds and capture final full-browser evidence.`,
      expected: `The destination or required control recovers within ${observationSeconds} seconds.`,
      actual: `The failed state remained after ${observationSeconds} seconds.`,
      status: 'FAIL'
    }] : baseSteps;
    return {
      slug: event.workflowSlug,
      name,
      source: override.source ?? (event.workflowSlug.includes('scenario-13-migrated-organization-')
        ? 'tests/navigation/manage-access.md'
        : event.workflowSlug.endsWith('organization-user-logout-browser-back-after-logout')
          ? 'tests/logout/organization-user-browser-back-after-logout.md'
          : manifestAccount.controller),
      status,
      expected,
      actual,
      steps,
      reproduce: override.reproduce ?? defaultReproduce(name, status),
      screenshots: [...new Set(screenshots)].sort(),
      warnings,
      ...(status === 'FAIL' && Number(override.failureObservationSeconds) > 0
        ? {failureObservationSeconds: Number(override.failureObservationSeconds)}
        : {})
    };
  });
  const browserBackWorkflowCount = workflows.filter((workflow) => workflow.slug.endsWith('organization-user-logout-browser-back-after-logout')).length;
  const isStandaloneOrganizationUser = /(?:^|[/\\])organization-user-execution\.md$/i.test(manifestAccount.controller);
  const browserBackIsRequired = isStandaloneOrganizationUser && ['140462', '140463', '140466'].includes(organizationId);
  if (browserBackIsRequired && browserBackWorkflowCount !== 1) {
    throw new Error(`${manifestAccount.slug} requires exactly one Organization User Browser Back-after-logout workflow; found ${browserBackWorkflowCount}.`);
  }
  if (!browserBackIsRequired && browserBackWorkflowCount !== 0) {
    throw new Error(`${manifestAccount.slug} is not authorized to include the Organization User Browser Back-after-logout workflow.`);
  }
  const counts = workflows.reduce((result, workflow) => {
    result[workflow.status] = (result[workflow.status] ?? 0) + 1;
    return result;
  }, {PASS: 0, FAIL: 0, BLOCKED: 0, 'NOT TESTED': 0});
  const status = counts.FAIL ? 'FAIL' : counts.BLOCKED ? 'BLOCKED' : counts['NOT TESTED'] ? 'NOT TESTED' : 'PASS';
  const issueWorkflow = workflows.find((workflow) => workflow.status === 'FAIL')
    ?? workflows.find((workflow) => workflow.status === 'BLOCKED')
    ?? workflows.find((workflow) => workflow.status === 'NOT TESTED');
  return {
    execution: index + 1,
    name: manifestAccount.name,
    slug: manifestAccount.slug,
    controller: manifestAccount.controller,
    status,
    summary: `${workflows.length} scenario/context validations: ${counts.PASS} passed, ${counts.FAIL} failed, ${counts.BLOCKED} blocked, and ${counts['NOT TESTED']} not tested.`,
    expected: 'Execute every authorized workflow for the documented role and organization contexts, continue through independent failures, and preserve read-only safety except for explicitly approved temporary test-data lifecycles.',
    actual: issueWorkflow ? issueWorkflow.actual : 'Every authorized workflow completed successfully.',
    cleanup: accountObservation.cleanup ?? 'No business data was changed. Read-only navigation, searches, filters, application switching, logout checks, and any separately authorized Organization User Browser Back check were used.',
    screenshots: allScreenshots,
    workflows,
    reproduce: issueWorkflow?.reproduce ?? []
  };
});

if (accountEvents.length !== accounts.length) throw new Error(`Expected ${accounts.length} account-start events; found ${accountEvents.length}.`);

const runData = {
  runId,
  environment: observations.environment ?? manifest.application ?? 'AES Stage',
  mode: observations.mode ?? 'Unattended safe mode · headed Chrome · full-browser evidence',
  executedAt: journal.recordingEndedAtUtc,
  video: 'videos/multi-user-full-suite-execution.webm',
  recordedDurationSeconds: Number(observations.recordedDurationSeconds),
  accounts,
  organizationId
};

fs.writeFileSync(path.join(runDir, 'run-data.json'), `${JSON.stringify(runData, null, 2)}\n`);
console.log(`Built run-data.json for ${accounts.length} accounts and ${accounts.flatMap((account) => account.workflows).length} workflows.`);
