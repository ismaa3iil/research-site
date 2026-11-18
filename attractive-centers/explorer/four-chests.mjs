// SPDX-License-Identifier: MIT
// New chest rules for four planar points. Research by Ismail Hammoudeh.
// Every rule moves one or several points along one common direction h, all in the positive sense, starting
// from a configuration where the center is known. Monotonicity then gives <Z, h> >= (known value).
//   Three-fold pin    three points form an equilateral triangle and the fourth is its centre: Z is that centre.
//                     The direction is forced: from the centroid of the three points to the fourth point.
//   Moved-vertex transfer   the fourth point returns to the centroid of a triangle one of whose vertices has
//                     also been moved along the same line; Z then lies in the chest of that triangle.
//   Two-step cut      one point is moved from a trial position v to its true place; the center of the
//                     intermediate configuration lies in its own one-step chest.
// Every cut is a valid inequality for every monotone four-point center; scans only choose finitely many of them.
import {add,sub,mul,dot,norm,mean,hp,clip,polyHP,triangle,pairPlanes} from './geometry.mjs?v=b46-20261001';
import {edgeSlabs,centroidTransfer,involutionPlanes} from './revision.mjs?v=b46-20261001';
const S3=Math.sqrt(3);

export function threeFoldPins(p,directions=180){
  const hs=[];
  for(let d=0;d<4;d++){
    const o=[0,1,2,3].filter(k=>k!==d),g=mean(o.map(k=>p[k])),w=sub(p[d],g);
    const scale=Math.max(...o.map(k=>norm(sub(p[k],g))));if(!(scale>0))continue;
    // If the fourth point is the centroid itself, every direction is admissible.
    const dirs=norm(w)>1e-9*scale?[mul(w,1/norm(w))]:Array.from({length:directions},(_,k)=>[Math.cos(Math.PI*k/directions),Math.sin(Math.PI*k/directions)]);
    for(const h of dirs){
      const n=[-h[1],h[0]];
      for(const ord of [[o[0],o[1],o[2]],[o[0],o[2],o[1]]]){
        const s=ord.map(k=>dot(sub(p[k],p[d]),n)),X=(2*s[1]+s[0])/S3,Y=s[0];
        if(Math.hypot(X,Y)<1e-9*scale)continue;
        // offsets along h of the vertices of the equilateral triangle whose vertices lie on the three parallel lines
        const rho=[X,-X/2-S3/2*Y,-X/2+S3/2*Y];
        const values=[dot(p[d],h),...ord.map((k,m)=>dot(p[k],h)-rho[m])];
        hs.push(hp(h,Math.min(...values)),hp(mul(h,-1),-Math.max(...values)));
      }
    }
  }
  return hs.filter(Boolean);
}

export function movedVertexTransfer(p,steps=40){
  const hs=[];
  for(let d=0;d<4;d++){
    const T=[0,1,2,3].filter(k=>k!==d).map(k=>p[k]),g=mean(T),w=sub(p[d],g),len=norm(w);
    const scale=Math.max(...T.map(v=>norm(sub(v,g))));if(!(len>1e-9*scale))continue;
    const u=mul(w,1/len),chest=t=>{const c=triangle(t);return c.degenerate?null:c.poly;};
    for(let a=0;a<3;a++)for(let q=1;q<=steps;q++){
      const t=4*scale*q/steps;
      const low=chest(T.map((v,k)=>k===a?sub(v,mul(u,t)):v));
      if(low?.length)hs.push(hp(u,Math.min(...low.map(z=>dot(z,u)))));
      const high=chest(T.map((v,k)=>k===a?add(v,mul(u,3*len+t)):v));
      if(high?.length)hs.push(hp(mul(u,-1),-Math.max(...high.map(z=>dot(z,u)))));
    }
  }
  return hs.filter(Boolean);
}

// One-step chest of a configuration: the unconditional rules that are cheap to evaluate.
// Insertion: if one point is the centroid of the other three, the center lies in the chest of that triangle.
function insertionPlanes(p){
  const hs=[];
  for(let d=0;d<4;d++){
    const T=[0,1,2,3].filter(k=>k!==d).map(k=>p[k]),g=mean(T),scale=Math.max(...T.map(v=>norm(sub(v,g))));
    if(norm(sub(p[d],g))>1e-9*scale)continue;
    const c=triangle(T);if(!c.degenerate)hs.push(...polyHP(c.poly));
  }
  return hs;
}
// One-step chest of a configuration: the unconditional rules that are cheap to evaluate.
export function oneStepPlanes(p,{orbit=false,transfer=false}={}){
  return [...edgeSlabs(p),...pairPlanes(p).hs,...(orbit?involutionPlanes(p):[]),...(transfer?centroidTransfer(p):insertionPlanes(p)),...threeFoldPins(p,36)].filter(Boolean);
}
function oneStepPolygon(p,options){
  const g=mean(p),R=50*Math.max(...p.map(v=>norm(sub(v,g))));
  let poly=[[g[0]-R,g[1]-R],[g[0]+R,g[1]-R],[g[0]+R,g[1]+R],[g[0]-R,g[1]+R]];
  const pair=pairPlanes(p);if(pair.central)return [pair.central];
  for(const h of oneStepPlanes(p,options)){poly=clip(poly,h);if(!poly.length)break;}
  return poly;
}
const reflect=(q,a,b)=>{const d=sub(b,a),t=dot(sub(q,a),d)/dot(d,d),f=add(a,mul(d,t));return sub(mul(f,2),q);};

