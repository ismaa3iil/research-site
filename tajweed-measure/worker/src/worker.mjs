import { validateMeasurement, summarize, PROTOCOL_VERSION } from '../../shared/measurement.mjs';

const now = () => Math.floor(Date.now() / 1000);
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
const hash = async token => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))].map(x => x.toString(16).padStart(2, '0')).join('');
const random = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const bearer = req => req.headers.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_-]{32,200})$/)?.[1] || '';
class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
async function body(req) {
  if (!req.headers.get('Content-Type')?.startsWith('application/json')) throw new HttpError(415, 'JSON is required.');
  if (+req.headers.get('Content-Length') > 65536) throw new HttpError(413, 'Request too large.');
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, 'A request body is required.');
  let size = 0; const chunks = [];
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > 65536) { await reader.cancel(); throw new HttpError(413, 'Request too large.'); }
    chunks.push(value);
  }
  const all = new Uint8Array(size); let at = 0;
  for (const chunk of chunks) { all.set(chunk, at); at += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(all)); } catch { throw new HttpError(400, 'Invalid JSON.'); }
}
async function expert(req, env) {
  const token = bearer(req);
  if (!token) throw new HttpError(401, 'Open your guest invitation to sign in.');
  const e = await env.DB.prepare('SELECT e.id,e.label FROM sessions s JOIN experts e ON e.id=s.expert_id WHERE s.token_hash=? AND s.expires_at>? AND e.active=1').bind(await hash(token), now()).first();
  if (!e) throw new HttpError(401, 'This session has expired or access was revoked.');
  return e;
}
async function assigned(env, e, id) {
  const row = await env.DB.prepare('SELECT t.id,t.public_json,c.public_json AS clip_json FROM assignments a JOIN tasks t ON t.id=a.task_id JOIN clips c ON c.id=t.clip_id WHERE a.expert_id=? AND t.id=?').bind(e.id, id).first();
  if (!row) throw new HttpError(404, 'Task not found.');
  return { ...JSON.parse(row.public_json), clip: JSON.parse(row.clip_json) };
}
async function admin(req, env) {
  const token = bearer(req);
  if (!env.ADMIN_SECRET || !token || await hash(token) !== await hash(env.ADMIN_SECRET)) throw new HttpError(401, 'Owner authentication required.');
}
async function route(req, env) {
  const path = new URL(req.url).pathname;
  // Only this explicit frontend allowlist is public. Never fall through to assets.
  const roomAssets = new Set(['/room/', '/room/index.html', '/room/style.css', '/room/guide.html', '/room/dist/app.js', '/room/dist/WAVESURFER-LICENSE.txt']);
  if (req.method === 'GET' && path === '/room/config.json') return json({ apiUrl: new URL(req.url).origin, studyTitle: 'Tajweed timing study' });
  if (req.method === 'GET' && roomAssets.has(path)) {
    return env.AUDIO_ASSETS.fetch(new Request(new URL(path === '/room/' ? '/room/index.html' : path, req.url)));
  }
  if (path === '/v1/health' && req.method === 'GET') return json({ service: 'tajweed-measure', protocolVersion: PROTOCOL_VERSION });
  if (path === '/v1/session' && req.method === 'POST') {
    const { invite } = await body(req);
    if (typeof invite !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(invite)) throw new HttpError(401, 'Invalid or expired invitation.');
    const e = await env.DB.prepare('SELECT e.id,e.label FROM invitations i JOIN experts e ON e.id=i.expert_id WHERE i.token_hash=? AND i.expires_at>? AND e.active=1').bind(await hash(invite), now()).first();
    if (!e) throw new HttpError(401, 'Invalid or expired invitation.');
    const token = random(), expires = now() + 7 * 86400;
    await env.DB.batch([
      env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(now()),
      env.DB.prepare('INSERT INTO sessions(token_hash,expert_id,expires_at) VALUES(?,?,?)').bind(await hash(token), e.id, expires)
    ]);
    return json({ token, expert: e, expires });
  }
  if (path.startsWith('/v1/admin/')) {
    await admin(req, env);
    if (path === '/v1/admin/experts' && req.method === 'GET') {
      const rows = await env.DB.prepare('SELECT e.id,e.label,e.active,e.created_at, (SELECT count(*) FROM assignments a WHERE a.expert_id=e.id) AS assigned, (SELECT count(*) FROM annotations n WHERE n.expert_id=e.id AND json_extract(n.data_json,\'$.status\')=\'submitted\') AS submitted FROM experts e').all();
      return json(rows.results);
    }
    if (path === '/v1/admin/experts' && req.method === 'POST') {
      const b = await body(req);
      if (typeof b.label !== 'string' || !b.label.trim() || b.label.length > 100) throw new HttpError(400, 'An expert label is required.');
      const all = (await env.DB.prepare('SELECT id FROM tasks ORDER BY id').all()).results.map(t => t.id);
      const ids = b.taskIds === 'all' ? all : b.taskIds;
      if (!Array.isArray(ids) || !ids.length || ids.length > 1000 || new Set(ids).size !== ids.length || ids.some(id => !all.includes(id))) throw new HttpError(400, 'Choose valid, distinct task IDs (up to 1000).');
      const id = crypto.randomUUID(), invite = random(), expires = now() + 30 * 86400;
      // Bulk assignment is one statement so larger studies stay below D1 batch query limits.
      await env.DB.batch([
        env.DB.prepare('INSERT INTO experts(id,label,created_at) VALUES(?,?,?)').bind(id, b.label.trim(), now()),
        env.DB.prepare('INSERT INTO invitations(token_hash,expert_id,expires_at) VALUES(?,?,?)').bind(await hash(invite), id, expires),
        env.DB.prepare('INSERT INTO assignments(expert_id,task_id) SELECT ?,value FROM json_each(?)').bind(id, JSON.stringify(ids))
      ]);
      return json({ id, label: b.label.trim(), expires, assigned: ids.length, invitationUrl: `${env.SITE_URL}#invite=${invite}` }, 201);
    }
    const revoke = path.match(/^\/v1\/admin\/experts\/([a-f0-9-]+)\/revoke$/);
    if (revoke && req.method === 'POST') {
      await env.DB.batch([
        env.DB.prepare('UPDATE experts SET active=0 WHERE id=?').bind(revoke[1]),
        env.DB.prepare('DELETE FROM sessions WHERE expert_id=?').bind(revoke[1]),
        env.DB.prepare('DELETE FROM invitations WHERE expert_id=?').bind(revoke[1])
      ]);
      return json({ revoked: revoke[1] });
    }
    if (path === '/v1/admin/export' && req.method === 'GET') {
      const [annotations, history, clips, tasks, experts] = await env.DB.batch([
        env.DB.prepare('SELECT * FROM annotations ORDER BY expert_id,task_id'),
        env.DB.prepare('SELECT * FROM annotation_history ORDER BY id'),
        env.DB.prepare('SELECT * FROM clips'), env.DB.prepare('SELECT * FROM tasks'),
        env.DB.prepare('SELECT id,label,active,created_at FROM experts')
      ]);
      return json({ schemaVersion: 1, protocolVersion: PROTOCOL_VERSION, exportedAt: new Date().toISOString(),
        annotations: annotations.results, history: history.results, clips: clips.results, tasks: tasks.results, experts: experts.results });
    }
    throw new HttpError(404, 'Owner endpoint not found.');
  }
  const e = await expert(req, env);
  if (path === '/v1/tasks' && req.method === 'GET') {
    const rows = await env.DB.prepare('SELECT t.public_json,c.public_json AS clip_json,n.data_json,n.revision FROM assignments a JOIN tasks t ON t.id=a.task_id JOIN clips c ON c.id=t.clip_id LEFT JOIN annotations n ON n.task_id=t.id AND n.expert_id=a.expert_id WHERE a.expert_id=? ORDER BY json_extract(c.public_json,\'$.recording\'),json_extract(t.public_json,\'$.verseOrder\'),json_extract(t.public_json,\'$.wordIndex\'),t.id').bind(e.id).all();
    return json({ expert: e, tasks: rows.results.map(r => ({ ...JSON.parse(r.public_json), clip: JSON.parse(r.clip_json), annotation: r.data_json ? JSON.parse(r.data_json) : null, revision: r.revision || 0 })) });
  }
  const annotation = path.match(/^\/v1\/tasks\/([a-zA-Z0-9_-]+)\/annotation$/);
  if (annotation && req.method === 'PUT') {
    const task = await assigned(env, e, annotation[1]), b = await body(req);
    if (!Number.isSafeInteger(b.revision) || b.revision < 0) throw new HttpError(400, 'Invalid revision.');
    let data; try { data = validateMeasurement(b.measurement, task.clip); } catch (err) { throw new HttpError(422, err.message); }
    data.summary = summarize(data, task.clip);
    data.source = { clipId: task.clip.id, sourceSha256: task.clip.sourceSha256, sampleRate: task.clip.sampleRate, clipStartSample: task.clip.sourceStartSample,
      targetStartSample: data.target ? task.clip.sourceStartSample + data.target.start : null,
      targetEndSample: data.target ? task.clip.sourceStartSample + data.target.end : null };
    const stamp = now(), serialized = JSON.stringify(data);
    const sql = b.revision === 0
      ? 'INSERT INTO annotations(expert_id,task_id,revision,data_json,updated_at) VALUES(?,?,1,?,?) ON CONFLICT(expert_id,task_id) DO NOTHING RETURNING revision'
      : 'UPDATE annotations SET data_json=?,updated_at=?,revision=revision+1 WHERE expert_id=? AND task_id=? AND revision=? RETURNING revision';
    const args = b.revision === 0 ? [e.id, task.id, serialized, stamp] : [serialized, stamp, e.id, task.id, b.revision];
    const result = await env.DB.prepare(sql).bind(...args).first();
    if (!result) throw new HttpError(409, 'A newer revision exists. Export your local draft, then reload before editing.');
    return json({ annotation: data, revision: b.revision + 1, updatedAt: stamp });
  }
  if (path === '/v1/annotations' && req.method === 'GET') {
    const rows = await env.DB.prepare('SELECT task_id,revision,data_json,updated_at FROM annotations WHERE expert_id=? ORDER BY task_id').bind(e.id).all();
    return json({ schemaVersion: 1, protocolVersion: PROTOCOL_VERSION, expert: e, annotations: rows.results.map(r => ({ taskId: r.task_id, revision: r.revision, updatedAt: r.updated_at, ...JSON.parse(r.data_json) })) });
  }
  const audio = path.match(/^\/v1\/audio\/([a-zA-Z0-9_-]+)$/);
  if (audio && req.method === 'GET') {
    const row = await env.DB.prepare('SELECT c.object_key FROM clips c WHERE c.id=? AND EXISTS(SELECT 1 FROM tasks t JOIN assignments a ON a.task_id=t.id WHERE t.clip_id=c.id AND a.expert_id=?)').bind(audio[1], e.id).first();
    if (!row) throw new HttpError(404, 'Clip not found.');
    const object = await env.AUDIO_ASSETS.fetch(new Request(new URL('/audio/' + row.object_key, req.url)));
    if (!object.ok) throw new HttpError(404, 'The study audio has not been uploaded yet.');
    const response = new Response(object.body, object);
    response.headers.set('Content-Type', 'audio/flac');
    return response;
  }
  throw new HttpError(404, 'Endpoint not found.');
}
export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());
    const headers = new Headers({ 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Vary': 'Origin' });
    if (origin && origin !== new URL(req.url).origin && !allowed.includes(origin)) return new Response('Origin not allowed.', { status: 403, headers });
    if (origin) headers.set('Access-Control-Allow-Origin', origin);
    if (req.method === 'OPTIONS') {
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      return new Response(null, { status: 204, headers });
    }
    let response;
    try { response = await route(req, env); }
    catch (err) {
      if (!err.status) console.error('Tajweed service error:', err.name, err.message);
      response = json({ error: err.status ? err.message : 'The service could not complete this request.' }, err.status || 500);
    }
    const result = new Response(response.body, response);
    for (const [key, value] of headers) result.headers.set(key, value);
    return result;
  }
};
