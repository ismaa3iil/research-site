// Regression tests for the tetrahedron face means and the new tetrahedron chest rules.
import assert from 'node:assert/strict';
import {axisPins,medianPins,movedVertexTransfer3,twoStepCuts3,facePlanes} from './tetra-chests.mjs';
import {faceMeanCenters3} from './face-means.mjs';
import {compute} from './worker.mjs';
import {dot,normalize,mean,sub,norm,polyhedron} from './geometry.mjs';
const base={para:true,bisector:true,edge:true,transfer:true},all={...base,pins:true,twostep:true};
const presets={'Bundle tetrahedron':[[0,0,0],[4,0,0],[0,3,0],[1,1,2]],'Generic tetrahedron':[[0,0,0],[2,0,0],[.3,1.8,0],[.5,.6,2.2]],
  'Heart enlargement benchmark':[[0,0,0],[1,0,0],[0,1,0],[3,-2,.5]],'Scalene 2':[[0,0,0],[4,0,0],[1,3,0],[.5,.8,2.5]]};
let seed=23;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647*4-2;
const randomTetra=()=>{for(;;){const P=[0,1,2,3].map(()=>[rnd(),rnd(),rnd()]),u=sub(P[1],P[0]),v=sub(P[2],P[0]),w=sub(P[3],P[0]);
  const vol=Math.abs(u[0]*(v[1]*w[2]-v[2]*w[1])-u[1]*(v[0]*w[2]-v[2]*w[0])+u[2]*(v[0]*w[1]-v[1]*w[0]));if(vol>.5)return P;}};

// 1. Every certified tetrahedron center (face means included) satisfies every new inequality.
let slack=Infinity,checked=0,kind='';
for(const points of [...Object.values(presets),...Array.from({length:16},randomTetra)]){
  const d=compute({mode:'tetra',points,on:base}).result,p=normalize(points).p;
  const groups={axis:axisPins(p),median:medianPins(p),transfer:movedVertexTransfer3(p),twoStep:twoStepCuts3(p,d.vertices,{samples:120,keep:60})};
  for(const [name,hs] of Object.entries(groups))for(const h of hs)for(const c of d.tetraHearts.expanded.centers){const s=dot(h.n,c.point)-h.b;checked++;if(s<slack){slack=s;kind=name;}}
}
assert.ok(slack>-1e-7,`a certified center violates a new chest inequality (${kind}): ${slack}`);

// 2. Face means: sampled 3x3 responses are positive semidefinite; a regular tetrahedron gives its centroid.
let lowEigen=Infinity;
const minEigen3=S=>{// smallest eigenvalue of a symmetric 3x3 matrix (trigonometric formula)
  const m=(S[0][0]+S[1][1]+S[2][2])/3,B=S.map((r,i)=>r.map((v,j)=>v-(i===j?m:0))),p2=B.flat().reduce((s,v)=>s+v*v,0)/6;
  if(p2<1e-30)return m;const q=Math.sqrt(p2),det=(B[0][0]*(B[1][1]*B[2][2]-B[1][2]*B[2][1])-B[0][1]*(B[1][0]*B[2][2]-B[1][2]*B[2][0])+B[0][2]*(B[1][0]*B[2][1]-B[1][1]*B[2][0]))/(2*q**3);
  return m+2*q*Math.cos(Math.acos(Math.max(-1,Math.min(1,det)))/3+2*Math.PI/3);};
for(let n=0;n<4;n++){
  const P=randomTetra(),ids=faceMeanCenters3(P).map(c=>c.id),e=1e-6;
  for(let j=0;j<4;j++){
    const J=ids.map(()=>[[0,0,0],[0,0,0],[0,0,0]]),ok=ids.map(()=>true);
    for(let k=0;k<3;k++){const a=structuredClone(P),b=structuredClone(P);a[j][k]+=e;b[j][k]-=e;
      const u=new Map(faceMeanCenters3(a).map(c=>[c.id,c.point])),v=new Map(faceMeanCenters3(b).map(c=>[c.id,c.point]));
      ids.forEach((id,m)=>{const x=u.get(id),y=v.get(id);if(!x||!y){ok[m]=false;return;}for(let r=0;r<3;r++)J[m][r][k]=(x[r]-y[r])/(2*e);});}
    J.forEach((M,m)=>{if(ok[m])lowEigen=Math.min(lowEigen,minEigen3(M.map((r,i)=>r.map((v,c)=>(v+M[c][i])/2))));});
  }
}
assert.ok(lowEigen>-1e-6,'negative sampled response of a face mean: '+lowEigen);
{const R=[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]];for(const c of faceMeanCenters3(R))assert.ok(norm(sub(c.point,mean(R)))<1e-10,'regular tetrahedron: '+c.id);}

// 3. Volumes at the presets; pins, two-step cuts and refinement can only shrink the chest.
const report={},times=[];
for(const [name,points] of Object.entries(presets)){
  const a=compute({mode:'tetra',points,on:base}).result,b=compute({mode:'tetra',points,on:{...base,pins:true}}).result;
  const t=performance.now(),c=compute({mode:'tetra',points,on:all}).result;times.push(performance.now()-t);
  const f=compute({mode:'tetra',points,on:{...all,refineChest:true}}).result,pc=v=>+(100*v/a.base.volume).toFixed(3),h=c.tetraHearts;
  assert.ok(b.volume<=a.volume*(1+1e-9)&&c.volume<=b.volume*(1+1e-9)&&f.volume<=c.volume*(1+1e-9),name);
  assert.equal(h.expanded.centers.length,h.beforeFaceMeans.centers.length+h.faceMeans.centers.length);
  // the certified centers stay inside the final refined chest
  for(const q of facePlanes(f))for(const z of h.expanded.centers)assert.ok(dot(q.n,z.point)-q.b>-1e-7,name+': center outside the refined chest');
  report[name]={chestBefore:pc(a.volume),withPins:pc(b.volume),withTwoStep:pc(c.volume),refined:pc(f.volume),heartBefore:pc(h.beforeFaceMeans.volume),heartLatest:pc(h.expanded.volume)};
}
assert.ok(report['Bundle tetrahedron'].withTwoStep<report['Bundle tetrahedron'].chestBefore-1);
console.log(JSON.stringify({passed:true,inequalityChecks:checked,minSlackOfCertifiedCenters:slack,minSampledEigenvalue:lowEigen,percentOfTetrahedron:report,computeMilliseconds:{min:Math.round(Math.min(...times)),max:Math.round(Math.max(...times))},
  scope:'Numerical regression. Each rule is a proved consequence of monotonicity along straight moves; scans select finitely many valid cuts.'}));
