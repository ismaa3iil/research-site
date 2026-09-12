import assert from 'node:assert/strict';
import {compute} from './worker.mjs';
import {normalize,mean,sub,norm,area,inside,polyHP,powerCenter,triangle,clipAll,hull,dot} from './geometry.mjs';
import {centroidTransfer,edgeSlabs,involutionPlanes} from './revision.mjs';
let checks=0,samples=0,omitted=0;const ck=(q,m)=>{assert.ok(q,m);checks++};
const on={para:true,bisector:true,network:true,orbit:true,edge:true,transfer:true};
const ref=[[0,0],[21,0],[5,12],[26/3,4]];
let seed=19023;const rand=()=>((seed=(1664525*seed+1013904223)>>>0)/2**32);
const configs=[];
for(let i=0;i<4;i++)for(const t of [-3,-.1,-.0001,.0001,.1,3]){let p=structuredClone(ref);p[i][0]+=t;p[i][1]+=.37*t;configs.push(p);}
for(let i=0;i<35;i++)configs.push(Array.from({length:4},()=>[-3+6*rand(),-3+6*rand()]));
configs.push([[0,0],[1,0],[2,0],[.4,1]],[[0,0],[0,0],[1,0],[.4,1]]);
for(const points of configs){
 const p=normalize(points).p,d=compute({mode:'four',points,on}).result;
 ck(d.combined.length>0,'nonempty generic chest');ck(inside(mean(p),polyHP(d.combined),2e-7),'centroid survives all unconditional layers');
 for(const exponent of [1.2,2,4,6.8]){let q=powerCenter(p,exponent);if(!q.converged){omitted++;continue;}samples++;ck(inside(q.point,polyHP(d.combined),3e-7),'power center survives generic intersection');}
 const perm=[points[2],points[0],points[3],points[1]],q=compute({mode:'four',points:perm,on}).result;
 ck(Math.abs(area(d.combined)-area(q.combined))<2e-7,'label-invariant area');
 ck(d.combined.every(v=>inside(v,polyHP(q.combined),2e-7)),'label-invariant polygon');
 const overlay=compute({mode:'four',points,on:{...on,triangle:true}}).result;
 ck(Math.abs(area(d.combined)-area(overlay.combined))<1e-12,'ABC reference does not constrain generic four-point chest');
}
const path=[];
for(const dx of [0,1e-6,.01,1,10,50]){
 const p=structuredClone(ref);p[3][0]+=dx;const r=compute({mode:'four',points:p,on}).result;
 path.push({dx,ratio:area(r.combined)/r.baseArea,note:r.transferNote});
 if(dx)ck(r.centroidGapNormalized>1e-13,'drag switches to directional transfer');
}
ck(path.at(-1).ratio>0,'distant fourth point supported');
console.log(JSON.stringify({checks,configurations:configs.length,convergedPowerSamples:samples,omittedPowerSamples:omitted,path,scope:'Numerical regression, supplemented by a derivation audit; not a universal numerical certificate'},null,2));
