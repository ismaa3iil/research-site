// SPDX-License-Identifier: MIT
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {b46Weights,b46Heart} from './b46.mjs';
import {b36Heart} from './b41.mjs';
import {normalize,triangle,area,norm,sub,inside,polyHP,POWER_MIN,POWER_MAX} from './geometry.mjs';
import {compute} from './worker.mjs';
const near=(a,b,tol=2e-9)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
const perms=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
const ref=JSON.parse(fs.readFileSync(new URL('./B46-browser-reference.json',import.meta.url)));
let checks=0;
for(const r of ref){
  for(const perm of perms){
    const w=b46Weights(perm.map(i=>r.sides[i]));assert.equal(w.length,44);
    w.forEach((row,j)=>perm.forEach((i,k)=>{near(row.weights[k],r.weights[j][i],3e-14);checks++;}));
  }
}
const diagnostic=[[0,0],[21,0],[5,12]],q=normalize(diagnostic).p,r=b46Heart(q);
assert.equal(r.centers.length,46);assert.equal(r.failed,0);
for(const perm of perms){
  const s=b46Heart(perm.map(i=>q[i]));
  s.centers.forEach((c,i)=>near(norm(sub(c.point,r.centers[i].point)),0));
}
const transformed=q.map(([x,y])=>[7+3*(.6*x-.8*y),-2-3*(.8*x+.6*y)]);
b46Heart(transformed).centers.forEach((c,i)=>{
  const [x,y]=r.centers[i].point;near(norm(sub(c.point,[7+3*(.6*x-.8*y),-2-3*(.8*x+.6*y)])),0,2e-8);
});
const eq=b46Heart([[0,0],[2,0],[1,Math.sqrt(3)]]);
assert.equal(eq.centers.length,46);assert.equal(eq.poly.length,1);
eq.centers.forEach(c=>near(norm(sub(c.point,[1,Math.sqrt(3)/3])),0));
for(const h of [.05,.3,1,2,20])b46Heart([[-1,0],[1,0],[0,h]]).centers.forEach(c=>near(c.point[0],0));
let seed=20261001;
const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};
for(let k=0;k<120;k++){
  const p=normalize([[-1,0],[1,0],[-3+6*random(),.05+5*random()]]).p,t=triangle(p),s=b46Heart(p);
  assert.equal(s.failed,0);assert.equal(s.centers.length,46);
  assert(s.centers.every(c=>inside(c.point,polyHP(t.poly),3e-7)),'B46 values inside standard chest');
  checks+=46;
}
// Certified support gaps are verified numerically here ONLY as regressions.
for(const [a,b,c,p,gap] of [[4165,5213,1074,POWER_MIN,26.18],[268,499,321,POWER_MAX,4.99]]){
  const u=(b*b+c*c-a*a)/(2*c),pts=[[0,0],[c,0],[u,Math.sqrt(b*b-u*u)]],s=b46Heart(pts);
  const n=p===POWER_MIN?[.20867825703267053,-.97798434805563565]:[-.9356689385041045,.35287906925546367];
  const target=s.centers.find(v=>v.p===p),others=s.centers.filter(v=>v!==target);
  assert(target,'Power endpoint must converge at its certificate witness');
  const dot=v=>v.point[0]*n[0]+v.point[1]*n[1];
  assert(dot(target)-Math.max(...others.map(dot))>gap);
}
const response=compute({mode:'triangle',points:diagnostic,on:{b46:true,b36:false}});
assert.equal(response.result.b46.centers.length,46);
assert.equal(response.result.b36.centers.length,36);
assert(response.result.heart.centers.length>=3);
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(html.includes('id="b46-status"'));assert(html.includes('1,142'));
const app=fs.readFileSync(new URL('./app.mjs',import.meta.url),'utf8');
assert(app.includes("['b46','B46 heart · 44 rational + 2 power endpoints',true]"));
assert(app.includes("['b36','Historical B36 comparison',false]"));
console.log(JSON.stringify({passed:true,checks,defaultMaps:r.centers.length,defaultHullVertices:r.poly.length,
  defaultPercent:100*area(r.poly)/area(q),historicalB36Maps:b36Heart(q).centers.length,
  witnessRegressionsPassed:true,allKnownNativeContainment:'Theorem in linked audit; not inferred from these tests'},null,2));