// Trial positions for the point p[i]: special positions first, then the symmetric loci, then a grid.
// 'reach' bounds the distance from p[i]: farther positions cannot produce a cut (see twoStepCuts).
export function trialPositions(p,i,{grid=14,loci=160,reach=Infinity}={}){
  const g=mean(p),scale=Math.max(...p.map(v=>norm(sub(v,g)))),o=[0,1,2,3].filter(k=>k!==i),out=[];
  out.push(mean(o.map(k=>p[k])));
  for(let a=0;a<3;a++){
    const j=o[a],k=o[(a+1)%3],l=o[(a+2)%3],m=mean([p[j],p[k]]),d=sub(p[k],p[j]),L=norm(d);if(!(L>0))continue;
    const nrm=[-d[1],d[0]];
    out.push(reflect(p[j],p[k],p[l]),reflect(p[l],m,add(m,nrm)),sub(mul(p[l],3),add(p[j],p[k])));
    for(const s of [1,-1])out.push(add(m,mul(nrm,s*S3/2)),add(m,mul(nrm,s*S3/6)));
  }
  const special=out.length,r=Math.min(reach,2.5*scale);
  for(let a=0;a<3;a++){
    const j=o[a],k=o[(a+1)%3],m=mean([p[j],p[k]]),d=sub(p[k],p[j]),L=norm(d);if(!(L>0))continue;
    const nrm=[-d[1]/L,d[0]/L],t0=dot(sub(p[i],m),nrm);
    for(let q=0;q<=loci;q++){
      out.push(add(m,mul(nrm,t0+r*(2*q/loci-1))));                         // bisector of p[j]p[k], near p[i]
      const an=2*Math.PI*q/loci,e=[Math.cos(an),Math.sin(an)];
      out.push(add(p[j],mul(e,L)),add(p[k],mul(e,L)));                       // circles |v-p[j]| = |v-p[k]| = L
    }
  }
  for(let x=0;x<=grid;x++)for(let y=0;y<=grid;y++)out.push([p[i][0]+r*(2*x/grid-1),p[i][1]+r*(2*y/grid-1)]);
  return out.filter((v,n)=>(n<special||norm(sub(v,p[i]))<=reach)&&norm(sub(v,p[i]))>1e-6*scale&&o.every(k=>norm(sub(v,p[k]))>1e-6*scale));
}

export function twoStepCuts(p,start,options={}){
  const cuts=[];let poly=start;const G4=mean(p);
  for(let round=0;round<2&&poly.length>2;round++)for(let i=0;i<4;i++){
    // The centroid of the four points lies in every chest. With the point moved to v it is G4 - h/4, h = p[i] - v,
    // so a cut needs <G4 - h/4, h> > min <x, h> over the current polygon, hence |h| < 4 max |x - G4|.
    const reach=4*Math.max(...poly.map(x=>norm(sub(x,G4))));
    for(const v of trialPositions(p,i,{...options,reach})){
      const h=sub(p[i],v),low=Math.min(...poly.map(x=>dot(x,h)));
      if(dot(G4,h)-dot(h,h)/4<=low)continue;
      const C=oneStepPolygon(p.map((q,k)=>k===i?v:q),options);if(!C.length)continue;
      const bound=Math.min(...C.map(z=>dot(z,h)));
      if(bound-low>1e-9*norm(h)){const cut=hp(h,bound);cuts.push(cut);poly=clip(poly,cut);if(poly.length<3)break;}
    }
  }
  return cuts;
}

// Layers for the explorer: 'pins' (three-fold pins with moved-vertex transfer) and 'twostep'.
export function fourChestLayers(p,hull,base,options={}){
  const pins=[...threeFoldPins(p),...movedVertexTransfer(p)];
  const start=[...oneStepPlanes(p),...pins].reduce((q,h)=>clip(q,h),base);
  const cuts=options.twoStep===false?[]:twoStepCuts(p,start,options);
  return {pinPlanes:pins,cutPlanes:cuts,pins:pins.reduce((q,h)=>clip(q,h),hull),twostep:cuts.reduce((q,h)=>clip(q,h),hull)};
}

// The same pins for one triangle T (three planar points) and a fourth point q, returned as slabs lo <= <Z,h> <= hi.
// Used by the tetrahedron rules, where T is a face and q the foot of the fourth vertex on its plane.
export function threeFoldSlabs(T,q,directions=36){
  const out=[],g=mean(T),w=sub(q,g),scale=Math.max(...T.map(v=>norm(sub(v,g))));if(!(scale>0))return out;
  const dirs=norm(w)>1e-9*scale?[mul(w,1/norm(w))]:Array.from({length:directions},(_,k)=>[Math.cos(Math.PI*k/directions),Math.sin(Math.PI*k/directions)]);
  for(const h of dirs){
    const n=[-h[1],h[0]];
    for(const ord of [[0,1,2],[0,2,1]]){
      const s=ord.map(k=>dot(sub(T[k],q),n)),X=(2*s[1]+s[0])/S3,Y=s[0];
      if(Math.hypot(X,Y)<1e-9*scale)continue;
      const rho=[X,-X/2-S3/2*Y,-X/2+S3/2*Y],values=[dot(q,h),...ord.map((k,m)=>dot(T[k],h)-rho[m])];
      out.push({h,lo:Math.min(...values),hi:Math.max(...values)});
    }
  }
  return out;
}
