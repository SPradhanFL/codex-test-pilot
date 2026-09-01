# Implementation Spec — Parallel Multi-User Suite Execution

**Status:** Ready for implementation
**Target:** Codex, working in `codex-test-pilot`
**Author:** Prepared from a code audit of the 140463 run `20260901-022835`

> **File placement note.** This spec lives at the repository root on purpose. Do **not** move it into
> `instructions/Multi User Instructions/`. `scripts/start-multi-user-full-suite-run.ps1` (lines 31–40)
> enumerates `*-execution.md` in that folder and **throws** if the discovered set does not exactly match
> the controller catalog. A stray Markdown file there breaks every run.

---

## 1. Objective

Execute the multi-user full suite with independent controllers running **concurrently** instead of
one-after-another, while producing the same HTML evidence package the team uses today.

### Measured baseline

From `reports/full-suite/140463/20260901-022835/run-data.json`:

| Controller | Duration (s) |
|---|---:|
| organization-user | 497.5 |
| multi-org-employee-employee | 437.6 |
| campus-user | 244.2 |
| multi-role-campus-employee-organization | 238.7 |
| multi-role-employee-employee-substitute | 235.4 |
| employee-user | 201.8 |
| substitute-user | 195.6 |
| multi-role-organization-employee | 170.4 |
| multi-org-organization-campus | 66.5 |
| multi-org-employee-substitute | 53.1 |
| **Total recorded** | **2380.0 (39.7 min)** |

Grouping controllers by distinct login account yields **8 lanes**; the critical path is
`organization-user` at **497.5 s**.

**Target: 39.7 min → ~8.3 min (≈4.8×).** The ceiling is a single controller, so do not attempt to go
below it (see §3.2).

> Five lanes above are short only because they terminated early on BLOCKED results. Once test-account
> provisioning is fixed, the serial run grows toward 60–70 min while the critical path barely moves, so
> the benefit of this work increases over time.

### Non-goals

- Parallelising **within** a controller. Explicitly forbidden — see §3.2.
- Changing scenario semantics, the 60-second failure-observation policy, or the URL-warning policy.
- Changing the visual design of the generated HTML.
- Fixing the test-account provisioning gaps (tracked separately; this spec only *enforces* their constraint).

---

## 2. Current architecture (what you are changing)

The run is serial because five separate mechanisms each assume exactly one browser, one video and one
monotonic timeline.

| # | Mechanism | Location |
|---|---|---|
| 1 | One MCP server → one Chrome | `.codex/config.toml` |
| 2 | One capture window, positioned at origin | `scripts/browser-window-capture-support.ps1` |
| 3 | One video file, name-asserted in four places | `finalize-*`, `generate-*` |
| 4 | One global event journal with a global sequence counter | `scripts/write-multi-user-video-event.ps1` |
| 5 | One global timeline scale factor | `scripts/apply-multi-user-video-timeline.mjs` |

### 2.1 What already supports parallelism — do not rewrite these

**The recording worker is already per-window.** `scripts/browser-window-video-worker.ps1` accepts an
explicit `-WindowHandle` and captures with `PrintWindow($window, $printHdc, 2)` (line 168). Flag `2` is
`PW_RENDERFULLCONTENT`, which renders a *specific* window's content without requiring foreground focus.
Each worker pipes raw BGRA frames into its **own** ffmpeg process writing its **own** `-CapturePath`.
N concurrent workers are within the existing design. Keep this file's capture loop intact.

**The report tree is already sharded.** `scripts/start-multi-user-full-suite-run.ps1` (lines 108–113)
pre-creates a disjoint `roles/<slug>/{scenarios,screenshots}` subtree per controller. No two controllers
write to the same directory.

---

## 3. Design

### 3.1 The lane model

A **lane** is a serial execution queue owning exactly one Chrome window, one MCP server, one video and
one event journal.

```
Lane = one distinct login account
  ├── owns 1 Chrome window (unique handle, unique screen slot)
  ├── owns 1 MCP server instance (unique --output-dir)
  ├── owns 1 video               roles/<slug>/videos/<slug>.webm
  ├── owns 1 event journal       roles/<slug>/video-events.json
  └── runs its controllers SEQUENTIALLY
```

Lanes run in parallel. Controllers **within** a lane run sequentially.

### 3.2 Two rules that must never be violated

**Rule 1 — Never parallelise inside a controller.** Scenario ordering is load-bearing:

