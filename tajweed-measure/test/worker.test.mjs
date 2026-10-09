import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { fileURLToPath } from 'node:url';
import { validateMeasurement, summarize } from '../shared/measurement.mjs';

const secret = 'A'.repeat(43), origin = 'https://ismaa3iil.fyi';
let mf, db, a, b, inviteB;
const clip = { id: 'clip_a', recording: 'Recording A', sampleRate: 1000, samples: 10000, sourceStartSample: 5000, sourceSha256: 'abc' };
const task = id => ({ id, family: 'qalqala', verseKey: '50:1', wordIndex: 1, verseOrder: 50001 });
const valid = () => ({ status: 'submitted', applicability: 'yes', actualStop: 'continue', confidence: 'high', alignmentConfirmed: true, samePaceConfirmed: true, subtype: 'ق', notes: '', calibrationNote: '', target: { start: 8500, end: 8800 }, references: Array.from({ length: 10 }, (_, i) => ({ id: 'r' + i, kind: i < 5 ? 'short_vowel' : 'natural_madd', start: i * 300, end: i * 300 + (i < 5 ? 100 : 200), label: 'word / a', eligible: true, exclusion: '' })) });
async function call(path, { method = 'GET', token, body, from = origin } = {}) {
  return mf.dispatchFetch('https://api.example' + path, { method, headers: { Origin: from, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
async function invite(label, ids) {
  const r = await call('/v1/admin/experts', { method: 'POST', token: secret, body: { label, taskIds: ids } });
  assert.equal(r.status, 201); const created = await r.json();
  const code = created.invitationUrl.split('#invite=')[1];
  const session = await call('/v1/session', { method: 'POST', body: { invite: code } });
  assert.equal(session.status, 200);
  return { ...await session.json(), code, id: created.id };
}
before(async () => {
  mf = new Miniflare(convertV4MiniflareOptions({ modulesRoot: fileURLToPath(new URL('..', import.meta.url)), modules: [
    { type: 'ESModule', path: fileURLToPath(new URL('../worker/src/worker.mjs', import.meta.url)) },
    { type: 'ESModule', path: fileURLToPath(new URL('../shared/measurement.mjs', import.meta.url)) }
  ], compatibilityDate: '2026-10-01', d1Databases: ['DB'], r2Buckets: ['AUDIO'], bindings: { ADMIN_SECRET: secret, ALLOWED_ORIGINS: origin, SITE_URL: origin + '/tajweed-measure/' } }));
  db = await mf.getD1Database('DB');
  const schema = await readFile(new URL('../worker/schema.sql', import.meta.url), 'utf8');
  for (const statement of schema.trim().split(/;\r?\n(?=(?:CREATE|PRAGMA))/)) await db.prepare(statement).run();
  await db.prepare('INSERT INTO clips VALUES(?,?,?,?)').bind('clip_a', JSON.stringify(clip), '{"reciter":"private identity"}', 'clip_a.flac').run();
  for (const id of ['task_a', 'task_b']) await db.prepare('INSERT INTO tasks VALUES(?,?,?)').bind(id, 'clip_a', JSON.stringify(task(id))).run();
  await (await mf.getR2Bucket('AUDIO')).put('clip_a.flac', new Uint8Array([102,76,97,67]));
  a = await invite('Expert A', ['task_a']); b = await invite('Expert B', ['task_b']); inviteB = b.code;
});
after(async () => { await mf?.dispose(); });

test('independent medians and native source coordinates', () => {
  const s = summarize(validateMeasurement(valid(), clip), clip);
  assert.equal(s.targetMs, 300); assert.equal(s.hSvMs, 100); assert.equal(s.hNatMs, 100);
  assert.equal(s.targetHarakaSv, 3); assert.equal(s.targetHarakaNat, 3);
});
test('target self-reference, duplicate references, and invalid boundaries are rejected', () => {
  let data = valid(); data.references[0].start = 8500; data.references[0].end = 8600;
  assert.throws(() => validateMeasurement(data, clip), /own timing reference/);
  data = valid(); data.references[1].start = 20; data.references[1].end = 80;
  assert.throws(() => validateMeasurement(data, clip), /must not overlap/);
  data = valid(); data.target.end = 10001; assert.throws(() => validateMeasurement(data, clip), /within the clip/);
});
test('missing references remain unavailable, and non-realized is null rather than zero', () => {
  const data = valid(); data.references = []; data.calibrationNote = 'This excerpt needs additional nearby ayah context.';
  assert.equal(summarize(validateMeasurement(data, clip), clip).targetHarakaSv, null);
  data.applicability = 'no'; data.target = null; data.notes = 'The reciter continued; no qalqala was realized.';
  assert.equal(summarize(validateMeasurement(data, clip), clip).targetMs, null);
});
test('authentication, origin checks, and private worklists', async () => {
  assert.equal((await call('/v1/tasks')).status, 401);
  assert.equal((await call('/v1/tasks', { token: a.token, from: 'https://evil.example' })).status, 403);
  assert.equal((await call('/v1/session', { method: 'POST', body: { invite: 'Z'.repeat(43) } })).status, 401);
  const response = await call('/v1/tasks', { token: a.token });
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  const data = await response.json(); assert.deepEqual(data.tasks.map(t => t.id), ['task_a']);
  assert.equal(JSON.stringify(data).includes('private identity'), false);
  assert.equal((await call('/v1/tasks/task_b/annotation', { method: 'PUT', token: a.token, body: { revision: 0, measurement: valid() } })).status, 404);
});
test('saving, stale-write conflicts, append-only history, and exports', async () => {
  let response = await call('/v1/tasks/task_a/annotation', { method: 'PUT', token: a.token, body: { revision: 0, measurement: valid() } });
  assert.equal(response.status, 200); let result = await response.json();
  assert.equal(result.revision, 1); assert.equal(result.annotation.source.targetStartSample, 13500);
  assert.equal(result.annotation.source.targetEndSample, 13800);
  response = await call('/v1/tasks/task_a/annotation', { method: 'PUT', token: a.token, body: { revision: 0, measurement: valid() } }); assert.equal(response.status, 409);
  const edited = valid(); edited.target.end = 8900;
  response = await call('/v1/tasks/task_a/annotation', { method: 'PUT', token: a.token, body: { revision: 1, measurement: edited } }); assert.equal(response.status, 200);
  const history = (await db.prepare('SELECT revision,data_json FROM annotation_history ORDER BY revision').all()).results;
  assert.equal(history.length, 2); assert.equal(JSON.parse(history[0].data_json).target.end, 8800); assert.equal(JSON.parse(history[1].data_json).target.end, 8900);
  const own = await (await call('/v1/annotations', { token: b.token })).json(); assert.equal(own.annotations.length, 0);
  assert.equal((await call('/v1/admin/export', { token: a.token })).status, 401);
  const exported = await (await call('/v1/admin/export', { token: secret })).json(); assert.equal(exported.history.length, 2); assert.equal(exported.clips.length, 1);
  assert.equal(JSON.stringify(exported).includes('token_hash'), false);
});
test('protected audio and revocation invalidate invitations and sessions', async () => {
  assert.equal((await call('/v1/audio/clip_a')).status, 401);
  assert.equal((await call('/v1/audio/clip_missing', { token: a.token })).status, 404);
  assert.equal((await call('/v1/audio/clip_a', { token: a.token })).status, 200);
  const response = await call(`/v1/admin/experts/${b.id}/revoke`, { method: 'POST', token: secret }); assert.equal(response.status, 200);
  assert.equal((await call('/v1/tasks', { token: b.token })).status, 401);
  assert.equal((await call('/v1/session', { method: 'POST', body: { invite: inviteB } })).status, 401);
  assert.equal((await call('/v1/tasks', { token: a.token })).status, 200);
});
test('expired sessions and invitations cannot be reused', async () => {
  await db.prepare('UPDATE sessions SET expires_at=0 WHERE expert_id=?').bind(a.id).run();
  await db.prepare('UPDATE invitations SET expires_at=0 WHERE expert_id=?').bind(a.id).run();
  assert.equal((await call('/v1/tasks', { token: a.token })).status, 401);
  assert.equal((await call('/v1/session', { method: 'POST', body: { invite: a.code } })).status, 401);
});
