$ErrorActionPreference = 'Stop'
$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$orgId = '140463'; $runId = '20991231-235959'
$runRoot = [System.IO.Path]::GetFullPath((Join-Path $workspaceRoot "reports\full-suite\$orgId\$runId"))
$zipPath = [System.IO.Path]::GetFullPath((Join-Path $workspaceRoot "reports\full-suite\$orgId\multi-user-full-suite-$orgId-$runId.zip"))
$expectedRoot = [System.IO.Path]::GetFullPath((Join-Path $workspaceRoot "reports\full-suite\$orgId"))
if (-not $runRoot.StartsWith($expectedRoot, [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe integration-test path.' }

function Write-TestJson($Path, $Value) { $Value | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $Path -Encoding utf8 }
function New-TestJournal($LaneSlug, $AccountSlug, $WorkflowSlug) {
    [ordered]@{ schemaVersion = 1; organizationId = $orgId; runId = $runId; timelineSource = 'measured-video-events-v1'; recordingStartedAtUtc = '2099-12-31T23:59:00Z'; recordingEndedAtUtc = '2099-12-31T23:59:02Z'; monotonicOriginTimestamp = 1; monotonicFrequency = 1000; events = @(
        [ordered]@{ sequence=1; kind='recording-start'; recordedAtUtc='2099-12-31T23:59:00Z'; monotonicTimestamp=1; elapsedMilliseconds=0 },
        [ordered]@{ sequence=2; kind='account-start'; accountSlug=$AccountSlug; recordedAtUtc='2099-12-31T23:59:00Z'; monotonicTimestamp=51; elapsedMilliseconds=50 },
        [ordered]@{ sequence=3; kind='workflow-start'; accountSlug=$AccountSlug; workflowSlug=$WorkflowSlug; recordedAtUtc='2099-12-31T23:59:00Z'; monotonicTimestamp=101; elapsedMilliseconds=100 },
        [ordered]@{ sequence=4; kind='workflow-end'; accountSlug=$AccountSlug; workflowSlug=$WorkflowSlug; recordedAtUtc='2099-12-31T23:59:01Z'; monotonicTimestamp=1901; elapsedMilliseconds=1900 },
        [ordered]@{ sequence=5; kind='account-end'; accountSlug=$AccountSlug; recordedAtUtc='2099-12-31T23:59:01Z'; monotonicTimestamp=1951; elapsedMilliseconds=1950 },
        [ordered]@{ sequence=6; kind='recording-end'; recordedAtUtc='2099-12-31T23:59:02Z'; monotonicTimestamp=2001; elapsedMilliseconds=2000 }
    ) }
}

try {
    if (Test-Path -LiteralPath $runRoot) { Remove-Item -LiteralPath $runRoot -Recurse -Force }
    if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
    foreach ($path in @('roles\organization-user\screenshots','roles\organization-user\scenarios','roles\campus-user\screenshots','roles\campus-user\scenarios','lanes\lane-1\videos','lanes\lane-2\videos')) { New-Item -ItemType Directory -Force -Path (Join-Path $runRoot $path) | Out-Null }
    $accounts = @(
        [ordered]@{ execution=1; name='Organization User'; slug='organization-user'; controller='instructions/Multi User Instructions/organization-user-execution.md'; report='roles/organization-user/index.html'; status='PENDING'; laneId=1; video='lanes/lane-1/videos/lane-1.webm' },
        [ordered]@{ execution=2; name='Campus User'; slug='campus-user'; controller='instructions/Multi User Instructions/campus-user-execution.md'; report='roles/campus-user/index.html'; status='PENDING'; laneId=2; video='lanes/lane-2/videos/lane-2.webm' }
    )
    $capture = [ordered]@{ browser='Chrome'; browserMode='headed'; freshAutomationContext=$true; freshBrowserWindow=$true; reuseExistingTabs=$false; reuseExistingSessionState=$false; captureMethod='print-window-raw-frame-pipe'; captureScope='full-browser-window'; windowSize='1280x720'; includeBrowserChrome=$true; addressBarVisible=$true; pageOnly=$false; videoCount=2; continuous=$true; blur=$false; masking=$false; overlays=$false; dimming=$false; annotations=$false; chapterCards=$false; executionMode='parallel'; parallelLanes=2 }
    $knownFailureCatalog = Get-Content -Raw -LiteralPath (Join-Path $workspaceRoot 'config\known-failures.json') | ConvertFrom-Json
    $manifest = [ordered]@{ runId=$runId; organizationId=$orgId; configuration='config/aes-stage.ml.140463.json'; createdAt='2099-12-31'; mode='multi-user unattended safe mode'; reportFormat='migrated-user-navigation-reference-v3'; reportDirectory='roles'; expectedAccountReports=2; expectedRoleReports=2; enabledControllers=@('organization-user-execution.md','campus-user-execution.md'); selectedControllers=@('organization-user-execution.md','campus-user-execution.md'); excludedControllers=@(); scenarioScope=[ordered]@{name='time-and-attendance';repositoryScenarioIds=@(29..46);excludedRepositoryScenarioIds=@(1..28);includeSupplementalWorkflows=$false}; timeline=[ordered]@{source='measured-video-events-v1';eventJournal='lanes/<lane-slug>/video-events.json';allowEstimatedRanges=$false;allowEqualPartitioning=$false}; capture=$capture; urlValidation=[ordered]@{requiredContains='stage-k12.ss';comparison='case-insensitive-substring';mismatchClassification='WARNING';warningDoesNotChangeStatus=$true;evidence='full-browser-window-screenshot'}; failurePolicy=[ordered]@{appliesTo='FAIL';observationTimeoutSeconds=120;requireFinalEvidence=$true;preserveBlockedAndNotTested=$true}; performancePolicy=[ordered]@{warningThresholdSeconds=30;maximumUiRecoverySeconds=120;warningCode='SLOW_UI_LOAD';warningDoesNotChangeStatus=$true;requireMeasuredElapsedTime=$true}; knownFailurePolicy=[ordered]@{catalog='config/known-failures.json';schemaVersion=1;displayLabel='KNOWN FAILED';statusRemains='FAIL';tickets=@($knownFailureCatalog.tickets)}; accounts=$accounts; lanes=@([ordered]@{laneId=1;slug='lane-1';controllers=@('organization-user-execution.md')},[ordered]@{laneId=2;slug='lane-2';controllers=@('campus-user-execution.md')}) }
    Write-TestJson (Join-Path $runRoot 'run-manifest.json') $manifest
    Write-TestJson (Join-Path $runRoot 'lanes\lane-1\video-events.json') (New-TestJournal 'lane-1' 'organization-user' 'scenario-01')
    Write-TestJson (Join-Path $runRoot 'lanes\lane-2\video-events.json') (New-TestJournal 'lane-2' 'campus-user' 'scenario-03')
    $savedErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    & node (Join-Path $workspaceRoot 'scripts\build-multi-user-run-data.mjs') $orgId $runId 2>$null
    $outOfScopeExitCode = $LASTEXITCODE
    $ErrorActionPreference = $savedErrorActionPreference
    if ($outOfScopeExitCode -eq 0) { throw 'TA-only scope failed to reject AM workflow events.' }
    Write-TestJson (Join-Path $runRoot 'lanes\lane-1\video-events.json') (New-TestJournal 'lane-1' 'organization-user' 'scenario-29')
    Write-TestJson (Join-Path $runRoot 'lanes\lane-2\video-events.json') (New-TestJournal 'lane-2' 'campus-user' 'scenario-30')
    $backEvidenceName = 'scenario-29-known-back-failure.png'
    $sidekickEvidenceName = 'scenario-30-sidekick-recovered.png'
    $tinyPng = [Convert]::FromBase64String('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=')
    [System.IO.File]::WriteAllBytes((Join-Path $runRoot "roles\organization-user\screenshots\$backEvidenceName"), $tinyPng)
    [System.IO.File]::WriteAllBytes((Join-Path $runRoot "roles\campus-user\screenshots\$sidekickEvidenceName"), $tinyPng)
    Write-TestJson (Join-Path $runRoot 'lanes\lane-1\execution-observations.json') ([ordered]@{environment='AES Stage ML';accounts=[ordered]@{'organization-user'=[ordered]@{overrides=[ordered]@{'scenario-29'=[ordered]@{name='29. Organization User TA round trip';source='tests/time-and-attendance/app-switcher-navigation-matrix.md';status='FAIL';actual='Logout succeeded, but browser Back restored the authenticated page after the 120-second observation.';failureObservationSeconds=120;knownFailure=[ordered]@{ticket='HCMAT-79895';matchEvidence='Logout succeeded and one browser Back action restored the previously authenticated page.'};steps=@([ordered]@{action='Observe the restored page for 120 seconds.';expected='Authenticated controls remain unavailable.';actual='The authenticated page remained visible after 120 seconds.';status='FAIL'});http404s=@()}}}}})
    Write-TestJson (Join-Path $runRoot 'lanes\lane-2\execution-observations.json') ([ordered]@{environment='AES Stage ML';accounts=[ordered]@{'campus-user'=[ordered]@{overrides=[ordered]@{'scenario-30'=[ordered]@{name='30. Campus User TA round trip';source='tests/time-and-attendance/app-switcher-navigation-matrix.md';status='PASS';actual='Sidekick became responsive after 42.317 seconds and all functional assertions succeeded.';warnings=@([ordered]@{code='SLOW_UI_LOAD';severity='WARNING';thresholdSeconds=30;elapsedSeconds=42.317;knownIssue=[ordered]@{ticket='HCMAT-79933'};step='Wait for Sidekick to become visible and responsive.';expected='Sidekick becomes responsive within 30 seconds.';actual='Sidekick became responsive after 42.317 seconds; functional validation continued and passed.';screenshot=$sidekickEvidenceName});http404s=@()}}}}})
    Write-TestJson (Join-Path $runRoot 'lanes\lane-1\browser-window-video-metadata.json') ([ordered]@{organizationId=$orgId;runId=$runId;laneSlug='lane-1';recordedDurationSeconds=2.0})
    Write-TestJson (Join-Path $runRoot 'lanes\lane-2\browser-window-video-metadata.json') ([ordered]@{organizationId=$orgId;runId=$runId;laneSlug='lane-2';recordedDurationSeconds=2.0})
    Write-TestJson (Join-Path $runRoot 'parallel-run-summary.json') ([ordered]@{organizationId=$orgId;runId=$runId;lanes=@([ordered]@{laneId=1;slug='lane-1';status='SUCCEEDED'},[ordered]@{laneId=2;slug='lane-2';status='SUCCEEDED'});postProcessing=[ordered]@{status='PENDING';stage='lane-validation'}})
    $ffmpeg = Join-Path $workspaceRoot 'node_modules\ffmpeg-static\ffmpeg.exe'
    & $ffmpeg -hide_banner -loglevel error -y -f lavfi -i 'color=c=blue:s=1280x720:r=15:d=2' -c:v libvpx-vp9 -deadline realtime (Join-Path $runRoot 'lanes\lane-1\videos\lane-1.webm')
    & $ffmpeg -hide_banner -loglevel error -y -f lavfi -i 'color=c=green:s=1280x720:r=15:d=2' -c:v libvpx-vp9 -deadline realtime (Join-Path $runRoot 'lanes\lane-2\videos\lane-2.webm')
    & node (Join-Path $workspaceRoot 'scripts\generate-parallel-run-summary-report.mjs') $orgId $runId --index
    if (-not (Test-Path -LiteralPath (Join-Path $runRoot 'parallel-run-summary.html')) -or -not (Test-Path -LiteralPath (Join-Path $runRoot 'index.html'))) { throw 'Fallback parallel HTML reports were not generated.' }
    if ((Get-Content -Raw -LiteralPath (Join-Path $runRoot 'parallel-run-summary.html')) -notmatch 'Time &amp; Attendance scenarios 29-46 only') { throw 'Fallback parallel report did not display the TA-only scope.' }
    & node (Join-Path $workspaceRoot 'scripts\build-multi-user-run-data.mjs') $orgId $runId
    & node (Join-Path $workspaceRoot 'scripts\apply-multi-user-video-timeline.mjs') $orgId $runId
    & (Join-Path $workspaceRoot 'scripts\finalize-multi-user-full-suite-run.ps1') -OrgId $orgId -RunId $runId | Out-Null
    & node (Join-Path $workspaceRoot 'scripts\generate-multi-user-full-suite-report.mjs') $orgId $runId
    $masterHtml = Get-Content -Raw -LiteralPath (Join-Path $runRoot 'index.html')
    if ($masterHtml -notmatch 'Time &amp; Attendance-only validation') { throw 'Canonical report did not display the TA-only scope.' }
    if ($masterHtml -notmatch 'Known failures' -or $masterHtml -notmatch 'HCMAT-79895') { throw 'Canonical dashboard did not display the known-failure summary.' }
    $scenarioHtml = Get-Content -Raw -LiteralPath (Join-Path $runRoot 'roles\organization-user\scenarios\scenario-29.html')
    if ($scenarioHtml -notmatch 'KNOWN FAILED' -or $scenarioHtml -notmatch 'HCMAT-79895') { throw 'Canonical report did not display the linked known failure.' }
    $sidekickHtml = Get-Content -Raw -LiteralPath (Join-Path $runRoot 'roles\campus-user\scenarios\scenario-30.html')
    if ($sidekickHtml -notmatch '>PASS<' -or $sidekickHtml -notmatch '42\.317 seconds') { throw 'Recovered Sidekick did not remain PASS with its measured slow-load time.' }
    if ($sidekickHtml -notmatch 'HCMAT-79933' -or $sidekickHtml -notmatch 'Known performance issue') { throw 'Recovered Sidekick warning did not display its Jira description.' }
    & (Join-Path $workspaceRoot 'scripts\package-multi-user-full-suite-report.ps1') -OrgId $orgId -RunId $runId | Out-Null
    foreach ($html in @(Get-ChildItem -LiteralPath $runRoot -Recurse -File -Filter '*.html')) {
        $text = Get-Content -Raw -LiteralPath $html.FullName
        foreach ($match in [regex]::Matches($text, '<video[^>]+src="([^"]+)"')) {
            $resolved = [System.IO.Path]::GetFullPath((Join-Path $html.DirectoryName $match.Groups[1].Value))
            if (-not (Test-Path -LiteralPath $resolved)) { throw "Broken video link in $($html.FullName): $($match.Groups[1].Value)" }
        }
    }
    Write-Output 'PASS: TA-only rejection guard, two-lane build, timeline, finalization, report links, and packaging succeeded.'
} finally {
    if (Test-Path -LiteralPath $runRoot) { Remove-Item -LiteralPath $runRoot -Recurse -Force }
    if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
}
