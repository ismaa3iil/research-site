# Tajweed measurement room

Static measurement interface for GitHub Pages, with a separate Cloudflare Worker, D1 database, and authenticated Worker audio assets. This is a pilot annotation tool, not a report of measured reciter performance. R2 activation is not required.

The backend and 32-clip / 148-task pilot were deployed on 9 October 2026. `config.json` contains the live API URL. See [the validation record](VALIDATION.md) for completed checks and remaining manual browser acceptance. The local owner secret and invitation files are gitignored.

The new service is independent of the website's existing triangle-preference collector. It never uses that collector's database or changes its configuration.

## What experts can do

- Open a revocable guest invitation, without creating a GitHub account.
- Listen to assigned lossless excerpts, zoom the waveform, inspect a spectrogram, loop intervals, and slow playback.
- Mark target and reference boundaries by dragging, keyboard, or numeric entry.
- Review rule applicability, actual stopping, confidence, subtype, and text/audio alignment.
- Save drafts, submit measurements, recover unsaved work, and export their own annotations.

The server checks assignment ownership on every request. Experts cannot view another expert's annotations. Invitations last 30 days and may be reused until expiry or revocation. Sessions last seven days. Only token hashes are stored in D1; the browser keeps a session token in sessionStorage. Unsaved recovery drafts stay in localStorage on the annotator's device. Signing out clears the session, not recovery drafts. Use private devices for private work.

The owner creates and revokes invitations through a local CLI. No emails are sent. The owner secret never belongs in browser code or this repository.

## Local development

Requires Node 24 or later. Install pinned dependencies with `npm ci`, then run:

```sh
npm test
npm run build
npm run preview
```

Local preview is explicitly enabled only on localhost/127.0.0.1 with `?preview=1`. It stores annotations on that device and does not simulate secure guest authentication. Production always requires the Worker.

The preparation script accepts the existing study folder containing `data/pilot-excerpts.json`, `data/pilot-annotations.json`, `data/event-inventory.json`, and the WAV clips. It requires numpy and soundfile; `--libs` can point to an existing library folder:

```sh
python tools/prepare_pilot.py --study-root /path/to/Tajweed --libs /path/to/libraries
```

It creates 32 lossless FLACs, 148 tasks, a private provenance manifest, and a D1 seed file under gitignored `.preview/` and `.private/`. It verifies every FLAC against the PCM source. Audio, expert identities, and annotations must never be committed to the public website repository. All generated pilot measurements start empty. `node tools/stage-assets.mjs` verifies the hashes again and stages audio plus the public sign-in interface for Worker deployment.

## Connect the existing Cloudflare account

Cloudflare DNS for the website does not by itself create the application's backend. Run these from this directory after signing into the correct account:

```sh
npx wrangler login --device --scopes account:read user:read workers:write workers_scripts:write d1:write
npx wrangler whoami
npx wrangler d1 create tajweed-measure
```

Copy `worker/wrangler.toml.example` to `worker/wrangler.toml`; set the **new** D1 database ID and, if needed, the account ID. Keep the exact production origin `https://ismaa3iil.fyi` and chosen site URL in the variables. Add other origins deliberately. A deployed Worker also accepts its own origin for the review interface at `/room/`.

**Keep `assets.run_worker_first = true`, `html_handling = "none"`, and `not_found_handling = "none"`.** All asset requests must pass through the authentication code. The only public frontend paths are an explicit `/room/` allowlist; raw `/audio/` paths never fall through to asset serving. An authenticated audio request also needs an assigned task using that clip. Tests cover direct URLs and navigation requests. See [Cloudflare's authenticated asset routing documentation](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/).

Assets have a 25 MiB per-file limit; the staging script rejects larger clips. Split long recordings into reviewed excerpts rather than uploading entire long surahs. Asset storage has no additional charge, while requests that run the authentication Worker count toward the account's Worker allowance. No paid plan or R2 service is enabled by this setup. See [Cloudflare's asset billing documentation](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/).

