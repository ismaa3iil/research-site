// SPDX-License-Identifier: MIT
// Face means. Research by Ismail Hammoudeh.
// For a certified attractive triangle center Z3, the map
//   Z4(P1,P2,P3,P4) = (1/4) [ Z3(P2,P3,P4) + Z3(P1,P3,P4) + Z3(P1,P2,P4) + Z3(P1,P2,P3) ]
// is symmetric and similarity-equivariant, and its response to each point is a sum of responses of Z3.
// It is therefore attractive wherever no three points are collinear. If Z3 extends continuously to flat
// triangles, the finite attractivity law also holds for moves that cross a collinear position.
import {add,sub,mul,norm,normalize,hull} from './geometry.mjs?v=b46-20261001';
import {b46Heart} from './b46.mjs?v=b46-20261001';
import {analyticRows,shapeWeights} from './analytic-hearts.mjs?v=four-20261118';
import {trianglePullbackCenters} from './tetra-hearts.mjs?v=all-hearts-20261018';
import {steinerCenter} from './steiner-hearts.mjs?v=steiner-20261118';
import {STEINER_MAPS} from './steiner-hearts-data.mjs?v=steiner-20261118';
let rows=null;

// All certified triangle centers of the explorer at one triangle, in the coordinates of the input.
export function triangleCenterList(points){
  const {p,g,s}=normalize(points),out=[],world=q=>add(g,mul(q,s));
  for(const c of b46Heart(p).centers)out.push({id:`B46-${c.b46Position}`,name:`B46 #${c.b46Position}: ${c.name}`,point:world(c.point)});
  // Shape-dependent weighted means: evaluated directly from the coefficient rows, without building hulls.
  rows??=analyticRows();
  const sides=p.map((_,i)=>norm(sub(p[(i+1)%3],p[(i+2)%3])));
  for(const row of rows){const w=shapeWeights(sides,row.coefficients);out.push({id:row.id,name:row.name,point:world([0,1].map(j=>w[0]*p[0][j]+w[1]*p[1][j]+w[2]*p[2][j]))});}
  for(const c of trianglePullbackCenters(p))out.push({id:c.id,name:c.name,point:world(c.point)});
  STEINER_MAPS.forEach((c,i)=>out.push({id:`St${i+1}`,name:`Steiner map St${i+1}`,point:world(steinerCenter(p,c))}));
  return out;
}

// Triangle centers that must not be used for face means. tests-face-means.mjs checks that every center tends to
// a point of the line when the triangle flattens; all 767 pass, so the set is empty.
export const FACE_MEAN_EXCLUDED=new Set();

export function faceMeanCenters(p,{excluded=FACE_MEAN_EXCLUDED}={}){
  const scale=Math.max(...p.map(v=>norm(sub(v,p[0]))));
  const faces=[0,1,2,3].map(d=>p.filter((_,k)=>k!==d));
  // a flat or nearly flat face: the family is omitted (the remaining heart is still valid)
  for(const f of faces){const u=sub(f[1],f[0]),v=sub(f[2],f[0]);if(Math.abs(u[0]*v[1]-u[1]*v[0])<1e-9*scale*scale)return [];}
  // Each id names one fixed triangle center. A center that failed to evaluate on some face is left out.
  const lists=faces.map(f=>new Map(triangleCenterList(f).map(c=>[c.id,c]))),out=[];
  for(const [id,c] of lists[0]){
    if(excluded.has(id)||!lists.every(L=>L.has(id)))continue;
    const q=[0,0];for(const L of lists){const v=L.get(id).point;q[0]+=v[0]/4;q[1]+=v[1]/4;}
    if(Number.isFinite(q[0])&&Number.isFinite(q[1]))out.push({id:'F-'+id,name:'Face mean of '+(c.name||id),point:q});
  }
  return out;
}

export function faceMeanHeart(p,options){
  const centers=faceMeanCenters(p,options),poly=hull(centers.map(c=>c.point));
  return {centers,poly,boundary:centers.filter(c=>poly.some(v=>norm(sub(v,c.point))<2e-8))};
}

// Tetrahedron. Each face is evaluated in its own plane. For a center Z = sum w_i v_i of a face, a displacement h of a
// vertex normal to the face changes no side length to first order, so Z moves by w_i h: the response is the planar
// response in the plane of the face and the barycentric weight w_i >= 0 along its normal (the center lies in the
// triangle). The mean over the four faces is therefore an attractive center of the tetrahedron.
export function faceMeanCenters3(p,{excluded=FACE_MEAN_EXCLUDED}={}){
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot3=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const lists=[];
  for(let d=0;d<4;d++){
    const f=p.filter((_,k)=>k!==d),o=f[0],u=sub(f[1],o),v=sub(f[2],o),m=cross(u,v);
    if(!(norm(m)>1e-9*norm(u)*norm(v)))return [];
    const e=mul(u,1/norm(u)),n=mul(m,1/norm(m)),g=cross(n,e);
    const list=triangleCenterList(f.map(q=>[dot3(sub(q,o),e),dot3(sub(q,o),g)]));
    lists.push(new Map(list.map(c=>[c.id,{name:c.name,point:add(o,add(mul(e,c.point[0]),mul(g,c.point[1])))}])));
  }
  const out=[];
  for(const [id,c] of lists[0]){
    if(excluded.has(id)||!lists.every(L=>L.has(id)))continue;
    const q=[0,0,0];for(const L of lists){const v=L.get(id).point;for(let k=0;k<3;k++)q[k]+=v[k]/4;}
    if(q.every(Number.isFinite))out.push({id:'F-'+id,name:'Face mean of '+(c.name||id),point:q});
  }
  return out;
}
