import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const fullSuiteRoot = path.join(repositoryRoot, 'reports', 'full-suite');
const outputPath = path.join(fullSuiteRoot, 'day-wise-comparison.html');
const allowedStatuses = ['PASS', 'FAIL', 'BLOCKED', 'NOT TESTED'];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function walkForRunData(directory) {
  const found = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...walkForRunData(entryPath));
    } else if (entry.isFile() && entry.name === 'run-data.json') {
      found.push(entryPath);
    }
  }
  return found;
}

function resolveRunId(data, dataPath) {
  const configured = String(data.runId ?? '');
  if (/^\d{8}-\d{6}$/.test(configured)) return configured;
  const match = dataPath.match(/(\d{8}-\d{6})/g);
  return match?.at(-1) ?? '';
}

function normalizeStatus(value) {
  const normalized = String(value ?? '').trim().toUpperCase();
  return allowedStatuses.includes(normalized) ? normalized : 'NOT TESTED';
}

function summarizeStatuses(flows) {
  const counts = { total: flows.size, PASS: 0, FAIL: 0, BLOCKED: 0, 'NOT TESTED': 0 };
  for (const flow of flows.values()) counts[flow.status] += 1;
  return counts;
}

function readOrganizationRuns(organizationId, organizationDirectory) {
  const runs = [];
  for (const dataPath of walkForRunData(organizationDirectory)) {
    try {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      const runId = resolveRunId(data, dataPath);
      if (!runId) continue;
      const flows = new Map();
      for (const account of Array.isArray(data.accounts) ? data.accounts : []) {
        const accountSlug = String(account.slug ?? account.name ?? 'unknown-account');
        const accountName = String(account.name ?? accountSlug);
        for (const workflow of Array.isArray(account.workflows) ? account.workflows : []) {
          const workflowSlug = String(workflow.slug ?? workflow.name ?? 'unknown-workflow');
          const key = accountSlug + '::' + workflowSlug;
          flows.set(key, {
            key,
            accountSlug,
            accountName,
            workflowSlug,
            name: String(workflow.name ?? workflowSlug),
            status: normalizeStatus(workflow.status),
            actual: String(workflow.actual ?? workflow.summary ?? 'No execution note was recorded.'),
            expected: String(workflow.expected ?? ''),
            source: String(workflow.source ?? '')
          });
        }
      }
      runs.push({
        organizationId,
        runId,
        dayKey: runId.slice(0, 8),
        dataPath,
        flows,
        totals: summarizeStatuses(flows)
      });
    } catch (error) {
      console.warn('Skipping unreadable run data: ' + dataPath + ' (' + error.message + ')');
    }
  }
  return runs.sort((a, b) => a.runId.localeCompare(b.runId));
}

function selectLatestRunPerDay(runs) {
  const byDay = new Map();
  for (const run of runs) {
    const existing = byDay.get(run.dayKey);
    if (!existing || run.runId > existing.runId) byDay.set(run.dayKey, run);
  }
  return [...byDay.values()].sort((a, b) => a.runId.localeCompare(b.runId));
}

function compareRuns(previous, current) {
  const result = {
    newFailures: [],
    newBlockers: [],
    recoveredFromFailure: [],
    recoveredFromBlocked: [],
    otherChanges: [],
    newCoverage: [],
    removedCoverage: []
  };

  for (const currentFlow of current.flows.values()) {
    const previousFlow = previous.flows.get(currentFlow.key);
    if (!previousFlow) {
      result.newCoverage.push({ previous: null, current: currentFlow });
      continue;
    }
    if (previousFlow.status === currentFlow.status) continue;

    const transition = { previous: previousFlow, current: currentFlow };
    if (currentFlow.status === 'FAIL') result.newFailures.push(transition);
    else if (currentFlow.status === 'BLOCKED') result.newBlockers.push(transition);
    else if (currentFlow.status === 'PASS' && previousFlow.status === 'FAIL') {
      result.recoveredFromFailure.push(transition);
    } else if (currentFlow.status === 'PASS' && previousFlow.status === 'BLOCKED') {
      result.recoveredFromBlocked.push(transition);
    } else {
      result.otherChanges.push(transition);
    }
  }

  for (const previousFlow of previous.flows.values()) {
    if (!current.flows.has(previousFlow.key)) {
      result.removedCoverage.push({ previous: previousFlow, current: null });
    }
  }

  return result;
}

