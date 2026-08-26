import fs from 'node:fs';
import path from 'node:path';

const workspace = process.cwd();
const organizationId = process.argv[2];
const runId = process.argv[3];
if (!/^\d+$/.test(organizationId ?? '') || !/^\d{8}-\d{6}$/.test(runId ?? '')) {
  throw new Error('Usage: node scripts/generate-multi-user-full-suite-report.mjs <OrgId> <YYYYMMDD-HHMMSS>');
}

const runDir = path.join(workspace, 'reports', 'full-suite', organizationId, runId);
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
const data = readJson(path.join(runDir, 'run-data.json'));
const manifest = readJson(path.join(runDir, 'run-manifest.json'));
if (manifest.configuration !== `config/aes-stage.ml.${organizationId}.json`) throw new Error('The run manifest has an invalid organization configuration reference.');
const configPath = path.join(workspace, ...String(manifest.configuration ?? '').split('/'));
if (!manifest.configuration || !fs.existsSync(configPath)) throw new Error('The run manifest must reference its organization configuration.');
const organizationConfig = readJson(configPath);
const roleRoot = path.join(runDir, 'roles');
const validStatuses = new Set(['PASS', 'FAIL', 'BLOCKED', 'NOT TESTED']);
const expectedRoleReports = Number(manifest.expectedRoleReports ?? manifest.expectedAccountReports);

if (String(manifest.organizationId) !== organizationId || String(data.organizationId) !== organizationId) {
  throw new Error('Run manifest/data organization does not match the requested organization.');
}
if (String(organizationConfig.organizationId) !== organizationId) throw new Error('The organization configuration does not match this run.');
if (!manifest.urlValidation
  || manifest.urlValidation.requiredContains !== organizationConfig.requiredUrlContains
  || manifest.urlValidation.comparison !== 'case-insensitive-substring'
  || manifest.urlValidation.mismatchClassification !== 'WARNING'
  || manifest.urlValidation.warningDoesNotChangeStatus !== true
  || manifest.urlValidation.evidence !== 'full-browser-window-screenshot') {
  throw new Error('The run manifest does not satisfy the configured URL warning/evidence policy.');
}

if (!Number.isInteger(expectedRoleReports) || expectedRoleReports < 1) {
  throw new Error('run-manifest.json has an invalid expectedRoleReports value.');
}
if (!Array.isArray(data.accounts) || data.accounts.length !== expectedRoleReports) {
  throw new Error(`Expected exactly ${expectedRoleReports} role/login-combination results, found ${data.accounts?.length ?? 0}.`);
}
if (!(Number(data.recordedDurationSeconds) > 0)) {
  throw new Error('recordedDurationSeconds must be greater than zero.');
}
if (data.timelineSource !== 'measured-video-events-v1' || !(Number(data.sourceElapsedMilliseconds) > 0)) {
  throw new Error('Measured video events are required. Run scripts/apply-multi-user-video-timeline.mjs before report generation; evenly divided or estimated scenario ranges are not accepted.');
}
if (!(Number(data.videoTimelineScale) >= 0.9 && Number(data.videoTimelineScale) <= 1.1)) {
  throw new Error('The measured browser timeline is not sufficiently aligned with the finalized video duration.');
}
if (data.video !== 'videos/multi-user-full-suite-execution.webm') {
  throw new Error('The run must reference the single standard multi-user video path.');
}
if (!fs.existsSync(path.join(runDir, 'videos', 'multi-user-full-suite-execution.webm'))) {
  throw new Error('Missing final continuous video.');
}
if (manifest.reportDirectory && manifest.reportDirectory !== 'roles') {
  throw new Error('The standard report directory must be roles.');
}
if (!manifest.capture) {
  throw new Error('The run manifest must define the full-browser capture policy.');
} else {
  const capture = manifest.capture;
  const invalidCapture = capture.browser !== 'Chrome'
    || capture.browserMode !== 'headed'
    || capture.freshAutomationContext !== true
    || capture.freshBrowserWindow !== true
    || capture.reuseExistingTabs !== false
    || capture.reuseExistingSessionState !== false
    || capture.captureMethod !== 'print-window-raw-frame-pipe'
    || capture.captureScope !== 'full-browser-window'
    || capture.windowSize !== '1280x720'
    || capture.includeBrowserChrome !== true
    || capture.addressBarVisible !== true
    || capture.pageOnly !== false
    || Number(capture.videoCount) !== 1
    || capture.continuous !== true
    || ['blur', 'masking', 'overlays', 'dimming', 'annotations', 'chapterCards'].some((key) => capture[key] !== false);
  if (invalidCapture) throw new Error('The run manifest does not satisfy the full-browser headed-Chrome, address-bar-visible, one-continuous-video, no-blur/no-overlay capture policy.');
}

