import { readFile, writeFile, mkdir, copyFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const root = '.private/worker-assets';
await mkdir(root + '/audio', { recursive: true });
await mkdir(root + '/room/dist', { recursive: true });
const { clips } = JSON.parse(await readFile('.private/provenance.json', 'utf8'));
let total = 0;
for (const clip of clips) {
  const name = clip.id + '.flac';
  if (!/^clip_[a-f0-9]{20}\.flac$/.test(name)) throw new Error('Unexpected clip filename.');
  const bytes = await readFile('.preview/audio/' + name);
  if (bytes.length > 25 * 1024 * 1024) throw new Error('Clip exceeds the Workers asset limit; split the excerpt.');
  if (createHash('sha256').update(bytes).digest('hex') !== clip.flacSha256) throw new Error('Audio hash mismatch: ' + name);
  await writeFile(root + '/audio/' + name, bytes); total += bytes.length;
}
if ((await readdir(root + '/audio')).length !== clips.length) throw new Error('The staging folder has unexpected old audio; use a fresh reviewed folder before deployment.');
for (const path of ['index.html','style.css','guide.html','dist/app.js','dist/WAVESURFER-LICENSE.txt']) await copyFile(path, root + '/room/' + path);
console.log(JSON.stringify({ stagedClips: clips.length, audioBytes: total, frontendFiles: 5, authenticationRequiredForAudio: true }));
