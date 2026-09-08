import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {evaluate,optimize,V} from '../math.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../data/catalogue.json',import.meta.url))),triangles=[[[0,0,0],[21,0,0],[16,12,0]],[[0,0,0],[13,0,0],[107/13,Math.sqrt(81-(107/13)**2),0]],[[3,-8,2],[3,49.33,2],[3,35.68,34.76]]];
const output=execFileSync(process.env.JULIA||'julia',[fileURLToPath(new URL('./export.jl',import.meta.url))],{encoding:'utf8',timeout:120000});let count=0,unavailable=0;
for(let line of output.trim().split('\n')){let [i,id,values]=line.split('\t'),t=triangles[+i-1],r=id.startsWith('O-')?optimize(id,t):evaluate(rows[+id.slice(1)-1].StarExpression,t);if(values==='unavailable'){assert.ok(r.error,`${i} ${id} should be unavailable`);unavailable++;}else{assert.ok(r.point,`${i} ${id} unexpectedly unavailable`);let expected=values.split(',').map(Number),error=V.norm(V.sub(r.point,expected))/Math.max(1,V.norm(expected));assert.ok(error<(id.startsWith('O-')?2e-5:2e-7),`${i} ${id}: ${error}`);}count++;}
console.log(`JavaScript–Julia parity passed for ${count} results across scalene, obtuse and tilted triangles (${unavailable} non-real/undefined).`);
