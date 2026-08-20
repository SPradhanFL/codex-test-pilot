import fs from 'node:fs';
import path from 'node:path';

const workspace = process.cwd();
const sourcePath = path.join(workspace, 'instructions', 'Multi User Instructions', 'team-execution-prompts.md');
const outputPath = path.join(workspace, 'instructions', 'Multi User Instructions', 'team-execution-prompts.html');
const source = fs.readFileSync(sourcePath, 'utf8').replace(/^\uFEFF/, '');
const lines = source.split(/\r?\n/);

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const inline = (value) => escapeHtml(value).replace(/`([^`]+)`/g, '<code>$1</code>');
const slugify = (value) => value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
const headings = lines.filter((line) => line.startsWith('## ')).map((line) => line.slice(3));

let body = '';
let sectionOpen = false;
let listOpen = false;
let inFence = false;
let fenceLanguage = '';
let fenceLines = [];
let blockIndex = 0;

const closeList = () => {
  if (listOpen) {
    body += '</ol>';
    listOpen = false;
  }
};
const closeSection = () => {
  closeList();
  if (sectionOpen) {
    body += '</section>';
    sectionOpen = false;
  }
};
const renderFence = () => {
  blockIndex += 1;
  const label = fenceLanguage === 'powershell' ? 'PowerShell setup command' : 'Copy-and-paste Codex prompt';
  body += `<div class="code-card"><div class="code-head"><span>${label}</span><button type="button" class="copy" onclick="copyBlock(this)">Copy</button></div><pre><code id="code-${blockIndex}">${escapeHtml(fenceLines.join('\n'))}</code></pre></div>`;
  fenceLines = [];
};

for (const line of lines) {
  if (line.startsWith('```')) {
    if (inFence) {
      renderFence();
      inFence = false;
      fenceLanguage = '';
    } else {
      closeList();
      inFence = true;
      fenceLanguage = line.slice(3).trim().toLowerCase();
    }
    continue;
  }
  if (inFence) {
    fenceLines.push(line);
    continue;
  }
  if (line.startsWith('# ')) continue;
  if (line.startsWith('## ')) {
    closeSection();
    const heading = line.slice(3);
    body += `<section class="panel" id="${slugify(heading)}"><h2>${inline(heading)}</h2>`;
    sectionOpen = true;
    continue;
  }
  const ordered = line.match(/^\d+\.\s+(.+)$/);
  if (ordered) {
    if (!listOpen) {
      body += '<ol class="steps">';
      listOpen = true;
    }
    body += `<li>${inline(ordered[1])}</li>`;
    continue;
  }
  if (!line.trim()) {
    closeList();
    continue;
  }
  closeList();
  body += `<p>${inline(line)}</p>`;
}
closeSection();