const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const statusClass = (status) => String(status).toLowerCase().replace(/\s+/g, '-');
const slugify = (value) => String(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'scenario';
const fmt = (seconds) => {
  const value = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = value % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}` : `${minutes}:${String(secs).padStart(2, '0')}`;
};
const range = (item) => `${fmt(item.startSeconds)}–${fmt(item.endSeconds)}`;
const countStatuses = (items) => items.reduce((counts, item) => {
  counts[item.status] = (counts[item.status] ?? 0) + 1;
  return counts;
}, {PASS: 0, FAIL: 0, BLOCKED: 0, 'NOT TESTED': 0});
const isTimeAttendanceWorkflow = (account, workflow) => String(workflow.source ?? account.controller)
  .replace(/\\/g, '/')
  .includes('tests/time-and-attendance/');
const usernameReferences = {
  'organization-user-execution.md': ['org_username', 'AES_STAGE_ORGANIZATION_USERNAME'],
  'campus-user-execution.md': ['campusUser', 'AES_STAGE_CAMPUS_USERNAME'],
  'employee-user-execution.md': ['employee', 'AES_STAGE_EMPLOYEE_USERNAME'],
  'substitute-user-execution.md': ['substitute', 'AES_STAGE_SUBSTITUTE_USERNAME'],
  'multi-role-campus-employee-organization-execution.md': ['userRoleSwitcher', 'AES_STAGE_ROLE_SWITCHER_ORG_USERNAME'],
  'multi-role-organization-employee-execution.md': ['multiRoleOrgEmployee', 'AES_STAGE_MULTI_ROLE_ORG_EMPLOYEE_USERNAME'],
  'multi-role-employee-employee-substitute-execution.md': ['multiRoleEmployeeEmployeeSubstitute', 'AES_STAGE_MULTI_ROLE_EMPLOYEE_EMPLOYEE_SUBSTITUTE_USERNAME'],
  'multi-org-employee-substitute-execution.md': ['multiOrgEmployeeSubstitute', 'AES_STAGE_MULTI_ORG_EMPLOYEE_SUBSTITUTE_USERNAME'],
  'multi-org-employee-employee-execution.md': ['multiOrgEmployeeEmployee', 'AES_STAGE_MULTI_ORG_EMPLOYEE_EMPLOYEE_USERNAME'],
  'multi-org-organization-campus-execution.md': ['multiOrgOrgCampus', 'AES_STAGE_MULTI_ORG_ORG_CAMPUS_USERNAME']
};
const resolveTestUsername = (account) => {
  const controllerName = path.basename(String(account.controller)).toLowerCase();
  const [defaultKey, defaultEnvironment] = usernameReferences[controllerName] ?? [];
  const key = account.testUsernameKey ?? defaultKey;
  const environmentName = account.testUsernameEnvironment ?? defaultEnvironment;
  const username = String((environmentName && process.env[environmentName]) || (key && organizationConfig.testUsernames?.[key]) || '').trim();
  if (!username || /[\u0000-\u001f\u007f]/.test(username) || username.length > 320) {
    throw new Error(`A valid configured test username could not be resolved for TA role ${account.slug}.`);
  }
  return username;
};
const countWarnings = (items) => items.reduce((total, item) => total + (Array.isArray(item.warnings) ? item.warnings.length : 0), 0);
const screenshotNames = (workflow) => [...new Set(Array.isArray(workflow?.screenshots) ? workflow.screenshots : [])];
const redactControllerSource = (source) => source
  .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[identity redacted]')
  .replace(/^(\s*(?:[-*]\s*)?(?:username|user\s*id|email|password|passcode|secret)\s*(?::|=)\s*).+$/gim, '$1[redacted from report]')
  .replace(/("(?:username|userId|email|password|secret)"\s*:\s*")[^"]*(")/gi, '$1[redacted from report]$2');

let previousEnd = 0;
const normalizedAccounts = data.accounts.map((account, accountIndex) => {
  if (account.execution !== accountIndex + 1) throw new Error(`Role execution order is invalid at index ${accountIndex}.`);
  if (!/^[a-z0-9-]+$/.test(account.slug ?? '')) throw new Error(`Invalid role/login-combination slug: ${account.slug}`);
  if (!validStatuses.has(account.status)) throw new Error(`Invalid status for ${account.slug}: ${account.status}`);
  if (account.timelineMeasured !== true || !(Number(account.sourceEndElapsedMilliseconds) > Number(account.sourceStartElapsedMilliseconds))) {
    throw new Error(`Account ${account.slug} does not have a measured video-event range.`);
  }
  if (Number(account.startSeconds) < 0 || Number(account.endSeconds) < Number(account.startSeconds)) throw new Error(`Invalid video range for ${account.slug}.`);
  if (Number(account.startSeconds) < previousEnd - 0.1) throw new Error(`Overlapping role video range for ${account.slug}.`);
  if (Number(account.endSeconds) > Number(data.recordedDurationSeconds) + 0.1) throw new Error(`Role video range exceeds final duration for ${account.slug}.`);
  previousEnd = Number(account.endSeconds);

  const controllerPath = path.join(workspace, ...String(account.controller).split('/'));
  if (!fs.existsSync(controllerPath)) throw new Error(`Missing controller: ${account.controller}`);

  if (!Array.isArray(account.workflows) || !account.workflows.length) {
    throw new Error(`Account ${account.slug} must contain individually measured workflows.`);
  }
  const rawWorkflows = account.workflows;
  const usedSlugs = new Set();
  let previousWorkflowEnd = Number(account.startSeconds);
  const workflows = rawWorkflows.map((workflow, workflowIndex) => {
    if (!validStatuses.has(workflow.status)) throw new Error(`Invalid workflow status for ${account.slug}: ${workflow.status}`);
    if (workflow.timelineMeasured !== true || !(Number(workflow.sourceEndElapsedMilliseconds) > Number(workflow.sourceStartElapsedMilliseconds))) {
      throw new Error(`Workflow ${account.slug}/${workflow.slug ?? workflowIndex + 1} does not have a measured video-event range.`);
    }
    const startSeconds = Number(workflow.startSeconds);
    const endSeconds = Number(workflow.endSeconds);
    if (startSeconds < Number(account.startSeconds) - 0.1 || endSeconds > Number(account.endSeconds) + 0.1 || endSeconds < startSeconds) {
      throw new Error(`Workflow video range is outside the role range for ${account.slug}: ${workflow.name}`);
    }
    if (startSeconds < previousWorkflowEnd - 0.1) throw new Error(`Workflow video ranges overlap for ${account.slug}: ${workflow.name}`);
    previousWorkflowEnd = endSeconds;
    const slug = workflow.slug ? String(workflow.slug) : `${String(workflowIndex + 1).padStart(2, '0')}-${slugify(workflow.name)}`;
    if (!/^[a-z0-9-]+$/.test(slug) || usedSlugs.has(slug)) throw new Error(`Invalid or duplicate workflow slug for ${account.slug}: ${slug}`);
    usedSlugs.add(slug);
    const steps = Array.isArray(workflow.steps) ? workflow.steps : [];
    for (const step of steps) {
      if (step.status && !validStatuses.has(step.status)) throw new Error(`Invalid step status for ${account.slug}/${slug}: ${step.status}`);
    }
    const requiredFailureObservationSeconds = Number(manifest.failurePolicy?.observationTimeoutSeconds ?? 0);
    if (workflow.status === 'FAIL' && requiredFailureObservationSeconds > 0) {
      if (Number(workflow.failureObservationSeconds) !== requiredFailureObservationSeconds) {
        throw new Error(`Failed workflow ${account.slug}/${slug} must record failureObservationSeconds=${requiredFailureObservationSeconds}.`);
      }
      const timeoutRecorded = steps.some((step) => new RegExp(`\\b${requiredFailureObservationSeconds}\\s*seconds?\\b`, 'i').test(`${step.action ?? ''} ${step.expected ?? ''} ${step.actual ?? ''}`));
      if (!timeoutRecorded) {
        throw new Error(`Failed workflow ${account.slug}/${slug} must include an executed step recording the ${requiredFailureObservationSeconds}-second failure observation.`);
      }
    }
    const screenshots = screenshotNames(workflow);
    for (const screenshot of screenshots) {
      if (!/^[A-Za-z0-9_.-]+\.png$/.test(screenshot)) throw new Error(`Invalid screenshot filename: ${screenshot}`);
      const screenshotPath = path.join(roleRoot, account.slug, 'screenshots', screenshot);
      if (!fs.existsSync(screenshotPath)) throw new Error(`Missing screenshot: ${screenshotPath}`);
    }
    const navigation = Array.isArray(workflow.navigation) ? workflow.navigation : [];
    const allowedEvidence = new Set(['Observed', 'Expected/inferred', 'Not observed']);
    for (const [eventIndex, event] of navigation.entries()) {
      if (!allowedEvidence.has(event.evidence)) throw new Error(`Invalid navigation evidence classification for ${account.slug}/${slug} event ${eventIndex + 1}.`);
      if (!/^https:\/\/[A-Za-z0-9.-]+(?::\d+)?$/.test(event.origin ?? '')) throw new Error(`Navigation origin must contain only scheme and host for ${account.slug}/${slug} event ${eventIndex + 1}.`);
      if (!/^\/[^?#]*$/.test(event.path ?? '')) throw new Error(`Navigation path must be sanitized and exclude query/fragment data for ${account.slug}/${slug} event ${eventIndex + 1}.`);
      if (/\/token\/(?!\{REDACTED\}(?:\/|$))/i.test(event.path)) throw new Error(`Navigation token path is not redacted for ${account.slug}/${slug} event ${eventIndex + 1}.`);
      if (!Array.isArray(event.queryKeys) || event.queryKeys.some((key) => !/^[A-Za-z0-9_.!~-]+$/.test(key))) throw new Error(`Navigation queryKeys are invalid for ${account.slug}/${slug} event ${eventIndex + 1}.`);
      if (typeof event.action !== 'string' || typeof event.result !== 'string') throw new Error(`Navigation action/result is missing for ${account.slug}/${slug} event ${eventIndex + 1}.`);
    }
    const isTimeAttendance = isTimeAttendanceWorkflow(account, workflow);
    if (isTimeAttendance && !Array.isArray(workflow.http404s)) {
      throw new Error(`TA workflow ${account.slug}/${slug} must provide an http404s array, using [] when no HTTP 404 was observed.`);
    }
    const http404s = Array.isArray(workflow.http404s) ? workflow.http404s : [];
    for (const [eventIndex, event] of http404s.entries()) {
      if (Number(event.status) !== 404) throw new Error(`HTTP 404 evidence must have status 404 for ${account.slug}/${slug} event ${eventIndex + 1}.`);
      if (!allowedEvidence.has(event.evidence)) throw new Error(`Invalid HTTP 404 evidence classification for ${account.slug}/${slug} event ${eventIndex + 1}.`);
      if (!/^https:\/\/[A-Za-z0-9.-]+(?::\d+)?$/.test(event.origin ?? '')) throw new Error(`HTTP 404 origin must contain only scheme and host for ${account.slug}/${slug} event ${eventIndex + 1}.`);
      const host = new URL(event.origin).hostname.toLowerCase();
      if (!(organizationConfig.approvedHosts ?? []).some((approved) => String(approved).toLowerCase() === host)) throw new Error(`HTTP 404 origin is not an approved Stage host for ${account.slug}/${slug} event ${eventIndex + 1}.`);
      if (!/^\/[^?#]*$/.test(event.path ?? '')) throw new Error(`HTTP 404 path must be sanitized and exclude query/fragment data for ${account.slug}/${slug} event ${eventIndex + 1}.`);
      if (/\/token\/(?!\{REDACTED\}(?:\/|$))/i.test(event.path)) throw new Error(`HTTP 404 token path is not redacted for ${account.slug}/${slug} event ${eventIndex + 1}.`);
      if (!Array.isArray(event.queryKeys) || event.queryKeys.some((key) => !/^[A-Za-z0-9_.!~-]+$/.test(key))) throw new Error(`HTTP 404 queryKeys are invalid for ${account.slug}/${slug} event ${eventIndex + 1}.`);
      if (typeof event.action !== 'string' || !event.action.trim() || typeof event.impact !== 'string' || !event.impact.trim()) throw new Error(`HTTP 404 action/impact is missing for ${account.slug}/${slug} event ${eventIndex + 1}.`);
    }
    const warnings = Array.isArray(workflow.warnings) ? workflow.warnings : [];
    for (const warning of warnings) {
      if (warning.severity !== 'WARNING') throw new Error(`Invalid warning severity for ${account.slug}/${slug}.`);
      if (!/^[A-Z0-9_]+$/.test(warning.code ?? '')) throw new Error(`Invalid warning code for ${account.slug}/${slug}.`);
      for (const field of ['step', 'expected', 'actual']) {
        if (!String(warning[field] ?? '').trim()) throw new Error(`Warning ${warning.code} is missing ${field} for ${account.slug}/${slug}.`);
        if (/https?:\/\/\S*[?#]\S*/i.test(String(warning[field]))) throw new Error(`Warning ${warning.code} contains a non-sanitized URL in ${field} for ${account.slug}/${slug}.`);
      }
      if (!/^[A-Za-z0-9_.-]+\.png$/.test(warning.screenshot ?? '')) throw new Error(`Invalid warning screenshot for ${account.slug}/${slug}.`);
      if (!screenshots.includes(warning.screenshot)) throw new Error(`Warning screenshot must also appear in the workflow screenshots list: ${account.slug}/${slug}/${warning.screenshot}`);
    }
    return {...workflow, slug, startSeconds, endSeconds, steps, screenshots, warnings, navigation, http404s, isTimeAttendance};
  });
  if (workflows.length >= 3) {
    const durations = workflows.map((workflow) => workflow.endSeconds - workflow.startSeconds);
    const nearlyEqual = Math.max(...durations) - Math.min(...durations) <= 0.02;
    const fillsAccount = Math.abs(workflows[0].startSeconds - Number(account.startSeconds)) <= 0.02
      && Math.abs(workflows.at(-1).endSeconds - Number(account.endSeconds)) <= 0.02
      && workflows.slice(1).every((workflow, index) => Math.abs(workflow.startSeconds - workflows[index].endSeconds) <= 0.02);
    if (nearlyEqual && fillsAccount) {
      throw new Error(`Suspicious evenly divided workflow ranges detected for ${account.slug}; measured event boundaries are required.`);
    }
  }
  const workflowCounts = countStatuses(workflows);
  const derivedStatus = workflowCounts.FAIL ? 'FAIL' : workflowCounts.BLOCKED ? 'BLOCKED' : workflowCounts['NOT TESTED'] ? 'NOT TESTED' : 'PASS';
  if (account.status !== derivedStatus) {
    throw new Error(`Role status for ${account.slug} is ${account.status}, but its scenario results require ${derivedStatus}.`);
  }
  const hasTimeAttendance = workflows.some((workflow) => workflow.isTimeAttendance);
  const testUsername = hasTimeAttendance ? resolveTestUsername(account) : '';
  return {...account, controllerPath, workflows, hasTimeAttendance, testUsername};
});

const css = `
:root{--bg:#eef2f7;--panel:#fff;--ink:#172033;--muted:#5e6b7d;--line:#d9e1ec;--navy:#17345f;--blue:#2467c9;--pass:#16835a;--fail:#c33a3a;--blocked:#a56a09;--not:#7752aa;--shadow:0 10px 30px rgba(28,45,72,.09)}
*{box-sizing:border-box}body{margin:0;background:linear-gradient(180deg,#eaf1fa 0,#f7f9fc 330px);color:var(--ink);font:15px/1.55 Inter,Segoe UI,Arial,sans-serif}a{color:var(--blue);text-decoration:none}a:hover{text-decoration:underline}.wrap{width:min(1180px,calc(100% - 32px));margin:0 auto}.hero{background:linear-gradient(135deg,#10284a,#245a9d);color:#fff;padding:38px 0 34px}.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-weight:700;font-size:12px;opacity:.8}.hero h1{margin:7px 0 9px;font-size:34px;line-height:1.15}.hero p{max-width:900px;margin:0;color:#dce9fb}.meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.chip{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);padding:6px 10px;border-radius:999px;font-size:13px}.main{padding:26px 0 50px}.grid{display:grid;gap:15px}.stats{grid-template-columns:repeat(auto-fit,minmax(140px,1fr));margin-bottom:18px}.stat,.panel,.scenario-card{background:var(--panel);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow)}.stat{padding:18px}.stat b{display:block;font-size:29px}.stat span,.muted{color:var(--muted)}.panel{padding:20px;margin-bottom:18px}.panel h2{margin:0 0 12px;font-size:21px}.video{width:100%;max-height:620px;background:#0a0f18;border-radius:10px}.video-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:12px 0 0}.btn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:9px;padding:9px 13px;background:var(--blue);color:#fff;font-weight:700;cursor:pointer}.btn.secondary{background:#e7eef9;color:#17345f}.timeline{color:var(--muted);font-variant-numeric:tabular-nums}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:12px 10px;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}tr:last-child td{border-bottom:0}.badge{display:inline-block;border-radius:999px;padding:4px 9px;font-size:12px;font-weight:800;letter-spacing:.03em}.badge.pass{background:#dcf4e9;color:#0c6947}.badge.fail{background:#fde5e5;color:#a41d1d}.badge.blocked{background:#fff0cf;color:#7b4c00}.badge.not-tested{background:#eee7f8;color:#5c3886}.badge.partial{background:#fff0cf;color:#7b4c00}.scenario-list{grid-template-columns:repeat(2,1fr)}.scenario-card{padding:18px;border-left:5px solid var(--line)}.scenario-card.pass{border-left-color:var(--pass)}.scenario-card.fail{border-left-color:var(--fail)}.scenario-card.blocked{border-left-color:var(--blocked)}.scenario-card.not-tested{border-left-color:var(--not)}.scenario-card h3{margin:8px 0 6px;font-size:17px}.scenario-card p{margin:0;color:var(--muted)}.card-top{display:flex;justify-content:space-between;gap:12px;align-items:center}.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.detail-grid h3,.failure h3{margin:0 0 8px}.detail-grid p{margin:0}.steps{margin:0;padding-left:22px}.steps li+li{margin-top:6px}.failure{border-left:5px solid var(--fail);background:#fff7f7}.blocked-note{border-left-color:var(--blocked);background:#fffaf0}.not-tested-note{border-left-color:var(--not);background:#faf7ff}.shots{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.shot{margin:0}.shot a{display:block}.shot img{width:100%;display:block;border:1px solid var(--line);border-radius:10px;background:#f3f5f8}.shot figcaption{font-size:13px;color:var(--muted);margin-top:7px}.back{display:inline-flex;margin-bottom:15px}.source{font-family:Consolas,monospace;font-size:12px;background:#f3f5f9;border-radius:6px;padding:3px 6px;color:#47556a}.footer{color:var(--muted);font-size:13px;text-align:center;padding:0 0 28px}details pre{white-space:pre-wrap;word-break:break-word;background:#111827;color:#e5e7eb;padding:18px;border-radius:10px;max-height:650px;overflow:auto}@media(max-width:800px){.scenario-list,.detail-grid,.shots{grid-template-columns:1fr}.hero h1{font-size:27px}}@media print{.video-toolbar,.btn,.back,video{display:none}.panel,.stat,.scenario-card{box-shadow:none;break-inside:avoid}}
.badge.warning{background:#fff3c4;color:#735300}.warning-note{border-left:5px solid #d39b09;background:#fffdf3}.warning-note h3{margin:0 0 8px}
`;
const videoScript = `let playbackToken=0;let rangeWatcher=null;const once=(target,event)=>new Promise((resolve)=>target.addEventListener(event,resolve,{once:true}));async function playRange(start,end){const token=++playbackToken;const v=document.getElementById('evidenceVideo');const safeStart=Math.max(0,Number(start)||0);const safeEnd=Math.max(safeStart,Number(end)||safeStart);clearInterval(rangeWatcher);v.pause();if(v.readyState<1)await once(v,'loadedmetadata');if(token!==playbackToken)return;if(Math.abs(v.currentTime-safeStart)>0.05){const sought=once(v,'seeked');v.currentTime=safeStart;await sought}if(token!==playbackToken)return;v.scrollIntoView({behavior:'smooth',block:'center'});await v.play().catch(()=>{});rangeWatcher=setInterval(()=>{if(token!==playbackToken||v.currentTime>=safeEnd-0.03||v.ended){v.pause();clearInterval(rangeWatcher)}},50)}`;
const shell = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${css}</style></head><body>${body}<script>${videoScript}</script></body></html>`;
const issueClass = (status) => status === 'BLOCKED' ? 'blocked-note' : status === 'NOT TESTED' ? 'not-tested-note' : '';
const detailText = (workflow, field) => workflow[field] || workflow.steps.map((step) => step[field]).filter(Boolean).join(' ') || 'No additional detail was recorded.';
const failureSteps = (account, workflow) => {
  const items = workflow.reproduce?.length ? workflow.reproduce : account.reproduce ?? [];
  return items.length ? items : ['Open the role/login-combination report.', `Repeat “${workflow.name}” using the documented controller steps.`, 'Observe the reported result state.'];
};
const navigationMarkup = (navigation) => {
  if (!navigation.length) return '<p class="muted">No sanitized navigation events were recorded.</p>';
  const rows = navigation.map((event, index) => {
    const query = event.queryKeys.length ? `?[${event.queryKeys.map(esc).join(', ')}]=REDACTED` : '';
    return `<tr><td>${index + 1}</td><td>${esc(event.evidence)}</td><td>${esc(event.action)}</td><td><code>${esc(event.origin)}${esc(event.path)}${query}</code></td><td>${esc(event.result)}</td></tr>`;
  }).join('');
  return `<div class="table-wrap"><table><thead><tr><th>#</th><th>Evidence</th><th>Action/source</th><th>Sanitized URL</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table></div>`;
};
const http404Markup = (events) => {
  if (!events.length) return '<p class="muted">No HTTP 404 responses observed.</p>';
  const rows = events.map((event, index) => {
    const query = event.queryKeys.length ? `?[${event.queryKeys.map(esc).join(', ')}]=REDACTED` : '';
    return `<tr><td>${index + 1}</td><td>${esc(event.evidence)}</td><td>${esc(event.action)}</td><td>${esc(event.status)}</td><td><code>${esc(event.origin)}${esc(event.path)}${query}</code></td><td>${esc(event.impact)}</td></tr>`;
  }).join('');
  return `<div class="table-wrap"><table><thead><tr><th>#</th><th>Evidence</th><th>Action/source</th><th>Status</th><th>Sanitized URL</th><th>Impact</th></tr></thead><tbody>${rows}</tbody></table></div>`;
};
const screenshotMarkup = (screenshots, prefix, label) => screenshots.map((name, index) => `<figure class="shot"><a href="${prefix}${esc(name)}"><img loading="lazy" src="${prefix}${esc(name)}" alt="Screenshot evidence ${index + 1} for ${esc(label)}"></a><figcaption>Evidence ${index + 1}: ${esc(name)}</figcaption></figure>`).join('') || '<p class="muted">No scenario-specific screenshot was recorded.</p>';
const warningLabel = (count, capitalized = false) => `${count} ${capitalized ? 'W' : 'w'}arning${count === 1 ? '' : 's'}`;
const warningBadgeMarkup = (workflow) => workflow.warnings.length ? `<span class="badge warning">${warningLabel(workflow.warnings.length, true)}</span>` : '';
const failureObservationMarkup = (workflow) => workflow.status === 'FAIL' && Number(workflow.failureObservationSeconds) > 0
  ? `<p><strong>Failure observation:</strong> The expected result was polled for the full ${esc(workflow.failureObservationSeconds)} seconds before FAIL was finalized.</p>`
  : '';
const warningPanels = (workflow, screenshotPrefix = '', detailLink = '') => workflow.warnings.map((warning) => `<section class="panel warning-note"><div class="card-top"><h3>${esc(warning.code)}</h3><span class="badge warning">WARNING</span></div><p><strong>Step:</strong> ${esc(warning.step)}</p><p><strong>Expected:</strong> ${esc(warning.expected)}</p><p><strong>Actual:</strong> ${esc(warning.actual)}</p>${screenshotPrefix ? `<div class="shots">${screenshotMarkup([warning.screenshot], screenshotPrefix, `${workflow.name} URL warning`)}</div>` : ''}${detailLink ? `<p><a href="${detailLink}">Open complete scenario evidence →</a></p>` : ''}</section>`).join('');

fs.mkdirSync(roleRoot, {recursive: true});

for (const account of normalizedAccounts) {
  const roleDir = path.join(roleRoot, account.slug);
  const scenarioDir = path.join(roleDir, 'scenarios');
  fs.mkdirSync(scenarioDir, {recursive: true});
  fs.mkdirSync(path.join(roleDir, 'screenshots'), {recursive: true});
  const workflowCounts = countStatuses(account.workflows);
  const roleWarningCount = countWarnings(account.workflows);
  const controllerSource = redactControllerSource(fs.readFileSync(account.controllerPath, 'utf8'));
  const roleRows = account.workflows.map((workflow, index) => `<tr><td>${index + 1}</td><td><a href="scenarios/${esc(workflow.slug)}.html"><strong>${esc(workflow.name)}</strong></a><br><span class="source">${esc(workflow.source ?? account.controller)}</span></td><td><span class="badge ${statusClass(workflow.status)}">${esc(workflow.status)}</span> ${warningBadgeMarkup(workflow)}</td><td class="timeline">${range(workflow)}</td><td><button class="btn secondary" onclick="playRange(${workflow.startSeconds},${workflow.endSeconds})">Play range</button></td></tr>`).join('');
  const roleCards = account.workflows.map((workflow, index) => `<article class="scenario-card ${statusClass(workflow.status)}"><div class="card-top"><span class="eyebrow">Scenario ${index + 1}</span><span><span class="badge ${statusClass(workflow.status)}">${esc(workflow.status)}</span> ${warningBadgeMarkup(workflow)}</span></div><h3><a href="scenarios/${esc(workflow.slug)}.html">${esc(workflow.name)}</a></h3><p>${esc(detailText(workflow, 'actual'))}</p></article>`).join('');
  const roleIssues = account.workflows.filter((workflow) => workflow.status !== 'PASS').map((workflow) => `<section class="panel failure ${issueClass(workflow.status)}"><div class="card-top"><h3>${esc(workflow.name)}</h3><span class="badge ${statusClass(workflow.status)}">${esc(workflow.status)}</span></div><p><strong>Observed:</strong> ${esc(detailText(workflow, 'actual'))}</p>${failureObservationMarkup(workflow)}<p><strong>Steps to reproduce:</strong></p><ol class="steps">${failureSteps(account, workflow).map((step) => `<li>${esc(step)}</li>`).join('')}</ol><p><a href="scenarios/${esc(workflow.slug)}.html">Open complete scenario evidence →</a></p></section>`).join('') || '<section class="panel"><p>No failed, blocked, or not-tested scenarios.</p></section>';
  const roleWarnings = account.workflows.flatMap((workflow) => workflow.warnings.length ? [warningPanels(workflow, '', `scenarios/${esc(workflow.slug)}.html`)] : []).join('') || '<section class="panel"><p>No URL warnings were recorded.</p></section>';
  const roleBody = `<header class="hero"><div class="wrap"><div class="eyebrow">Role / login combination ${account.execution} · ${esc(account.status)}</div><h1>${esc(account.name)}</h1><p>${esc(account.summary)}</p><div class="meta"><span class="chip">Run ${esc(runId)}</span><span class="chip">${esc(data.environment)}</span><span class="chip">Fresh browser context</span><span class="chip">Measured video ${range(account)}</span><span class="chip">Full browser + address bar</span><span class="chip">URL contains ${esc(manifest.urlValidation.requiredContains)}</span><span class="chip">${warningLabel(roleWarningCount)}</span><span class="chip">${esc(account.controller)}</span></div></div></header><main class="main"><div class="wrap"><a class="back" href="../../index.html">← Back to multi-user dashboard</a><section class="grid stats"><div class="stat"><b>${account.workflows.length}</b><span>Total scenarios</span></div><div class="stat"><b>${workflowCounts.PASS}</b><span>Passed</span></div><div class="stat"><b>${workflowCounts.FAIL}</b><span>Failed</span></div><div class="stat"><b>${workflowCounts.BLOCKED}</b><span>Blocked</span></div><div class="stat"><b>${workflowCounts['NOT TESTED']}</b><span>Not tested</span></div><div class="stat"><b>${roleWarningCount}</b><span>Warnings</span></div></section><section class="panel"><h2>Continuous full-browser video evidence</h2><video id="evidenceVideo" class="video" controls preload="metadata" src="../../${esc(data.video)}"></video><div class="video-toolbar"><button class="btn" onclick="playRange(${account.startSeconds},${account.endSeconds})">Play this role execution</button><span class="timeline">${range(account)}</span></div><p>One headed Chrome outer-window recording, including the address bar, is shared by the complete run. The run started in a fresh isolated automation context and did not reuse an existing tab or prior authenticated session. Every range comes from measured execution events aligned to the finalized video; no equal-time estimation is used. No blur, masking, dimming, annotation, overlay, or chapter card is applied.</p></section><section class="panel"><h2>Execution timeline</h2><p>Select a scenario name for its full steps, expected/actual result, full-browser screenshot evidence, URL warnings, and measured playback control.</p><div class="table-wrap"><table><thead><tr><th>#</th><th>Scenario</th><th>Status and warnings</th><th>Video range</th><th>Evidence</th></tr></thead><tbody>${roleRows}</tbody></table></div></section><h2>Scenario outcomes</h2><section class="grid scenario-list">${roleCards}</section><h2>URL warnings</h2>${roleWarnings}<h2>Failures and blocked flows</h2>${roleIssues}<section class="panel"><h2>Role / login-combination result</h2><div class="detail-grid"><div><h3>Expected</h3><p>${esc(account.expected)}</p></div><div><h3>Actual</h3><p>${esc(account.actual)}</p></div></div><p><strong>Safety and cleanup:</strong> ${esc(account.cleanup)}</p></section><section class="panel"><details><summary><strong>Complete controller structure</strong></summary><p class="source">${esc(account.controller)}</p><pre>${esc(controllerSource)}</pre></details></section></div></main><footer class="footer"><div class="wrap">Generated from measured execution events. Credentials, tokens, cookies, and session identifiers are intentionally omitted.</div></footer>`;
  const roleBodyWithTestUsername = (account.hasTimeAttendance
    ? roleBody.replace('</div></div></header>', `<span class="chip">Test username: ${esc(account.testUsername)}</span></div></div></header>`)
    : roleBody).replace('Credentials, tokens, cookies, and session identifiers are intentionally omitted.', 'Passwords, tokens, cookies, and session identifiers are intentionally omitted.');
  fs.writeFileSync(path.join(roleDir, 'index.html'), shell(`${account.name} · ${runId}`, roleBodyWithTestUsername));

  for (const [workflowIndex, workflow] of account.workflows.entries()) {
    const reproduce = workflow.status === 'PASS' ? '' : `<section class="panel failure ${issueClass(workflow.status)}"><h2>${workflow.status === 'FAIL' ? 'Failure and steps to reproduce' : 'Result reason and reproduction'}</h2><p>${esc(detailText(workflow, 'actual'))}</p>${failureObservationMarkup(workflow)}<ol class="steps">${failureSteps(account, workflow).map((step) => `<li>${esc(step)}</li>`).join('')}</ol></section>`;
    const stepRows = workflow.steps.map((step, stepIndex) => `<tr><td>${stepIndex + 1}</td><td>${esc(step.action)}</td><td>${esc(step.expected)}</td><td>${esc(step.actual)}</td><td><span class="badge ${statusClass(step.status ?? workflow.status)}">${esc(step.status ?? workflow.status)}</span></td></tr>`).join('');
    const executedSteps = stepRows ? `<div class="table-wrap"><table><thead><tr><th>#</th><th>Action</th><th>Expected</th><th>Actual</th><th>Status</th></tr></thead><tbody>${stepRows}</tbody></table></div>` : '<p class="muted">No individual step rows were recorded.</p>';
    const warningEvidence = workflow.warnings.length ? `<h2>URL warnings</h2>${warningPanels(workflow, '../screenshots/')}` : '<section class="panel"><h2>URL warnings</h2><p>No URL warnings were recorded.</p></section>';
    const failureObservationChip = workflow.status === 'FAIL' && Number(workflow.failureObservationSeconds) > 0 ? `<span class="chip">Failure wait ${esc(workflow.failureObservationSeconds)} seconds</span>` : '';
    const detailBody = `<header class="hero"><div class="wrap"><div class="eyebrow">Scenario evidence · ${esc(workflow.status)}</div><h1>${esc(workflow.name)}</h1><div class="meta"><span class="chip">Video ${range(workflow)}</span>${failureObservationChip}<span class="chip">Full browser + address bar</span><span class="chip">URL contains ${esc(manifest.urlValidation.requiredContains)}</span><span class="chip">${warningLabel(workflow.warnings.length)}</span><span class="chip">${esc(workflow.source ?? account.controller)}</span><span class="chip">${esc(account.name)}</span></div></div></header><main class="main"><div class="wrap"><a class="back" href="../index.html">← Back to role report</a><section class="panel"><div class="card-top"><h2>Scenario result</h2><span><span class="badge ${statusClass(workflow.status)}">${esc(workflow.status)}</span> ${warningBadgeMarkup(workflow)}</span></div><div class="detail-grid"><div><h3>Expected</h3><p>${esc(detailText(workflow, 'expected'))}</p></div><div><h3>Actual</h3><p>${esc(detailText(workflow, 'actual'))}</p></div></div></section><section class="panel"><h2>Executed steps</h2>${executedSteps}</section>${warningEvidence}${reproduce}<section class="panel"><h2>Scenario full-browser video evidence</h2><video id="evidenceVideo" class="video" controls preload="metadata" src="../../../${esc(data.video)}"></video><div class="video-toolbar"><button class="btn" onclick="playRange(${workflow.startSeconds},${workflow.endSeconds})">Play this scenario</button><span class="timeline">${range(workflow)} in the continuous recording</span></div></section><section class="panel"><h2>Full-browser screenshot evidence</h2><p>The complete Chrome window, including the address bar, is preserved in each image.</p><div class="shots">${screenshotMarkup(workflow.screenshots, '../screenshots/', workflow.name)}</div></section></div></main><footer class="footer"><div class="wrap">Role-specific execution evidence. Credentials and session secrets are omitted.</div></footer>`;
    const taEvidence = workflow.isTimeAttendance
      ? `<section class="panel"><h2>Test account</h2><p><strong>Test username:</strong> ${esc(account.testUsername)}</p></section><section class="panel"><h2>HTTP 404 observations</h2>${http404Markup(workflow.http404s)}</section>`
      : '';
    const detailBodyWithTaEvidence = workflow.isTimeAttendance
      ? detailBody
        .replace('</div></div></header>', `<span class="chip">Test username: ${esc(account.testUsername)}</span></div></div></header>`)
        .replace('<a class="back" href="../index.html">← Back to role report</a>', `<a class="back" href="../index.html">← Back to role report</a>${taEvidence}`)
      : detailBody;
    const detailBodyWithNavigation = detailBodyWithTaEvidence.replace(
      '<section class="panel"><h2>Scenario full-browser video evidence</h2>',
      `<section class="panel"><h2>Sanitized redirect sequence</h2>${navigationMarkup(workflow.navigation)}</section><section class="panel"><h2>Scenario full-browser video evidence</h2>`
    );
    const detailBodyWithSafetyNotice = detailBodyWithNavigation.replace('Credentials and session secrets are omitted.', 'Passwords and session secrets are omitted.');
    fs.writeFileSync(path.join(scenarioDir, `${workflow.slug}.html`), shell(`${workflowIndex + 1}. ${workflow.name}`, detailBodyWithSafetyNotice));
  }
}

const allWorkflows = normalizedAccounts.flatMap((account) => account.workflows);
const scenarioCounts = countStatuses(allWorkflows);
const totalWarningCount = countWarnings(allWorkflows);
const resultCountMarkup = (workflows) => {
  const resultCounts = countStatuses(workflows);
  const warnings = countWarnings(workflows);
  const notTested = resultCounts['NOT TESTED'] ? `<span class="badge not-tested">${resultCounts['NOT TESTED']} Not tested</span>` : '';
  const warningBadge = warnings ? `<span class="badge warning">${warnings} Warning${warnings === 1 ? '' : 's'}</span>` : '';
  return `<div style="display:flex;flex-wrap:wrap;gap:6px"><span class="badge pass">${resultCounts.PASS} Passed</span><span class="badge fail">${resultCounts.FAIL} Failed</span><span class="badge blocked">${resultCounts.BLOCKED} Blocked</span>${notTested}${warningBadge}</div>`;
};
const rows = normalizedAccounts.map((account) => `<tr><td>${account.execution}</td><td><a href="roles/${esc(account.slug)}/index.html"><strong>${esc(account.name)}</strong></a><br><span class="source">${esc(account.controller)}</span>${account.hasTimeAttendance ? `<br><strong>Test username:</strong> ${esc(account.testUsername)}` : ''}</td><td>${resultCountMarkup(account.workflows)}</td><td class="timeline">${range(account)}</td><td><button class="btn secondary" onclick="playRange(${account.startSeconds},${account.endSeconds})">Play range</button></td></tr>`).join('');
const cards = normalizedAccounts.map((account) => `<article class="scenario-card ${statusClass(account.status)}"><div class="card-top"><span class="eyebrow">Execution ${account.execution}</span>${resultCountMarkup(account.workflows)}</div><h3><a href="roles/${esc(account.slug)}/index.html">${esc(account.name)}</a></h3><p>${esc(account.summary)}</p></article>`).join('');
const issues = normalizedAccounts.filter((account) => account.status !== 'PASS').map((account) => `<section class="panel failure ${issueClass(account.status)}"><div class="card-top"><h3>${account.execution}. ${esc(account.name)}</h3>${resultCountMarkup(account.workflows)}</div><p><strong>Observed:</strong> ${esc(account.actual ?? account.summary)}</p><p><strong>Steps to reproduce:</strong></p><ol class="steps">${(account.reproduce?.length ? account.reproduce : ['Open the linked role report.', 'Repeat the controller steps for the affected role context.', 'Observe the reported result state.']).map((step) => `<li>${esc(step)}</li>`).join('')}</ol><p><a href="roles/${esc(account.slug)}/index.html">Open complete role evidence →</a></p></section>`).join('') || '<section class="panel"><p>No failed, blocked, or not-tested role executions.</p></section>';
const warningSummary = normalizedAccounts.flatMap((account) => account.workflows.filter((workflow) => workflow.warnings.length).map((workflow) => `<section class="panel warning-note"><div class="card-top"><h3>${esc(account.name)} · ${esc(workflow.name)}</h3>${warningBadgeMarkup(workflow)}</div><p>The workflow retained status <strong>${esc(workflow.status)}</strong>. The warning is supplemental and does not alter status totals.</p><p><a href="roles/${esc(account.slug)}/scenarios/${esc(workflow.slug)}.html">Open warning details and screenshot →</a></p></section>`)).join('') || '<section class="panel"><p>No URL warnings were recorded.</p></section>';
const indexBody = `<header class="hero"><div class="wrap"><div class="eyebrow">Execution report · AES Stage ML · Organization ${esc(organizationId)}</div><h1>Multi-user full-suite validation</h1><p>${expectedRoleReports} role/login-combination controllers were evaluated in a fresh isolated headed Chrome automation context with one shared continuous full-browser evidence video.</p><div class="meta"><span class="chip">Organization ${esc(organizationId)}</span><span class="chip">Run ${esc(runId)}</span><span class="chip">${esc(data.environment)}</span><span class="chip">${esc(data.mode)}</span><span class="chip">Fresh browser context</span><span class="chip">${fmt(data.recordedDurationSeconds)} continuous video</span><span class="chip">Full browser + address bar</span><span class="chip">URL contains ${esc(manifest.urlValidation.requiredContains)}</span><span class="chip">${fmt(Number(data.sourceElapsedMilliseconds) / 1000)} measured browser elapsed</span><span class="chip">Measured timeline</span><span class="chip">${allWorkflows.length} scenario/context validations</span><span class="chip">${scenarioCounts.PASS} passed · ${scenarioCounts.FAIL} failed · ${scenarioCounts.BLOCKED} blocked · ${scenarioCounts['NOT TESTED']} not tested · ${warningLabel(totalWarningCount)}</span></div></div></header><main class="main"><div class="wrap"><section class="grid stats"><div class="stat"><b>${expectedRoleReports}</b><span>Total role reports</span></div><div class="stat"><b>${allWorkflows.length}</b><span>Scenario/context validations</span></div><div class="stat"><b>${scenarioCounts.PASS}</b><span>Passed</span></div><div class="stat"><b>${scenarioCounts.FAIL}</b><span>Failed</span></div><div class="stat"><b>${scenarioCounts.BLOCKED}</b><span>Blocked</span></div><div class="stat"><b>${scenarioCounts['NOT TESTED']}</b><span>Not tested</span></div><div class="stat"><b>${totalWarningCount}</b><span>Warnings</span></div></section><section class="panel"><h2>Continuous full-browser video evidence</h2><video id="evidenceVideo" class="video" controls preload="metadata" src="${esc(data.video)}"></video><div class="video-toolbar"><button class="btn" onclick="playRange(0,${data.recordedDurationSeconds})">Play full execution</button><span class="timeline">00:00–${fmt(data.recordedDurationSeconds)}</span></div><p>One 1280×720 headed Chrome outer-window video, including the address bar, covers the complete browser execution. The run started in a fresh isolated automation context and did not reuse an existing tab or prior authenticated session. Scenario ranges come from monotonic measured start/end events aligned to the finalized video; evenly divided estimates are rejected. No blur, masking, dimming, action annotation, overlay, or chapter card is applied.</p></section><section class="panel"><h2>Execution timeline</h2><p>Select a role/login-combination name for its complete structure, scenario pages, full-browser screenshots, URL warnings, and measured playback controls. Each row shows the scenario result and warning counts for that execution.</p><div class="table-wrap"><table><thead><tr><th>#</th><th>Role / login combination</th><th>Scenario results</th><th>Video range</th><th>Evidence</th></tr></thead><tbody>${rows}</tbody></table></div></section><h2>Scenario outcomes by execution</h2><section class="grid scenario-list">${cards}</section><h2>URL warnings</h2>${warningSummary}<h2>Failures and blocked flows</h2>${issues}</div></main><footer class="footer"><div class="wrap">Generated ${esc(data.executedAt)} from measured video events. Credentials, tokens, cookies, and session identifiers are intentionally omitted.</div></footer>`;
const indexBodyWithSafetyNotice = indexBody.replace('Credentials, tokens, cookies, and session identifiers are intentionally omitted.', 'Passwords, tokens, cookies, and session identifiers are intentionally omitted.');
fs.writeFileSync(path.join(runDir, 'index.html'), shell(`Multi-user full suite · ${runId}`, indexBodyWithSafetyNotice));

const timeline = {
  organizationId,
  runId,
  reportFormat: 'migrated-user-navigation-reference-v3',
  video: data.video,
  recordedDurationSeconds: Number(data.recordedDurationSeconds),
  timelineSource: data.timelineSource,
  sourceElapsedMilliseconds: Number(data.sourceElapsedMilliseconds),
  videoTimelineScale: Number(data.videoTimelineScale),
  recordingStartedAtUtc: data.recordingStartedAtUtc,
  recordingEndedAtUtc: data.recordingEndedAtUtc,
  capture: manifest.capture,
  warningCount: totalWarningCount,
  note: 'One continuous full-browser headed-Chrome recording with address bar visible. No blur, masking, dimming, overlays, annotations, or chapter cards.',
  roles: normalizedAccounts.map((account) => ({
    execution: account.execution,
    name: account.name,
    slug: account.slug,
    report: `roles/${account.slug}/index.html`,
    controller: account.controller,
    status: account.status,
    warningCount: countWarnings(account.workflows),
    startSeconds: Number(account.startSeconds),
    endSeconds: Number(account.endSeconds),
    range: range(account),
    scenarios: account.workflows.map((workflow) => ({name: workflow.name, slug: workflow.slug, report: `roles/${account.slug}/scenarios/${workflow.slug}.html`, status: workflow.status, warningCount: workflow.warnings.length, timelineMeasured: true, sourceStartElapsedMilliseconds: workflow.sourceStartElapsedMilliseconds, sourceEndElapsedMilliseconds: workflow.sourceEndElapsedMilliseconds, startSeconds: workflow.startSeconds, endSeconds: workflow.endSeconds, range: range(workflow)}))
  }))
};
fs.writeFileSync(path.join(runDir, 'timeline.json'), JSON.stringify(timeline, null, 2) + '\n');
fs.writeFileSync(path.join(runDir, 'report-format.json'), JSON.stringify({name: 'Migrated User Navigation Reference', version: 3, roleDirectory: 'roles', oneContinuousVideo: true, fullBrowserWindow: true, addressBarVisible: true, urlWarnings: true, measuredTimeline: true, blur: false, overlays: false}, null, 2) + '\n');
console.log(`Generated one dashboard, ${normalizedAccounts.length} role/login-combination reports, ${normalizedAccounts.reduce((total, account) => total + account.workflows.length, 0)} scenario reports, and ${warningLabel(totalWarningCount)} for ${runId}.`);
