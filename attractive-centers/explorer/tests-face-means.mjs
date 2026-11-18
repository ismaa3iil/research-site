// Regression tests for the face-mean hearts of four planar points.
import assert from 'node:assert/strict';
import {triangleCenterList,faceMeanCenters,FACE_MEAN_EXCLUDED} from './face-means.mjs';
import {compute} from './worker.mjs';
import {sub,dot,norm,mean,area,polyHP,inside} from './geometry.mjs';

// 1. The lean evaluation agrees with the triangle view, center by center.
let listError=0,compared=0;
for(const points of [[[0,0],[21,0],[5,12]],[[0,0],[3,0],[-1/3,4*Math.sqrt(14)/3]],[[-1,0],[1,0],[-.7,.5]],[[.3,-1.1],[2.2,.4],[-.7,1.9]]]){
  const r=compute({mode:'triangle',points}),ref=r.result.analytic.expanded.centers,list=triangleCenterList(points);
  assert.equal(list.length,ref.length);
  ref.forEach((c,k)=>{assert.equal(list[k].id,c.id);const w=[r.g[0]+r.s*c.point[0],r.g[1]+r.s*c.point[1]];listError=Math.max(listError,norm(sub(w,list[k].point))/r.s);compared++;});
}
assert.ok(listError<1e-12,'triangle center list mismatch '+listError);

// 2. Flat limit. By reflection symmetry the center of (0,0),(1,0),(t,-e) mirrors that of (t,e), so a center is
//    continuous across the flat triangle exactly when it tends to a point of the x-axis. Numerical test, not a proof.
const failing=new Set();
for(const t of [.3,.5,.77,1.6,-.45,3.2]){
  let previous=null;
  for(const e of [1e-2,1e-3,1e-4]){
    const list=triangleCenterList([[0,0],[1,0],[t,e]]);
    list.forEach((c,k)=>{if(!(Math.abs(c.point[1])/e<50)||(previous&&!(Math.abs(c.point[0]-previous[k].point[0])<.05)))failing.add(c.id);});
    previous=list;
  }
}
assert.deepEqual([...failing].sort(),[...FACE_MEAN_EXCLUDED].sort(),'the excluded set must equal the centers that fail the flat-limit test');

// 3. Finite attractivity law along random single-point moves, most of which cross a collinear position.
let seed=5,moves=0,crossing=0,lowMove=Infinity;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647*4-2;
const orient=(a,b,c)=>Math.sign((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]));
for(let q=0;q<120;q++){
  const P=[[rnd(),rnd()],[rnd(),rnd()],[rnd(),rnd()],[rnd(),rnd()]],j=q%4,v=[rnd(),rnd()],Q=P.map((p,k)=>k===j?v:p);
  const A=faceMeanCenters(P),B=new Map(faceMeanCenters(Q).map(c=>[c.id,c]));if(!A.length||!B.size)continue;
  const o=[0,1,2,3].filter(k=>k!==j),h=sub(P[j],v);
  if(o.some((_,a)=>orient(P[o[a]],P[o[(a+1)%3]],P[j])!==orient(P[o[a]],P[o[(a+1)%3]],v)))crossing++;
  moves++;for(const c of A){const d=B.get(c.id);if(d)lowMove=Math.min(lowMove,dot(sub(c.point,d.point),h)/dot(h,h));}
}
assert.ok(lowMove>-1e-9,'a face mean moved against a displacement: '+lowMove);

// 4. Sampled vertex responses (central differences).
let lowEigen=Infinity;
for(let q=0;q<6;q++){
  const P=[[rnd(),rnd()],[rnd(),rnd()],[rnd(),rnd()],[rnd(),rnd()]],base=faceMeanCenters(P),d=1e-6;if(!base.length)continue;
  for(let j=0;j<4;j++){
    const J=base.map(()=>[[0,0],[0,0]]);
    const ok=base.map(()=>true),byId=list=>new Map(list.map(c=>[c.id,c.point]));
    for(let k=0;k<2;k++){const a=structuredClone(P),b=structuredClone(P);a[j][k]+=d;b[j][k]-=d;const u=byId(faceMeanCenters(a)),v=byId(faceMeanCenters(b));
      base.forEach((c,n)=>{const x=u.get(c.id),y=v.get(c.id);if(!x||!y){ok[n]=false;return;}J[n][0][k]=(x[0]-y[0])/(2*d);J[n][1][k]=(x[1]-y[1])/(2*d);});}
    J.forEach((M,n)=>{if(ok[n])lowEigen=Math.min(lowEigen,(M[0][0]+M[1][1])/2-Math.hypot((M[0][0]-M[1][1])/2,(M[0][1]+M[1][0])/2));});
  }
}
assert.ok(lowEigen>-1e-6,'negative sampled response '+lowEigen);

// 5. Symmetric configurations: equilateral triangle with its centroid, and a parallelogram.
for(const P of [[[0,Math.sqrt(3)],[-1,0],[1,0],[0,Math.sqrt(3)/3]],[[0,0],[5,0],[6,3],[1,3]]])
  for(const c of faceMeanCenters(P))assert.ok(norm(sub(c.point,mean(P)))<1e-10,'symmetry: '+c.id);

// 6. Worker: the latest heart contains the previous one and the face means.
const report=[];
for(const points of [[[0,0],[21,0],[5,12],[7,14/3]],[[0,0],[4,0],[3,2],[0,3]],[[0,0],[6,.2],[4.7,4],[.5,3]],[[0,0],[4,0],[1,3],[.5,.8]]]){
  const d=compute({mode:'four',points,on:{}}).result,h=d.fourHearts,latest=polyHP(h.expanded.poly);
  for(const v of [...h.beforeFaceMeans.poly,...h.faceMeans.poly])assert.ok(inside(v,latest,1e-7));
  assert.equal(h.expanded.centers.length,h.beforeFaceMeans.centers.length+h.faceMeans.centers.length);
  report.push({previous:+(100*area(h.beforeFaceMeans.poly)/d.baseArea).toFixed(3),faceMeansAlone:+(100*area(h.faceMeans.poly)/d.baseArea).toFixed(3),latest:+(100*area(h.expanded.poly)/d.baseArea).toFixed(3)});
}
console.log(JSON.stringify({passed:true,triangleCentersCompared:compared,listError,flatLimitFailures:failing.size,randomMoves:moves,movesCrossingCollinear:crossing,minMoveProduct:lowMove,minSampledEigenvalue:lowEigen,heartPercentOfHull:report,
  scope:'Numerical regression. The face-mean construction is proved for configurations without collinear triples; the flat-limit check is numerical.'}));
