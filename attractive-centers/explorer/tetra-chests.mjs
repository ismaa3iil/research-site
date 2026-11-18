// SPDX-License-Identifier: MIT
// New chest rules for the tetrahedron. Research by Ismail Hammoudeh.
// As in the plane, every rule moves the vertices along one common direction h, all in the positive sense,
// starting from a configuration where the center is known; monotonicity gives <Z, h> >= (known value).
//   Axis pin      a face is moved inside its own plane to an equilateral triangle whose axis passes through the
//                 fourth vertex. A rotation by 120 degrees about that axis fixes the configuration, so the center
//                 lies on the axis, and <Z, h> is known for every h in the plane of the face.
//                 In the plane of the face this is the planar three-fold pin for the foot of the fourth vertex.
//   Median pin    all four vertices are moved along the median direction (face centroid to opposite vertex) to a
//                 flat configuration: an equilateral triangle with the fourth vertex at its centre. Rotations and
//                 the reflection in its plane fix that configuration, so the center is the centre itself.
//   Moved-vertex transfer   the fourth vertex returns to the centroid of a face one vertex of which has also been
//                 moved along the median direction; the center then lies in the triangle chest of that face.
import {add,sub,mul,dot,norm,mean,hp,clip,tetraPlanes,pairPlanes} from './geometry.mjs?v=b46-20261001';
import {faceChest,edgeSlabs} from './revision.mjs?v=b46-20261001';
import {threeFoldSlabs} from './four-chests.mjs?v=four-20261118';
const cross3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=v=>mul(v,1/norm(v));

// Orthonormal frame of the plane of a face: origin o, in-plane axes e and f, normal n.
export function faceFrame(face){
  const o=face[0],d=sub(face[1],o),m=cross3(d,sub(face[2],o));
  if(!(norm(d)>0)||!(norm(m)>1e-14*norm(d)*norm(sub(face[2],o))))return null;
  const e=unit(d),n=unit(m),f=cross3(n,e);
  return {o,e,f,n,to2:q=>[dot(sub(q,o),e),dot(sub(q,o),f)],to3:q=>add(o,add(mul(e,q[0]),mul(f,q[1])))};
}

export function axisPins(p,directions=36){
  const hs=[];
  for(let d=0;d<4;d++){
    const face=p.filter((_,k)=>k!==d),F=faceFrame(face);if(!F)continue;
    for(const {h,lo,hi} of threeFoldSlabs(face.map(F.to2),F.to2(p[d]),directions)){
      const H=add(mul(F.e,h[0]),mul(F.f,h[1])),shift=dot(F.o,H);
      hs.push(hp(H,lo+shift),hp(mul(H,-1),-(hi+shift)));
    }
  }
  return hs.filter(Boolean);
}

// Heights (x,y) of two vertices above the third such that the lifted triangle is equilateral.
// u, v are the planar edge vectors from the first vertex; both mirror solutions are returned.
function equilateralLifts(u,v){
  const a=dot(u,u),b=dot(v,v),c=dot(u,v),B=2*b-4*a+4*c,C=(b-2*c)**2;
  const Y=(-B+Math.sqrt(B*B+12*C))/6,scale=Math.max(a,b);
  let x,y;
  if(Y>1e-14*scale){y=Math.sqrt(Y);x=(b-2*c+Y)/(2*y);}
  else{y=0;x=Math.sqrt(Math.max(b-a,0));}
  // verify: |u|^2+x^2 = |v|^2+y^2 = |u-v|^2+(x-y)^2
  const s1=a+x*x,s2=b+y*y,s3=a+b-2*c+(x-y)**2;
  if(Math.abs(s1-s2)>1e-9*scale||Math.abs(s1-s3)>1e-9*scale)return [];
  return x===0&&y===0?[[0,0]]:[[x,y],[-x,-y]];
}

export function medianPins(p){
  const hs=[];
  for(let d=0;d<4;d++){
    const T=p.filter((_,k)=>k!==d),g=mean(T),w=sub(p[d],g),scale=Math.max(...T.map(v=>norm(sub(v,g))));
    if(!(norm(w)>1e-9*scale))continue;
    const h=unit(w),flat=q=>sub(q,mul(h,dot(q,h)));                       // projection along h
    const s=T.map(q=>dot(q,h)),sd=dot(p[d],h);
    for(const [x,y] of equilateralLifts(sub(flat(T[1]),flat(T[0])),sub(flat(T[2]),flat(T[0])))){
      const z=[0,x,y],centre=(x+y)/3,slack=[...s.map((v,k)=>v-z[k]),sd-centre];
      hs.push(hp(h,centre+Math.min(...slack)),hp(mul(h,-1),-(centre+Math.max(...slack))));
    }
  }
  return hs.filter(Boolean);
}

