import fs from 'node:fs';
import path from 'node:path';

const [organizationId, runId] = process.argv.slice(2);
if (!organizationId || !runId) {
  console.error('Usage: node scripts/generate-multi-user-failure-report.mjs <organization-id> <run-id>');
  process.exit(1);
}

const root = process.cwd();
const runDir = path.join(root, 'reports', 'full-suite', organizationId, runId);
const dataPath = path.join(runDir, 'run-data.json');
const outputPath = path.join(runDir, 'index-failure.html');

if (!fs.existsSync(dataPath)) {
  console.error(`Run data was not found: ${dataPath}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const statusOrder = ['FAIL', 'BLOCKED', 'NOT TESTED'];
const statusLabels = { FAIL: 'Failed', BLOCKED: 'Blocked', 'NOT TESTED': 'Not tested' };
const statusClasses = { FAIL: 'fail', BLOCKED: 'blocked', 'NOT TESTED': 'not-tested' };

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const fmt = (seconds) => {
  const value = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = value % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${minutes}:${String(secs).padStart(2, '0')}`;
};

const workflows = data.accounts.flatMap((account, accountIndex) =>
  account.workflows
    .filter((workflow) => statusOrder.includes(workflow.status))
    .map((workflow, workflowIndex) => ({ account, accountIndex, workflow, workflowIndex })),
);

const counts = Object.fromEntries(statusOrder.map((status) => [
  status,
  workflows.filter(({ workflow }) => workflow.status === status).length,
]));

const videoPath = data.video || 'videos/multi-user-full-suite-execution.webm';
const videoDuration = Number(data.recordedDurationSeconds) || Math.max(0, ...workflows.map(({ workflow }) => Number(workflow.endSeconds) || 0));

const renderList = (items, fallback) => {
  const values = Array.isArray(items) && items.length ? items : [fallback];
  return `<ol class="steps">${values.map((item) => `<li>${esc(item)}</li>`).join('')}</ol>`;
};

const renderStepTable = (steps) => {
  if (!Array.isArray(steps) || !steps.length) return '';
  return `<details class="execution-steps"><summary>Execution observations (${steps.length})</summary><div class="table-wrap"><table><thead><tr><th>Action</th><th>Expected</th><th>Actual</th><th>Status</th></tr></thead><tbody>${steps.map((step) => `<tr><td>${esc(step.action)}</td><td>${esc(step.expected)}</td><td>${esc(step.actual)}</td><td><span class="badge ${statusClasses[step.status] || statusClasses.FAIL}">${esc(statusLabels[step.status] || step.status)}</span></td></tr>`).join('')}</tbody></table></div></details>`;
};

const renderScreenshots = (account, workflow) => {
  const screenshots = Array.isArray(workflow.screenshots) ? workflow.screenshots : [];
  if (!screenshots.length) return '<p class="evidence-missing">No workflow-specific screenshot was recorded.</p>';
  return `<div class="shots">${screenshots.map((screenshot, index) => {
    const href = `roles/${account.slug}/screenshots/${screenshot}`;
    return `<figure class="shot"><a href="${esc(href)}" target="_blank" rel="noopener"><img src="${esc(href)}" loading="lazy" alt="${esc(workflow.name)} evidence ${index + 1}"></a><figcaption>Evidence ${index + 1}: ${esc(screenshot)}</figcaption></figure>`;
  }).join('')}</div>`;
};

let sequence = 0;
const sections = statusOrder.map((status) => {
  const items = workflows.filter(({ workflow }) => workflow.status === status);
  return `<section id="${statusClasses[status]}" class="status-section"><div class="section-title"><div><div class="eyebrow">Scenario outcomes</div><h2>${statusLabels[status]} scenarios</h2></div><span class="count ${statusClasses[status]}">${items.length}</span></div>${items.map(({ account, workflow }) => {
    sequence += 1;
    const start = Number(workflow.startSeconds) || 0;
    const end = Math.max(start, Number(workflow.endSeconds) || start);
    const detailHref = `roles/${account.slug}/scenarios/${workflow.slug}.html`;
    const fallbackRepro = `Select the documented ${account.name} context, execute ${workflow.name}, and observe the result shown in the evidence.`;
    return `<article class="case ${statusClasses[status]}">
      <div class="case-head"><div><div class="case-meta">Finding ${sequence} · ${esc(account.name)}</div><h3>${esc(workflow.name)}</h3></div><span class="badge ${statusClasses[status]}">${statusLabels[status]}</span></div>
      <div class="reason"><strong>Reason / observed result</strong><p>${esc(workflow.actual || 'No observed-result detail was recorded.')}</p></div>
      <div class="expected"><strong>Expected result</strong><p>${esc(workflow.expected || 'Complete the documented navigation and display the required page elements.')}</p></div>
      <div class="timeline-box"><div><strong>Measured video timeframe</strong><div class="time">${fmt(start)}–${fmt(end)} <span>(${fmt(end - start)})</span></div></div><button class="btn" type="button" onclick="playRange(${start},${end},this)">Play this scenario</button></div>
      <h4>Steps to reproduce</h4>${renderList(workflow.reproduce, fallbackRepro)}
      ${renderStepTable(workflow.steps)}
      <h4>Screenshot evidence</h4>${renderScreenshots(account, workflow)}
      <div class="case-links"><a href="${esc(detailHref)}">Open complete scenario report →</a><a href="roles/${esc(account.slug)}/index.html">Open role report →</a></div>
    </article>`;
  }).join('')}</section>`;
}).join('');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Failure analysis · Organization ${esc(organizationId)} · ${esc(runId)}</title>
<style>
:root{--bg:#eef2f7;--panel:#fff;--ink:#172033;--muted:#5e6b7d;--line:#d9e1ec;--navy:#17345f;--blue:#2467c9;--fail:#c33a3a;--blocked:#a56a09;--not:#7752aa;--shadow:0 10px 30px rgba(28,45,72,.09)}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:linear-gradient(180deg,#eaf1fa 0,#f7f9fc 330px);color:var(--ink);font:15px/1.55 Inter,Segoe UI,Arial,sans-serif}a{color:var(--blue);text-decoration:none}a:hover{text-decoration:underline}.wrap{width:min(1180px,calc(100% - 32px));margin:0 auto}.hero{background:linear-gradient(135deg,#10284a,#245a9d);color:#fff;padding:38px 0 34px}.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-weight:800;font-size:12px;opacity:.78}.hero h1{margin:7px 0 9px;font-size:34px;line-height:1.15}.hero p{max-width:920px;margin:0;color:#dce9fb}.meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.chip{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);padding:6px 10px;border-radius:999px;font-size:13px}.main{padding:26px 0 50px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:18px}.stat,.panel,.case{background:var(--panel);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow)}.stat{padding:18px}.stat b{display:block;font-size:29px}.stat span,.muted{color:var(--muted)}.stat.fail{border-top:4px solid var(--fail)}.stat.blocked{border-top:4px solid var(--blocked)}.stat.not-tested{border-top:4px solid var(--not)}.panel{padding:20px;margin-bottom:22px}.panel h2{margin:0 0 10px}.nav{display:flex;gap:10px;flex-wrap:wrap}.nav a{display:inline-flex;padding:8px 12px;border:1px solid #cbd8e8;border-radius:9px;background:#f7faff;font-weight:700}.video{width:100%;max-height:620px;background:#0a0f18;border-radius:10px}.video-note{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:10px;color:var(--muted)}.status-section{margin-top:28px}.section-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.section-title h2{margin:2px 0 0}.count{min-width:44px;text-align:center;padding:8px 12px;border-radius:999px;font-size:18px;font-weight:900}.count.fail,.badge.fail{background:#fde5e5;color:#a41d1d}.count.blocked,.badge.blocked{background:#fff0cf;color:#7b4c00}.count.not-tested,.badge.not-tested{background:#eee7f8;color:#5c3886}.case{padding:22px;margin-bottom:18px;border-left:6px solid var(--line);scroll-margin-top:18px}.case.fail{border-left-color:var(--fail)}.case.blocked{border-left-color:var(--blocked)}.case.not-tested{border-left-color:var(--not)}.case-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.case-meta{color:var(--muted);font-weight:700;font-size:13px}.case h3{margin:4px 0 14px;font-size:20px}.case h4{margin:20px 0 8px}.badge{display:inline-block;white-space:nowrap;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:900;letter-spacing:.03em}.reason,.expected{padding:13px 15px;border-radius:9px;margin-top:10px}.reason{background:#fff7f7}.blocked .reason{background:#fffaf0}.not-tested .reason{background:#faf7ff}.expected{background:#f5f8fc}.reason p,.expected p{margin:4px 0 0}.timeline-box{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:13px 15px;margin-top:12px;border:1px solid var(--line);border-radius:10px;background:#fbfcfe}.time{font:700 16px/1.5 Consolas,monospace}.time span{color:var(--muted);font-weight:400}.btn{border:0;border-radius:9px;padding:10px 14px;background:var(--blue);color:#fff;font-weight:800;cursor:pointer}.btn:hover{background:#1857ae}.steps{margin:0;padding-left:23px}.steps li+li{margin-top:7px}.execution-steps{margin-top:16px;border:1px solid var(--line);border-radius:10px;padding:11px 13px}.execution-steps summary{cursor:pointer;font-weight:800}.table-wrap{overflow:auto;margin-top:10px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px;border-bottom:1px solid var(--line);vertical-align:top}th{text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-size:11px}.shots{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.shot{margin:0}.shot a{display:block}.shot img{display:block;width:100%;border:1px solid var(--line);border-radius:10px;background:#f3f5f8}.shot figcaption{font-size:12px;color:var(--muted);margin-top:6px;word-break:break-word}.case-links{display:flex;gap:16px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:14px;margin-top:18px;font-weight:800}.evidence-missing{color:var(--fail);font-weight:700}.footer{color:var(--muted);font-size:13px;text-align:center;padding:0 0 28px}.playing{outline:3px solid #75a9f0;outline-offset:3px}
@media(max-width:800px){.stats{grid-template-columns:repeat(2,1fr)}.shots{grid-template-columns:1fr}.hero h1{font-size:27px}.timeline-box,.case-head,.video-note{align-items:flex-start;flex-direction:column}}@media print{video,.btn,.nav{display:none}.panel,.stat,.case{box-shadow:none;break-inside:avoid}.shots{grid-template-columns:1fr 1fr}}
</style></head><body>
<header class="hero"><div class="wrap"><div class="eyebrow">Failure analysis · ${esc(data.environment)} · Organization ${esc(organizationId)}</div><h1>Failed, blocked, and not-tested evidence</h1><p>A focused report containing every non-passing scenario, its reason, complete reproduction steps, screenshot evidence, and measured timeframe in the continuous execution video.</p><div class="meta"><span class="chip">Organization ${esc(organizationId)}</span><span class="chip">Run ${esc(runId)}</span><span class="chip">${workflows.length} non-passing validations</span><span class="chip">${fmt(videoDuration)} continuous video</span><span class="chip">Credentials and session data omitted</span></div></div></header>
<main class="main"><div class="wrap">
<section class="stats"><div class="stat"><b>${workflows.length}</b><span>Total findings</span></div><div class="stat fail"><b>${counts.FAIL}</b><span>Failed</span></div><div class="stat blocked"><b>${counts.BLOCKED}</b><span>Blocked</span></div><div class="stat not-tested"><b>${counts['NOT TESTED']}</b><span>Not tested</span></div></section>
<section class="panel"><div class="nav"><a href="index.html">← Master dashboard</a><a href="#fail">Failed (${counts.FAIL})</a><a href="#blocked">Blocked (${counts.BLOCKED})</a><a href="#not-tested">Not tested (${counts['NOT TESTED']})</a></div></section>
<section id="videoPanel" class="panel"><h2>Continuous video evidence</h2><video id="evidenceVideo" class="video" controls preload="metadata" src="${esc(videoPath)}"></video><div class="video-note"><span id="playingLabel">Select “Play this scenario” from any finding.</span><span>${fmt(videoDuration)} total duration</span></div></section>
${sections}
</div></main><footer class="footer"><div class="wrap">Generated from the finalized run data and measured scenario timeline. Credentials, tokens, cookies, and session identifiers are intentionally omitted.</div></footer>
<script>
let playbackToken=0;let rangeWatcher=null;let activeButton=null;const once=(target,event)=>new Promise((resolve)=>target.addEventListener(event,resolve,{once:true}));
async function playRange(start,end,button){const token=++playbackToken;const video=document.getElementById('evidenceVideo');const label=document.getElementById('playingLabel');const safeStart=Math.max(0,Number(start)||0);const safeEnd=Math.max(safeStart,Number(end)||safeStart);clearInterval(rangeWatcher);video.pause();if(activeButton)activeButton.classList.remove('playing');activeButton=button;if(activeButton)activeButton.classList.add('playing');label.textContent='Playing measured scenario range '+formatTime(safeStart)+'–'+formatTime(safeEnd);if(video.readyState<1)await once(video,'loadedmetadata');if(token!==playbackToken)return;if(Math.abs(video.currentTime-safeStart)>.05){const sought=once(video,'seeked');video.currentTime=safeStart;await sought}if(token!==playbackToken)return;document.getElementById('videoPanel').scrollIntoView({behavior:'smooth',block:'start'});await video.play().catch(()=>{});rangeWatcher=setInterval(()=>{if(token!==playbackToken||video.currentTime>=safeEnd-.03||video.ended){video.pause();clearInterval(rangeWatcher);if(activeButton)activeButton.classList.remove('playing')}},50)}
function formatTime(seconds){const value=Math.max(0,Math.round(Number(seconds)||0));const h=Math.floor(value/3600);const m=Math.floor((value%3600)/60);const s=value%60;return h?h+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'):m+':'+String(s).padStart(2,'0')}
</script></body></html>`;

fs.writeFileSync(outputPath, html, 'utf8');

const missingScreenshots = workflows.filter(({ workflow }) => !Array.isArray(workflow.screenshots) || !workflow.screenshots.length).length;
const missingReproduction = workflows.filter(({ workflow }) => !Array.isArray(workflow.reproduce) || !workflow.reproduce.length).length;
console.log(JSON.stringify({
  outputPath,
  total: workflows.length,
  failed: counts.FAIL,
  blocked: counts.BLOCKED,
  notTested: counts['NOT TESTED'],
  missingScreenshots,
  missingReproduction,
  videoDurationSeconds: videoDuration,
}, null, 2));