- Non-logout scenarios must precede logout scenarios — `role-scenario-matrix.md:145`
- Every logout scenario must begin from a *fresh* authenticated session — `:146`
- Scenario 46 runs last because it terminates the shared session — `:150`

Concurrent scenarios in one controller would share a session that one of them deliberately destroys.

**Rule 2 — Controllers sharing a login account must never run concurrently.**

In `config/aes-stage.ml.140463.json`, two accounts are each mapped to two controllers:

| Account | Controllers |
|---|---|
| `stage140463CU_OU_EMP` | `multi-role-campus-employee-organization`, `multi-role-organization-employee` |
| `stageSSD1SubEmpMultiRoles` | `multi-role-employee-employee-substitute`, `multi-org-employee-substitute` |

If such a pair runs concurrently, one controller's scenario 46 signs the other out mid-scenario. The
resulting false FAILs are **indistinguishable from the real defect** already present in this product
(Back-after-logout restoring authenticated content), so they would silently corrupt triage.

This constraint must be enforced **by the scheduler, structurally** — never by convention, comment or
documentation. Grouping lanes by resolved username satisfies it automatically.

---

## 4. Work items

Each item lists the current behaviour, the required change and its acceptance criteria. Implement in
order; W0 is a gate.

---

### W0 — Occlusion spike (GATE — do this first, do not skip)

**Why.** Everything else is mechanical. This is the one item with genuine technical risk, and a failure
here changes the shape of the solution.

`PW_RENDERFULLCONTENT` usually captures occluded windows, but **Chrome throttles or suspends painting of
windows it believes are fully occluded**, which can yield blank or frozen frames. That would silently
destroy the evidence value of the run — the reports would generate successfully with unusable video.

**Task.** Build a throwaway harness (do not commit it to `scripts/`):

1. Open two headed Chrome windows on real Stage pages.
2. Position them **deliberately overlapping**, so one is fully occluded.
3. Start two `browser-window-video-worker.ps1` instances, one per window handle.
4. Record for 120 seconds with page interaction in both.
5. Inspect both `.webm` files: frame-by-frame, confirm the occluded window's video shows **live, changing
   page content** — not a blank, white or frozen frame.

**Then repeat** with these Chrome flags added to the occluded instance:

```
--disable-features=CalculateNativeWinOcclusion
--disable-backgrounding-occluded-windows
--disable-renderer-backgrounding
```

To pass these through Playwright MCP, first determine the supported option by running:

```powershell
node node_modules/@playwright/mcp/cli.js --help
```

Do **not** guess the flag name. Use whatever the installed version documents for browser arguments.

**Report back before continuing**, with one of three outcomes:

| Outcome | Consequence |
|---|---|
| **A.** Occluded capture works unmodified | Proceed. Lane count is unconstrained by screen size. |
| **B.** Works only with the Chrome flags | Proceed; the flags become mandatory in `.codex/config.toml`. Record them in W6. |
| **C.** Unreliable even with flags | **Stop and report.** Lanes must then be non-overlapping, capping lane count at ~1 per 1280×720 of desktop (≈1 on 1080p, ≈9 on 4K). The fallback is fewer lanes or one Windows session per lane. Most of the speedup survives, because the critical path is one 8-minute controller either way. |

**Acceptance:** a written finding of A, B or C with the sample videos attached as evidence.

---

### W1 — Lane scheduler

**File:** `scripts/multi-user-org-context.ps1` (extend)

**Current.** `Select-MultiUserControllers` returns a flat, ordered controller list. The catalog at lines
1–12 already carries `UsernameKey` per controller.

**Change.** Add a function:

```powershell
function Group-MultiUserControllerLanes {
    param(
        [Parameter(Mandatory = $true)][pscustomobject]$Context,
        [Parameter(Mandatory = $true)][pscustomobject[]]$SelectedControllers,
        [int]$MaxLanes = 0     # 0 = unlimited
    )
}
```

Behaviour:

1. For each selected controller, resolve its **effective username** — the environment variable named in
   the `$credentialEnvironments` map if set, otherwise `Config.testUsernames[UsernameKey]`. Resolve the
   *value*, never the key: two different keys pointing at the same address are still the same account.
2. Group controllers by that resolved value, compared **case-insensitively and trimmed**.
3. Emit one lane object per distinct username:
   ```
   LaneId          integer, 1-based, stable
   UsernameKeys    all config keys that resolved here
   Controllers     ordered controller list for this lane
   Slug            'lane-<LaneId>'
   ```