export function movedVertexTransfer3(p,steps=24){
  const hs=[];
  for(let d=0;d<4;d++){
    const T=p.filter((_,k)=>k!==d),g=mean(T),w=sub(p[d],g),len=norm(w),scale=Math.max(...T.map(v=>norm(sub(v,g))));
    if(!(len>1e-9*scale))continue;
    const u=unit(w);let low=-Infinity,high=Infinity;
    for(let a=0;a<3;a++)for(let q=1;q<=steps;q++){
      const t=4*scale*q/steps;
      const c1=faceChest(T.map((v,k)=>k===a?sub(v,mul(u,t)):v));if(c1?.length)low=Math.max(low,Math.min(...c1.map(z=>dot(z,u))));
      const c2=faceChest(T.map((v,k)=>k===a?add(v,mul(u,3*len+t)):v));if(c2?.length)high=Math.min(high,Math.max(...c2.map(z=>dot(z,u))));
    }
    if(Number.isFinite(low))hs.push(hp(u,low));if(Number.isFinite(high))hs.push(hp(mul(u,-1),-high));
  }
  return hs.filter(Boolean);
}

export function tetraPinPlanes(p){return [...axisPins(p),...medianPins(p),...movedVertexTransfer3(p)];}

// Half-spaces of the faces of a convex polyhedron {vertices, faces}.
export function facePlanes(poly){
  const g=mean(poly.vertices),hs=[];
  for(const f of poly.faces){
    let n=null;for(let k=1;k<f.length-1&&!n;k++){const m=cross3(sub(f[k],f[0]),sub(f[k+1],f[0]));if(norm(m)>1e-14)n=m;}
    if(!n)continue;if(dot(n,sub(g,f[0]))<0)n=mul(n,-1);
    const h=hp(n,dot(n,f[0]));if(h)hs.push(h);
  }
  return hs;
}

// ---- Two-step cuts ------------------------------------------------------------------------------------------
// One vertex is moved from a trial position v to its true place, displacement h. The trial positions make the
// intermediate tetrahedron mirror-symmetric: v is the image of a vertex P_l under a rotation about the edge P_jP_k,
// so the plane through that edge and the midpoint of P_l v is a mirror plane and the center lies in it.
// Inside the mirror plane the one-step chest is a polygon, and <Z, h> >= its minimum of <z, h>.
function oneStepPlanes3(q){return [...tetraPlanes(q),...edgeSlabs(q),...pairPlanes(q).hs,...axisPins(q,12),...medianPins(q)].filter(Boolean);}
function mirrorPolygon(q,o,m){
  const a=Math.abs(m[0])<.6?[1,0,0]:[0,1,0],e=unit(cross3(m,a)),f=cross3(m,e),scale=Math.max(...q.map(v=>norm(sub(v,o))));
  const pair=pairPlanes(q);if(pair.central)return [pair.central];
  let poly=[[-60*scale,-60*scale],[60*scale,-60*scale],[60*scale,60*scale],[-60*scale,60*scale]];
  for(const h of oneStepPlanes3(q)){
    const n=[dot(h.n,e),dot(h.n,f)],b=h.b-dot(h.n,o);
    if(Math.hypot(n[0],n[1])<1e-10){if(b>1e-9*scale)return [];continue;}
    poly=clip(poly,hp(n,b));if(!poly.length)return [];
  }
  return poly.map(z=>add(o,add(mul(e,z[0]),mul(f,z[1]))));
}
const rotate=(q,o,axis,angle)=>{const v=sub(q,o),c=Math.cos(angle),s=Math.sin(angle);return add(o,add(add(mul(v,c),mul(cross3(axis,v),s)),mul(axis,dot(axis,v)*(1-c))));};

export function twoStepCuts3(p,vertices,{samples=96,keep=30}={}){
  if(!vertices||vertices.length<4)return [];
  const G4=mean(p),reach=4*Math.max(...vertices.map(x=>norm(sub(x,G4)))),scale=Math.max(...p.map(v=>norm(sub(v,G4)))),found=[];
  for(let i=0;i<4;i++){
    const o=[0,1,2,3].filter(k=>k!==i);
    for(let a=0;a<3;a++){
      const l=o[a],j=o[(a+1)%3],k=o[(a+2)%3],axis=sub(p[k],p[j]);if(!(norm(axis)>0))continue;const u=unit(axis);
      for(let q=1;q<samples;q++){
        const v=rotate(p[l],p[j],u,2*Math.PI*q/samples),h=sub(p[i],v),L=norm(h);
        if(!(L>1e-6*scale)||L>reach||norm(sub(v,p[l]))<1e-6*scale)continue;
        // The centroid of the four vertices lies in every chest; in the intermediate tetrahedron it is G4 - h/4.
        const low=Math.min(...vertices.map(x=>dot(x,h)));if(dot(G4,h)-L*L/4<=low)continue;
        const C=mirrorPolygon(p.map((z,n)=>n===i?v:z),p[j],unit(sub(v,p[l])));if(!C.length)continue;
        const bound=Math.min(...C.map(z=>dot(z,h)));
        if(bound-low>1e-9*L)found.push({plane:hp(h,bound),depth:(bound-low)/L});
      }
    }
  }
  // Keep the deepest cuts, skipping a cut whose normal is within about 4 degrees of a deeper one already kept.
  const kept=[];
  for(const c of found.sort((x,y)=>y.depth-x.depth)){if(kept.length>=keep)break;if(!kept.some(k=>dot(k.plane.n,c.plane.n)>.9976))kept.push(c);}
  return kept.map(c=>c.plane);
}
