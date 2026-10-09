"""Prepare private D1 seed + lossless R2 clips from the existing research corpus.
Usage: python tools/prepare_pilot.py --study-root D:/Work/Tajweed --libs D:/Work/Tajweed/.runtime
Only local files are read; nothing is uploaded. .preview and .private are gitignored.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import sys

p = argparse.ArgumentParser()
p.add_argument('--study-root', required=True, type=Path)
p.add_argument('--libs', type=Path)
args = p.parse_args()
if args.libs:
    sys.path.insert(0, str(args.libs))
import soundfile as sf
import numpy as np

app = Path(__file__).resolve().parents[1]
study = args.study_root.resolve()
private = app / '.private'
preview = app / '.preview'
(preview / 'audio').mkdir(parents=True, exist_ok=True)
private.mkdir(exist_ok=True)
excerpts = json.loads((study / 'data/pilot-excerpts.json').read_text(encoding='utf-8'))['clips']
annotations = json.loads((study / 'data/pilot-annotations.json').read_text(encoding='utf-8'))['events']
inventory = json.loads((study / 'data/event-inventory.json').read_text(encoding='utf-8'))
verses = {v['verse_key']: v for v in inventory['verses']}
events = {e['event_id']: e for e in inventory['events']}
names = {5: 'Al-Maida', 35: 'Fatir', 50: 'Qaf'}
labels = {name: f'Recording {chr(65 + i)}' for i, name in enumerate(sorted({c['cell_id'].rsplit('_', 1)[0] for c in excerpts}))}
opaque = lambda text: hashlib.sha256(text.encode()).hexdigest()[:20]
quote = lambda value: "'" + str(value).replace("'", "''") + "'"
serialized = lambda value: json.dumps(value, ensure_ascii=False, separators=(',', ':'))
clips, provenance, tasks, inserts = {}, [], [], []
total = 0
for original in excerpts:
    cid = 'clip_' + opaque(original['clip_id'])
    target = preview / 'audio' / f'{cid}.flac'
    pcm, fs = sf.read(study / original['relative_path'], dtype='int16', always_2d=True)
    if pcm.shape[1] != 1 or len(pcm) != original['decoded_samples'] or fs != original['sample_rate_hz']:
        raise RuntimeError('Source excerpt and manifest disagree: ' + original['clip_id'])
    sf.write(target, pcm, fs, subtype='PCM_16', format='FLAC')
    back, back_fs = sf.read(target, dtype='int16', always_2d=True)
    if back_fs != fs or not np.array_equal(pcm, back):
        raise RuntimeError('FLAC round trip was not lossless')
    reciter = original['cell_id'].rsplit('_', 1)[0]
    public = {'id': cid, 'recording': labels[reciter], 'sampleRate': fs,
              'samples': len(pcm), 'sourceStartSample': round(original['source_start_s'] * fs),
              'sourceSha256': original['source_sha256'],
              'alignmentWarning': original['navigation_status'] + '. Confirm the ayah by listening before submitting.'}
    clips[original['clip_id']] = public
    private_clip = {**original, 'id': cid, 'flacSha256': hashlib.sha256(target.read_bytes()).hexdigest(),
                    'flacBytes': target.stat().st_size, 'reviewEncoding': 'PCM16 mono → lossless FLAC; native sample rate'}
    provenance.append(private_clip)
    inserts.append(f"INSERT INTO clips(id,public_json,provenance_json,object_key) VALUES({quote(cid)},{quote(serialized(public))},{quote(serialized(private_clip))},{quote(cid + '.flac')}) ON CONFLICT(id) DO UPDATE SET public_json=excluded.public_json,provenance_json=excluded.provenance_json,object_key=excluded.object_key;")
    total += target.stat().st_size

for a in annotations:
    e = events[a['textual_event_id']]
    surah, ayah = map(int, a['verse_key'].split(':'))
    family = {'madd_wajib_candidate': 'madd_wajib'}.get(a['family'], a['family'])
    if family not in {'qalqala', 'ghunna_geminate', 'madd_wajib', 'madd_lazim'}:
        raise RuntimeError('Unrecognized task family: ' + family)
    task = {'id': 'task_' + opaque(a['annotation_id']), 'clipId': clips[a['clip_id']]['id'],
            'verseKey': a['verse_key'], 'verseOrder': surah * 1000 + ayah,
            'surahName': names[surah], 'family': family, 'word': a['word'],
            'wordIndex': a['word_index'], 'markedText': e['marked_text'],
            'textPosition': a['text_position'], 'verseText': verses[a['verse_key']]['text'],
            'textualEventId': a['textual_event_id'], 'characterStart': e['character_start'], 'characterEnd': e['character_end']}
    inserts.append(f"INSERT INTO tasks(id,clip_id,public_json) VALUES({quote(task['id'])},{quote(task['clipId'])},{quote(serialized(task))}) ON CONFLICT(id) DO UPDATE SET clip_id=excluded.clip_id,public_json=excluded.public_json;")
    tasks.append({**task, 'clip': clips[a['clip_id']], 'annotation': None, 'revision': 0})
tasks.sort(key=lambda t: (t['clip']['recording'], t['verseOrder'], t['wordIndex'], t['id']))
(preview / 'corpus.json').write_text(json.dumps({'tasks': tasks}, ensure_ascii=False), encoding='utf-8')
(private / 'seed.sql').write_text('\n'.join(inserts) + '\n', encoding='utf-8')
(private / 'provenance.json').write_text(json.dumps({'clips': provenance, 'taskMap': annotations}, ensure_ascii=False, indent=2), encoding='utf-8')
shutil.copyfile(preview / 'corpus.json', private / 'corpus.json')
print(json.dumps({'clips': len(clips), 'tasks': len(tasks), 'flacBytes': total,
                  'losslessRoundTrips': len(clips), 'measurements': 0}, indent=2))