Create a random 32-byte base64url owner secret and store it in a password manager. Set the Worker secret using Wrangler's interactive prompt:

```sh
npx wrangler secret put ADMIN_SECRET --config worker/wrangler.toml
npx wrangler d1 execute tajweed-measure --remote --file worker/schema.sql --config worker/wrangler.toml
npx wrangler d1 execute tajweed-measure --remote --file .private/seed.sql --config worker/wrangler.toml
```

Stage the reviewed audio and interface, then deploy them with the Worker:

```sh
node tools/stage-assets.mjs
npm run deploy:api
```

Set `apiUrl` in `config.json` to the deployed Worker HTTPS URL. That URL is public configuration, not a secret. Leave it blank until the service is deployed; the page then clearly says setup is incomplete. Merge the website PR to publish `/tajweed-measure/` through the site's normal GitHub Pages deployment. The checked-in `dist/app.js` must be rebuilt after frontend source changes.

## Owner operations

Set `TAJWEED_API_URL` and `TAJWEED_ADMIN_SECRET` in your local shell. Alternatively, the CLI reads the API URL from `config.json` and the secret from local gitignored `.private/owner-secrets.json` (`{"ADMIN_SECRET":"..."}`). The secret must be at least 32 URL-safe characters. Keep that local file private and backed up; never put it in the asset staging folder. Do not paste it into GitHub, the frontend, or chat.

```sh
node tools/admin.mjs invite "Expert 01" all
node tools/admin.mjs invite "Expert 02" task_id,task_id
node tools/admin.mjs list
node tools/admin.mjs revoke <expert-uuid>
node tools/admin.mjs export exports/study-backup.json
```

The invitation is returned once, with its credential in the URL fragment. Distribute it privately yourself. Assign a preselected overlapping subset to at least two experts for independent reliability review. The API currently allows up to 1000 tasks per invitation request; larger studies can extend assignment administration before expansion. Owner exports include original reciter provenance, current measurements, and every saved revision, with no credential hashes. Keep exported files private.

## Measurement and provenance

All boundaries are integer **clip-relative native samples**, including reference intervals. Exported source coordinates add `clip.sourceStartSample`. The original MP3 SHA256, native sample rate, decoder-derived frame counts, clip offsets, constant review gain, navigation caveats, and lossless FLAC hash are preserved. Milliseconds are derived using the native sample rate; playback speed never affects them.

The two haraka estimates are median eligible short vowel duration and half the median eligible natural madd duration. Each needs at least five distinct references. Missing calibration stays null; it is not inferred from the target. Experts see raw milliseconds and reference counts, not expected counts, cohort labels, or normalized target durations. Numerical targets and route-specific madd choices belong in a frozen analysis specification, not annotator best-fit judgments.

The pilot comprises Al-Maida 1–2; Fatir 1, 28, 45; Qaf 1, 6, 16, from four of the ten planned reciters. Clip navigation and textual candidates require specialist listening. Short excerpts such as Qaf 1 may need expanded context for enough calibration references. The initial operational boundaries need expert training and agreement before collection. See [the expert guide](guide.html).

## Validation

`npm test` uses Miniflare's actual Worker/D1/Assets runtime. It exercises invitation/session access, private assignments, audio access, direct asset URL protection, navigation requests, revocation, expiry, CORS, source-coordinate arithmetic, independent calibration, invalid/self-overlapping intervals, optimistic write conflicts, history triggers, and private exports. Before inviting experts, browser acceptance checks must cover actual prepared audio, waveform controls, marking, saving, reload recovery, narrow layout, and production invitation login. These checks do not replace human acoustic validation.

The frontend uses WaveSurfer.js under its BSD-3-Clause license, copied to `dist/WAVESURFER-LICENSE.txt` by the build. Source audio and Quran text retain their source rights; inclusion in this local private study package is not a grant of redistribution rights. Provenance remains in the private manifest.
