import assert from 'node:assert/strict';
import {normalize,area,mean,inside,triangle,clipAll,hull,pairPlanes,powerCenter,polyHP} from './geometry.mjs';
import {edgeSlabs,centroidTransfer,involutionPlanes,diameterBallPlanes} from './revision.mjs';
import {compute} from './worker.mjs';
let checks=0;const check=(b,msg)=>{assert.ok(b,msg);checks++},near=(a,b,t=1e-8)=>check(Math.abs(a-b)<t,`${a} != ${b}`);
const P=[[0,0],[21,0],[5,12],[26/3,4]],on={para:true,bisector:true,network:true,edge:true,transfer:true,orbit:true};
const d=compute({mode:'four',points:P,on}).result;
near(100*area(d.combined)/d.baseArea,5.930190602511855);
near(100*area(d.edge)/d.baseArea,100*451/6048);
check(d.combined.length===4,'four-vertex benchmark');
let seed=5871;const rand=()=>((seed=(1664525*seed+1013904223)>>>0)/2**32);
for(let k=0;k<20;k++){
 const t=[[0,0],[2,0],[-2+6*rand(),.05+6*rand()]],p=normalize([...t,mean(t)]).p;
 const tr=clipAll(hull(p),centroidTransfer(p)),std=triangle(p.slice(0,3)).poly;
 check(tr.every(q=>inside(q,polyHP(std),1e-8)),'centroid transfer is contained in standard chest; other omitted faces may tighten it');
 for(let exponent of [1.2,2,3,4,6.8]){
  const points=normalize([...t,[-2+6*rand(),-1+7*rand()]]).p;
  const q=powerCenter(points,exponent);if(!q.converged)continue;
  check(inside(q.point,[...edgeSlabs(points),...involutionPlanes(points),...centroidTransfer(points),...diameterBallPlanes(points)],3e-7),'power sample satisfies new bounds');
 }
}
for(const p of [[[0,0,0],[4,0,0],[0,3,0],[1,1,2]],[[1,0,0],[-.5,Math.sqrt(3)/2,0],[-.5,-Math.sqrt(3)/2,0],[1,0,1]]]){
 const n=normalize(p).p;
 check(inside(mean(n),[...edgeSlabs(n),...involutionPlanes(n),...centroidTransfer(n),...diameterBallPlanes(n)]),'3D centroid survives');
 const r=compute({mode:'tetra',points:p,on:{...on,ball:true}}).result;
 check(r.vertices.length>0&&r.volume>=0&&r.volume<=r.base.volume+1e-10,'3D volume valid, including symmetry-forced flat chests');
}
console.log(JSON.stringify({checks,benchmarkPercent:100*area(d.combined)/d.baseArea,claim:'Regression checks, not a proof of completeness'},null,2));
