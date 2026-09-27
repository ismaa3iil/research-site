# Anonymous preference collector

The atlas works without this service: rankings are always stored in the visitor's browser and can be exported. This optional Cloudflare Worker stores consented research submissions in D1.

Production endpoint: `https://triangle-beauty-preferences.ismaa3iil-triangle-beauty.workers.dev`

Stored fields are limited to the atlas/study versions, a salted hash of a random browser-local identifier, comparison number, the 1–2–3 ordering, diagram identifiers, presentation metadata, and timestamps. The worker does not store names, email addresses, IP addresses, referrers, or user-agent strings. Revisions replace earlier answers from the same browser; visitors can retract one answer or all their answers.

## Deployment

1. Use the tracked `wrangler.toml`; `wrangler.toml.example` documents the reusable template.
2. The production D1 database is named `triangle-beauty-preferences` and its ID is recorded in `wrangler.toml`.
3. Apply `schema.sql` to the remote database.
4. Set a long random `VISITOR_SALT` with Wrangler's secret command.
5. Deploy the Worker.
6. Put the resulting HTTPS Worker URL in `../preference-config.js` as `endpoint`.
7. Submit one test ranking from `https://ismaa3iil.fyi`, verify the D1 row, retract it, and verify that the row disappears before announcing the study.

Do not enable request-body logging. Treat the resulting anonymous preference table as research data. The public atlas states that individual response rows are retained while the exploratory study is active and for no more than two years after collection closes, after which they are deleted; anonymous aggregate statistics may be retained.
