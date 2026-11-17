// Regression tests for the certified Steiner-frame maps.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {steinerCenter,steinerHearts,steinerFrame} from './steiner-hearts.mjs';
import {STEINER_MAPS,STEINER_NUMERATORS,STEINER_DEGREE,STEINER_P_DEGREE,STEINER_DENOMINATOR} from './steiner-hearts-data.mjs';
import {compute} from './worker.mjs';
import {sub,norm,mean,polyHP,inside,area,normalize} from './geometry.mjs';
const summary=JSON.parse(readFileSync(new URL('./steiner-certified.json',import.meta.url)));
const width=2*(STEINER_DEGREE+1)+2*(STEINER_P_DEGREE+1);
assert.equal(STEINER_MAPS.length,summary.maps.length);
assert.ok(STEINER_NUMERATORS.every(r=>r.length===width&&r.every(Number.isInteger)));
assert.deepEqual(summary.maps.map(m=>m.numerators),STEINER_NUMERATORS);
assert.equal(summary.denominator,STEINER_DENOMINATOR);

// 1. Values agree with the independent Python evaluation.
let worst=0;
for(const {points,values} of summary.reference)STEINER_MAPS.forEach((c,i)=>{worst=Math.max(worst,norm(sub(steinerCenter(points,c),values[i])));});
assert.ok(worst<1e-10,'reference mismatch '+worst);

// 2. Steiner-frame form: Z = G + X cos3θ GP + Y sin3θ GQ with the documented X, Y.
function frameForm(points,c){
  const F=steinerFrame(points),kap=(1-F.k*F.k)/(1+F.k*F.k),[co,si]=F.cs[0],c3=4*co**3-3*co,s3=3*si-4*si**3,q=kap*kap/4,p=-(kap**3)*(2*c3*c3-1);
  const D=STEINER_DEGREE+1,E=STEINER_P_DEGREE+1,poly=(from,n)=>{let s=0;for(let m=n-1;m>=0;m--)s=s*q+c[from+m];return s;};
  const f=poly(0,D)+p*poly(2*D,E),g=poly(D,D)+p*poly(2*D+E,E),X=-kap*(f+g*kap),Y=-kap*(f-g*kap);
  return [F.g[0]+X*c3*F.a*F.e1[0]+Y*s3*F.b*F.e2[0],F.g[1]+X*c3*F.a*F.e1[1]+Y*s3*F.b*F.e2[1]];
}
let seed=11,frameWorst=0;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647*4-2;
const randomTriangles=Array.from({length:60},()=>[[rnd(),rnd()],[rnd(),rnd()],[rnd(),rnd()]]);
for(const t of randomTriangles)for(const c of STEINER_MAPS)frameWorst=Math.max(frameWorst,norm(sub(steinerCenter(t,c),frameForm(t,c))));
assert.ok(frameWorst<1e-9,'Steiner-frame form mismatch '+frameWorst);

// 3. Floating-point spot check of attractivity (the proof is the interval certificate, not this test).
let low=Infinity;
for(const t of randomTriangles.slice(0,25))for(const c of STEINER_MAPS)for(let j=0;j<3;j++){
  const J=[[0,0],[0,0]],d=1e-6;
  for(let k=0;k<2;k++){const a=structuredClone(t),b=structuredClone(t);a[j][k]+=d;b[j][k]-=d;const u=steinerCenter(a,c),v=steinerCenter(b,c);J[0][k]=(u[0]-v[0])/(2*d);J[1][k]=(u[1]-v[1])/(2*d);}
  low=Math.min(low,(J[0][0]+J[1][1])/2-Math.hypot((J[0][0]-J[1][1])/2,(J[0][1]+J[1][0])/2));
}
assert.ok(low>0,'negative sampled response '+low);

// 4. Every certified map lies in the standard chest; the latest heart contains the previous one.
const report=[];
for(const points of [[[0,0],[21,0],[5,12]],[[0,0],[3,0],[-1/3,4*Math.sqrt(14)/3]],[[-1,0],[1,0],[-.7,.5]],[[0,0],[6,0],[-11/3,Math.sqrt(455)/3]]]){
  const r=compute({mode:'triangle',points}).result,chest=polyHP(r.poly);
  for(const c of r.analytic.steiner.centers)assert.ok(inside(c.point,chest,1e-7),'Steiner map outside the chest: '+c.id);
  const latest=polyHP(r.analytic.expanded.poly);
  for(const v of r.analytic.beforeSteiner.poly)assert.ok(inside(v,latest,1e-7));
  report.push({chest:+(100*area(r.poly)/r.baseArea).toFixed(3),previous:+(100*area(r.analytic.beforeSteiner.poly)/r.baseArea).toFixed(3),steinerAlone:+(100*area(r.analytic.steiner.poly)/r.baseArea).toFixed(3),latest:+(100*area(r.analytic.expanded.poly)/r.baseArea).toFixed(3)});
}
// 5. Equilateral triangle: every map returns the centroid.
const eq=[[0,0],[2,0],[1,Math.sqrt(3)]];
for(const c of STEINER_MAPS)assert.ok(norm(sub(steinerCenter(eq,c),mean(eq)))<1e-12);
assert.equal(steinerHearts(normalize(eq).p).poly.length,1);
console.log(JSON.stringify({passed:true,maps:STEINER_MAPS.length,referenceError:worst,frameError:frameWorst,minSampledEigenvalue:low,areasPercent:report}));
