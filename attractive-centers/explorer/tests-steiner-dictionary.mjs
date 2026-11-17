// Dictionary between the explorer's shape maps (f,g) and Steiner-frame coefficients.
// Z = G + X·cos3θ·GP + Y·sin3θ·GQ,  X = −κ(f+gκ),  Y = −κ(f−gκ),  κ = (1−k²)/(1+k²),
// q = κ²/4, p = −κ³cos6θ, θ = eccentric angle of any vertex in the frame (GP,GQ).
import assert from 'node:assert/strict';
import {shapeCenter,CERTIFIED_SHAPE_MAPS,CERTIFIED_RAYS,CERTIFIED_EXTENSION_RAYS} from './analytic-hearts.mjs';
import {steinerFrame} from './steiner-hearts.mjs';
import {add,mul,sub,norm} from './geometry.mjs';
export function steinerForm(points,coefficients){
  const F=steinerFrame(points),kap=(1-F.k*F.k)/(1+F.k*F.k),[c,s]=F.cs[0];
  const c3=4*c**3-3*c,s3=3*s-4*s**3,q=kap*kap/4,p=-(kap**3)*(2*c3*c3-1);
  let f,g;if(coefficients.length===6){const [f0,fq,fp,g0,gq,gp]=coefficients;f=f0+fq*q+fp*p;g=g0+gq*q+gp*p;}else{const [f0,fq,g0,gq]=coefficients;f=f0+fq*q;g=g0+gq*q;}
  const X=-kap*(f+g*kap),Y=-kap*(f-g*kap);
  return {point:add(F.g,add(mul(F.e1,X*c3*F.a),mul(F.e2,Y*s3*F.b))),X,Y,kap,c3,s3};
}
let worst=0,n=0,seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647*4-2;
const maps=[[1,0,0,0],[0,0,1,0],[.3,-.7,.2,1.1],[.1,.2,.3,.4,.5,.6],...[...CERTIFIED_SHAPE_MAPS,...CERTIFIED_RAYS,...CERTIFIED_EXTENSION_RAYS].map(m=>m.coefficients)];
for(let t=0;t<200;t++){
  const pts=[[rnd(),rnd()],[rnd(),rnd()],[rnd(),rnd()]];
  for(const m of maps){const a=shapeCenter(pts,m),b=steinerForm(pts,m).point;worst=Math.max(worst,norm(sub(a,b)));n++;}
}
assert.ok(worst<1e-10,'dictionary mismatch '+worst);
console.log(JSON.stringify({passed:true,comparisons:n,maxError:worst}));
