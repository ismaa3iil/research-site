// Numerical implementation regression; global proofs remain separate.
import assert from 'node:assert/strict';
import {mean,sub,add,mul,dot,norm,normalize,area,hull,polyHP,inside,triangle} from './geometry.mjs';
import {compute} from './worker.mjs';
import {tetraCovariants,certifiedTetraCenters,modulatedTetraCenters,trianglePullbackCenters} from './tetra-hearts.mjs';
const near=(a,b,t=2e-10)=>assert(Math.abs(a-b)<t,`${a} vs ${b}`);
const vector=(a,b,t)=>a.forEach((x,i)=>near(x,b[i],t));
let seed=18102026;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
// Independent triangle side-length dictionary, including the inserted G slot.
for(let k=0;k<40;k++){
 const P=normalize(Array.from({length:3},()=>[rand()*4-2,rand()*4-2])).p,G=mean(P);
 const a2=P.map((_,i)=>dot(sub(P[(i+1)%3],P[(i+2)%3]),sub(P[(i+1)%3],P[(i+2)%3]))),total=a2.reduce((a,b)=>a+b,0),s=a2.map(a=>a/total),ms=s.reduce((a,b)=>a+b*b,0)/3,q=1.5*s.reduce((a,b)=>a+(b-1/3)**2,0);
 const combination=w=>P.reduce((sum,p,i)=>add(sum,mul(p,w[i])),[0,0]);
 const K=combination(s.map(x=>x-1/3)),HK=combination(s.map(x=>4*(x-1/3)-6*(x*x-ms)));
 const expected={U1:mul(K,-1),K1:mul(sub(K,HK),.5),V2:mul(sub(K,HK),1/6),
   K2:sub(mul(K,(3-4*q)/12),mul(HK,1/6)),V3:sub(mul(K,(25-48*q)/144),mul(HK,1/24))};
 const spatial=[...P,G].map(p=>[...p,0]),actual=tetraCovariants(spatial);
 for(const [key,value] of Object.entries(expected))vector(actual[key],[...value,0]);
 const maps=trianglePullbackCenters(P),cert=certifiedTetraCenters(spatial);
 cert.forEach((c,i)=>vector(maps[i].point,add(G,mul(expected[c.basis],c.numerator/c.denominator))));
 const chest=polyHP(triangle(P).poly);for(const c of maps)assert(inside(c.point,chest,3e-7));
 // Material finite differences, with the centroid recalculated after every motion.
 const v=[.7,-.3],eps=1e-5;
 for(let vertex=0;vertex<3;vertex++){
   const plus=P.map(p=>[...p]),minus=P.map(p=>[...p]);
   plus[vertex]=add(plus[vertex],mul(v,eps));minus[vertex]=sub(minus[vertex],mul(v,eps));
   const a=trianglePullbackCenters(plus),b=trianglePullbackCenters(minus);
   for(let i=0;i<a.length;i++)assert(dot(v,sub(a[i].point,b[i].point))/(2*eps)>-2e-7);
 }
}
// Modulation has zero correction at collinearity, and respects all symmetries.
const line=[[-2,0,0],[0,0,0],[1,0,0],[4,0,0]],G=mean(line);
for(const c of modulatedTetraCenters(line))vector(c.point,G);
const spatial=[[0,0,0],[4,0,0],[1,3,0],[.5,.8,2.5]],base=modulatedTetraCenters(spatial);
const perms=a=>a.length?a.flatMap((x,i)=>perms(a.filter((_,j)=>j!==i)).map(t=>[x,...t])):[[]];
for(const perm of perms([0,1,2,3]))modulatedTetraCenters(perm.map(i=>spatial[i])).forEach((c,i)=>vector(c.point,base[i].point));
const transform=p=>[3-2*p[1],-7+2*p[0],11+2*p[2]];
modulatedTetraCenters(spatial.map(transform)).forEach((c,i)=>vector(c.point,transform(base[i].point)));
for(let k=0;k<40;k++){
 const p=normalize(Array.from({length:4},()=>Array.from({length:3},()=>rand()*4-2))).p,v=[.3,-.7,.4],eps=1e-5;
 for(let vertex=0;vertex<4;vertex++){
   const a=p.map(x=>[...x]),b=p.map(x=>[...x]);a[vertex]=add(a[vertex],mul(v,eps));b[vertex]=sub(b[vertex],mul(v,eps));
   const ca=modulatedTetraCenters(a),cb=modulatedTetraCenters(b);
   for(let i=0;i<ca.length;i++)assert(dot(v,sub(ca[i].point,cb[i].point))/(2*eps)>0);
 }
}
const on={para:true,bisector:true,network:true,edge:true,transfer:true},examples=[
 [[0,0],[21,0],[5,12],[26/3,4]],[[0,0],[4,0],[1,3],[.5,.8]],
 [[0,6],[-1,0],[1,0],[0,2]],[[0,7],[-1,0],[1,0],[0,7/3]],
 [[0,Math.sqrt(3)],[-1,0],[1,0],[0,Math.sqrt(3)/3]],
 [[0,0],[1,0],[2,0],[.4,1]],[[0,0],[0,0],[1,0],[.4,1]]];
const benchmarks=[];
for(const points of examples){
 const {result:d,s}=compute({mode:'four',points,on}),h=d.fourHearts;
 const chest=polyHP(d.combined),inner=polyHP(h.expanded.poly);
 assert(h.expanded.poly.length>0);assert.equal(h.sosPolynomial.centers.length,10);assert.equal(h.modulated.centers.length,2);
 assert.equal(h.diagnostics.attempted,495);assert(h.diagnostics.accepted>0);
 for(const c of h.expanded.centers)assert(inside(c.point,chest,5e-7),c.name+' outside unconditional chest');
 for(const c of d.power.centers)assert(inside(c.point,inner,3e-7));
 assert(area(h.expanded.poly)>=area(d.power.poly)-1e-10);
 const again=compute({mode:'four',points,on:{...on,ball:true}}).result;
 assert.equal(again.fourHearts,h,'Chest toggles reuse the same inner family');
 benchmarks.push({points,heartArea:area(h.expanded.poly)*s*s,oldArea:area(d.power.poly)*s*s,chestArea:area(d.combined)*s*s,failed:h.diagnostics.failed});
}
near(benchmarks[0].chestArea,7.472040159164927,2e-10);
near(100*benchmarks[0].chestArea/126,5.930190602511847,2e-10);
for(const [index,h,lower] of [[2,6,3/4],[3,7,20/21]]){
 const r=compute({mode:'four',points:examples[index],on}),world=r.result.combined.map(p=>add(r.g,mul(p,r.s)));
 near(Math.min(...world.map(p=>p[1])),lower);near(Math.max(...world.map(p=>p[1])),(h*h-1)/(2*h));
}
const t=compute({mode:'triangle',points:[[0,0],[21,0],[5,12]],on:{}}).result;
assert.equal(t.analytic.pullback.centers.length,12);assert.equal(t.analytic.previousExpanded.centers.length,455);
assert(area(t.analytic.expanded.poly)>=area(t.analytic.previousExpanded.poly)-1e-10);
const regular=compute({mode:'four',points:examples[4],on}).result;
assert.equal(regular.fourHearts.expanded.poly.length,1);
console.log(JSON.stringify({passed:true,triangleDictionaries:40,modulatedSpatialShapes:40,planarConfigurations:examples.length,benchmarks,
 scope:'Numerical implementation regression. Global certificates and proofs are linked separately.'},null,2));
