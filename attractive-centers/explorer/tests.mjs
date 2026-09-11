// Run with Node.js: node tests.mjs
import assert from 'node:assert/strict';
import {area,hull,mean,inside,polyHP,triangle,four,fourCombined,tetra,tetraPlanes,pairPlanes,bisectors,normalize,heart,sub,norm,clipAll} from './geometry.mjs';
import {compute} from './worker.mjs';
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
let checks=0;
const check=(b,label)=>{assert.ok(b,label);checks++;};
const p=[[0,0],[21,0],[5,12],[26/3,4]], q=normalize(p).p, d=four(q), base=area(hull(q));
const ratios={parallelogram:100*area(d.para.poly)/base,bisectors:100*area(d.bisector)/base,network:100*area(d.network)/base,stability:100*area(d.stable)/base,combined:100*area(fourCombined(d,{para:true,bisector:true,network:true}))/base};
near(ratios.parallelogram,58.41049071935858);
near(ratios.bisectors,21.239748530428564);
near(ratios.network,31.369614569850143);
near(ratios.stability,82.2609243285015);
near(ratios.combined,13.412708341951713);
for(const region of [d.para.poly,d.bisector,d.network,d.stable,fourCombined(d,{para:true,bisector:true,network:true,stable:true})])check(inside(mean(q),polyHP(region),1e-7),'centroid survives');
const eq=triangle([[0,0],[2,0],[1,Math.sqrt(3)]]);
check(eq.cnt.length===1&&eq.poly.length===1,'internal Napoleon degenerates to one point');
near(norm(sub(eq.poly[0],[1,Math.sqrt(3)/3])),0);
const square=four([[-1,-1],[1,-1],[1,1],[-1,1]]);
check(square.para.poly.length===1,'parallelogram symmetry');
const regular=tetra([[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]]);
near(regular.base.volume,8/3);check(regular.vertices.length===1,'regular tetrahedron has singleton bisector chest');near(norm(regular.vertices[0]),0);
const right=tetra([[0,0,0],[1,0,0],[0,1,0],[0,0,1]],{para:false,bisector:false});near(right.volume,1/6);
const tri=normalize(p.slice(0,3)).p, t=triangle(tri), inner=heart(tri);
near(100*area(t.poly)/area(tri),5.930190602511855);
check(inner.failed===0,'default solver convergence');check(area(inner.poly)>0,'visible inner hull');
check(inner.centers.every(c=>inside(c.point,polyHP(t.poly),1e-7)),'default inner centers in standard chest');
// Reordering, similarity, and reflected orientation must not change area ratios.
for(const order of [[0,1,2,3],[3,1,0,2],[2,3,1,0]]){
 const r=normalize(order.map(i=>{let [x,y]=p[i];return [7+2*(.6*x-.8*y),-3-2*(.8*x+.6*y)];})).p,e=four(r),a=area(hull(r));
 for(const [actual,expected] of [[e.para.poly,ratios.parallelogram],[e.bisector,ratios.bisectors],[e.network,ratios.network],[e.stable,ratios.stability]])near(100*area(actual)/a,expected,2e-6);
 checks+=4;
}
let seed=92831;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};
let omitted=0;
for(let i=0;i<80;i++){
 const r=normalize(Array.from({length:4},()=>[2*rand()-1,2*rand()-1])).p;
 if(area(hull(r))<.005)continue;
 const e=four(r),g=mean(r),all=fourCombined(e,{para:true,bisector:true,network:true,stable:true});
 check(all.length>0&&inside(g,polyHP(all),1e-6),'random four-point centroid survives all constructions');
 const tr=r.slice(0,3);if(area(tr)<.01)continue;
 const h=heart(tr,25),s=triangle(tr);omitted+=h.failed;
 check(h.centers.every(c=>inside(c.point,polyHP(s.poly),2e-6)),'random inner family stays inside triangle chest');
 const tet=Array.from({length:4},()=>[rand(),rand(),rand()]),v=tetra(normalize(tet).p);
 if(v.base.volume<1e-6)continue;
 check(v.volume<=v.base.volume+1e-7,'3D volume bounded by hull');
 const np=normalize(tet).p;
 check(inside(mean(np),[...tetraPlanes(np),...pairPlanes(np).hs,...bisectors(np).hs])&&v.vertices.length>0,'3D centroid survives all planes');
}
const point=[[0,0]],segment=[[-1,0],[1,0]];
check(clipAll([[-2,-2],[2,-2],[2,2],[-2,2]],polyHP(point)).length===1,'point-region intersection');
near(area(clipAll([[-2,-2],[2,-2],[2,2],[-2,2]],polyHP(segment))),0);
for(const mode of ['triangle','four','tetra']){
 const points=mode==='triangle'?p.slice(0,3):mode==='four'?p:[[0,0,0],[2,0,0],[.3,1.8,0],[.5,.6,2.2]];
 check(compute({mode,points,on:{para:true,bisector:true,network:true}}).mode===mode,'worker contract');
}
console.log(JSON.stringify({checks,defaultRetainedPercent:ratios,triangleRetainedPercent:100*area(t.poly)/area(tri),innerRetainedPercent:100*area(inner.poly)/area(tri),randomPowerSamplesOmitted:omitted},null,2));
