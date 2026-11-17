// SPDX-License-Identifier: MIT
// Certified Steiner-frame maps. Research by Ismail Hammoudeh.
// Z = G + X·cos3θ·GP + Y·sin3θ·GQ, where GP, GQ are the semi-axes of the Steiner inellipse and θ is the
// eccentric angle of a vertex. With κ = (1−k²)/(1+k²), k = |GQ|/|GP|, q = κ²/4 and p = −κ³cos6θ:
//   X = −κ(f + gκ),  Y = −κ(f − gκ),  f = Σ(f_m + p·fp_m)q^m,  g = Σ(g_m + p·gp_m)q^m.
// Equivalently the vertex weights are 1/3 − f·u_i − 6g(u_i² − mean u²), u_i = 1/3 − a_i²/(a²+b²+c²).
// Each coefficient vector passed an interval-arithmetic certificate of positive definite vertex responses.
import {add,sub,mul,dot,mean,norm,hull} from './geometry.mjs?v=b46-20261001';
import {STEINER_DEGREE,STEINER_P_DEGREE,STEINER_MAPS} from './steiner-hearts-data.mjs?v=steiner-20261118';

export function steinerFrame(p){
  const g=mean(p),w=p.map(v=>sub(v,g));
  const sxx=w.reduce((s,v)=>s+v[0]*v[0],0)/3,sxy=w.reduce((s,v)=>s+v[0]*v[1],0)/3,syy=w.reduce((s,v)=>s+v[1]*v[1],0)/3;
  const half=(sxx+syy)/2,r=Math.hypot((sxx-syy)/2,sxy);
  if(!(half>0))return null;
  const angle=.5*Math.atan2(2*sxy,sxx-syy),e1=[Math.cos(angle),Math.sin(angle)],e2=[-e1[1],e1[0]];
  const a=Math.sqrt((half+r)/2),b=Math.sqrt(Math.max(half-r,0)/2);
  return {g,e1,e2,a,b,k:b/a,cs:w.map(v=>[dot(v,e1)/(2*a),b>0?dot(v,e2)/(2*b):0])};
}

// Shape data shared by every map: one pass over the triangle, then each map costs a few multiplications.
function shapeData(p){
  const squared=p.map((_,i)=>{const d=sub(p[(i+1)%3],p[(i+2)%3]);return dot(d,d);}),total=squared[0]+squared[1]+squared[2];
  if(!(total>0)||!Number.isFinite(total))throw Error('Steiner maps need finite, noncollapsed triangle data.');
  const u=squared.map(a=>1/3-a/total),uu=(u[0]*u[0]+u[1]*u[1]+u[2]*u[2])/3;
  const q=9*uu/2,pp=-36*(u[0]**3+u[1]**3+u[2]**3);
  const sum=k=>p.reduce((s,v,i)=>add(s,mul(v,k(u[i]))),[0,0]);
  // Z = G − f·W − 6g·V, with W = Σu_i v_i and V = Σ(u_i² − mean u²)v_i
  return {q,p:pp,g:mean(p),W:sum(x=>x),V:sum(x=>x*x-uu)};
}
const horner=(c,from,count,q)=>{let s=0;for(let m=count-1;m>=0;m--)s=s*q+c[from+m];return s;};
function evaluate(d,c){
  const D=STEINER_DEGREE+1,E=STEINER_P_DEGREE+1;
  const f=horner(c,0,D,d.q)+d.p*horner(c,2*D,E,d.q),g=horner(c,D,D,d.q)+d.p*horner(c,2*D+E,E,d.q);
  return [d.g[0]-f*d.W[0]-6*g*d.V[0],d.g[1]-f*d.W[1]-6*g*d.V[1]];
}
export function steinerCenter(points,coefficients){return evaluate(shapeData(points),coefficients);}

export function steinerHearts(points){
  const d=shapeData(points);
  const centers=STEINER_MAPS.map((c,i)=>({id:`St${i+1}`,name:`Steiner map St${i+1} · interval-certified`,point:evaluate(d,c)}));
  centers.push({id:'G',name:'G · centroid',point:d.g});
  const poly=hull(centers.map(c=>c.point));
  return {centers,poly,boundary:centers.filter(c=>poly.some(v=>norm(sub(v,c.point))<2e-9))};
}
