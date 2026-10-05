import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),dist=path.join(root,'dist');
await mkdir(path.join(dist,'src'),{recursive:true});
const files=['index.html','styles.css','icon.svg','LICENSE','src/math.js','src/worker.js','src/app.js'];
for(const file of files)await copyFile(path.join(root,file),path.join(dist,file));
await writeFile(path.join(dist,'.nojekyll'),'');
console.log(`Built ${files.length} static files in ${dist}`);
