import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('..', import.meta.url)));
await mkdir('dist', { recursive: true });
await build({ entryPoints: ['src/app.mjs'], outfile: 'dist/app.js', bundle: true, minify: true, format: 'esm', target: ['es2022'], legalComments: 'eof' });
await copyFile('node_modules/wavesurfer.js/LICENSE', 'dist/WAVESURFER-LICENSE.txt');
console.log('Built dist/app.js (all browser dependencies bundled locally).');
