import WaveSurfer from 'wavesurfer.js';
import Regions from 'wavesurfer.js/dist/plugins/regions.esm.js';
import Timeline from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram.esm.js';
import { families, validateMeasurement, summarize } from '../shared/measurement.mjs';

const $ = id => document.getElementById(id);
const preview = ['localhost', '127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).get('preview') === '1';
const invitation = new URLSearchParams(location.hash.slice(1)).get('invite');
if (invitation) history.replaceState(null, '', location.pathname + location.search);
let config, tasks = [], current, measurement, baseRevision = 0, dirty = false, ws, regions, spec, selected = 'target', rendering = false, ready = false, clipId, blobUrl, loading = false;
let credentials = JSON.parse(sessionStorage.getItem('tajweed-session') || 'null');
const blank = () => ({ status: 'draft', applicability: 'pending', actualStop: 'pending', confidence: 'pending', alignmentConfirmed: false, samePaceConfirmed: false, subtype: '', notes: '', calibrationNote: '', target: null, references: [] });
const notice = (message, error = false) => { $('notice').textContent = message; $('notice').className = error ? 'error' : ''; $('notice').hidden = !message; };
const error = e => notice(e.message || String(e), true);
const download = (name, data) => { const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
async function api(path, options = {}) {
  const response = await fetch(config.apiUrl + path, { ...options, headers: { ...(credentials ? { Authorization: `Bearer ${credentials.token}` } : {}), ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }, cache: 'no-store', credentials: 'omit' });
  if (!response.ok) { const b = await response.json().catch(() => ({})); throw new Error(b.error || `Request failed (${response.status}).`); }
  return response;
}
function draftKey() { return `tajweed-draft:${preview ? 'preview' : credentials?.expert.id}:${current.id}`; }
function changed() {
  dirty = true; $('save-state').textContent = preview ? 'Unsaved changes · local preview' : 'Unsaved changes · recovery copy on this device';
  localStorage.setItem(draftKey(), JSON.stringify({ measurement, revision: baseRevision }));
  updateCounts();
}
function updateCounts() {
  const s = summarize(measurement, current.clip);
  $('reference-counts').textContent = `${s.shortVowelCount} short vowels · ${s.naturalMaddCount} natural madd`;
  $('target-duration').textContent = s.targetMs === null ? 'No interval marked' : `${s.targetMs.toFixed(1)} ms`;
}
function renderQueue() {
  const submitted = tasks.filter(t => t.annotation?.status === 'submitted').length;
  $('progress').textContent = `${submitted} / ${tasks.length} submitted`;
  $('progressbar').max = tasks.length || 1; $('progressbar').value = submitted;
  const filter = $('filter').value, nav = $('tasks'); nav.replaceChildren();
  for (const t of tasks.filter(t => filter === 'all' || (filter === 'pending' ? t.annotation?.status !== 'submitted' : t.family === filter))) {
    const button = document.createElement('button'); button.className = `task${current?.id === t.id ? ' current' : ''}`;
    const word = document.createElement('span'); word.className = 'taskword'; word.lang = 'ar'; word.dir = 'rtl'; word.textContent = t.word;
    const strong = document.createElement('strong'); strong.textContent = `${t.clip.recording} · ${t.verseKey}`;
    const small = document.createElement('small'); small.textContent = `${families[t.family]} · ${t.annotation?.status || 'pending'}`;
    button.append(word, strong, small); button.onclick = () => openTask(t).catch(error); nav.append(button);
  }
}
function drawRegions() {
  if (!ready) return;
  rendering = true; regions.clearRegions();
  const fs = current.clip.sampleRate;
  const add = (id, interval, color, content) => { if (interval) regions.addRegion({ id, start: interval.start / fs, end: interval.end / fs, color, content, drag: true, resize: true }); };
  add('target', measurement.target, '#218d7055', 'Target');
  for (const r of measurement.references) add(r.id, r, r.eligible ? (r.kind === 'short_vowel' ? '#c9913c44' : '#627dca44') : '#88888822', r.kind === 'short_vowel' ? 'SV' : 'Natural');
  rendering = false;
}
function selectInterval(id) {
  selected = id;
  $('select-target').classList.toggle('selected', id === 'target');
  for (const button of document.querySelectorAll('[data-ref-select]')) button.classList.toggle('selected', button.dataset.refSelect === id);
}
function interval() { return selected === 'target' ? measurement.target : measurement.references.find(r => r.id === selected); }
function newInterval() {
  const fs = current.clip.sampleRate, start = Math.min(Math.round((ws?.getCurrentTime() || 0) * fs), current.clip.samples - 1);
  return { start, end: Math.min(current.clip.samples, start + Math.round(fs * .1)) };
}
function setMark(side) {
  if (!ready) return;
  if (selected === 'target' && measurement.applicability !== 'yes') { notice('Choose “Realized · measure” before marking the target.', true); return; }
  let r = interval();
  if (!r && selected === 'target') measurement.target = r = newInterval();
  if (!r) return;
  const position = Math.min(current.clip.samples, Math.max(0, Math.round(ws.getCurrentTime() * current.clip.sampleRate)));
  r[side] = position;
  if (r.end <= r.start) { if (side === 'start') r.end = Math.min(current.clip.samples, r.start + Math.round(.1 * current.clip.sampleRate)); else r.start = Math.max(0, r.end - Math.round(.1 * current.clip.sampleRate)); }
  renderIntervals(); drawRegions(); changed();
}
function inputSeconds(value) { return Math.round(Number(value) * current.clip.sampleRate); }
function renderIntervals() {
  const fs = current.clip.sampleRate;
  $('target-start').value = measurement.target ? (measurement.target.start / fs).toFixed(6) : '';
  $('target-end').value = measurement.target ? (measurement.target.end / fs).toFixed(6) : '';
  const parent = $('references'); parent.replaceChildren();
  for (const r of measurement.references) {
    const div = document.createElement('div'); div.className = `ref${r.kind === 'natural_madd' ? ' natural' : ''}`;
    const row = document.createElement('div'); row.className = 'row';
    const edit = document.createElement('button'); edit.textContent = r.kind === 'short_vowel' ? 'Edit short vowel' : 'Edit natural madd'; edit.dataset.refSelect = r.id; edit.onclick = () => selectInterval(r.id);
    row.append(edit);
    for (const side of ['start', 'end']) {
      const label = document.createElement('label'); label.textContent = `${side === 'start' ? 'Start' : 'End'} (s)`;
      const input = document.createElement('input'); input.type = 'number'; input.step = '.001'; input.min = '0'; input.value = (r[side] / fs).toFixed(6);
      input.onchange = () => { r[side] = inputSeconds(input.value); drawRegions(); changed(); duration.textContent = `${((r.end - r.start) * 1000 / fs).toFixed(1)} ms`; };
      label.append(input); row.append(label);
    }
    const duration = document.createElement('span'); duration.className = 'duration'; duration.textContent = `${((r.end - r.start) * 1000 / fs).toFixed(1)} ms`; row.append(duration);
    const remove = document.createElement('button'); remove.className = 'remove'; remove.textContent = 'Remove'; remove.onclick = () => { measurement.references = measurement.references.filter(x => x.id !== r.id); selectInterval('target'); renderIntervals(); drawRegions(); changed(); }; row.append(remove);
    const details = document.createElement('div'); details.className = 'row';
    const label = document.createElement('input'); label.className = 'ref-label'; label.placeholder = 'Reference word + vowel (a / i / u)'; label.setAttribute('aria-label', 'Reference word and vowel'); label.value = r.label; label.oninput = () => { r.label = label.value; changed(); };
    const eligible = document.createElement('label'); eligible.className = 'check eligible'; const check = document.createElement('input'); check.type = 'checkbox'; check.checked = r.eligible; check.onchange = () => { r.eligible = check.checked; drawRegions(); changed(); exclusion.hidden = check.checked; }; eligible.append(check, 'Eligible');
    const exclusion = document.createElement('input'); exclusion.placeholder = 'Reason for exclusion'; exclusion.setAttribute('aria-label', 'Reason for exclusion'); exclusion.hidden = r.eligible; exclusion.value = r.exclusion; exclusion.oninput = () => { r.exclusion = exclusion.value; changed(); };
    details.append(label, eligible, exclusion); div.append(row, details); parent.append(div);
  }
  selectInterval(selected); updateCounts();
}
function populate() {
  for (const [id, key] of [['applicability','applicability'],['actual-stop','actualStop'],['confidence','confidence'],['subtype','subtype'],['notes','notes'],['calibration-note','calibrationNote']]) $(id).value = measurement[key];
  $('alignment').checked = measurement.alignmentConfirmed; $('same-pace').checked = measurement.samePaceConfirmed;
  renderIntervals(); drawRegions();
}
async function loadAudio(clip) {
  if (clipId === clip.id && ready) { drawRegions(); return; }
  ready = false; $('audio-state').textContent = 'Loading lossless audio…';
  for (const id of ['play','selection','mark-start','mark-end']) $(id).disabled = true;
  ws?.destroy(); spec = null; if (blobUrl) URL.revokeObjectURL(blobUrl);
  regions = Regions.create();
  ws = WaveSurfer.create({ container: '#waveform', waveColor: '#8ba9a0', progressColor: '#216e5a', cursorColor: '#b95321', height: 125, sampleRate: clip.sampleRate, minPxPerSec: 0, normalize: false, plugins: [regions, Timeline.create({ height: 20 })] });
  ws.on('timeupdate', time => { $('cursor').textContent = `${time.toFixed(3)} s`; const r = interval(); if ($('loop').checked && r && time >= r.end / clip.sampleRate) ws.setTime(r.start / clip.sampleRate); });
  ws.on('play', () => { $('play').textContent = 'Ⅱ Pause'; }); ws.on('pause', () => { $('play').textContent = '▶ Play'; });
  regions.on('region-clicked', (r, e) => { e.stopPropagation(); selectInterval(r.id); });
  regions.on('region-updated', r => {
    if (rendering) return;
    const dest = r.id === 'target' ? measurement.target : measurement.references.find(x => x.id === r.id);
    if (!dest) return;
    dest.start = Math.max(0, Math.round(r.start * clip.sampleRate)); dest.end = Math.min(clip.samples, Math.round(r.end * clip.sampleRate));
    selectInterval(r.id); renderIntervals(); changed();
  });
  const response = preview ? await fetch(`.preview/audio/${clip.id}.flac`) : await api(`/v1/audio/${clip.id}`);
  if (!response.ok) throw new Error('Preview audio is unavailable. Prepare the private pilot files first.');
  blobUrl = URL.createObjectURL(await response.blob());
  await ws.load(blobUrl);
  if (Math.abs(ws.getDuration() - clip.samples / clip.sampleRate) > 2 / clip.sampleRate) throw new Error('Decoded duration differs from the source manifest. Do not measure this clip.');
  clipId = clip.id; ready = true; $('speed').value = '1'; $('zoom').value = '0'; $('show-spec').checked = false;
  for (const id of ['play','selection','mark-start','mark-end']) $(id).disabled = false;
  $('audio-state').textContent = `${(clip.samples / clip.sampleRate).toFixed(2)} s · ${clip.sampleRate / 1000} kHz · lossless`;
  drawRegions();
}
async function openTask(task, first = false) {
  if (loading) return;
  if (!first && dirty && !confirm('This measurement has unsaved changes. Keep a local recovery copy and switch events?')) return;
  loading = true;
  try {
    current = task; baseRevision = task.revision; measurement = structuredClone(task.annotation || blank()); selected = 'target'; dirty = false;
    const saved = JSON.parse(localStorage.getItem(draftKey()) || 'null');
    if (saved) { measurement = saved.measurement; baseRevision = saved.revision; dirty = true; notice(saved.revision !== task.revision ? 'A local draft was recovered, but the server revision has changed. Export this draft before reloading.' : 'Recovered unsaved changes from this device.'); }
    $('save-state').textContent = dirty ? 'Recovered local draft · not saved to study' : task.annotation ? `Saved revision ${task.revision} · ${task.annotation.status}` : 'No measurement saved';
    $('event-meta').textContent = `${task.clip.recording} / ${task.surahName} / ${task.verseKey} / word ${task.wordIndex}`;
    $('family').textContent = families[task.family]; $('word').textContent = task.word; $('ayah').textContent = task.verseText;
    $('position').textContent = task.textPosition === 'ayah_end' ? 'AYAH END' : task.textPosition === 'within_ayah' ? 'WITHIN AYAH' : 'TEXT CANDIDATE';
    $('boundary-help').textContent = { qalqala: 'Mark the release onset through the end of the post-release acoustic event; exclude the preceding closure and the following segment. Describe ambiguity in notes.', ghunna_geminate: 'Mark the onset and end of sustained nasal resonance. Identify the geminate letter and describe difficult transitions.', madd_wajib: 'Mark the sustained vowel nucleus before the hamza in the same word. Exclude the hamza closure and release.', madd_lazim: 'Mark the sustained vowel nucleus before the necessary sukun. Record kalimi or harfi and exclude the following consonant.' }[task.family];
    $('alignment-warning').textContent = task.clip.alignmentWarning;
    populate(); renderQueue(); await loadAudio(task.clip);
  } finally { loading = false; }
}
async function save(status) {
  if (!current || loading) return;
  const data = validateMeasurement({ ...measurement, status }, current.clip);
  $('save').disabled = $('submit').disabled = true;
  try {
    let result;
    if (preview) {
      result = { annotation: { ...data, summary: summarize(data, current.clip) }, revision: current.revision + 1 };
      const saved = JSON.parse(localStorage.getItem('tajweed-preview-saved') || '{}'); saved[current.id] = result; localStorage.setItem('tajweed-preview-saved', JSON.stringify(saved));
    } else result = await (await api(`/v1/tasks/${current.id}/annotation`, { method: 'PUT', body: JSON.stringify({ measurement: data, revision: baseRevision }) })).json();
    current.annotation = result.annotation; current.revision = result.revision; baseRevision = result.revision; measurement = structuredClone(result.annotation); dirty = false; localStorage.removeItem(draftKey());
    $('save-state').textContent = `${preview ? 'Saved on this device only' : 'Saved to study'} · revision ${result.revision} · ${status}`; renderQueue(); notice('');
  } finally { $('save').disabled = $('submit').disabled = false; }
}
async function enter(invite) {
  if (!config.apiUrl) throw new Error('The Cloudflare service is not connected yet. The study owner must complete backend setup.');
  let code = invite.trim(); if (code.includes('#invite=')) code = code.split('#invite=')[1];
  credentials = await (await api('/v1/session', { method: 'POST', body: JSON.stringify({ invite: code }), headers: { Authorization: '' } })).json();
  sessionStorage.setItem('tajweed-session', JSON.stringify(credentials)); $('invite').value = ''; await start();
}
async function start() {
  let expert;
  if (preview) {
    const response = await fetch('.preview/corpus.json'); if (!response.ok) throw new Error('Run the pilot preparation script before previewing.');
    tasks = (await response.json()).tasks; expert = { label: 'Local pilot preview' };
    const saved = JSON.parse(localStorage.getItem('tajweed-preview-saved') || '{}'); tasks.forEach(t => Object.assign(t, saved[t.id] || {}));
    notice('LOCAL PREVIEW — annotations save on this device only. No guest login or shared backend is active.');
  } else { const response = await (await api('/v1/tasks')).json(); tasks = response.tasks; expert = response.expert; }
  $('identity').textContent = expert.label; $('login').hidden = true; $('workspace').hidden = false; $('signout').hidden = preview;
  if (!tasks.length) { notice('You have no assigned events yet. Contact the study owner.'); $('workspace').hidden = true; return; }
  await openTask(tasks.find(t => t.annotation?.status !== 'submitted') || tasks[0], true);
}
for (const [id, key] of [['applicability','applicability'],['actual-stop','actualStop'],['confidence','confidence'],['subtype','subtype'],['notes','notes'],['calibration-note','calibrationNote']]) $(id).addEventListener('input', () => {
  measurement[key] = $(id).value;
  if (id === 'applicability' && measurement.applicability !== 'yes') { measurement.target = null; renderIntervals(); drawRegions(); }
  changed();
});
for (const [id, key] of [['alignment','alignmentConfirmed'],['same-pace','samePaceConfirmed']]) $(id).onchange = () => { measurement[key] = $(id).checked; changed(); };
for (const side of ['start','end']) $(`target-${side}`).onchange = () => {
  if (measurement.applicability !== 'yes') { notice('Choose “Realized · measure” before marking the target.', true); renderIntervals(); return; }
  measurement.target ||= newInterval(); measurement.target[side] = inputSeconds($(`target-${side}`).value); drawRegions(); changed();
};
$('clear-target').onclick = () => { measurement.target = null; renderIntervals(); drawRegions(); changed(); };
$('select-target').onclick = () => selectInterval('target');
for (const [id, kind] of [['add-sv','short_vowel'],['add-nat','natural_madd']]) $(id).onclick = () => {
  if (!ready) return; const r = { id: crypto.randomUUID(), kind, ...newInterval(), label: '', eligible: true, exclusion: '' };
  measurement.references.push(r); selected = r.id; renderIntervals(); drawRegions(); changed();
};
$('play').onclick = () => ws.playPause().catch(error);
$('selection').onclick = () => { const r = interval(); if (!r) return notice('Mark an interval first.', true); ws.play(r.start / current.clip.sampleRate, $('loop').checked ? undefined : r.end / current.clip.sampleRate).catch(error); };
$('speed').onchange = () => ws?.setPlaybackRate(Number($('speed').value), true);
$('zoom').oninput = () => { if (ready) ws.zoom(Number($('zoom').value)); };
$('show-spec').onchange = () => {
  if (!ready) return;
  if ($('show-spec').checked) spec = ws.registerPlugin(Spectrogram.create({ height: 160, labels: true, fftSamples: 512, noverlap: 384, frequencyMax: 6000, scale: 'linear', rendering: 'windowed' }));
  else { spec?.destroy(); spec = null; }
};
$('mark-start').onclick = () => setMark('start'); $('mark-end').onclick = () => setMark('end');
document.addEventListener('keydown', event => {
  if (event.target.closest('input,textarea,select,button') || event.ctrlKey || event.metaKey || event.altKey || !ready) return;
  if (event.key.toLowerCase() === 'i') { event.preventDefault(); setMark('start'); }
  if (event.key.toLowerCase() === 'o') { event.preventDefault(); setMark('end'); }
  if (event.code === 'Space') { event.preventDefault(); ws.playPause().catch(error); }
});
$('save').onclick = () => save('draft').catch(error); $('submit').onclick = () => save('submitted').catch(error);
$('restore').onclick = () => {
  if (!confirm('Discard unsaved changes for this event and restore its last saved measurement? Export your local draft first if needed.')) return;
  localStorage.removeItem(draftKey()); measurement = structuredClone(current.annotation || blank()); baseRevision = current.revision; dirty = false;
  populate(); $('save-state').textContent = current.annotation ? `Restored saved revision ${current.revision}` : 'Restored empty measurement'; notice('');
};
$('next').onclick = () => { const index = tasks.indexOf(current); if (index + 1 < tasks.length) openTask(tasks[index + 1]).catch(error); else notice('You reached the end of your worklist.'); };
$('filter').onchange = renderQueue;
$('export-draft').onclick = () => download('tajweed-local-draft.json', { mode: preview ? 'local-preview' : 'unsaved-recovery', taskId: current.id, baseRevision, clip: current.clip, measurement });
$('export').onclick = async () => { try { download('tajweed-my-annotations.json', preview ? { mode: 'local-preview', annotations: tasks.filter(t => t.annotation).map(t => ({ taskId: t.id, clip: t.clip, revision: t.revision, ...t.annotation })) } : await (await api('/v1/annotations')).json()); } catch (e) { error(e); } };
$('signout').onclick = () => { if (dirty && !confirm('Sign out with unsaved changes? A recovery copy stays on this device.')) return; credentials = null; sessionStorage.removeItem('tajweed-session'); location.reload(); };
$('invite-form').onsubmit = event => { event.preventDefault(); enter($('invite').value).catch(error); };
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
try {
  config = await (await fetch('config.json', { cache: 'no-store' })).json(); config.apiUrl = config.apiUrl.replace(/\/$/, '');
  $('setup').textContent = config.apiUrl ? 'Your invitation is private. Treat it as an access credential.' : 'Study setup is in progress. Guest access opens when the Cloudflare service is connected.';
  if (preview) await start(); else if (invitation) await enter(invitation); else if (credentials) await start();
} catch (e) { error(e); }
