import fs from 'node:fs';
import path from 'node:path';

const workspace = process.cwd();
const organizationId = process.argv[2];
const runId = process.argv[3];
const writeIndex = process.argv.includes('--index');
if (!/^\d+$/.test(organizationId ?? '') || !/^\d{8}-\d{6}$/.test(runId ?? '')) {
  throw new Error('Usage: node scripts/generate-parallel-run-summary-report.mjs <OrgId> <YYYYMMDD-HHmmss> [--index]');
}

const runDir = path.join(workspace, 'reports', 'full-suite', organizationId, runId);
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
const manifest = readJson(path.join(runDir, 'run-manifest.json'));
const summary = readJson(path.join(runDir, 'parallel-run-summary.json'));
if (String(manifest.organizationId) !== organizationId || String(summary.organizationId) !== organizationId || summary.runId !== runId) {
  throw new Error('Parallel manifest/summary does not match the requested run.');
}

const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const rel = (...parts) => parts.join('/');
const exists = (...parts) => fs.existsSync(path.join(runDir, ...parts));
const size = (...parts) => exists(...parts) ? fs.statSync(path.join(runDir, ...parts)).size : 0;
const statusClass = (status) => String(status).toLowerCase().replace(/[^a-z0-9]+/g, '-');
const lanesById = new Map((summary.lanes ?? []).map((lane) => [Number(lane.laneId), lane]));
const scenarioScope = manifest.scenarioScope?.name ?? 'full';
const scopeLabel = scenarioScope === 'time-and-attendance' ? 'Time & Attendance scenarios 29-46 only' : 'Full scenario scope';

const laneDetails = (manifest.lanes ?? []).map((lane) => {
  const slug = String(lane.slug);
  const result = lanesById.get(Number(lane.laneId)) ?? {status: 'UNKNOWN', artifactFailure: 'lane result was not recorded'};
  const artifacts = {
    observations: exists('lanes', slug, 'execution-observations.json'),
    events: exists('lanes', slug, 'video-events.json'),
    metadata: exists('lanes', slug, 'browser-window-video-metadata.json'),
    video: size('lanes', slug, 'videos', `${slug}.webm`) >= 1024
  };
  const missing = Object.entries(artifacts).filter(([, present]) => !present).map(([name]) => name);
  return {...lane, ...result, artifacts, missing};
});

const laneRows = laneDetails.map((lane) => {
  const status = lane.missing.length ? (lane.status === 'SUCCEEDED' ? 'INCOMPLETE' : lane.status) : lane.status;
  const links = [];
  if (lane.artifacts.video) links.push(`<a href="${rel('lanes', lane.slug, 'videos', `${lane.slug}.webm`)}">Video</a>`);
  if (lane.artifacts.observations) links.push(`<a href="${rel('lanes', lane.slug, 'execution-observations.json')}">Observations</a>`);
  if (lane.artifacts.events) links.push(`<a href="${rel('lanes', lane.slug, 'video-events.json')}">Timeline events</a>`);
  const issue = lane.artifactFailure || (lane.missing.length ? `Missing now: ${lane.missing.join(', ')}` : 'All required lane artifacts are present.');
  return `<tr><td>${esc(lane.laneId)}</td><td><strong>${esc(lane.slug)}</strong><br><span>${esc((lane.controllers ?? []).join(', '))}</span></td><td><span class="badge ${statusClass(status)}">${esc(status)}</span></td><td>${esc(issue)}</td><td>${links.join(' · ') || 'No lane evidence available'}</td></tr>`;
}).join('');

const accountRows = (manifest.accounts ?? []).map((account) => {
  const lane = (manifest.lanes ?? []).find((item) => Number(item.laneId) === Number(account.laneId));
  const observationPath = lane && path.join(runDir, 'lanes', lane.slug, 'execution-observations.json');
  let observation;
  try { observation = observationPath && readJson(observationPath).accounts?.[account.slug]; } catch { observation = undefined; }
  const overrides = Object.values(observation?.overrides ?? {});
  const counts = overrides.reduce((result, item) => {
    const status = String(item?.status ?? 'PASS').toUpperCase();
    result[status] = (result[status] ?? 0) + 1;
    return result;
  }, {});
  const screenshotsDir = path.join(runDir, 'roles', account.slug, 'screenshots');
  const screenshotCount = fs.existsSync(screenshotsDir) ? fs.readdirSync(screenshotsDir, {withFileTypes: true}).filter((item) => item.isFile()).length : 0;
  const reportPath = rel('roles', account.slug, 'index.html');
  const name = exists('roles', account.slug, 'index.html') ? `<a href="${reportPath}">${esc(account.name)}</a>` : esc(account.name);
  const recorded = overrides.length
    ? `${counts.PASS ?? 0} pass, ${counts.FAIL ?? 0} fail, ${counts.BLOCKED ?? 0} blocked, ${counts['NOT TESTED'] ?? 0} not tested in explicit observations`
    : 'No execution observations available';
  return `<tr><td>${esc(account.execution)}</td><td><strong>${name}</strong><br><span>${esc(account.controller)}</span></td><td>${esc(lane?.slug ?? `lane-${account.laneId}`)}</td><td>${esc(recorded)}</td><td>${screenshotCount}</td></tr>`;
}).join('');

