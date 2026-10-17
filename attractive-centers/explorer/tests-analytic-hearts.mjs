// SPDX-License-Identifier: MIT
// Implementation regressions against independently derived exact rational data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {shapeWeights,shapeCenter,bridgeCoefficients,analyticHearts,CERTIFIED_SHAPE_MAPS,CERTIFIED_RAYS,CERTIFIED_EXTENSION_RAYS,constantSamples} from './analytic-hearts.mjs';
import {rational,EXACT_COLLINEAR_ENDPOINTS} from './analytic-hearts-data.mjs';
import {b46Heart} from './b46.mjs';
import {normalize,triangle,area,norm,sub,inside,polyHP} from './geometry.mjs';
import {compute} from './worker.mjs';

const reference=JSON.parse(fs.readFileSync(new URL('./analytic-hearts-catalogue.json',import.meta.url)));
const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
const all=[...CERTIFIED_SHAPE_MAPS,...CERTIFIED_RAYS,...CERTIFIED_EXTENSION_RAYS,
  ...EXACT_COLLINEAR_ENDPOINTS.map(row=>({...row,coefficients:row.seed.map(v=>rational(v)*rational(row.lower))}))];
const byId=new Map(all.map(row=>[row.id,row]));
const near=(a,b,tol=3e-12)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
let exactChecks=0;
for(const triangle of reference.exact_references){
  for(const row of triangle.maps){
    const cf=row.id.startsWith('Bridge-')?bridgeCoefficients(rational(row.id.slice(7))):byId.get(row.id).coefficients;
    for(const perm of permutations){
      const w=shapeWeights(perm.map(i=>triangle.sides_abc[i]),cf);
      perm.forEach((i,j)=>{near(w[j],rational(row.weights[i]));exactChecks++;});
      near(w.reduce((a,b)=>a+b,0),1);
    }
  }
}
for(const [i,id]of [[0,'R2*'],[1,'R5*']]){
  bridgeCoefficients(i).forEach((v,j)=>near(v,byId.get(id).coefficients[j],1e-15));
}
assert.throws(()=>bridgeCoefficients(-.1));assert.throws(()=>bridgeCoefficients(1.1));
assert.equal(constantSamples().length,261);

const pts=[[0,0],[21,0],[5,12]],base=b46Heart(normalize(pts).p);
const result=analyticHearts(normalize(pts).p,base);
assert.equal(result.rays.centers.length,6);assert.equal(result.extensionRays.centers.length,7);
assert.equal(result.bridge.centers.length,129);assert.equal(result.expanded.centers.length,455);
const eq=[[0,0],[2,0],[1,Math.sqrt(3)]],equilateral=analyticHearts(eq,b46Heart(eq));
assert.equal(equilateral.expanded.poly.length,1);
equilateral.expanded.centers.forEach(c=>near(norm(sub(c.point,[1,Math.sqrt(3)/3])),0));

for(const cf of all.map(row=>row.coefficients)){
  const point=shapeCenter(pts,cf);
  for(const perm of permutations)near(norm(sub(shapeCenter(perm.map(i=>pts[i]),cf),point)),0);
  const transformed=pts.map(([x,y])=>[7+3*(.6*x-.8*y),-2-3*(.8*x+.6*y)]);
  const expected=[7+3*(.6*point[0]-.8*point[1]),-2-3*(.8*point[0]+.6*point[1])];
  near(norm(sub(shapeCenter(transformed,cf),expected)),0,5e-12);
}
for(const h of [.05,.3,1,2,20]){
  const p=[[-1,0],[1,0],[0,h]],d=analyticHearts(p,b46Heart(p));
  d.expanded.centers.forEach(c=>near(c.point[0],0));
  assert(d.expanded.poly.length<=2);
}
let seed=20261017;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};
for(let i=0;i<80;i++){
  const p=normalize([[-1,0],[1,0],[-3+6*random(),.05+5*random()]]).p;
  const d=analyticHearts(p,b46Heart(p)),chest=polyHP(triangle(p).poly),expanded=polyHP(d.expanded.poly);
  for(const map of d.expanded.centers)assert(inside(map.point,chest,3e-7),map.name+' outside chest');
  for(const layer of [d.constant,d.shape,d.six,d.conic]){
    assert(layer.poly.every(p=>inside(p,expanded,3e-7)),'Layer nesting');
    assert(area(layer.poly)<=area(d.expanded.poly)+1e-10);
  }
}
const witnesses=[];
for(const [a,b,c]of [[6,5,3],[9,8,7],[9,6,5],[12,8,6],[14,11,5]]){
  const x=(b*b+c*c-a*a)/(2*c),p=normalize([[0,0],[c,0],[x,Math.sqrt(b*b-x*x)]]).p;
  const d=analyticHearts(p,b46Heart(p));
  assert(area(d.expanded.poly)>area(d.six.poly)+1e-7,'New extension must enlarge six-ray witness');
  if(a===12)assert(area(d.conic.poly)>area(d.six.poly)+1e-7,'Repaired bridge witness');
  witnesses.push({sides:[a,b,c],latestGainOverSixPercent:100*(area(d.expanded.poly)/area(d.six.poly)-1)});
}
const worker=compute({mode:'triangle',points:pts,on:{expanded:true}});
assert.equal(worker.result.analytic.expanded.centers.length,455);
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
for(const text of ['id="new-hearts"','id="conic-bridge"','analytic-heart-proofs.zip','P1–P3'])assert(html.includes(text));
const app=fs.readFileSync(new URL('./app.mjs',import.meta.url),'utf8');
assert(app.includes("['expanded','Latest heart · bridge + new rays',true]"));
assert(app.includes("['b46','B46 heart · 44 rational + 2 power endpoints',false]"));
console.log(JSON.stringify({passed:true,exactChecks,randomTriangles:80,maps:455,witnesses,
  scope:'Numerical implementation regression; mathematical certificates are in the proof download.'},null,2));
