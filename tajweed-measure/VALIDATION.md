# Pilot validation record

9 October 2026. The separate Cloudflare D1 database is initialized with 32 clips and 148 empty candidate tasks. No expert measurements have been collected.

- Pinned dependency installation and frontend bundle: successful.
- Worker/D1/Assets integration tests: eight tests passed in the actual local Cloudflare runtime. Assertions cover independent calibration; missing calibration and non-realized targets; invalid/self-overlapping bounds; origin/authentication checks; assignment isolation; audio access; direct asset URL and navigation protection; invitation revocation and expiry; native-source offsets; optimistic concurrency; immutable saved history; owner and expert exports.
- Worker deployment bundle: Wrangler dry run passed (17.61 KiB before gzip); the dry run did not deploy the Worker or upload assets.
- Private pilot preparation: 32 clips, 148 tasks, 32,846,399 bytes of lossless FLAC. Every FLAC was decoded and compared sample-for-sample against its PCM16 WAV source. All 32 passed. Original MP3 files remain unchanged.
- Browser acceptance: **pending**. The available in-app browser rejected both loopback and localhost preview navigation with `net::ERR_BLOCKED_BY_CLIENT`. No security settings were changed. Successful builds and backend tests do not establish that playback, region dragging, spectrogram rendering, recovery, or responsive layout work in a real browser.
- Cloudflare deployment: D1 schema and pilot import completed. The account has no R2 service enabled; private audio now uses Worker assets with `run_worker_first = true` and an explicit public frontend allowlist. Asset hashes were verified during staging. Worker deployment is pending the additional `workers_scripts:write` OAuth authorization. GitHub Pages frontend also needs the deployed API URL before guest use.

Before inviting experts, open the deployed review interface at `/room/` and check: actual FLAC loading and playback; region placement by keyboard, numeric times, and dragging; zoom; spectrogram; speed and loop; draft save and reload; stale-draft recovery and restore; JSON export; phone-width layout; production invitation login and rejection of unassigned tasks. Do not retain test clicks as research annotations.

The expert panel must then agree on the acoustic boundary definitions and confirm clip/ayah alignment. Inferred navigation and incomplete context are explicitly flagged in the worklist. Expand short clips when calibration needs more context. Main-study annotations should start only after this pilot review.
