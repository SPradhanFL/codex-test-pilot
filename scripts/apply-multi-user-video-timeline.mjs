import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const [organizationId, runId] = process.argv.slice(2);
if (!/^\d+$/.test(organizationId ?? '') || !/^\d{8}-\d{6}$/.test(runId ?? '')) throw new Error('Usage: node scripts/apply-multi-user-video-timeline.mjs <OrgId> <YYYYMMDD-HHmmss>');
const workspace = process.cwd();
const runDir = path.join(workspace, 'reports', 'full-suite', organizationId, runId);
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const dataPath = path.join(runDir, 'run-data.json');
const data = readJson(dataPath); const manifest = readJson(path.join(runDir, 'run-manifest.json'));
const parallel = manifest.capture?.executionMode === 'parallel';
if (String(data.organizationId) !== organizationId || !Array.isArray(data.accounts) || !data.accounts.length) throw new Error('Run data does not match this organization or has no accounts.');

const probeDuration = relativeVideo => {
  const video = path.resolve(runDir, relativeVideo); const root = `${path.resolve(runDir)}${path.sep}`;
  if (!video.startsWith(root) || !fs.existsSync(video)) throw new Error(`Missing or unsafe video: ${relativeVideo}`);
  const laneRoot = path.dirname(path.dirname(video));
  const metadataPath = path.join(laneRoot, 'browser-window-video-metadata.json');
  if (fs.existsSync(metadataPath)) {
    const duration = Number(readJson(metadataPath).recordedDurationSeconds);
    if (duration > 0) return duration;
  }
  const result = spawnSync(path.join(workspace, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'), ['-hide_banner', '-i', video], { encoding: 'utf8' });
  const match = String(result.stderr).match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) throw new Error(`Unable to probe video duration: ${relativeVideo}. ${result.error?.message ?? ''}`);
  return Number((+match[1] * 3600 + +match[2] * 60 + +match[3]).toFixed(3));
};

function applyLane(journal, accounts, recordedDurationSeconds, laneLabel) {
  if (String(journal.organizationId) !== organizationId || journal.runId !== runId || journal.schemaVersion !== 1 || journal.timelineSource !== 'measured-video-events-v1') throw new Error(`Invalid event journal for ${laneLabel}.`);
  const events = journal.events ?? [];
  const one = (kind, accountSlug, workflowSlug) => {
    const matches = events.filter(event => event.kind === kind && (accountSlug === undefined || event.accountSlug === accountSlug) && (workflowSlug === undefined || event.workflowSlug === workflowSlug));
    if (matches.length !== 1) throw new Error(`Expected one ${laneLabel}/${kind}/${accountSlug ?? ''}/${workflowSlug ?? ''} event; found ${matches.length}.`);
    return { ...matches[0], elapsedMilliseconds: Number(matches[0].elapsedMilliseconds) };
  };
  const start = one('recording-start'); const end = one('recording-end');
  const sourceElapsedMilliseconds = end.elapsedMilliseconds - start.elapsedMilliseconds;
  const scale = recordedDurationSeconds / (sourceElapsedMilliseconds / 1000);
  if (!(sourceElapsedMilliseconds > 0) || scale < 0.9 || scale > 1.1) throw new Error(`Lane ${laneLabel} duration scale ${scale.toFixed(6)} is outside 0.9-1.1.`);
  const seconds = elapsed => Number(Math.min(recordedDurationSeconds, Math.max(0, (elapsed - start.elapsedMilliseconds) / 1000 * scale)).toFixed(3));
  let previousAccountEnd = 0;
  for (const account of accounts) {
    const accountStart = one('account-start', account.slug); const accountEnd = one('account-end', account.slug);
    if (accountEnd.elapsedMilliseconds <= accountStart.elapsedMilliseconds) throw new Error(`Invalid interval for ${account.slug}.`);
    Object.assign(account, { startSeconds: seconds(accountStart.elapsedMilliseconds), endSeconds: seconds(accountEnd.elapsedMilliseconds), sourceStartElapsedMilliseconds: accountStart.elapsedMilliseconds, sourceEndElapsedMilliseconds: accountEnd.elapsedMilliseconds, timelineMeasured: true });
    if (account.startSeconds < previousAccountEnd - .05) throw new Error(`Account ranges overlap in ${laneLabel}.`);
    let previousWorkflowEnd = account.startSeconds;
    for (const workflow of account.workflows ?? []) {
      const workflowStart = one('workflow-start', account.slug, workflow.slug); const workflowEnd = one('workflow-end', account.slug, workflow.slug);
      if (workflowEnd.elapsedMilliseconds <= workflowStart.elapsedMilliseconds) throw new Error(`Invalid interval for ${account.slug}/${workflow.slug}.`);
      Object.assign(workflow, { startSeconds: seconds(workflowStart.elapsedMilliseconds), endSeconds: seconds(workflowEnd.elapsedMilliseconds), sourceStartElapsedMilliseconds: workflowStart.elapsedMilliseconds, sourceEndElapsedMilliseconds: workflowEnd.elapsedMilliseconds, timelineMeasured: true });
      if (workflow.startSeconds < account.startSeconds - .05 || workflow.endSeconds > account.endSeconds + .05 || workflow.startSeconds < previousWorkflowEnd - .05) throw new Error(`Invalid workflow range for ${account.slug}/${workflow.slug}.`);
      previousWorkflowEnd = workflow.endSeconds;
    }
    previousAccountEnd = account.endSeconds;
  }
  return { recordedDurationSeconds, sourceElapsedMilliseconds, videoTimelineScale: Number(scale.toFixed(9)), recordingStartedAtUtc: journal.recordingStartedAtUtc, recordingEndedAtUtc: journal.recordingEndedAtUtc };
}

if (parallel) {
  data.lanes = [];
  for (const lane of manifest.lanes ?? []) {
    const accounts = data.accounts.filter(account => Number(account.laneId) === Number(lane.laneId));
    const video = `lanes/${lane.slug}/videos/${lane.slug}.webm`;
    if (!accounts.length) throw new Error(`No accounts assigned to ${lane.slug}.`);
    try {
      const values = applyLane(readJson(path.join(runDir, 'lanes', lane.slug, 'video-events.json')), accounts, probeDuration(video), lane.slug);
      accounts.forEach(account => { account.video = video; });
      data.lanes.push({ laneId: lane.laneId, slug: lane.slug, ...values });
    } catch (err) {
      console.warn(`[WARN] Lane ${lane.slug} timeline could not be applied: ${err.message}`);
      data.lanes.push({ laneId: lane.laneId, slug: lane.slug, failed: true, failureReason: String(err.message) });
    }
  }
  const activeLanes = data.lanes.filter(l => !l.failed);
  if (!activeLanes.length) throw new Error('All lanes failed to produce valid timelines. Check lane video and event journal artifacts.');
  data.recordedDurationSeconds = Math.max(...activeLanes.map(lane => lane.recordedDurationSeconds));
  data.sourceElapsedMilliseconds = Math.max(...activeLanes.map(lane => lane.sourceElapsedMilliseconds));
  delete data.video; delete data.videoTimelineScale; delete data.recordingStartedAtUtc; delete data.recordingEndedAtUtc;
} else {
  Object.assign(data, applyLane(readJson(path.join(runDir, 'video-events.json')), data.accounts, Number(data.recordedDurationSeconds), 'serial'));
}
data.timelineSource = 'measured-video-events-v1';
fs.writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Applied measured timelines to ${parallel ? data.lanes.length : 1} lane(s).`);