const toc = headings.map((heading) => `<a href="#${slugify(heading)}">${escapeHtml(heading)}</a>`).join('');
const css = `
:root{--bg:#eef2f7;--panel:#fff;--ink:#172033;--muted:#5e6b7d;--line:#d9e1ec;--blue:#2467c9;--navy:#17345f;--pass:#16835a;--warn:#a56a09;--shadow:0 10px 30px rgba(28,45,72,.09)}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:linear-gradient(180deg,#eaf1fa 0,#f7f9fc 330px);color:var(--ink);font:15px/1.55 Inter,Segoe UI,Arial,sans-serif}.wrap{width:min(1180px,calc(100% - 32px));margin:0 auto}.hero{background:linear-gradient(135deg,#10284a,#245a9d);color:#fff;padding:38px 0 34px}.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-weight:700;font-size:12px;opacity:.8}.hero h1{margin:7px 0 9px;font-size:34px;line-height:1.15}.hero p{max-width:900px;margin:0;color:#dce9fb}.meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.chip{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);padding:6px 10px;border-radius:999px;font-size:13px}.main{padding:26px 0 50px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:18px}.stat,.panel,.toc{background:var(--panel);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow)}.stat{padding:18px}.stat b{display:block;font-size:29px}.stat span{color:var(--muted)}.toc{display:flex;gap:8px;flex-wrap:wrap;padding:15px;margin-bottom:18px;position:sticky;top:8px;z-index:5}.toc a,.quick-link{color:var(--navy);background:#e7eef9;border-radius:999px;padding:6px 10px;text-decoration:none;font-size:13px;font-weight:700}.toc a:hover,.quick-link:hover{background:#d8e5f8}.panel{padding:20px;margin-bottom:18px;scroll-margin-top:85px}.panel h2{margin:0 0 12px;font-size:21px}.panel p{color:var(--muted)}.panel code{font-family:Consolas,monospace;background:#edf1f7;border-radius:5px;padding:2px 5px;color:#334155}.steps{padding-left:23px}.steps li+li{margin-top:7px}.code-card{border:1px solid #253755;border-radius:11px;overflow:hidden;margin:14px 0;background:#111827}.code-head{display:flex;justify-content:space-between;align-items:center;background:#1d2b42;color:#dce9fb;padding:9px 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}.copy{border:1px solid #6f8bb7;background:#2467c9;color:#fff;border-radius:7px;padding:6px 11px;font-weight:700;cursor:pointer}.copy.done{background:var(--pass)}pre{margin:0;padding:17px;white-space:pre-wrap;word-break:break-word;overflow:auto;color:#e5e7eb;font:13px/1.55 Consolas,monospace}pre code{background:transparent!important;color:inherit!important;padding:0!important}.notice{border-left:5px solid var(--warn);background:#fffaf0}.links{display:flex;flex-wrap:wrap;gap:9px;margin-top:16px}.footer{color:var(--muted);font-size:13px;text-align:center;padding:0 0 28px}@media(max-width:850px){.stats{grid-template-columns:repeat(2,1fr)}.hero h1{font-size:27px}.toc{position:static}}@media print{.toc,.copy{display:none}.panel,.stat{box-shadow:none;break-inside:avoid}}
`;
const script = `async function copyBlock(button){const text=button.closest('.code-card').querySelector('code').innerText;let copied=false;try{await navigator.clipboard.writeText(text);copied=true}catch(error){const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();copied=document.execCommand('copy');area.remove()}if(copied){const old=button.textContent;button.textContent='Copied';button.classList.add('done');setTimeout(()=>{button.textContent=old;button.classList.remove('done')},1600)}}`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Team Execution Prompts</title><style>${css}</style></head><body><header class="hero"><div class="wrap"><div class="eyebrow">Team handoff · AES Stage ML</div><h1>Multi-User Team Execution Prompts</h1><p>Copy-ready prompts for individual role/login-combination runs and consolidated multi-user execution with consistent HTML reports, screenshots, and continuous video evidence.</p><div class="meta"><span class="chip">10 individual controller prompts</span><span class="chip">2 one-shot suite prompts</span><span class="chip">9 combinations ready</span><span class="chip">1 Campus username required</span></div><div class="links"><a class="quick-link" href="team-execution-prompts.md">Open source Markdown</a><a class="quick-link" href="../../reports/multi-user-controller-coverage/20260820-205517/index.html">Open controller coverage reference</a></div></div></header><main class="main"><div class="wrap"><section class="stats"><div class="stat"><b>10</b><span>Individual prompts</span></div><div class="stat"><b>2</b><span>One-shot prompts</span></div><div class="stat"><b>9</b><span>Ready now</span></div><div class="stat"><b>1</b><span>Setup item remaining</span></div></section><section class="panel notice"><h2>Current readiness note</h2><p>The nine configured login combinations pass the local readiness check. The optional standalone Campus User run requires <code>testUsernames.campusUser</code> or <code>AES_STAGE_CAMPUS_USERNAME</code>.</p></section><nav class="toc" aria-label="Prompt sections">${toc}</nav>${body}</div></main><footer class="footer"><div class="wrap">Generated from team-execution-prompts.md. Local passwords remain outside this HTML file and outside Git.</div></footer><script>${script}</script></body></html>`;

fs.writeFileSync(outputPath, html);
console.log(`Generated ${path.relative(workspace, outputPath)} with ${blockIndex} copyable blocks.`);