4. Order lanes **longest-first** by controller count so the critical path starts earliest.
5. If `MaxLanes` is greater than zero and lanes exceed it, merge the shortest lanes together until the
   count fits. Merging is always safe (it only makes execution more serial).

**Acceptance criteria:**

- For 140463's ten enabled controllers, returns exactly **8 lanes**.
- The two double-booked accounts each produce a **single** lane containing **both** of their controllers.
- No username value appears in more than one lane. Add a unit assertion for this — it is Rule 2.
- Resolved usernames are never written to stdout, logs or any run artifact.

---

### W2 — Per-lane run scaffolding

**File:** `scripts/start-multi-user-full-suite-run.ps1`

**Current.** Creates `videos/` once at run root (line 93); manifest hardcodes
`video = 'videos/multi-user-full-suite-execution.webm'` (line 128) and `videoCount = 1` (line 148).

**Change.**

1. Add parameters `[int]$MaxLanes = 0` and `[switch]$Parallel`.
2. When `-Parallel` is absent, behaviour must be **byte-identical to today** (see §6).
3. When `-Parallel` is present:
   - Call `Group-MultiUserControllerLanes`.
   - Create `roles/<slug>/videos/` per controller instead of a single run-level `videos/`.
   - Add a top-level `lanes` array to `run-manifest.json`:
     ```json
     "lanes": [
       { "laneId": 1, "slug": "lane-1", "controllers": ["organization-user-execution.md"] }
     ]
     ```
   - Add `laneId` to each entry of `manifest.accounts[]`.
   - Set `capture.executionMode` to `"parallel"`, `capture.parallelLanes` to the lane count, and
     `capture.videoCount` to the lane count.
   - Keep every other `capture.*` key exactly as it is. Those encode the evidence policy
     (headed Chrome, address bar visible, 1280×720, no blur/overlay) and must not be relaxed.

**Acceptance:** `-Parallel` on 140463 creates 8 lane entries, 10 role folders each containing a `videos/`
subdirectory, and a manifest whose `capture.videoCount` equals 8.

---

### W3 — Per-lane event journals

**File:** `scripts/write-multi-user-video-event.ps1`

**Current — three concurrency defects:**

- Single journal at `<runDir>/video-events.json` (line 27).
- Unlocked read-modify-write (lines 98 and 144) — concurrent writers lose events or corrupt the JSON.
- Global counter `sequence = $events.Count + 1` (line 130), and `RecordingStart` throws if the file
  already exists (line 66), so only one lane could ever start.

**Change.**

1. Add a `[string]$LaneSlug` parameter. When supplied, the journal path becomes
   `<runDir>/roles/<LaneSlug>/video-events.json`. When omitted, keep the existing run-root path.
2. Each lane journal is independent: its own `RecordingStart`, its own `monotonicOriginTimestamp`, its
   own sequence counter starting at 1.
3. Even though lanes now write to separate files, **add a file lock** around the read-modify-write —
   open with `[System.IO.File]::Open($path, 'Open', 'ReadWrite', 'None')` and hold it across both the
   read and the write. Two processes in the same lane (a retry, a stray worker) must not interleave.
4. Retry lock acquisition for up to 5 seconds, then throw a clear error.
5. Keep the duplicate-event check (lines 117–124), scoped within the lane journal.

**Acceptance:** a stress test writing 200 events across 8 lanes concurrently produces 8 valid journals
with contiguous sequence numbers and zero lost events.

---

### W4 — Per-lane video capture and window tiling

**Files:** `scripts/start-browser-window-video.ps1`, `scripts/browser-window-capture-support.ps1`

**Current.**

- `start-browser-window-video.ps1` hardcodes the capture and final paths (lines 44–45) and derives all
  control-file paths from the run root (lines 46–48), so a second lane collides on every one.
- `Get-ForegroundChromeCaptureWindow` defaults to `GetForegroundWindow()`, else the newest Chrome by
  `StartTime` (`browser-window-capture-support.ps1`, lines 203–216) — with N Chromes it grabs the wrong
  window.
- `SetWindowPos($handle, [IntPtr]::Zero, 0, 0, $Width, $Height, ...)` (line 260) positions **every**
  window at **x=0, y=0**, so N windows stack exactly on top of one another.

**Change.**

