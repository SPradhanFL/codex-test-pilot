import fs from 'node:fs';
import path from 'node:path';

const workspace = process.cwd();
const organizationId = process.argv[2];
const runId = process.argv[3];
if (!/^\d+$/.test(organizationId ?? '') || !/^\d{8}-\d{6}$/.test(runId ?? '')) {
  throw new Error('Usage: node scripts/apply-multi-user-video-timeline.mjs <OrgId> <YYYYMMDD-HHmmss>');
}

const runDir = path.join(workspace, 'reports', 'full-suite', organizationId, runId);
const runDataPath = path.join(runDir, 'run-data.json');
const eventPath = path.join(runDir, 'video-events.json');
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));

if (!fs.existsSync(runDataPath)) throw new Error(`Missing run data: ${runDataPath}`);
if (!fs.existsSync(eventPath)) throw new Error(`Missing measured video event journal: ${eventPath}`);

const data = readJson(runDataPath);
const journal = readJson(eventPath);
if (String(data.organizationId) !== organizationId || String(journal.organizationId) !== organizationId) {
  throw new Error('The run data or video event journal does not match the requested organization.');
}
if (journal.schemaVersion !== 1 || journal.runId !== runId || journal.timelineSource !== 'measured-video-events-v1') {
  throw new Error('The video event journal does not match the requested run or supported schema.');
}
if (!Array.isArray(journal.events) || !journal.events.length) throw new Error('The video event journal is empty.');
if (!Array.isArray(data.accounts) || !data.accounts.length) throw new Error('run-data.json must contain account results before the timeline is applied.');

const recordedDurationSeconds = Number(data.recordedDurationSeconds);
if (!(recordedDurationSeconds > 0)) throw new Error('recordedDurationSeconds must be populated from the finalized video before applying the timeline.');

const findEvents = (kind, accountSlug, workflowSlug) => journal.events.filter((event) => event.kind === kind
  && (accountSlug === undefined || event.accountSlug === accountSlug)
  && (workflowSlug === undefined || event.workflowSlug === workflowSlug));
const oneEvent = (kind, accountSlug, workflowSlug) => {
  const matches = findEvents(kind, accountSlug, workflowSlug);
  const label = [kind, accountSlug, workflowSlug].filter(Boolean).join(' / ');
  if (matches.length !== 1) throw new Error(`Expected exactly one measured event for ${label}; found ${matches.length}.`);
  const elapsed = Number(matches[0].elapsedMilliseconds);
  if (!(elapsed >= 0)) throw new Error(`Invalid elapsedMilliseconds for ${label}.`);
  return {...matches[0], elapsedMilliseconds: elapsed};
};

const recordingStart = oneEvent('recording-start');
const recordingEnd = oneEvent('recording-end');
const sourceElapsedMilliseconds = recordingEnd.elapsedMilliseconds - recordingStart.elapsedMilliseconds;
if (!(sourceElapsedMilliseconds > 0)) throw new Error('The measured recording event interval must be greater than zero.');
const scale = recordedDurationSeconds / (sourceElapsedMilliseconds / 1000);
if (scale < 0.9 || scale > 1.1) {
  throw new Error(`The finalized video duration differs too much from measured browser elapsed time (scale ${scale.toFixed(6)}). The recording is incomplete or its start/end events were captured at the wrong time; rerun instead of generating inaccurate playback ranges.`);
}
const toVideoSeconds = (elapsedMilliseconds) => Number(Math.min(
  recordedDurationSeconds,
  Math.max(0, ((elapsedMilliseconds - recordingStart.elapsedMilliseconds) / 1000) * scale)
).toFixed(3));

let previousAccountEnd = 0;
for (const account of data.accounts) {
  if (!/^[a-z0-9-]+$/.test(account.slug ?? '')) throw new Error(`Every account requires a stable slug before timeline application: ${account.name}`);
  if (!Array.isArray(account.workflows) || !account.workflows.length) throw new Error(`Account ${account.slug} has no workflows.`);

  const accountStart = oneEvent('account-start', account.slug);
  const accountEnd = oneEvent('account-end', account.slug);
  if (accountEnd.elapsedMilliseconds <= accountStart.elapsedMilliseconds) throw new Error(`Account ${account.slug} has an invalid measured interval.`);
  account.startSeconds = toVideoSeconds(accountStart.elapsedMilliseconds);
  account.endSeconds = toVideoSeconds(accountEnd.elapsedMilliseconds);
  account.sourceStartElapsedMilliseconds = accountStart.elapsedMilliseconds;
  account.sourceEndElapsedMilliseconds = accountEnd.elapsedMilliseconds;
  account.timelineMeasured = true;
  if (account.startSeconds < previousAccountEnd - 0.05) throw new Error(`Measured account ranges overlap at ${account.slug}.`);

  let previousWorkflowEnd = account.startSeconds;
  for (const workflow of account.workflows) {
    if (!/^[a-z0-9-]+$/.test(workflow.slug ?? '')) throw new Error(`Every workflow requires a stable slug before timeline application: ${account.slug} / ${workflow.name}`);
    const workflowStart = oneEvent('workflow-start', account.slug, workflow.slug);
    const workflowEnd = oneEvent('workflow-end', account.slug, workflow.slug);
    if (workflowEnd.elapsedMilliseconds <= workflowStart.elapsedMilliseconds) throw new Error(`Workflow ${account.slug}/${workflow.slug} has an invalid measured interval.`);
    workflow.startSeconds = toVideoSeconds(workflowStart.elapsedMilliseconds);
    workflow.endSeconds = toVideoSeconds(workflowEnd.elapsedMilliseconds);
    workflow.sourceStartElapsedMilliseconds = workflowStart.elapsedMilliseconds;
    workflow.sourceEndElapsedMilliseconds = workflowEnd.elapsedMilliseconds;
    workflow.timelineMeasured = true;
    if (workflow.startSeconds < account.startSeconds - 0.05 || workflow.endSeconds > account.endSeconds + 0.05) {
      throw new Error(`Measured workflow range is outside its account range: ${account.slug}/${workflow.slug}`);
    }
    if (workflow.startSeconds < previousWorkflowEnd - 0.05) throw new Error(`Measured workflow ranges overlap: ${account.slug}/${workflow.slug}`);
    previousWorkflowEnd = workflow.endSeconds;
  }
  previousAccountEnd = account.endSeconds;
}

data.timelineSource = 'measured-video-events-v1';
data.sourceElapsedMilliseconds = sourceElapsedMilliseconds;
data.videoTimelineScale = Number(scale.toFixed(9));
data.recordingStartedAtUtc = journal.recordingStartedAtUtc;
data.recordingEndedAtUtc = journal.recordingEndedAtUtc;
fs.writeFileSync(runDataPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Applied ${journal.events.length} measured video events to organization ${organizationId}, run ${runId}, with scale ${scale.toFixed(6)}.`);