function formatDay(dayKey) {
  const year = Number(dayKey.slice(0, 4));
  const month = Number(dayKey.slice(4, 6));
  const day = Number(dayKey.slice(6, 8));
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function statusClass(status) {
  return status.toLowerCase().replaceAll(' ', '-');
}

function statusBadge(status) {
  return '<span class="status ' + statusClass(status) + '">' + escapeHtml(status) + '</span>';
}

function delta(current, previous) {
  const difference = current - previous;
  if (difference === 0) return '<span class="delta neutral">—</span>';
  const prefix = difference > 0 ? '+' : '';
  const kind = difference > 0 ? 'up' : 'down';
  return '<span class="delta ' + kind + '">' + prefix + difference + '</span>';
}

function renderTotalCard(label, value, previousValue, kind) {
  return [
    '<article class="metric ' + kind + '">',
    '<span>' + escapeHtml(label) + '</span>',
    '<strong>' + value + '</strong>',
    previousValue === null ? '<small>Baseline</small>' : '<small>' + delta(value, previousValue) + ' vs previous day</small>',
    '</article>'
  ].join('');
}

function renderTransitionItem(transition) {
  const current = transition.current;
  const previous = transition.previous;
  const flow = current ?? previous;
  return [
    '<li class="change-item">',
    '<div class="change-heading">',
    '<div><span class="context">' + escapeHtml(flow.accountName) + '</span><h4>' + escapeHtml(flow.name) + '</h4></div>',
    '<div class="transition-badges">',
    previous ? statusBadge(previous.status) : '<span class="status new">NEW</span>',
    '<span class="arrow" aria-hidden="true">→</span>',
    current ? statusBadge(current.status) : '<span class="status removed">REMOVED</span>',
    '</div>',
    '</div>',
    '<p>' + escapeHtml(current?.actual ?? 'This workflow was not included in the current daily snapshot.') + '</p>',
    '</li>'
  ].join('');
}

function renderChangeSection(title, description, items, accent, emptyText) {
  return [
    '<section class="change-group ' + accent + '">',
    '<div class="group-heading"><div><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(description) + '</p></div>',
    '<span class="count">' + items.length + '</span></div>',
    items.length
      ? '<ul class="change-list">' + items.map(renderTransitionItem).join('') + '</ul>'
      : '<div class="empty">' + escapeHtml(emptyText) + '</div>',
    '</section>'
  ].join('');
}

function renderBaseline(run) {
  const nonPassing = [...run.flows.values()]
    .filter((flow) => flow.status !== 'PASS')
    .map((flow) => ({ previous: null, current: flow }));
  return [
    '<section class="baseline-note">',
    '<strong>Baseline day</strong>',
    '<p>This is the first recorded daily snapshot for this organization, so no previous-day transitions can be calculated.</p>',
    '</section>',
    renderChangeSection(
      'Baseline non-passing results',
      'FAIL, BLOCKED, and NOT TESTED outcomes present in the first daily snapshot.',
      nonPassing,
      'baseline',
      'The baseline run contains only PASS results.'
    )
  ].join('');
}

function renderDailyCard(run, previous) {
  const comparison = previous ? compareRuns(previous, run) : null;
  const previousTotals = previous?.totals ?? null;
  const comparisonLabel = previous
    ? 'Compared with ' + formatDay(previous.dayKey) + ' · run ' + previous.runId
    : 'First available daily snapshot';

  const sections = comparison
    ? [
        renderChangeSection(
          'New failures',
          'Current FAIL results that were not FAIL on the previous recorded day.',
          comparison.newFailures,
          'failure',
          'No new failures.'
        ),
        renderChangeSection(
          'New PASS — previously failed',
          'Scenarios that changed directly from FAIL to PASS.',
          comparison.recoveredFromFailure,
          'recovery',
          'No previous-day failures recovered to PASS.'
        ),
        renderChangeSection(
          'New blockers',
          'Current BLOCKED results that had another status on the previous recorded day.',
          comparison.newBlockers,
          'blocked',
          'No new blockers.'
        ),
        renderChangeSection(
          'New PASS — previously blocked',
          'Scenarios that changed directly from BLOCKED to PASS.',
          comparison.recoveredFromBlocked,
          'recovery',
          'No previous-day blockers recovered to PASS.'
        ),
        renderChangeSection(
          'Other status changes',
          'Changes involving NOT TESTED or another transition not listed above.',
          comparison.otherChanges,
          'other',
          'No other status changes.'
        ),
        renderChangeSection(
          'Coverage changes',
          'Newly introduced and removed scenario/context identities.',
          [...comparison.newCoverage, ...comparison.removedCoverage],
          'coverage',
          'No coverage identities were added or removed.'
        )
      ].join('')
    : renderBaseline(run);

  return [
    '<article class="day-card" id="day-' + run.organizationId + '-' + run.dayKey + '">',
    '<header class="day-header">',
    '<div><p class="eyebrow">' + escapeHtml(comparisonLabel) + '</p><h2>' + escapeHtml(formatDay(run.dayKey)) + '</h2>',
    '<p class="run-id">Selected daily run: <code>' + escapeHtml(run.runId) + '</code></p></div>',
    '<span class="total-pill">' + run.totals.total + ' validations</span>',
    '</header>',
    '<div class="metrics">',
    renderTotalCard('Passed', run.totals.PASS, previousTotals?.PASS ?? null, 'pass'),
    renderTotalCard('Failed', run.totals.FAIL, previousTotals?.FAIL ?? null, 'fail'),
    renderTotalCard('Blocked', run.totals.BLOCKED, previousTotals?.BLOCKED ?? null, 'blocked'),
    renderTotalCard('Not tested', run.totals['NOT TESTED'], previousTotals?.['NOT TESTED'] ?? null, 'not-tested'),
    '</div>',
    '<div class="change-grid">' + sections + '</div>',
    '</article>'
  ].join('');
}

function formatSigned(value) {
  if (value === 0) return '—';
  return (value > 0 ? '+' : '') + value;
}

function comparisonCounts(previous, current) {
  if (!previous) {
    return {
      newFailures: null,
      recoveredFailures: null,
      newBlockers: null,
      recoveredBlockers: null
    };
  }
  const comparison = compareRuns(previous, current);
  return {
    newFailures: comparison.newFailures.length,
    recoveredFailures: comparison.recoveredFromFailure.length,
    newBlockers: comparison.newBlockers.length,
    recoveredBlockers: comparison.recoveredFromBlocked.length
  };
}

function renderDailySummaryTable(runs) {
  const rows = [...runs].reverse().map((run) => {
    const chronologicalIndex = runs.findIndex((candidate) => candidate.runId === run.runId);
    const previous = chronologicalIndex > 0 ? runs[chronologicalIndex - 1] : null;
    const changes = comparisonCounts(previous, run);
    const baseline = '<span class="table-muted">Baseline</span>';
    return [
      '<tr>',
      '<th scope="row"><strong>' + escapeHtml(formatDay(run.dayKey)) + '</strong><small>' + escapeHtml(previous ? 'vs ' + formatDay(previous.dayKey) : 'first recorded day') + '</small></th>',
      '<td><code>' + escapeHtml(run.runId) + '</code></td>',
      '<td class="number">' + run.totals.total + '</td>',
      '<td class="number pass-text">' + run.totals.PASS + (previous ? '<small>' + formatSigned(run.totals.PASS - previous.totals.PASS) + '</small>' : '') + '</td>',
      '<td class="number fail-text">' + run.totals.FAIL + (previous ? '<small>' + formatSigned(run.totals.FAIL - previous.totals.FAIL) + '</small>' : '') + '</td>',
      '<td class="number blocked-text">' + run.totals.BLOCKED + (previous ? '<small>' + formatSigned(run.totals.BLOCKED - previous.totals.BLOCKED) + '</small>' : '') + '</td>',
      '<td class="number">' + run.totals['NOT TESTED'] + (previous ? '<small>' + formatSigned(run.totals['NOT TESTED'] - previous.totals['NOT TESTED']) + '</small>' : '') + '</td>',
      '<td class="number fail-cell">' + (previous ? changes.newFailures : baseline) + '</td>',
      '<td class="number recovery-cell">' + (previous ? changes.recoveredFailures : baseline) + '</td>',
      '<td class="number blocked-cell">' + (previous ? changes.newBlockers : baseline) + '</td>',
      '<td class="number recovery-cell">' + (previous ? changes.recoveredBlockers : baseline) + '</td>',
      '</tr>'
    ].join('');
  }).join('');

  return [
    '<section class="report-table-section">',
    '<div class="section-heading"><div><p class="eyebrow">Daily rollup</p><h2>Execution totals and movement</h2></div><p>Numbers beneath status totals show the change from the previous recorded day.</p></div>',
    '<div class="table-scroll"><table class="comparison-table summary-table">',
    '<thead><tr><th>Date compared</th><th>Selected run</th><th>Total</th><th>Passed</th><th>Failed</th><th>Blocked</th><th>Not tested</th><th>New FAIL</th><th>FAIL → PASS</th><th>New BLOCKED</th><th>BLOCKED → PASS</th></tr></thead>',
    '<tbody>' + rows + '</tbody>',
    '</table></div>',
    '</section>'
  ].join('');
}

function renderScenarioChangeRow(label, style, transition) {
  const current = transition.current;
  const previous = transition.previous;
  const flow = current ?? previous;
  return [
    '<tr>',
    '<td><span class="change-type ' + style + '">' + escapeHtml(label) + '</span></td>',
    '<td><strong>' + escapeHtml(flow.accountName) + '</strong></td>',
    '<td><strong>' + escapeHtml(flow.name) + '</strong><small><code>' + escapeHtml(flow.workflowSlug) + '</code></small></td>',
    '<td>' + (previous ? statusBadge(previous.status) : '<span class="status new">NEW</span>') + '</td>',
    '<td>' + (current ? statusBadge(current.status) : '<span class="status removed">REMOVED</span>') + '</td>',
    '<td class="reason">' + escapeHtml(current?.actual ?? 'This scenario/context was not included in the current daily snapshot.') + '</td>',
    '</tr>'
  ].join('');
}

function renderScenarioChangeTable(runs) {
  const dayGroups = [];
  for (let index = runs.length - 1; index > 0; index -= 1) {
    const current = runs[index];
    const previous = runs[index - 1];
    const comparison = compareRuns(previous, current);
    const categories = [
      ['New failure', 'failure', comparison.newFailures],
      ['New PASS — was FAIL', 'recovery', comparison.recoveredFromFailure],
      ['New blocker', 'blocked', comparison.newBlockers],
      ['New PASS — was BLOCKED', 'recovery', comparison.recoveredFromBlocked],
      ['Other status change', 'other', comparison.otherChanges]
    ];
    const changeRows = categories.flatMap(([label, style, items]) =>
      [...items]
        .sort((a, b) => {
          const aFlow = a.current ?? a.previous;
          const bFlow = b.current ?? b.previous;
          return (aFlow.accountName + aFlow.name).localeCompare(bFlow.accountName + bFlow.name);
        })
        .map((transition) => renderScenarioChangeRow(label, style, transition))
    );
    dayGroups.push([
      '<tr class="date-divider"><th colspan="6">' + escapeHtml(formatDay(current.dayKey)) + ' <span>compared with ' + escapeHtml(formatDay(previous.dayKey)) + ' · ' + changeRows.length + ' displayed changes</span></th></tr>',
      changeRows.length ? changeRows.join('') : '<tr><td colspan="6" class="no-change">No failure, blocker, recovery, or other status change was recorded.</td></tr>'
    ].join(''));
  }

  return [
    '<section class="report-table-section">',
    '<div class="section-heading"><div><p class="eyebrow">Scenario-level comparison</p><h2>What changed from the previous recorded day</h2></div><p>Focused only on failures, blockers, recoveries, and other status transitions.</p></div>',
    runs.length > 1
      ? '<div class="table-scroll"><table class="comparison-table detail-table"><thead><tr><th>Change</th><th>Login / context</th><th>Scenario</th><th>Previous</th><th>Current</th><th>Current result or reason</th></tr></thead><tbody>' + dayGroups.join('') + '</tbody></table></div>'
      : '<div class="no-data">A second recorded day is required before scenario transitions can be calculated.</div>',
    '</section>'
  ].join('');
}

function renderOrganizationPanel(organization, index) {
  const runs = organization.dailyRuns;
  const latest = runs.at(-1);
  const latestTotals = latest?.totals ?? { total: 0, PASS: 0, FAIL: 0, BLOCKED: 0, 'NOT TESTED': 0 };

  return [
    '<section class="org-panel" id="panel-' + organization.id + '" role="tabpanel" aria-labelledby="tab-' + organization.id + '"' + (index ? ' hidden' : '') + '>',
    '<div class="org-overview">',
    '<div><p class="eyebrow">Organization comparison</p><h1>' + escapeHtml(organization.id) + '</h1>',
    '<p>Latest completed run from each recorded date, displayed newest first.</p></div>',
    '<div class="overview-facts">',
    '<span><strong>' + runs.length + '</strong> recorded days</span>',
    '<span><strong>' + latestTotals.total + '</strong> latest validations</span>',
    '<span><strong>' + latestTotals.PASS + '</strong> latest passes</span>',
    '<span><strong>' + latestTotals.FAIL + '</strong> latest failures</span>',
    '<span><strong>' + latestTotals.BLOCKED + '</strong> latest blockers</span>',
    '</div>',
    '</div>',
    runs.length ? renderDailySummaryTable(runs) + renderScenarioChangeTable(runs) : '<div class="no-data">No organization-scoped runs were found.</div>',
    '</section>'
  ].join('');
}

function buildReport(organizations) {
  const generatedAt = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  }).format(new Date());
  const totalDailySnapshots = organizations.reduce((sum, organization) => sum + organization.dailyRuns.length, 0);
  const tabs = organizations.map((organization, index) => [
    '<button class="org-tab" id="tab-' + organization.id + '" role="tab" aria-selected="' + (!index) + '" aria-controls="panel-' + organization.id + '" tabindex="' + (index ? '-1' : '0') + '" data-org="' + organization.id + '">',
    '<span>Organization</span><strong>' + escapeHtml(organization.id) + '</strong>',
    '</button>'
  ].join('')).join('');
  const panels = organizations.map(renderOrganizationPanel).join('');

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>Day-wise Full-Suite Comparison</title>',
    '<style>',
    ':root{--ink:#162033;--muted:#617089;--line:#dce3ec;--canvas:#eef3f8;--surface:#fff;--navy:#172846;--indigo:#4b55d2;--pass:#16794b;--pass-bg:#e8f7ef;--fail:#b42331;--fail-bg:#fdebed;--blocked:#a15c00;--blocked-bg:#fff3dd;--nt:#606a7b;--nt-bg:#edf0f4;--shadow:0 12px 34px rgba(23,40,70,.09)}',
    '*{box-sizing:border-box}',
    'html{scroll-behavior:smooth}',
    'body{margin:0;background:var(--canvas);color:var(--ink);font:15px/1.55 Inter,Segoe UI,Arial,sans-serif}',
    '.topbar{background:linear-gradient(120deg,#14233f 0%,#263f6c 72%,#315d72 100%);color:#fff;padding:32px clamp(20px,4vw,58px) 26px}',
    '.topbar-inner{max-width:1500px;margin:auto;display:flex;justify-content:space-between;gap:30px;align-items:flex-end}',
    '.title-block h1{margin:2px 0 8px;font-size:clamp(28px,4vw,44px);line-height:1.12;letter-spacing:-.03em}',
    '.title-block p{margin:0;color:#d9e4f4;max-width:780px}',
    '.stamp{flex:0 0 auto;text-align:right;color:#c8d6e8;font-size:13px}.stamp strong{display:block;color:#fff;font-size:16px}',
    '.shell{max-width:1500px;margin:auto;padding:0 clamp(16px,3vw,42px) 54px}',
    '.method{margin:18px 0;padding:14px 18px;background:#fff;border:1px solid var(--line);border-radius:12px;color:var(--muted);display:flex;gap:12px;align-items:flex-start}',
    '.method strong{color:var(--ink);white-space:nowrap}',
    '.tabs-wrap{position:sticky;top:0;z-index:10;margin:18px 0 24px;padding:10px;background:rgba(238,243,248,.94);backdrop-filter:blur(10px);border-radius:16px}',
    '.tabs{display:flex;gap:9px;overflow:auto}',
    '.org-tab{appearance:none;border:1px solid #cdd7e4;background:#fff;color:var(--muted);padding:10px 22px;border-radius:11px;cursor:pointer;min-width:145px;text-align:left;box-shadow:0 2px 7px rgba(23,40,70,.04)}',
    '.org-tab span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.09em}.org-tab strong{display:block;color:var(--ink);font-size:18px}',
    '.org-tab[aria-selected=true]{background:var(--navy);border-color:var(--navy);color:#bfcde2}.org-tab[aria-selected=true] strong{color:#fff}',
    '.org-tab:focus-visible{outline:3px solid #8ba4ff;outline-offset:2px}',
    '.org-panel[hidden]{display:none}',
    '.org-overview{display:flex;justify-content:space-between;gap:26px;align-items:flex-end;margin-bottom:22px}',
    '.org-overview h1{font-size:34px;margin:0}.org-overview p{margin:4px 0 0;color:var(--muted)}',
    '.overview-facts{display:flex;gap:9px;flex-wrap:wrap;justify-content:flex-end}.overview-facts span{background:#fff;border:1px solid var(--line);padding:8px 12px;border-radius:999px;color:var(--muted)}.overview-facts strong{color:var(--ink)}',
    '.eyebrow{text-transform:uppercase;letter-spacing:.09em;font-size:11px;font-weight:750;color:#667894;margin:0 0 4px}',
    '.timeline{display:grid;gap:24px}',
    '.report-table-section{margin:0 0 24px;background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);overflow:hidden}',
    '.section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;padding:18px 20px;border-bottom:1px solid var(--line);background:#f8fafc}.section-heading h2{margin:0;font-size:20px}.section-heading>p{margin:0;max-width:540px;color:var(--muted);font-size:12px;text-align:right}',
    '.table-scroll{overflow:auto;max-width:100%}',
    '.comparison-table{width:100%;border-collapse:separate;border-spacing:0;text-align:left;color:var(--ink)}',
    '.comparison-table th,.comparison-table td{padding:12px 14px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);vertical-align:top}.comparison-table th:last-child,.comparison-table td:last-child{border-right:0}.comparison-table tbody tr:last-child td,.comparison-table tbody tr:last-child th{border-bottom:0}',
    '.comparison-table thead th{position:sticky;top:0;z-index:2;background:#263858;color:#fff;font-size:11px;line-height:1.3;text-transform:uppercase;letter-spacing:.055em;white-space:nowrap}',
    '.comparison-table tbody tr:not(.date-divider):hover td,.comparison-table tbody tr:not(.date-divider):hover th{background:#f8fbff}',
    '.summary-table{min-width:1180px}.summary-table tbody th{min-width:165px;background:#f8fafc}.summary-table tbody th small,.summary-table td small,.detail-table td small{display:block;margin-top:3px;color:var(--muted);font-weight:400}.summary-table .number{text-align:center;font-size:17px;font-weight:800}.summary-table .number small{font-size:11px}.pass-text{color:var(--pass)}.fail-text{color:var(--fail)}.blocked-text{color:var(--blocked)}',
    '.fail-cell{background:#fff8f8}.blocked-cell{background:#fffaf0}.recovery-cell{background:#f4fbf7}.table-muted{color:#8b95a5;font-size:11px;font-weight:500}',
    '.detail-table{min-width:1140px}.detail-table th:nth-child(1){width:155px}.detail-table th:nth-child(2){width:190px}.detail-table th:nth-child(3){width:290px}.detail-table th:nth-child(4),.detail-table th:nth-child(5){width:105px}.detail-table .reason{min-width:360px;color:#526078;font-size:13px}',
    '.date-divider th{padding:10px 14px!important;background:#e8eef7!important;color:#243552!important;text-transform:none!important;letter-spacing:0!important;font-size:13px!important;position:static!important}.date-divider span{margin-left:8px;color:#67758b;font-weight:500}',
    '.change-type{display:inline-block;padding:5px 8px;border-radius:6px;font-size:11px;font-weight:800;white-space:nowrap}.change-type.failure{background:var(--fail-bg);color:var(--fail)}.change-type.recovery{background:var(--pass-bg);color:var(--pass)}.change-type.blocked{background:var(--blocked-bg);color:var(--blocked)}.change-type.other,.change-type.coverage{background:var(--nt-bg);color:var(--nt)}',
    '.no-change{padding:20px!important;text-align:center;color:#7a8799;font-style:italic}',
    '.day-card{background:var(--surface);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow);overflow:hidden}',
    '.day-header{padding:22px 24px 18px;display:flex;justify-content:space-between;align-items:flex-start;gap:20px;border-bottom:1px solid var(--line)}',
    '.day-header h2{margin:0;font-size:25px;letter-spacing:-.02em}.run-id{margin:5px 0 0;color:var(--muted)}code{font:12px/1.4 Consolas,monospace;background:#f1f4f8;padding:2px 6px;border-radius:5px}',
    '.total-pill{background:#edf1ff;color:#3643a8;border:1px solid #d7dcff;border-radius:999px;padding:7px 12px;font-weight:700;white-space:nowrap}',
    '.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border-bottom:1px solid var(--line)}',
    '.metric{background:#fff;padding:16px 20px;border-top:3px solid transparent}.metric span{display:block;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.06em}.metric strong{display:block;font-size:28px;line-height:1.2;margin:4px 0}.metric small{color:var(--muted)}',
    '.metric.pass{border-top-color:var(--pass)}.metric.fail{border-top-color:var(--fail)}.metric.blocked{border-top-color:var(--blocked)}.metric.not-tested{border-top-color:#778196}',
    '.delta{display:inline!important;font-weight:700}.delta.up{color:var(--fail)}.metric.pass .delta.up{color:var(--pass)}.delta.down{color:var(--pass)}.metric.pass .delta.down{color:var(--fail)}.delta.neutral{color:#8a94a4}',
    '.change-grid{padding:20px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}',
    '.change-group{border:1px solid var(--line);border-radius:13px;overflow:hidden;align-self:start}.change-group.failure{border-top:4px solid var(--fail)}.change-group.recovery{border-top:4px solid var(--pass)}.change-group.blocked{border-top:4px solid var(--blocked)}.change-group.other,.change-group.coverage,.change-group.baseline{border-top:4px solid #7a86a0}',
    '.group-heading{display:flex;justify-content:space-between;gap:16px;padding:15px 16px;background:#f8fafc;border-bottom:1px solid var(--line)}.group-heading h3{margin:0;font-size:16px}.group-heading p{margin:3px 0 0;color:var(--muted);font-size:12px}.count{align-self:flex-start;display:grid;place-items:center;min-width:30px;height:30px;padding:0 8px;border-radius:999px;background:#e7ecf3;font-weight:800}',
    '.change-list{list-style:none;margin:0;padding:0}.change-item{padding:15px 16px;border-bottom:1px solid var(--line)}.change-item:last-child{border-bottom:0}.change-heading{display:flex;justify-content:space-between;gap:15px;align-items:flex-start}.change-heading h4{margin:2px 0 0;font-size:14px}.context{font-size:11px;color:#52627a;text-transform:uppercase;letter-spacing:.05em;font-weight:700}.change-item p{margin:8px 0 0;color:var(--muted);font-size:13px}',
    '.transition-badges{display:flex;align-items:center;gap:5px;white-space:nowrap}.status{display:inline-block;border-radius:999px;padding:4px 8px;font-size:10px;letter-spacing:.04em;font-weight:800}.status.pass{background:var(--pass-bg);color:var(--pass)}.status.fail{background:var(--fail-bg);color:var(--fail)}.status.blocked{background:var(--blocked-bg);color:var(--blocked)}.status.not-tested{background:var(--nt-bg);color:var(--nt)}.status.new{background:#e8edff;color:#3949ab}.status.removed{background:#f1eaf7;color:#72518b}.arrow{color:#8490a3}',
    '.empty{padding:18px 16px;color:#7b8799;font-style:italic}.baseline-note{grid-column:1/-1;background:#eef4ff;border:1px solid #cddcff;border-radius:12px;padding:14px 16px}.baseline-note p{margin:3px 0 0;color:#52627a}',
    '.footer{max-width:1500px;margin:0 auto;padding:0 clamp(20px,4vw,58px) 34px;color:#718096;font-size:12px}.no-data{padding:40px;background:#fff;border:1px dashed #b9c5d4;border-radius:14px;text-align:center;color:var(--muted)}',
    '@media(max-width:900px){.topbar-inner,.org-overview,.section-heading{align-items:flex-start;flex-direction:column}.stamp{text-align:left}.overview-facts{justify-content:flex-start}.section-heading>p{text-align:left}.metrics{grid-template-columns:repeat(2,1fr)}.change-grid{grid-template-columns:1fr}}',
    '@media(max-width:560px){.topbar{padding-top:24px}.shell{padding-inline:10px}.method{flex-direction:column}.day-header,.change-heading{flex-direction:column}.metrics{grid-template-columns:1fr}.transition-badges{align-self:flex-start}.change-grid{padding:12px}.day-header{padding:18px}.section-heading{padding:15px}}',
    '@media print{body{background:#fff}.topbar{background:#fff;color:#111;padding:16px 0}.title-block p,.stamp{color:#444}.shell{padding:0}.tabs-wrap{display:none}.org-panel[hidden]{display:block}.org-panel{break-before:page}.report-table-section{box-shadow:none;overflow:visible}.table-scroll{overflow:visible}.comparison-table{font-size:9px}.comparison-table thead th{position:static}.day-card{box-shadow:none;break-inside:avoid}.change-list{break-inside:auto}}',
    '</style>',
    '</head>',
    '<body>',
    '<header class="topbar"><div class="topbar-inner">',
    '<div class="title-block"><p class="eyebrow" style="color:#aebfda">AES Stage execution intelligence</p><h1>Day-wise Full-Suite Comparison</h1><p>Scenario-level regressions, recoveries, blockers, and coverage changes across organization runs.</p></div>',
    '<div class="stamp"><span>Generated</span><strong>' + escapeHtml(generatedAt) + '</strong><span>' + totalDailySnapshots + ' daily snapshots · no media included</span></div>',
    '</div></header>',
    '<main class="shell">',
    '<aside class="method"><strong>Comparison method</strong><span>For each organization and calendar date, the latest completed run is selected. Each scenario is matched by login/context slug and workflow slug, then compared with the previous recorded day for that organization.</span></aside>',
    '<nav class="tabs-wrap" aria-label="Organization reports"><div class="tabs" role="tablist">' + tabs + '</div></nav>',
    panels,
    '</main>',
    '<footer class="footer">Generated from organization-scoped run-data.json files under reports/full-suite. Screenshots, videos, credentials, and sensitive session data are intentionally excluded.</footer>',
    '<script>',
    '(function(){',
    'const tabs=[...document.querySelectorAll("[role=tab]")];',
    'function activate(tab){for(const item of tabs){const selected=item===tab;item.setAttribute("aria-selected",String(selected));item.tabIndex=selected?0:-1;document.getElementById("panel-"+item.dataset.org).hidden=!selected;}history.replaceState(null,"","#org-"+tab.dataset.org);}',
    'for(const tab of tabs){tab.addEventListener("click",()=>activate(tab));tab.addEventListener("keydown",(event)=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;event.preventDefault();let index=tabs.indexOf(tab);if(event.key==="ArrowRight")index=(index+1)%tabs.length;if(event.key==="ArrowLeft")index=(index-1+tabs.length)%tabs.length;if(event.key==="Home")index=0;if(event.key==="End")index=tabs.length-1;activate(tabs[index]);tabs[index].focus();});}',
    'const requested=location.hash.match(/^#org-(\\d+)$/)?.[1];const initial=tabs.find((tab)=>tab.dataset.org===requested);if(initial)activate(initial);',
    '})();',
    '</script>',
    '</body>',
    '</html>'
  ].join('\n');
}

