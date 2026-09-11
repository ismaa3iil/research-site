// SPDX-License-Identifier: MIT
// Goal 1 revision 2. Unconditional transfer is distinct from absorption.
import {add,sub,mul,dot,norm,mean,hp,polyHP,triangle,clipAll,tetraPlanes,polyhedron,four,fourCombined,tetra,pairPlanes,bisectors} from './geometry.mjs';
const cross3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function edgeSlabs(p){
  let hs=[];
  for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){
    const n=sub(p[j],p[i]);if(norm(n)<1e-12)continue;
    const values=[dot(n,mean([p[i],p[j]])),...p.filter((_,k)=>k!==i&&k!==j).map(q=>dot(n,q))];
    hs.push(hp(n,Math.min(...values)),hp(mul(n,-1),-Math.max(...values)));
  }return hs;
}
export function faceChest(face){
  if(face[0].length===2){const t=triangle(face);return t.degenerate?null:t.poly;}
  const o=face[0],d=sub(face[1],o),l=norm(d);if(l<1e-12)return null;
  const e=mul(d,1/l),n=cross3(e,sub(face[2],o));if(norm(n)<1e-12)return null;
  const f=cross3(mul(n,1/norm(n)),e);
  const t=triangle(face.map(q=>[dot(sub(q,o),e),dot(sub(q,o),f)]));
  return t.degenerate?null:t.poly.map(q=>add(o,add(mul(e,q[0]),mul(f,q[1]))));
}
export function centroidTransfer(p){
  let hs=[];
  p.forEach((z,i)=>{
    const face=p.filter((_,j)=>j!==i),c=faceChest(face);if(!c?.length)return;
    const d=sub(z,mean(face));
    // Numerical equality tolerance, on normalized configurations only.
    if(norm(d)<1e-13){if(z.length===2)hs.push(...polyHP(c));}
    else hs.push(hp(d,Math.min(...c.map(q=>dot(d,q)))));
  });return hs;
}
export function involutionPlanes(p){
  const hs=[];
  for(let i=0;i<4;i++)for(let j=0;j<4;j++)if(i!==j){
    const [k,l]=[0,1,2,3].filter(z=>z!==i&&z!==j),e=sub(p[l],p[k]),den=dot(e,e);if(den<1e-24)continue;
    const m=mean([p[k],p[l]]),proj=v=>mul(e,dot(v,e)/den);
    const images=[[sub(mul(m,2),p[j]),false],[sub(p[j],mul(proj(sub(p[j],m)),2)),false],[add(p[k],sub(mul(proj(sub(p[j],p[k])),2),sub(p[j],p[k]))),true]];
    for(const [q,fixed] of images){const h=sub(p[i],q),anchors=[mean([q,p[j]]),...(fixed?[p[k],p[l]]:[m])];
      const row=hp(h,Math.min(...anchors.map(a=>dot(h,a))));if(row)hs.push(row);
    }
  }return hs;
}
export function diameterBallPlanes(p,count=64){
  const dim=p[0].length,dirs=[];
  if(dim===2)for(let k=0;k<count;k++)dirs.push([Math.cos(2*Math.PI*k/count),Math.sin(2*Math.PI*k/count)]);
  else for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++)if(x||y||z)dirs.push(mul([x,y,z],1/Math.hypot(x,y,z)));
  const faces=p.map((z,i)=>({z,c:faceChest(p.filter((_,j)=>j!==i))})).filter(f=>f.c?.length);
  return dirs.map(n=>{
    const bound=Math.min(...faces.map(({z,c})=>Math.max(...c.map(q=>(dot(n,add(q,z))+norm(sub(q,z)))/2))));
    return hp(mul(n,-1),-bound);
  }).filter(h=>h&&Number.isFinite(h.b));
}
export function revisedFour(p,on){
  const d=four(p),eh=edgeSlabs(p),th=centroidTransfer(p),bh=diameterBallPlanes(p);
  const oh=involutionPlanes(p);let combined=fourCombined(d,on);
  if(on.orbit)combined=clipAll(combined,oh);
  if(on.edge)combined=clipAll(combined,eh);
  if(on.transfer)combined=clipAll(combined,th);
  if(on.ball)combined=clipAll(combined,bh);
  return {...d,orbit:clipAll(d.hull,oh),edge:clipAll(d.hull,eh),transfer:clipAll(d.hull,th),ball:clipAll(d.hull,bh),combined};
}
export function revisedTetra(p,on){
  const d=tetra(p,on);if(d.degenerate||!d.base)return d;
  const e=edgeSlabs(p),t=centroidTransfer(p),b=on.ball?diameterBallPlanes(p):[];
  const hs=tetraPlanes(p),pair=pairPlanes(p);
  if(on.para&&pair.central)return d;
  if(on.para)hs.push(...pair.hs);if(on.bisector)hs.push(...bisectors(p).hs);
  if(on.orbit)hs.push(...involutionPlanes(p));if(on.edge)hs.push(...e);if(on.transfer)hs.push(...t);if(on.ball)hs.push(...b);
  const base=tetraPlanes(p);
  return {...d,...polyhedron(hs),edge:polyhedron([...base,...e]),transfer:polyhedron([...base,...t]),ball:on.ball?polyhedron([...base,...b]):null};
}
