# Pilot validation record

9 October 2026. No live Cloudflare resources have been provisioned and no expert measurements have been collected.

- Pinned dependency installation and frontend bundle: successful.
- Worker/D1/R2 integration tests: seven tests passed in the actual local Cloudflare runtime. Assertions cover independent calibration; missing calibration and non-realized targets; invalid/self-overlapping bounds; origin/authentication checks; assignment isolation; audio access; invitation revocation and expiry; native-source offsets; optimistic concurrency; immutable saved history; owner and expert exports.
- Worker deployment bundle: Wrangler dry run passed (16.95 KiB before gzip); no deployment or cloud resource creation occurred.
- Private pilot preparation: 32 clips, 148 tasks, 32,846,399 bytes of lossless FLAC. Every FLAC was decoded and compared sample-for-sample against its PCM16 WAV source. All 32 passed. Original MP3 files remain unchanged.
- Browser acceptance: **pending**. The available in-app browser rejected both loopback and localhost preview navigation with `net::ERR_BLOCKED_BY_CLIENT`. No security settings were changed. Successful builds and backend tests do not establish that playback, region dragging, spectrogram rendering, recovery, or responsive layout work in a real browser.
- Cloudflare deployment: **pending account sign-in** (`wrangler whoami` reports unauthenticated). GitHub Pages frontend also needs a configured deployed API URL before guest use.

Before inviting experts, open the local preview and check: actual FLAC loading and playback; region placement by keyboard, numeric times, and dragging; zoom; spectrogram; speed and loop; draft save and reload; stale-draft recovery and restore; JSON export; phone-width layout; production invitation login and rejection of unassigned tasks. Do not retain test clicks as research annotations.

The expert panel must then agree on the acoustic boundary definitions and confirm clip/ayah alignment. Inferred navigation and incomplete context are explicitly flagged in the worklist. Expand short clips when calibration needs more context. Main-study annotations should start only after this pilot review.
