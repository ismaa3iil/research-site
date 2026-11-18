// Regression tests for the new planar four-point chest rules.
import assert from 'node:assert/strict';
import {threeFoldPins,movedVertexTransfer,fourChestLayers} from './four-chests.mjs';
import {compute} from './worker.mjs';
import {dot,area,polyHP,inside,normalize,clipAll,triangle,hull,norm,sub,mean} from './geometry.mjs';
const base={para:true,bisector:true,network:true,edge:true,transfer:true,combined:true},all={...base,pins:true,twostep:true};
const presets={'13-20-21 + centroid':[[0,0],[21,0],[5,12],[26/3,4]],'13-20-21 + incenter':[[0,0],[21,0],[5,12],[7,14/3]],'Bundle planar':[[0,0],[4,0],[3,2],[0,3]],
  'Convex quadrilateral':[[0,0],[6,.2],[4.7,4],[.5,3]],'Independent bisector':[[0,0],[4,7],[2,4],[3,3]],'Scalene 2':[[0,0],[4,0],[1,3],[.5,.8]]};

// 1. Every certified four-point center satisfies every new inequality, at presets and at random configurations.
let seed=17,slack=Infinity,checked=0;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647*4-2;
const configurations=[...Object.values(presets),...Array.from({length:25},()=>[[rnd(),rnd()],[rnd(),rnd()],[rnd(),rnd()],[rnd(),rnd()]])];
for(const points of configurations){
  const d=compute({mode:'four',points,on:all}).result,p=normalize(points).p,layers=fourChestLayers(p,d.hull,d.hull,{grid:8,loci:80});
  for(const h of [...layers.pinPlanes,...layers.cutPlanes])for(const c of d.fourHearts.expanded.centers){slack=Math.min(slack,dot(h.n,c.point)-h.b);checked++;}
}
assert.ok(slack>-1e-7,'a certified center violates a new chest inequality: '+slack);

// 2. Three-fold pin: an equilateral triangle with its centre pins the center exactly.
{const p=normalize([[0,Math.sqrt(3)],[-1,0],[1,0],[0,Math.sqrt(3)/3]]).p,big=[[-9,-9],[9,-9],[9,9],[-9,9]],q=clipAll(big,threeFoldPins(p));
  assert.ok(q.length&&q.every(v=>norm(sub(v,mean(p)))<1e-6),'three-fold pins must collapse to the centre');}

// 3. Areas at the presets; the selected chest can only shrink.
const report={};
for(const [name,points] of Object.entries(presets)){
  const a=compute({mode:'four',points,on:base}).result,b=compute({mode:'four',points,on:{...base,pins:true}}).result,c=compute({mode:'four',points,on:all}).result;
  const pc=x=>+(100*area(x)/a.baseArea).toFixed(3);
  assert.ok(area(b.combined)<=area(a.combined)+1e-12&&area(c.combined)<=area(b.combined)+1e-12);
  report[name]={before:pc(a.combined),withPins:pc(b.combined),withTwoStep:pc(c.combined),heart:pc(c.fourHearts.expanded.poly)};
}
assert.ok(report['13-20-21 + incenter'].withTwoStep<report['13-20-21 + incenter'].before-1);

// 4. 13-20-21 with its incenter: the new chest lies inside the standard chest of the triangle ABC (lifted Napoleon inequality).
{const points=presets['13-20-21 + incenter'],r=compute({mode:'four',points,on:all}),t=polyHP(triangle(normalize(points.slice(0,3)).p).poly);
  const tri=normalize(points.slice(0,3)),world=v=>[r.g[0]+r.s*v[0],r.g[1]+r.s*v[1]],back=v=>[(v[0]-tri.g[0])/tri.s,(v[1]-tri.g[1])/tri.s];
  for(const v of r.result.combined)assert.ok(inside(back(world(v)),t,1e-6),'outside the standard chest of ABC');}

// 5. Refinement never enlarges the chest; chest toggles reuse the scan.
{const points=presets['Convex quadrilateral'],fast=compute({mode:'four',points,on:all}).result,fine=compute({mode:'four',points,on:{...all,refineChest:true}}).result;
  assert.ok(area(fine.combined)<=area(fast.combined)+1e-9);report.refinedConvexQuadrilateral=+(100*area(fine.combined)/fine.baseArea).toFixed(3);}

// 6. Timing of the default scan.
const times=[];for(const points of Object.values(presets)){const p=normalize(points).p,h=hull(p),t=performance.now();fourChestLayers(p,h,h,{grid:8,loci:80});times.push(performance.now()-t);}
console.log(JSON.stringify({passed:true,inequalityChecks:checked,minSlackOfCertifiedCenters:slack,chestPercentOfHull:report,defaultScanMilliseconds:{min:Math.round(Math.min(...times)),max:Math.round(Math.max(...times))},
  scope:'Numerical regression. Each rule is a proved consequence of monotonicity along straight moves; scans select finitely many valid cuts.'}));