1. Add `[string]$LaneSlug` and `[int]$WindowSlot` to `start-browser-window-video.ps1`. Derive all paths
   under `roles/<LaneSlug>/`:
   ```
   roles/<LaneSlug>/videos/<LaneSlug>.capture.webm
   roles/<LaneSlug>/videos/<LaneSlug>.webm
   roles/<LaneSlug>/browser-window-video.{stop,ready.json,result.json}
   roles/<LaneSlug>/browser-window-video-state.json
   ```
   Keep the existing containment check (lines 49–53), retargeted at the lane directory.
2. Make `-WindowHandle` **mandatory** whenever `-LaneSlug` is supplied. Never fall back to foreground
   detection in parallel mode — that is what makes lanes capture each other's windows.
3. Add a `Get-MultiUserWindowSlotPosition` helper computing X/Y from `$WindowSlot`, the desktop working
   area and the 1280×720 window size. Tile left-to-right, then top-to-bottom.
4. If the requested slot count exceeds what fits without overlap, behaviour depends on the W0 outcome:
   - Outcome A or B → allow overlap and log a warning naming the affected slots.
   - Outcome C → **throw**, naming the maximum supported lane count for this display.
5. Keep the existing post-resize assertion that the window actually reached 1280×720
   (`browser-window-capture-support.ps1`, lines 279–281). Do not weaken it.

**Acceptance:** 8 lanes start 8 workers, each producing a distinct non-empty `.webm` under its own role
folder, with 8 distinct Chrome window handles recorded in 8 distinct state files.

---

### W5 — Per-lane timeline scale

**File:** `scripts/apply-multi-user-video-timeline.mjs`

**Current — structurally serial.** Line 31 reads a single `recordedDurationSeconds`; the script derives
one global `scale` and **throws** at line 51 when video duration and measured elapsed time diverge. Under
parallelism, summed elapsed across lanes vastly exceeds any single lane's recording, so this check fires
every time by design.

**Change.**

1. Detect parallel mode from `manifest.capture.executionMode === 'parallel'`.
2. In parallel mode, iterate **per lane**:
   - Read `roles/<laneSlug>/video-events.json`.
   - Probe that lane's own video duration with the bundled ffmpeg
     (`node_modules/ffmpeg-static/ffmpeg.exe`).
   - Compute that lane's scale against **its own** recording only.
   - Apply the existing 0.9–1.1 tolerance **per lane**, and on violation name the offending lane in the
     error message.
3. Write per-lane values into `run-data.json`:
   ```
   data.lanes[]                  { laneId, slug, recordedDurationSeconds,
                                   sourceElapsedMilliseconds, videoTimelineScale }
   data.accounts[].video         'roles/<laneSlug>/videos/<laneSlug>.webm'
   data.accounts[].laneId
   ```
4. Scenario `startSeconds` / `endSeconds` become offsets **within that account's lane video**, not the
   run-global timeline. This is the key semantic change — get it right or every playback range in the
   report points at the wrong moment.
5. Preserve serial behaviour unchanged when `executionMode` is absent or `"serial"`.

**Acceptance:** on an 8-lane run every account carries a `laneId` and a `video`, and each scenario's
range resolves correctly inside its lane's video when opened in the report.

---

### W6 — Per-lane MCP servers

**File:** `.codex/config.toml`

**Current.** A single `[mcp_servers.playwright]` with a shared
`--output-dir reports/playwright-mcp-artifacts`. Playwright MCP serves one browser per server instance.

**Change.**

1. Define N server blocks `playwright_lane1` … `playwright_laneN`, identical to the current block except:
   - `--output-dir reports/playwright-mcp-artifacts/lane<N>`
   - any browser flags mandated by the W0 outcome
2. **Preserve every existing safety option verbatim**: `--isolated`, `--browser chrome`,
   `--codegen none`, `--viewport-size 1280x720`. Do **not** add `--extension`, `--user-data-dir`,
   `--storage-state`, `--shared-browser-context` or `--save-session` — `README.md:42` forbids these
   because they break the disposable-profile guarantee.
3. Keep `approval_mode = "approve"` on all twelve browser tools. **Do not silently relax approvals to
   make parallelism smoother.** If N concurrent lanes make interactive approval impractical, surface
   that as a finding and let the team decide — it is a security posture question, not an implementation
   detail.
4. Update `scripts/check-disposable-playwright-profile.ps1` to validate **every** lane server block, not
   just the first.

**Acceptance:** the disposable-profile preflight returns `READY` and validates all N blocks; each lane
writes MCP artifacts to its own subdirectory.

---

### W7 — Report generation for N videos

**Files:** `scripts/generate-multi-user-full-suite-report.mjs`,
`scripts/build-multi-user-run-data.mjs`, `scripts/finalize-multi-user-full-suite-run.ps1`

