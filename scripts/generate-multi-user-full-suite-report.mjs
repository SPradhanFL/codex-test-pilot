import fs from 'node:fs';
import path from 'node:path';

const workspace = process.cwd();
const runId = process.argv[2];
if (!/^\d{8}-\d{6}$/.test(runId ?? '')) {
  throw new Error('Usage: node scripts/generate-multi-user-full-suite-report.mjs <YYYYMMDD-HHMMSS>');
}

const runDir = path.join(workspace, 'reports', 'full-suite', runId);
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
const data = readJson(path.join(runDir, 'run-data.json'));
const manifest = readJson(path.join(runDir, 'run-manifest.json'));
const roleRoot = path.join(runDir, 'roles');
const validStatuses = new Set(['PASS', 'FAIL', 'BLOCKED', 'NOT TESTED']);
const expectedRoleReports = Number(manifest.expectedRoleReports ?? manifest.expectedAccountReports);

if (!Number.isInteger(expectedRoleReports) || expectedRoleReports < 1) {
  throw new Error('run-manifest.json has an invalid expectedRoleReports value.');
}
if (!Array.isArray(data.accounts) || data.accounts.length !== expectedRoleReports) {
  throw new Error(`Expected exactly ${expectedRoleReports} role/login-combination results, found ${data.accounts?.length ?? 0}.`);
}
if (!(Number(data.recordedDurationSeconds) > 0)) {
  throw new Error('recordedDurationSeconds must be greater than zero.');
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
if (manifest.capture) {
  const capture = manifest.capture;
  const invalidCapture = capture.browser !== 'Chrome'
    || capture.browserMode !== 'headed'
    || Number(capture.videoCount) !== 1
    || capture.continuous !== true
    || ['blur', 'masking', 'overlays', 'dimming', 'annotations', 'chapterCards'].some((key) => capture[key] !== false);
  if (invalidCapture) throw new Error('The run manifest does not satisfy the headed-Chrome, one-continuous-video, no-blur/no-overlay capture policy.');
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
const overallStatus = (counts) => counts.FAIL ? 'FAIL' : counts.BLOCKED || counts['NOT TESTED'] ? 'PARTIAL' : 'PASS';
const screenshotNames = (account, workflow) => {
  const selected = Array.isArray(workflow?.screenshots) && workflow.screenshots.length
    ? workflow.screenshots
    : (account.screenshots ?? []);
  return [...new Set(selected)];
};
const redactControllerSource = (source) => source
  .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[identity redacted]')
  .replace(/^(\s*(?:[-*]\s*)?(?:username|user\s*id|email|password|passcode|secret)\s*(?::|=)\s*).+$/gim, '$1[redacted from report]')
  .replace(/("(?:username|userId|email|password|secret)"\s*:\s*")[^"]*(")/gi, '$1[redacted from report]$2');

let previousEnd = 0;
const normalizedAccounts = data.accounts.map((account, accountIndex) => {
  if (account.execution !== accountIndex + 1) throw new Error(`Role execution order is invalid at index ${accountIndex}.`);
  if (!/^[a-z0-9-]+$/.test(account.slug ?? '')) throw new Error(`Invalid role/login-combination slug: ${account.slug}`);
  if (!validStatuses.has(account.status)) throw new Error(`Invalid status for ${account.slug}: ${account.status}`);
  if (Number(account.startSeconds) < 0 || Number(account.endSeconds) < Number(account.startSeconds)) throw new Error(`Invalid video range for ${account.slug}.`);
  if (Number(account.startSeconds) < previousEnd - 0.1) throw new Error(`Overlapping role video range for ${account.slug}.`);
  if (Number(account.endSeconds) > Number(data.recordedDurationSeconds) + 0.1) throw new Error(`Role video range exceeds final duration for ${account.slug}.`);
  previousEnd = Number(account.endSeconds);

  const controllerPath = path.join(workspace, ...String(account.controller).split('/'));
  if (!fs.existsSync(controllerPath)) throw new Error(`Missing controller: ${account.controller}`);

  const rawWorkflows = Array.isArray(account.workflows) && account.workflows.length ? account.workflows : [{
    name: account.name,
    status: account.status,
    startSeconds: account.startSeconds,
    endSeconds: account.endSeconds,
    expected: account.expected,
    actual: account.actual,
    steps: [],
    screenshots: account.screenshots,
    reproduce: account.reproduce
  }];
  const usedSlugs = new Set();
  const workflows = rawWorkflows.map((workflow, workflowIndex) => {
    if (!validStatuses.has(workflow.status)) throw new Error(`Invalid workflow status for ${account.slug}: ${workflow.status}`);
    const startSeconds = Number(workflow.startSeconds ?? account.startSeconds);
    const endSeconds = Number(workflow.endSeconds ?? account.endSeconds);
    if (startSeconds < Number(account.startSeconds) - 0.1 || endSeconds > Number(account.endSeconds) + 0.1 || endSeconds < startSeconds) {
      throw new Error(`Workflow video range is outside the role range for ${account.slug}: ${workflow.name}`);
    }
    const slug = workflow.slug ? String(workflow.slug) : `${String(workflowIndex + 1).padStart(2, '0')}-${slugify(workflow.name)}`;
    if (!/^[a-z0-9-]+$/.test(slug) || usedSlugs.has(slug)) throw new Error(`Invalid or duplicate workflow slug for ${account.slug}: ${slug}`);
    usedSlugs.add(slug);
    const steps = Array.isArray(workflow.steps) ? workflow.steps : [];
    for (const step of steps) {
      if (step.status && !validStatuses.has(step.status)) throw new Error(`Invalid step status for ${account.slug}/${slug}: ${step.status}`);
    }
    const screenshots = screenshotNames(account, workflow);
    for (const screenshot of screenshots) {
      if (!/^[A-Za-z0-9_.-]+\.png$/.test(screenshot)) throw new Error(`Invalid screenshot filename: ${screenshot}`);
      const screenshotPath = path.join(roleRoot, account.slug, 'screenshots', screenshot);
      if (!fs.existsSync(screenshotPath)) throw new Error(`Missing screenshot: ${screenshotPath}`);
    }
    return {...workflow, slug, startSeconds, endSeconds, steps, screenshots};
  });
  const workflowCounts = countStatuses(workflows);
  const derivedStatus = workflowCounts.FAIL ? 'FAIL' : workflowCounts.BLOCKED ? 'BLOCKED' : workflowCounts['NOT TESTED'] ? 'NOT TESTED' : 'PASS';
  if (account.status !== derivedStatus) {
    throw new Error(`Role status for ${account.slug} is ${account.status}, but its scenario results require ${derivedStatus}.`);
  }
  return {...account, controllerPath, workflows};
});

const css = `
:root{--bg:#eef2f7;--panel:#fff;--ink:#172033;--muted:#5e6b7d;--line:#d9e1ec;--navy:#17345f;--blue:#2467c9;--pass:#16835a;--fail:#c33a3a;--blocked:#a56a09;--not:#7752aa;--shadow:0 10px 30px rgba(28,45,72,.09)}
*{box-sizing:border-box}body{margin:0;background:linear-gradient(180deg,#eaf1fa 0,#f7f9fc 330px);color:var(--ink);font:15px/1.55 Inter,Segoe UI,Arial,sans-serif}a{color:var(--blue);text-decoration:none}a:hover{text-decoration:underline}.wrap{width:min(1180px,calc(100% - 32px));margin:0 auto}.hero{background:linear-gradient(135deg,#10284a,#245a9d);color:#fff;padding:38px 0 34px}.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-weight:700;font-size:12px;opacity:.8}.hero h1{margin:7px 0 9px;font-size:34px;line-height:1.15}.hero p{max-width:900px;margin:0;color:#dce9fb}.meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.chip{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);padding:6px 10px;border-radius:999px;font-size:13px}.main{padding:26px 0 50px}.grid{display:grid;gap:15px}.stats{grid-template-columns:repeat(auto-fit,minmax(140px,1fr));margin-bottom:18px}.stat,.panel,.scenario-card{background:var(--panel);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow)}.stat{padding:18px}.stat b{display:block;font-size:29px}.stat span,.muted{color:var(--muted)}.panel{padding:20px;margin-bottom:18px}.panel h2{margin:0 0 12px;font-size:21px}.video{width:100%;max-height:620px;background:#0a0f18;border-radius:10px}.video-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:12px 0 0}.btn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:9px;padding:9px 13px;background:var(--blue);color:#fff;font-weight:700;cursor:pointer}.btn.secondary{background:#e7eef9;color:#17345f}.timeline{color:var(--muted);font-variant-numeric:tabular-nums}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:12px 10px;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}tr:last-child td{border-bottom:0}.badge{display:inline-block;border-radius:999px;padding:4px 9px;font-size:12px;font-weight:800;letter-spacing:.03em}.badge.pass{background:#dcf4e9;color:#0c6947}.badge.fail{background:#fde5e5;color:#a41d1d}.badge.blocked{background:#fff0cf;color:#7b4c00}.badge.not-tested{background:#eee7f8;color:#5c3886}.badge.partial{background:#fff0cf;color:#7b4c00}.scenario-list{grid-template-columns:repeat(2,1fr)}.scenario-card{padding:18px;border-left:5px solid var(--line)}.scenario-card.pass{border-left-color:var(--pass)}.scenario-card.fail{border-left-color:var(--fail)}.scenario-card.blocked{border-left-color:var(--blocked)}.scenario-card.not-tested{border-left-color:var(--not)}.scenario-card h3{margin:8px 0 6px;font-size:17px}.scenario-card p{margin:0;color:var(--muted)}.card-top{display:flex;justify-content:space-between;gap:12px;align-items:center}.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.detail-grid h3,.failure h3{margin:0 0 8px}.detail-grid p{margin:0}.steps{margin:0;padding-left:22px}.steps li+li{margin-top:6px}.failure{border-left:5px solid var(--fail);background:#fff7f7}.blocked-note{border-left-color:var(--blocked);background:#fffaf0}.not-tested-note{border-left-color:var(--not);background:#faf7ff}.shots{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.shot{margin:0}.shot a{display:block}.shot img{width:100%;display:block;border:1px solid var(--line);border-radius:10px;background:#f3f5f8}.shot figcaption{font-size:13px;color:var(--muted);margin-top:7px}.back{display:inline-flex;margin-bottom:15px}.source{font-family:Consolas,monospace;font-size:12px;background:#f3f5f9;border-radius:6px;padding:3px 6px;color:#47556a}.footer{color:var(--muted);font-size:13px;text-align:center;padding:0 0 28px}details pre{white-space:pre-wrap;word-break:break-word;background:#111827;color:#e5e7eb;padding:18px;border-radius:10px;max-height:650px;overflow:auto}@media(max-width:800px){.scenario-list,.detail-grid,.shots{grid-template-columns:1fr}.hero h1{font-size:27px}}@media print{.video-toolbar,.btn,.back,video{display:none}.panel,.stat,.scenario-card{box-shadow:none;break-inside:avoid}}
`;
const videoScript = `let rangeEnd=null;let watcher=null;function playRange(start,end){const v=document.getElementById('evidenceVideo');rangeEnd=end;v.currentTime=Math.max(0,start);v.scrollIntoView({behavior:'smooth',block:'center'});const begin=()=>v.play().catch(()=>{});if(v.readyState>=1)begin();else v.addEventListener('loadedmetadata',begin,{once:true});clearInterval(watcher);watcher=setInterval(()=>{if(rangeEnd!==null&&v.currentTime>=rangeEnd){v.pause();clearInterval(watcher)}},150)}`;
const shell = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${css}</style></head><body>${body}<script>${videoScript}</script></body></html>`;
const issueClass = (status) => status === 'BLOCKED' ? 'blocked-note' : status === 'NOT TESTED' ? 'not-tested-note' : '';
const detailText = (workflow, field) => workflow[field] || workflow.steps.map((step) => step[field]).filter(Boolean).join(' ') || 'No additional detail was recorded.';
const failureSteps = (account, workflow) => {
  const items = workflow.reproduce?.length ? workflow.reproduce : account.reproduce ?? [];
  return items.length ? items : ['Open the role/login-combination report.', `Repeat “${workflow.name}” using the documented controller steps.`, 'Observe the reported result state.'];
};
const screenshotMarkup = (screenshots, prefix, label) => screenshots.map((name, index) => `<figure class="shot"><a href="${prefix}${esc(name)}"><img loading="lazy" src="${prefix}${esc(name)}" alt="Screenshot evidence ${index + 1} for ${esc(label)}"></a><figcaption>Evidence ${index + 1}: ${esc(name)}</figcaption></figure>`).join('') || '<p class="muted">No screenshot was produced for this blocked or not-tested scenario.</p>';

fs.mkdirSync(roleRoot, {recursive: true});

for (const account of normalizedAccounts) {
  const roleDir = path.join(roleRoot, account.slug);
  const scenarioDir = path.join(roleDir, 'scenarios');
  fs.mkdirSync(scenarioDir, {recursive: true});
  fs.mkdirSync(path.join(roleDir, 'screenshots'), {recursive: true});
  const workflowCounts = countStatuses(account.workflows);
  const controllerSource = redactControllerSource(fs.readFileSync(account.controllerPath, 'utf8'));
  const roleRows = account.workflows.map((workflow, index) => `<tr><td>${index + 1}</td><td><a href="scenarios/${esc(workflow.slug)}.html"><strong>${esc(workflow.name)}</strong></a><br><span class="source">${esc(workflow.source ?? account.controller)}</span></td><td><span class="badge ${statusClass(workflow.status)}">${esc(workflow.status)}</span></td><td class="timeline">${range(workflow)}</td><td><button class="btn secondary" onclick="playRange(${workflow.startSeconds},${workflow.endSeconds})">Play range</button></td></tr>`).join('');
  const roleCards = account.workflows.map((workflow, index) => `<article class="scenario-card ${statusClass(workflow.status)}"><div class="card-top"><span class="eyebrow">Scenario ${index + 1}</span><span class="badge ${statusClass(workflow.status)}">${esc(workflow.status)}</span></div><h3><a href="scenarios/${esc(workflow.slug)}.html">${esc(workflow.name)}</a></h3><p>${esc(detailText(workflow, 'actual'))}</p></article>`).join('');
  const roleIssues = account.workflows.filter((workflow) => workflow.status !== 'PASS').map((workflow) => `<section class="panel failure ${issueClass(workflow.status)}"><div class="card-top"><h3>${esc(workflow.name)}</h3><span class="badge ${statusClass(workflow.status)}">${esc(workflow.status)}</span></div><p><strong>Observed:</strong> ${esc(detailText(workflow, 'actual'))}</p><p><strong>Steps to reproduce:</strong></p><ol class="steps">${failureSteps(account, workflow).map((step) => `<li>${esc(step)}</li>`).join('')}</ol><p><a href="scenarios/${esc(workflow.slug)}.html">Open complete scenario evidence →</a></p></section>`).join('') || '<section class="panel"><p>No failed, blocked, or not-tested scenarios.</p></section>';
  const roleBody = `<header class="hero"><div class="wrap"><div class="eyebrow">Role / login combination ${account.execution} · ${esc(account.status)}</div><h1>${esc(account.name)}</h1><p>${esc(account.summary)}</p><div class="meta"><span class="chip">Run ${esc(runId)}</span><span class="chip">${esc(data.environment)}</span><span class="chip">${range(account)} in continuous video</span><span class="chip">${esc(account.controller)}</span></div></div></header><main class="main"><div class="wrap"><a class="back" href="../../index.html">← Back to multi-user dashboard</a><section class="grid stats"><div class="stat"><b>${account.workflows.length}</b><span>Total scenarios</span></div><div class="stat"><b>${workflowCounts.PASS}</b><span>Passed</span></div><div class="stat"><b>${workflowCounts.FAIL}</b><span>Failed</span></div><div class="stat"><b>${workflowCounts.BLOCKED}</b><span>Blocked</span></div><div class="stat"><b>${workflowCounts['NOT TESTED']}</b><span>Not tested</span></div></section><section class="panel"><h2>Continuous video evidence</h2><video id="evidenceVideo" class="video" controls preload="metadata" src="../../${esc(data.video)}"></video><div class="video-toolbar"><button class="btn" onclick="playRange(${account.startSeconds},${account.endSeconds})">Play this role execution</button><span class="timeline">${range(account)}</span></div><p>One headed Chrome recording is shared by the complete run. No blur, masking, dimming, annotation, overlay, or chapter card is applied.</p></section><section class="panel"><h2>Execution timeline</h2><p>Select a scenario name for its full steps, expected/actual result, screenshot evidence, and dedicated playback control.</p><div class="table-wrap"><table><thead><tr><th>#</th><th>Scenario</th><th>Status</th><th>Video range</th><th>Evidence</th></tr></thead><tbody>${roleRows}</tbody></table></div></section><h2>Scenario outcomes</h2><section class="grid scenario-list">${roleCards}</section><h2>Failures and blocked flows</h2>${roleIssues}<section class="panel"><h2>Role / login-combination result</h2><div class="detail-grid"><div><h3>Expected</h3><p>${esc(account.expected)}</p></div><div><h3>Actual</h3><p>${esc(account.actual)}</p></div></div><p><strong>Safety and cleanup:</strong> ${esc(account.cleanup)}</p></section><section class="panel"><details><summary><strong>Complete controller structure</strong></summary><p class="source">${esc(account.controller)}</p><pre>${esc(controllerSource)}</pre></details></section></div></main><footer class="footer"><div class="wrap">Generated from the observed execution. Credentials, tokens, cookies, and session identifiers are intentionally omitted.</div></footer>`;
  fs.writeFileSync(path.join(roleDir, 'index.html'), shell(`${account.name} · ${runId}`, roleBody));

  for (const [workflowIndex, workflow] of account.workflows.entries()) {
    const reproduce = workflow.status === 'PASS' ? '' : `<section class="panel failure ${issueClass(workflow.status)}"><h2>${workflow.status === 'FAIL' ? 'Failure and steps to reproduce' : 'Result reason and reproduction'}</h2><p>${esc(detailText(workflow, 'actual'))}</p><ol class="steps">${failureSteps(account, workflow).map((step) => `<li>${esc(step)}</li>`).join('')}</ol></section>`;
    const stepRows = workflow.steps.map((step, stepIndex) => `<tr><td>${stepIndex + 1}</td><td>${esc(step.action)}</td><td>${esc(step.expected)}</td><td>${esc(step.actual)}</td><td><span class="badge ${statusClass(step.status ?? workflow.status)}">${esc(step.status ?? workflow.status)}</span></td></tr>`).join('');
    const executedSteps = stepRows ? `<div class="table-wrap"><table><thead><tr><th>#</th><th>Action</th><th>Expected</th><th>Actual</th><th>Status</th></tr></thead><tbody>${stepRows}</tbody></table></div>` : '<p class="muted">No individual step rows were recorded.</p>';
    const detailBody = `<header class="hero"><div class="wrap"><div class="eyebrow">Scenario ${workflowIndex + 1} · ${esc(workflow.status)}</div><h1>${esc(workflow.name)}</h1><div class="meta"><span class="chip">Video ${range(workflow)}</span><span class="chip">${esc(workflow.source ?? account.controller)}</span><span class="chip">${esc(account.name)}</span></div></div></header><main class="main"><div class="wrap"><a class="back" href="../index.html">← Back to role report</a><section class="panel"><div class="card-top"><h2>Scenario result</h2><span class="badge ${statusClass(workflow.status)}">${esc(workflow.status)}</span></div><div class="detail-grid"><div><h3>Expected</h3><p>${esc(detailText(workflow, 'expected'))}</p></div><div><h3>Actual</h3><p>${esc(detailText(workflow, 'actual'))}</p></div></div></section><section class="panel"><h2>Executed steps</h2>${executedSteps}</section>${reproduce}<section class="panel"><h2>Scenario video evidence</h2><video id="evidenceVideo" class="video" controls preload="metadata" src="../../../${esc(data.video)}"></video><div class="video-toolbar"><button class="btn" onclick="playRange(${workflow.startSeconds},${workflow.endSeconds})">Play this scenario</button><span class="timeline">${range(workflow)} in the continuous recording</span></div></section><section class="panel"><h2>Screenshot evidence</h2><div class="shots">${screenshotMarkup(workflow.screenshots, '../screenshots/', workflow.name)}</div></section></div></main><footer class="footer"><div class="wrap">Role-specific execution evidence. Credentials and session secrets are omitted.</div></footer>`;
    fs.writeFileSync(path.join(scenarioDir, `${workflow.slug}.html`), shell(`${workflowIndex + 1}. ${workflow.name}`, detailBody));
  }
}

const counts = countStatuses(normalizedAccounts);
const overall = overallStatus(counts);
const rows = normalizedAccounts.map((account) => `<tr><td>${account.execution}</td><td><a href="roles/${esc(account.slug)}/index.html"><strong>${esc(account.name)}</strong></a><br><span class="source">${esc(account.controller)}</span></td><td><span class="badge ${statusClass(account.status)}">${esc(account.status)}</span></td><td class="timeline">${range(account)}</td><td><button class="btn secondary" onclick="playRange(${account.startSeconds},${account.endSeconds})">Play range</button></td></tr>`).join('');
const cards = normalizedAccounts.map((account) => `<article class="scenario-card ${statusClass(account.status)}"><div class="card-top"><span class="eyebrow">Execution ${account.execution}</span><span class="badge ${statusClass(account.status)}">${esc(account.status)}</span></div><h3><a href="roles/${esc(account.slug)}/index.html">${esc(account.name)}</a></h3><p>${esc(account.summary)}</p></article>`).join('');
const issues = normalizedAccounts.filter((account) => account.status !== 'PASS').map((account) => `<section class="panel failure ${issueClass(account.status)}"><div class="card-top"><h3>${account.execution}. ${esc(account.name)}</h3><span class="badge ${statusClass(account.status)}">${esc(account.status)}</span></div><p><strong>Observed:</strong> ${esc(account.actual ?? account.summary)}</p><p><strong>Steps to reproduce:</strong></p><ol class="steps">${(account.reproduce?.length ? account.reproduce : ['Open the linked role report.', 'Repeat the controller steps for the affected role context.', 'Observe the reported result state.']).map((step) => `<li>${esc(step)}</li>`).join('')}</ol><p><a href="roles/${esc(account.slug)}/index.html">Open complete role evidence →</a></p></section>`).join('') || '<section class="panel"><p>No failed, blocked, or not-tested role executions.</p></section>';
const indexBody = `<header class="hero"><div class="wrap"><div class="eyebrow">Execution report · AES Stage ML</div><h1>Multi-user full-suite validation</h1><p>${expectedRoleReports} role/login-combination controllers were evaluated in headed Chrome with one shared continuous evidence video.</p><div class="meta"><span class="chip">Run ${esc(runId)}</span><span class="chip">${esc(data.environment)}</span><span class="chip">${esc(data.mode)}</span><span class="chip">${fmt(data.recordedDurationSeconds)} continuous video</span><span class="chip">Overall ${overall}</span></div></div></header><main class="main"><div class="wrap"><section class="grid stats"><div class="stat"><b>${expectedRoleReports}</b><span>Total role reports</span></div><div class="stat"><b>${counts.PASS}</b><span>Passed</span></div><div class="stat"><b>${counts.FAIL}</b><span>Failed</span></div><div class="stat"><b>${counts.BLOCKED}</b><span>Blocked</span></div><div class="stat"><b>${counts['NOT TESTED']}</b><span>Not tested</span></div></section><section class="panel"><h2>Continuous video evidence</h2><video id="evidenceVideo" class="video" controls preload="metadata" src="${esc(data.video)}"></video><div class="video-toolbar"><button class="btn" onclick="playRange(0,${data.recordedDurationSeconds})">Play full execution</button><span class="timeline">00:00–${fmt(data.recordedDurationSeconds)}</span></div><p>One 1280×720 headed Chrome video covers the complete execution. No blur, masking, dimming, action annotation, overlay, or chapter card is applied.</p></section><section class="panel"><h2>Execution timeline</h2><p>Select a role/login-combination name for its complete structure, scenario pages, screenshot evidence, and dedicated playback controls.</p><div class="table-wrap"><table><thead><tr><th>#</th><th>Role / login combination</th><th>Status</th><th>Video range</th><th>Evidence</th></tr></thead><tbody>${rows}</tbody></table></div></section><h2>Scenario outcomes</h2><section class="grid scenario-list">${cards}</section><h2>Failures and blocked flows</h2>${issues}</div></main><footer class="footer"><div class="wrap">Generated ${esc(data.executedAt)}. Credentials, tokens, cookies, and session identifiers are intentionally omitted.</div></footer>`;
fs.writeFileSync(path.join(runDir, 'index.html'), shell(`Multi-user full suite · ${runId}`, indexBody));

const timeline = {
  runId,
  reportFormat: 'migrated-user-navigation-reference-v1',
  video: data.video,
  recordedDurationSeconds: Number(data.recordedDurationSeconds),
  capture: manifest.capture ?? {browser: 'Chrome', browserMode: 'headed', videoCount: 1, continuous: true, blur: false, overlays: false},
  note: 'One continuous headed-Chrome recording. No blur, masking, dimming, overlays, annotations, or chapter cards.',
  roles: normalizedAccounts.map((account) => ({
    execution: account.execution,
    name: account.name,
    slug: account.slug,
    report: `roles/${account.slug}/index.html`,
    controller: account.controller,
    status: account.status,
    startSeconds: Number(account.startSeconds),
    endSeconds: Number(account.endSeconds),
    range: range(account),
    scenarios: account.workflows.map((workflow) => ({name: workflow.name, slug: workflow.slug, report: `roles/${account.slug}/scenarios/${workflow.slug}.html`, status: workflow.status, startSeconds: workflow.startSeconds, endSeconds: workflow.endSeconds, range: range(workflow)}))
  }))
};
fs.writeFileSync(path.join(runDir, 'timeline.json'), JSON.stringify(timeline, null, 2) + '\n');
fs.writeFileSync(path.join(runDir, 'report-format.json'), JSON.stringify({name: 'Migrated User Navigation Reference', version: 1, roleDirectory: 'roles', oneContinuousVideo: true, blur: false, overlays: false}, null, 2) + '\n');
console.log(`Generated one dashboard, ${normalizedAccounts.length} role/login-combination reports, and ${normalizedAccounts.reduce((total, account) => total + account.workflows.length, 0)} scenario reports for ${runId}.`);
