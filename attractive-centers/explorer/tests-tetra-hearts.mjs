// Implementation regression, NOT a replacement for the global analytic proof.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalize,powerHeart,norm,sub,mean,dot,inside,tetraPlanes,pairPlanes,bisectors} from './geometry.mjs';
import {edgeSlabs,centroidTransfer} from './revision.mjs';
import {tetraCovariants,safeTetraCenters,barycentricAnchors,weightedPowerCenter,tetraHearts} from './tetra-hearts.mjs';
import {compute} from './worker.mjs';
const ref=JSON.parse(fs.readFileSync(new URL('./tetra-heart-reference.json',import.meta.url),'utf8'));
const rational=q=>{const [a,b='1']=q.split('/');return Number(a)/Number(b);};
let checks=0,rootChecks=0;
const near=(a,b,t=1e-10)=>{assert(Math.abs(a-b)<=t,`${a} differs from ${b}`);checks++;};
for(const shape of ref.shapes){
  const v=tetraCovariants(shape.points);
  for(const [key,exact] of Object.entries(shape.exactCovariants))v[key].forEach((x,i)=>near(x,rational(exact[i]),2e-13));
  const {p,g,s}=normalize(shape.points),A=barycentricAnchors(p).all;
  for(const test of shape.roots){
    const W=[...Array(4).fill((1-test.wE-test.wF)/4),...Array(6).fill(test.wE/6),...Array(4).fill(test.wF/4)];
    const r=weightedPowerCenter(A,W,test.p);assert(r.converged);assert(r.residual<2e-9);assert(r.errorEstimate<2e-7);
    r.point.forEach((x,i)=>near(g[i]+s*x,test.point[i],2e-6));rootChecks++;
  }
}
const benchmark=ref.shapes[0].points,{p,s}=normalize(benchmark),old=powerHeart(p,41);
const quick=tetraHearts(p,old),fine=tetraHearts(p,old,{refine:true});
assert.equal(quick.polynomial.centers.length,10);assert.equal(quick.diagnostics.attempted,495);assert.equal(fine.diagnostics.attempted,2835);
assert.equal(quick.diagnostics.failed,0);assert.equal(fine.diagnostics.failed,0);
assert(quick.expanded.volume>2.4*old.volume);assert(fine.expanded.volume>2.6*old.volume);
assert(quick.expanded.volume>=quick.constellation.volume-1e-12);assert(quick.expanded.volume>=quick.analytic.volume-1e-12);
for(const c of quick.expanded.centers)assert(inside(c.point,tetraPlanes(p),3e-8));
const regular=ref.shapes[2].points,reg=tetraHearts(regular,powerHeart(regular,41));
assert.equal(reg.expanded.vertices.length,1);near(reg.expanded.volume,0);assert(reg.expanded.centers.every(c=>norm(c.point)<2e-8));
// Similarities and all 24 relabellings: covariants and their fixed-coefficient maps.
function permutations(a){return a.length?a.flatMap((x,i)=>permutations(a.filter((_,j)=>i!==j)).map(t=>[x,...t])):[[]];}
const safe=safeTetraCenters(benchmark);
for(const perm of permutations([0,1,2,3])){
  const pp=perm.map(i=>benchmark[i]),other=safeTetraCenters(pp);
  safe.forEach((c,i)=>c.point.forEach((x,j)=>near(x,other[i].point[j],3e-13)));
}
const transform=v=>[7-2*v[1],-3+2*v[0],5+2*v[2]],shift=safeTetraCenters(benchmark.map(transform));
safe.forEach((c,i)=>transform(c.point).forEach((x,j)=>near(x,shift[i].point[j],3e-12)));
let seed=1290617;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
let omitted=0;
for(let i=0;i<12;i++){
  const pp=normalize(Array.from({length:4},()=>Array.from({length:3},()=>rand()*4-2))).p;
  const h=tetraHearts(pp,powerHeart(pp,21));omitted+=h.diagnostics.failed;
  for(const c of h.expanded.centers)assert(inside(c.point,tetraPlanes(pp),2e-7));
  assert(h.expanded.volume>=h.polynomial.volume-2e-10);
}
const on={para:true,bisector:true,orbit:false,edge:true,transfer:true};
const r=compute({mode:'tetra',points:benchmark,on}),again=compute({mode:'tetra',points:benchmark,on:{...on,polynomial:true}});
assert.equal(r.result.tetraHearts,again.result.tetraHearts,'Same normalized input uses bounded one-entry cache.');
const chestPlanes=[...tetraPlanes(p),...pairPlanes(p).hs,...bisectors(p).hs,...edgeSlabs(p),...centroidTransfer(p)];
for(const c of r.result.tetraHearts.expanded.centers)assert(inside(c.point,chestPlanes,2e-7),'Every new generator survives the unconditional chest.');
const app=fs.readFileSync(new URL('./app.mjs',import.meta.url),'utf8');
assert(app.includes("['tetraExpanded','Enlarged tetrahedron heart',true]"));
assert(app.includes("['power','Previous vertex-power heart',false]"));
console.log(JSON.stringify({passed:true,exactScalarChecks:60,rootChecks,checks,randomShapes:12,randomOmissions:omitted,
  benchmark:{quickVolume:quick.expanded.volume*s**3,fineVolume:fine.expanded.volume*s**3,
  quickRatio:quick.expanded.volume/old.volume,fineRatio:fine.expanded.volume/old.volume,
  quickAccepted:quick.diagnostics.accepted,fineAccepted:fine.diagnostics.accepted},
  scope:'Numerical implementation checks. Global proofs are separate.'},null,2));