**Current — four hard asserts block N videos:**

| Location | Assert |
|---|---|
| `generate-multi-user-full-suite-report.mjs:51` | throws unless `data.video === 'videos/multi-user-full-suite-execution.webm'` |
| `:54` | throws unless that exact file exists |
| `:76` | throws unless `Number(capture.videoCount) === 1` |
| `finalize-multi-user-full-suite-run.ps1:74` | throws unless exactly one `.webm` named exactly that |

The video element is also built from `data.video` at three different page depths:

| Page | Prefix |
|---|---|
| `roles/<slug>/index.html` (line 297) | `../../${data.video}` |
| `roles/<slug>/scenarios/*.html` (line 309) | `../../../${data.video}` |
| `index.html` (line 341) | `${data.video}` |

**Change.**

1. Replace the four asserts with mode-aware equivalents:
   - Serial → keep today's assertions **exactly**.
   - Parallel → assert `capture.videoCount === lanes.length`, that every `accounts[].video` exists on
     disk, and that every account's `video` resolves inside its own role folder.
2. Source the video from `account.video` rather than the global `data.video`, and **recompute the
   relative prefix per page depth**. Since each video now lives at `roles/<slug>/videos/<slug>.webm`:
   - role page → `videos/<slug>.webm`
   - scenario page → `../videos/<slug>.webm`
   - dashboard → `roles/<slug>/videos/<slug>.webm`

   Getting a prefix wrong produces a silently broken `<video>` element — verify each depth by opening
   the generated page, not by reading the code.
3. On the dashboard, each role card links to that role's own video. Replace the single shared player with
   either one player per role section or a player that re-sources on selection. **Do not** present N
   videos as though they were one continuous recording.
4. Update the dashboard hero copy at line 341 — it currently claims "one shared continuous full-browser
   evidence video", which becomes false. State the lane count and per-lane durations instead.
5. `finalize-multi-user-full-suite-run.ps1`: in parallel mode, validate one `.webm` **per role folder**
   rather than one per run. Keep the screenshot-collection logic (lines 78–118) unchanged.
6. `build-multi-user-run-data.mjs:198`: emit `accounts[].video` in parallel mode; retain the top-level
   `video` key only in serial mode.
7. Bump `report-format.json` to `version: 4`, replacing `oneContinuousVideo: true` with
   `videoPerLane: <boolean>`. Leave `fullBrowserWindow`, `addressBarVisible`, `urlWarnings`,
   `measuredTimeline`, `blur` and `overlays` untouched.

**Acceptance:** an 8-lane run generates the dashboard, 10 role pages and all scenario pages with no
thrown errors, and every `<video>` element resolves and seeks correctly at all three depths.

---

### W8 — Readiness check and orchestration

**Files:** `scripts/check-multi-user-run-readiness.ps1`, plus a new
`scripts/start-multi-user-parallel-lanes.ps1`

**Current.** The readiness check verifies only *presence* — a non-empty username string and a
cross-referenced controller document (lines 74–90). It has no concept of lanes and no duplicate-account
detection.

**Change.**

1. Add `[switch]$Parallel` and `[int]$MaxLanes` to the readiness script. In parallel mode additionally
   report: lane count, controllers per lane, screen slots available versus required, and per-lane MCP
   server presence in `.codex/config.toml`.
2. Add an explicit **duplicate-account warning** that names every account mapped to more than one
   controller. This is visible confirmation that Rule 2 is being enforced, and it doubles as a standing
   signal of the underlying provisioning problem.
3. Create `scripts/start-multi-user-parallel-lanes.ps1` as the orchestrator:
   - Runs the readiness check and **aborts** unless it returns `READY`.
   - Calls `start-multi-user-full-suite-run.ps1 -Parallel` to scaffold the run.
   - Launches one detached PowerShell process per lane.
   - Polls until all lanes complete, with a configurable overall timeout (default 90 minutes).
   - Aggregates per-lane exit codes into one summary.
   - **On any lane failure, does not delete or roll back other lanes' evidence.** Partial evidence is
     valuable; report which lanes succeeded and which did not.
   - Never writes resolved usernames or passwords to stdout, logs or state files.

**Acceptance:** one command runs the full 8-lane suite end to end and produces the standard evidence
package; killing one lane mid-run leaves the other seven lanes' evidence intact and correctly reported.

---

## 5. Execution order

