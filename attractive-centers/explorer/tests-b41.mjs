import assert from 'node:assert/strict';
import fs from 'node:fs';
import {b41Heart,b41Weights} from './b41.mjs';
import {normalize,triangle,area,inside,polyHP,norm,sub} from './geometry.mjs';
import {compute} from './worker.mjs';
const reference=JSON.parse(fs.readFileSync(new URL('./b41-reference.json',import.meta.url)));
const rational=str=>{const [n,d='1']=str.split('/');return Number(n)/Number(d);};
let checks=0;
function near(a,b,tol=3e-12){assert(Math.abs(a-b)<tol,`${a} != ${b}`);checks++;}
// Independent SymPy reference values evaluate the original ETC formulas,
// not the integer coefficient representation consumed by the browser.
for(let j=0;j<reference.sides.length;j++){
 const rows=b41Weights(reference.sides[j]);assert.equal(rows.length,41);
 rows.forEach((r,i)=>{assert.equal(r.name,reference.centers[i].name);r.weights.forEach((v,k)=>near(v,rational(reference.centers[i].weights[j][k])));});
}
const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
const base=[[0,0],[21,0],[5,12]],q=normalize(base).p,heart=b41Heart(q);
near(100*area(heart.poly)/area(q),2.01534575756951,1e-10);
assert.equal(heart.poly.length,11);
for(const perm of permutations){
 const r=b41Heart(perm.map(i=>q[i]));
 r.centers.forEach((c,i)=>near(norm(sub(c.point,heart.centers[i].point)),0));
}
const transformed=q.map(([x,y])=>[7+3*(.6*x-.8*y),-2-3*(.8*x+.6*y)]);
b41Heart(transformed).centers.forEach((c,i)=>{const [x,y]=heart.centers[i].point;near(norm(sub(c.point,[7+3*(.6*x-.8*y),-2-3*(.8*x+.6*y)])),0);});
const equilateral=[[0,0],[2,0],[1,Math.sqrt(3)]];
const eq=b41Heart(equilateral);assert.equal(eq.poly.length,1);eq.centers.forEach(c=>near(norm(sub(c.point,[1,Math.sqrt(3)/3])),0));
for(const h of [.001,.1,1,Math.sqrt(3),10,1000]){
 const t=[[-1,0],[1,0],[0,h]],r=b41Heart(t);r.centers.forEach(c=>near(c.point[0],0));
 assert(r.poly.length<=2,'isosceles hull is a segment or point');
}
let seed=190921;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};
let shapes=0;
for(let k=0;k<160;k++){
 const p=normalize([[-1,0],[1,0],[4*random()-2,.015+4*random()]]).p;
 const d=triangle(p),r=b41Heart(p);assert.equal(r.centers.length,41);
 assert(r.centers.every(c=>inside(c.point,polyHP(d.poly),3e-7)),'all B41 values inside standard chest');
 assert(area(r.poly)<=area(d.poly)+1e-7);checks+=2;shapes++;
}
const response=compute({mode:'triangle',points:base,on:{b41:true,heart:false}});
assert.equal(response.result.b41.centers.length,41);assert(response.result.heart.centers.length>=3);
assert(response.result.heart.poly.length>=3,'earlier family preserved');
assert.throws(()=>b41Weights([1,1,2]));assert.throws(()=>b41Weights([0,1,1]));
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
for(const id of ['guide','start','definitions','b41-status','methods','reproduce'])assert(html.includes(`id="${id}"`));
console.log(JSON.stringify({checks,randomShapes:shapes,referenceTriangles:reference.sides.length,
 B41Maps:41,defaultHullVertices:heart.poly.length,defaultPercent:100*area(heart.poly)/area(q),earlierFamilyPreserved:true},null,2));