if (!fs.existsSync(fullSuiteRoot)) {
  throw new Error('Full-suite report directory does not exist: ' + fullSuiteRoot);
}

const organizationDirectories = fs.readdirSync(fullSuiteRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
  .sort((a, b) => a.name.localeCompare(b.name));

const organizations = organizationDirectories.map((entry) => {
  const directory = path.join(fullSuiteRoot, entry.name);
  const allRuns = readOrganizationRuns(entry.name, directory);
  return {
    id: entry.name,
    allRunCount: allRuns.length,
    dailyRuns: selectLatestRunPerDay(allRuns)
  };
});

if (!organizations.length) {
  throw new Error('No organization-scoped report folders were found under ' + fullSuiteRoot);
}

fs.writeFileSync(outputPath, buildReport(organizations), 'utf8');

const summary = organizations.map((organization) => ({
  organizationId: organization.id,
  discoveredRuns: organization.allRunCount,
  dailySnapshots: organization.dailyRuns.length,
  firstDay: organization.dailyRuns.at(0)?.dayKey ?? null,
  latestDay: organization.dailyRuns.at(-1)?.dayKey ?? null,
  latestRunId: organization.dailyRuns.at(-1)?.runId ?? null
}));

console.log(JSON.stringify({ outputPath, organizations: summary }, null, 2));
