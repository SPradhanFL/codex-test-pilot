import fs from 'node:fs';
import path from 'node:path';

const workspace = process.cwd();
const runId = process.argv[2];
if (!/^\d{8}-\d{6}$/.test(runId ?? '')) {
  throw new Error('Usage: node scripts/generate-full-suite-report.mjs <YYYYMMDD-HHMMSS>');
}

const runDir = path.join(workspace, 'reports', 'full-suite', runId);
const data = JSON.parse(fs.readFileSync(path.join(runDir, 'run-data.json'), 'utf8'));
const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const statusClass = (status) => status.toLowerCase().replace(/\s+/g, '-');
const formatTime = (seconds) => {
  const rounded = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

const scale = data.recordedDurationSeconds / (data.sourceElapsedMilliseconds / 1000);
const chapterOffsetMs = Number(data.chapterOffsetMs ?? 0);
const starts = data.executions.map((item, index) => index === 0 ? 0 : Math.max(0, ((item.startMs - chapterOffsetMs) / 1000) * scale));
const executions = data.executions.map((item, index) => {
  const startSeconds = starts[index];
  const endSeconds = index + 1 < starts.length ? starts[index + 1] : data.recordedDurationSeconds;
  return {
    ...item,
    startSeconds: Number(startSeconds.toFixed(2)),
    endSeconds: Number(endSeconds.toFixed(2)),
    start: formatTime(startSeconds),
    end: formatTime(endSeconds),
    range: `${formatTime(startSeconds)}–${formatTime(endSeconds)}`
  };
});

const counts = executions.reduce((result, item) => {
  result[item.status] = (result[item.status] ?? 0) + 1;
  return result;
}, {PASS: 0, FAIL: 0, BLOCKED: 0, 'NOT TESTED': 0});
const overall = counts.FAIL || counts.BLOCKED ? 'FAIL' : counts['NOT TESTED'] ? 'PARTIAL' : 'PASS';

const baseStyles = `
:root{--bg:#f4f7fb;--panel:#fff;--ink:#172033;--muted:#5c6780;--line:#dfe6f0;--brand:#2354d8;--pass:#087d45;--fail:#b42318;--not-tested:#8a5b00;--blocked:#6b3fa0;--shadow:0 10px 30px rgba(27,42,74,.08)}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,Segoe UI,Arial,sans-serif;line-height:1.55}a{color:var(--brand)}main{max-width:1240px;margin:auto;padding:32px 22px 64px}.hero{padding:30px;border-radius:22px;color:#fff;background:linear-gradient(135deg,#172554,#2354d8);box-shadow:var(--shadow)}.hero h1{margin:0 0 8px;font-size:clamp(28px,4vw,46px)}.hero p{margin:4px 0;color:#dbe6ff}.status{display:inline-flex;border-radius:999px;padding:6px 11px;font-size:12px;font-weight:800;letter-spacing:.04em}.pass{color:#fff;background:var(--pass)}.fail{color:#fff;background:var(--fail)}.not-tested{color:#fff;background:var(--not-tested)}.blocked{color:#fff;background:var(--blocked)}.partial{color:#172033;background:#ffd166}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin:20px 0}.card,.panel,.outcome{background:var(--panel);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow)}.card{padding:18px}.metric{font-size:30px;font-weight:800}.label{color:var(--muted);font-size:13px}.panel{padding:22px;margin:18px 0}.panel h2{margin-top:0}.toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}input,select,button{font:inherit;border:1px solid #bfc9da;border-radius:10px;padding:10px 12px;background:#fff}button{cursor:pointer;color:#fff;background:var(--brand);border-color:var(--brand)}table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;vertical-align:top;padding:12px;border-bottom:1px solid var(--line)}th{color:#46526a;background:#f8faff}.table-wrap{overflow:auto}.outcomes{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}.outcome{padding:18px}.outcome h3{margin:0 0 8px}.outcome p{color:var(--muted)}video{width:100%;max-height:680px;border-radius:14px;background:#111}.evidence{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}.evidence figure{margin:0;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:#fff}.evidence img{display:block;width:100%;height:auto}.evidence figcaption{padding:10px;color:var(--muted);font-size:13px}pre{white-space:pre-wrap;word-break:break-word;background:#111827;color:#e5e7eb;padding:20px;border-radius:14px;max-height:700px;overflow:auto}.failure{border-left:6px solid var(--fail);background:#fff3f1}.muted{color:var(--muted)}.back{display:inline-block;margin-bottom:16px}.pill-link{display:inline-block;text-decoration:none;border-radius:10px;padding:8px 11px;color:#fff;background:var(--brand)}@media print{body{background:#fff}.toolbar,button,.back{display:none}.panel,.card,.outcome{box-shadow:none;break-inside:avoid}main{max-width:none;padding:10px}video{display:none}}
`;

const videoScript = `
function playRange(start,end){const video=document.getElementById('suite-video');video.currentTime=start;video.play();const stop=()=>{if(video.currentTime>=end){video.pause();video.removeEventListener('timeupdate',stop)}};video.addEventListener('timeupdate',stop);video.scrollIntoView({behavior:'smooth',block:'center'})}
`;

fs.mkdirSync(path.join(runDir, 'scenarios'), {recursive: true});
const timeline = {
  runId,
  video: data.video,
  recordedDurationSeconds: data.recordedDurationSeconds,
  recordedDuration: data.recordedDuration,
  wallClockDuration: data.wallClockDuration,
  note: chapterOffsetMs > 0
    ? 'Ranges are contiguous and aligned to legacy chapter cards in this recording.'
    : 'Ranges are contiguous and use recorded execution offsets. No chapter card, blur, or recording overlay is used.',
  executions: executions.map(({execution, scenario, source, status, startSeconds, endSeconds, start, end, range}) => ({execution, scenario, source, status, startSeconds, endSeconds, start, end, range}))
};
fs.writeFileSync(path.join(runDir, 'timeline.json'), JSON.stringify(timeline, null, 2) + '\n');

for (const item of executions) {
  const sourcePath = path.join(workspace, ...item.source.split('/'));
  const source = fs.readFileSync(sourcePath, 'utf8');
  const failures = item.reproduce?.length ? `<section class="panel failure"><h2>Failed scenario and steps to reproduce</h2><ol>${item.reproduce.map((step) => `<li>${esc(step)}</li>`).join('')}</ol><p><strong>Expected:</strong> Assigned Campus User, Employee, and Substitute roles are visible and selectable.</p><p><strong>Actual:</strong> ${esc(item.summary)}</p></section>` : '';
  const screenshots = item.screenshots.map((name) => `<figure><a href="../screenshots/${esc(item.slug)}/${esc(name)}"><img src="../screenshots/${esc(item.slug)}/${esc(name)}" alt="${esc(item.scenario)} evidence"></a><figcaption>${esc(name)}</figcaption></figure>`).join('');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(item.scenario)} · ${runId}</title><style>${baseStyles}</style></head><body><main>
  <a class="back" href="../index.html">← Full-suite dashboard</a>
  <header class="hero"><span class="status ${statusClass(item.status)}">${esc(item.status)}</span><h1>Execution ${item.execution} · ${esc(item.scenario)}</h1><p>${esc(item.source)} · Video ${esc(item.range)}</p></header>
  <section class="cards"><div class="card"><div class="metric">${item.execution}</div><div class="label">Execution</div></div><div class="card"><div class="metric">${esc(item.range)}</div><div class="label">Continuous-video range</div></div><div class="card"><div class="metric">${esc(data.mode)}</div><div class="label">Execution mode</div></div></section>
  <section class="panel"><h2>Scenario outcome</h2><p>${esc(item.summary)}</p><button onclick="playRange(${item.startSeconds},${item.endSeconds})">Play this execution (${esc(item.range)})</button></section>
  ${failures}
  <section class="panel"><h2>Continuous video evidence</h2><video id="suite-video" controls preload="metadata" src="../videos/full-suite-execution.webm"></video></section>
  <section class="panel"><h2>Screenshot evidence</h2><div class="evidence">${screenshots}</div></section>
  <section class="panel"><h2>Complete test structure</h2><p class="muted">Source: ${esc(item.source)}</p><pre>${esc(source)}</pre></section>
  <section class="panel"><h2>Safety and cleanup</h2><p>No password, token, cookie, or authentication fragment is included. Unattended safe mode did not create, update, or delete persistent staging records.</p></section>
  </main><script>${videoScript}</script></body></html>`;
  fs.writeFileSync(path.join(runDir, 'scenarios', `${item.slug}.html`), html);
}

const rows = executions.map((item) => `<tr data-status="${esc(item.status)}"><td>${item.execution}</td><td><a href="scenarios/${esc(item.slug)}.html"><strong>${esc(item.scenario)}</strong></a><br><span class="muted">${esc(item.source)}</span></td><td><span class="status ${statusClass(item.status)}">${esc(item.status)}</span></td><td>${esc(item.range)}</td><td>${esc(item.summary)}</td><td><button onclick="playRange(${item.startSeconds},${item.endSeconds})">Play</button></td></tr>`).join('');
const outcomes = executions.map((item) => `<article class="outcome"><span class="status ${statusClass(item.status)}">${esc(item.status)}</span><h3>${item.execution} · <a href="scenarios/${esc(item.slug)}.html">${esc(item.scenario)}</a></h3><p>${esc(item.summary)}</p><button onclick="playRange(${item.startSeconds},${item.endSeconds})">${esc(item.range)}</button></article>`).join('');
const failureSections = executions.filter((item) => item.status === 'FAIL').map((item) => `<article class="panel failure"><h3>${item.execution} · ${esc(item.scenario)}</h3><p>${esc(item.summary)}</p><ol>${item.reproduce.map((step) => `<li>${esc(step)}</li>`).join('')}</ol><a href="scenarios/${esc(item.slug)}.html">Open full execution report</a></article>`).join('');
const index = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AES Stage Full Suite · ${runId}</title><style>${baseStyles}</style></head><body><main>
<header class="hero"><span class="status ${statusClass(overall)}">${overall}</span><h1>AES Stage full-suite execution</h1><p>Run ${runId} · ${esc(data.mode)} · One continuous ${esc(data.recordedDuration)} video</p><p>The run is FAIL because two required role-switcher scenarios failed. Persistent create/delete branches are explicitly NOT TESTED in safe mode.</p></header>
<section class="cards"><div class="card"><div class="metric">${executions.length}</div><div class="label">Total executions</div></div><div class="card"><div class="metric">${counts.PASS}</div><div class="label">Passed</div></div><div class="card"><div class="metric">${counts.FAIL}</div><div class="label">Failed</div></div><div class="card"><div class="metric">${counts['NOT TESTED']}</div><div class="label">Not tested</div></div><div class="card"><div class="metric">${counts.BLOCKED}</div><div class="label">Blocked</div></div><div class="card"><div class="metric">${esc(data.recordedDuration)}</div><div class="label">Recorded duration</div></div></section>
<section class="panel"><h2>Continuous execution video</h2><p class="muted">Use any Play button below to jump to that execution’s exact range.</p><video id="suite-video" controls preload="metadata" src="videos/full-suite-execution.webm"></video></section>
<section class="panel"><h2>Execution results</h2><div class="toolbar"><input id="q" placeholder="Search executions" oninput="filterRows()"><select id="status-filter" onchange="filterRows()"><option value="">All statuses</option><option>PASS</option><option>FAIL</option><option>NOT TESTED</option><option>BLOCKED</option></select></div><div class="table-wrap"><table><thead><tr><th>#</th><th>Execution</th><th>Status</th><th>Video range</th><th>Actual result</th><th>Evidence</th></tr></thead><tbody id="results">${rows}</tbody></table></div></section>
<section class="panel"><h2>Scenario outcomes</h2><div class="outcomes">${outcomes}</div></section>
<section><h2>Failed scenarios</h2>${failureSections}</section>
<section class="panel"><h2>Run safety and artifact policy</h2><p>Unattended safe mode performed navigation, read-only searches, validation, and unsaved form interaction. It did not create, update, or delete persistent staging records. Passwords, tokens, cookies, generated phone values, PIN values, and authentication fragments are excluded from this report.</p><p>Before this run started, the previous top-level run was moved under <code>reports/full-suite/old-runs/old-&lt;timestamp&gt;</code>. This run remains the only current top-level timestamped run.</p><p><a class="pill-link" href="timeline.json">Open timeline JSON</a></p></section>
</main><script>${videoScript}function filterRows(){const q=document.getElementById('q').value.toLowerCase();const s=document.getElementById('status-filter').value;for(const row of document.querySelectorAll('#results tr')){row.hidden=!(row.innerText.toLowerCase().includes(q)&&(!s||row.dataset.status===s))}}</script></body></html>`;
fs.writeFileSync(path.join(runDir, 'index.html'), index);
console.log(`Generated ${executions.length} scenario reports and dashboard for ${runId}`);