const incomplete = laneDetails.filter((lane) => lane.status !== 'SUCCEEDED' || lane.missing.length).length;
const completed = laneDetails.length - incomplete;
const post = summary.postProcessing ?? {};
const postStatus = post.status ?? 'NOT STARTED';
const postMessage = post.error || post.message || (post.stage ? `Current stage: ${post.stage}` : 'Detailed report post-processing has not completed.');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Parallel run ${esc(runId)}</title><style>
:root{color-scheme:light;font-family:Inter,Segoe UI,Arial,sans-serif;color:#172033;background:#f3f6fb}*{box-sizing:border-box}body{margin:0}.wrap{max-width:1180px;margin:auto;padding:0 22px}.hero{background:linear-gradient(135deg,#123f78,#2474bd);color:#fff;padding:40px 0}.eyebrow{font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;opacity:.85}h1{margin:8px 0 12px;font-size:clamp(28px,5vw,48px)}.hero p{max-width:850px;margin:0;line-height:1.55}.main{padding:24px 0 48px}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.stat,.panel{background:#fff;border:1px solid #dce4ef;border-radius:14px;box-shadow:0 8px 24px #163b6d12}.stat{padding:18px}.stat b{display:block;font-size:28px;color:#174f8d}.stat span,td span{font-size:12px;color:#667085}.panel{padding:20px;margin-top:18px}h2{margin:0 0 14px}.table{overflow:auto}table{border-collapse:collapse;width:100%;min-width:820px}th,td{text-align:left;padding:12px;border-bottom:1px solid #e5eaf1;vertical-align:top;line-height:1.4}th{font-size:12px;text-transform:uppercase;color:#667085}.badge{display:inline-block;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:800;background:#e9eef5}.succeeded{background:#dcfce7;color:#166534}.failed,.failed-artifacts,.timed-out,.incomplete{background:#fee2e2;color:#991b1b}.running,.pending{background:#fef3c7;color:#92400e}.message{border-left:5px solid #d97706;background:#fffbeb;padding:14px 16px;border-radius:8px;line-height:1.5}a{color:#0b61a4;font-weight:650}@media(max-width:760px){.grid{grid-template-columns:repeat(2,1fr)}}@media print{.hero{background:#174f8d!important}.panel,.stat{box-shadow:none}}
</style></head><body><header class="hero"><div class="wrap"><div class="eyebrow">Parallel execution evidence · Organization ${esc(organizationId)}</div><h1>Run ${esc(runId)}</h1><p>This dashboard is created before strict timeline finalization so every parallel run has an HTML entry point. When detailed post-processing succeeds, the canonical scenario dashboard replaces this page.</p></div></header><main class="main"><div class="wrap"><section class="grid"><div class="stat"><b>${laneDetails.length}</b><span>Parallel lanes</span></div><div class="stat"><b>${completed}</b><span>Complete lanes</span></div><div class="stat"><b>${incomplete}</b><span>Incomplete lanes</span></div><div class="stat"><b>${esc(postStatus)}</b><span>Detailed report status</span></div></section><section class="panel"><h2>Report processing</h2><div class="message"><strong>${esc(postStatus)}</strong> — ${esc(postMessage)}</div></section><section class="panel"><h2>Lane results and evidence</h2><div class="table"><table><thead><tr><th>Lane</th><th>Controllers</th><th>Status</th><th>Artifact check</th><th>Available evidence</th></tr></thead><tbody>${laneRows}</tbody></table></div></section><section class="panel"><h2>Account observation overview</h2><div class="table"><table><thead><tr><th>#</th><th>Login combination</th><th>Lane</th><th>Recorded outcomes</th><th>Screenshots</th></tr></thead><tbody>${accountRows}</tbody></table></div></section><section class="panel"><h2>Machine-readable details</h2><p><a href="parallel-run-summary.json">Parallel run summary</a> · <a href="run-manifest.json">Run manifest</a></p><p>Credentials, tokens, cookies, session identifiers, and configured usernames are intentionally excluded.</p></section></div></main></body></html>`;

const summaryReport = path.join(runDir, 'parallel-run-summary.html');
const scopedHtml = html.replace('This dashboard is created before strict timeline finalization', `${esc(scopeLabel)}. This dashboard is created before strict timeline finalization`);
fs.writeFileSync(summaryReport, scopedHtml);
if (writeIndex) fs.writeFileSync(path.join(runDir, 'index.html'), scopedHtml);
console.log(`Generated ${path.relative(workspace, summaryReport)}${writeIndex ? ' and fallback index.html' : ''}.`);