```
W0  (GATE — report findings and wait for confirmation)
     ↓
W1 → W2 → W3   (scheduler, scaffolding, journals — independent of capture)
     ↓
W4 → W6        (capture and MCP — shaped by the W0 outcome)
     ↓
W5 → W7        (timeline and reporting — depend on the artifact layout above)
     ↓
W8             (orchestration — depends on everything)
```

W1–W3 can be built and unit-tested before W0 concludes, since they do not touch capture. Do not start
W4 or W6 until W0 is resolved.

---

## 6. Backward compatibility — non-negotiable

**Serial mode must remain the default and must not change.**

Running without `-Parallel` must produce output **byte-identical** to today, except for timestamps and
genuinely new optional fields. This is the regression guard for the whole change.

Verify by:

1. Copying an existing run's `execution-observations.json` into a fresh serial run.
2. Regenerating the report.
3. Diffing against `reports/full-suite/140463/20260901-022835/`.

Only timestamps, run IDs and additive optional keys may differ. Any other diff is a bug in your change.

---

## 7. Security and safety constraints

These are existing repository rules. Parallelism does not relax any of them.

- Never write passwords, tokens, cookies or session fragments to any file, log, report or console.
- Never log a resolved username — the lane grouping in W1 compares them in memory only. The reporting
  standard permits the configured Stage username in the designated `Test username` HTML field only, via
  the existing `resolveTestUsername` path (`generate-multi-user-full-suite-report.mjs:112–122`).
- Preserve `--isolated` on every lane. Each lane gets a fresh disposable in-memory Chrome profile; no
  lane may inherit or share cookies, cache or storage state.
- Preserve the existing path-containment checks. Every new lane path must be validated as resolving
  inside its run directory, matching the pattern at `start-browser-window-video.ps1:49–53`.
- Preserve unattended safe mode. Parallelism must not enable any create, update, delete, approval,
  reconciliation or import action that serial mode declines.
- Keep the 60-second failure-observation policy per scenario. It is wall-clock per lane and is
  unaffected by concurrency.

---

## 8. Verification plan

| Level | Test | Pass condition |
|---|---|---|
| Unit | `Group-MultiUserControllerLanes` on 140463 | Exactly 8 lanes; both double-booked accounts each yield one lane holding both controllers |
| Unit | Same username via two different config keys | Lands in **one** lane |
| Concurrency | 200 events across 8 lanes | 8 valid journals, contiguous sequences, zero lost events |
| Integration | 2-lane run, non-overlapping windows | 2 valid videos, both timelines aligned within tolerance |
| Integration | 8-lane full run | Complete evidence package; all playback ranges correct |
| Regression | Serial run vs. `20260901-022835` | Diff limited to timestamps, run IDs and additive keys |
| Negative | Force two controllers of one account into different lanes | Scheduler **refuses** (Rule 2 assertion fires) |
| Negative | Kill one lane mid-run | Other lanes complete; partial evidence preserved and reported |

---

## 9. Deliverables

1. W0 findings (A, B or C) with sample videos.
2. Modified: `multi-user-org-context.ps1`, `start-multi-user-full-suite-run.ps1`,
   `write-multi-user-video-event.ps1`, `start-browser-window-video.ps1`,
   `browser-window-capture-support.ps1`, `apply-multi-user-video-timeline.mjs`,
   `build-multi-user-run-data.mjs`, `generate-multi-user-full-suite-report.mjs`,
   `finalize-multi-user-full-suite-run.ps1`, `check-multi-user-run-readiness.ps1`,
   `check-disposable-playwright-profile.ps1`, `.codex/config.toml`.
3. New: `scripts/start-multi-user-parallel-lanes.ps1`.
4. `README.md` updated with the parallel invocation and its constraints.
5. A measured before/after wall-clock comparison for OrgId 140463.

---

## 10. Open questions — raise these rather than guessing

1. **W0 outcome C.** If occluded capture proves unreliable, how many lanes does the available hardware
   support? Does the team have a 4K display or a dedicated runner?
2. **Approval prompts.** Do N concurrent lanes make `approval_mode = "approve"` impractical in practice?
   If so, that is a team decision about security posture, not something to resolve in code.
3. **Account provisioning.** Rule 2 costs real parallelism — 10 controllers collapse to 8 lanes. Giving
   the two double-booked controller pairs their own accounts would widen this to 10 lanes, though the
   critical path stays at `organization-user`, so the wall-clock gain is small. Worth doing for test
   correctness regardless of speed.
