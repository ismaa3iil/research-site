import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../math.mjs';
import {atlasData} from '../worker.mjs';
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} ≠ ${b} (tol ${tol})`);
test('forward sections satisfy the plane, circumconic and side formula',()=>{
  for(const h of [.03,.3,1/Math.SQRT2,1,Math.SQRT2,Math.sqrt(3),3,8])for(const phi of [.2,.7,1.03])for(const fraction of [.1,.45,.8]){
    const mu=fraction*M.muMax(phi),tri=M.section(h,mu,phi),s=M.sides2(tri),d=Math.hypot(1,h*mu);
    tri.forEach((p,i)=>{near(p[2],-h*mu*(p[0]+1),1e-9);const [u,v]=M.plane(h,mu,p);near((1-mu*mu)*u*u/(d*d)+v*v-2*(1+mu)*u/d,0,1e-8);
      const j=(i+1)%3,k=(i+2)%3,tj=(1+mu)/(1-mu*Math.cos(phi+M.TAU*j/3)),tk=(1+mu)/(1-mu*Math.cos(phi+M.TAU*k/3));near(s[i],(1+h*h)*(tj*tj+tk*tk)+(1-2*h*h)*tj*tk,1e-8);});
    near(M.sum(M.angles(M.weights(tri))),Math.PI);
  }
});
test('inverse recovers forward parameters across height regimes',()=>{
  for(const h of [.03,.2,.7,1,Math.SQRT2,Math.sqrt(3),2,4,8])for(const phi of [.25,.6,.95])for(const f of [.2,.5,.8]){
    const mu=f*M.muMax(phi),q=M.weights(M.section(h,mu,phi)),rows=M.inverse(q,h);
    assert.ok(rows.some(r=>Math.abs(r.mu-mu)<2e-4&&Math.abs(r.c-Math.cos(3*phi))<2e-4),JSON.stringify({h,phi,mu,rows}));
  }
});
test('inverse at fixed mu recovers tetrahedral height',()=>{
  for(const h of [.2,.7,Math.SQRT2,2,8])for(const [mu,phi] of [[.65,.4],[1,.9],[1.25,.9]]){
    const q=M.weights(M.section(h,mu,phi)),rows=M.inverseAtMu(q,mu);
    assert.ok(rows.some(r=>Math.abs(r.h-h)<2e-4),JSON.stringify({h,mu,rows}));
  }
});
test('all reconstructed apices obey equal-edge-angle equations',()=>{
  for(const tri of [[[-1,0],[1,0],[.25,1.35]],[[-1,0],[1,0],[0,M.SQ3]],[[-1,0],[1,0],[.35,.35]]])for(const h of [.8,Math.SQRT2,Math.sqrt(3),2.4]){
    const rows=M.apexRows(tri,M.inverse(M.weights(tri),h));
    for(const row of rows){const rays=tri.map(p=>M.sub([...p,0],row.point)),c=(h*h-.5)/(h*h+1);for(let i=0;i<3;i++)near(M.dot(rays[i],rays[(i+1)%3])/(M.norm(rays[i])*M.norm(rays[(i+1)%3])),c,2e-5);}
  }
});
test('equilateral includes one axial and three off-axis parabolic apices at H=3',()=>{
  const tri=[[-1,0],[1,0],[0,M.SQ3]],rows=M.apexRows(tri,M.inverse(M.weights(tri),Math.sqrt(3)));
  assert.equal(rows.length,4);assert.equal(rows.filter(r=>r.type==='Parabolic').length,3);
  const off=rows.filter(r=>r.type==='Parabolic');off.forEach(r=>near(r.point[2],.5));
  assert.ok(off.some(r=>Math.abs(r.point[0]-1.25)<1e-8));
});
test('known roots, singularities, degenerate inputs and permutations',()=>{
  const roots=M.realRoots([1,-4,6,-4,1],0,2);assert.equal(roots.length,1);near(roots[0],1);
  assert.equal(M.transitions.length,12);assert.equal(M.inverse(M.complexWeights(.2,0),1).length,0);
  assert.equal(M.physical(1,0),false);assert.equal(M.physical(1,.9),true);
  const tri=M.section(Math.SQRT2,.65,.4),q=M.weights(tri);for(const perm of M.permutations){const c=M.counts(M.inverse(perm.map(i=>q[i]),Math.SQRT2));assert.deepEqual(c,[1,0,0]);}
  assert.equal(M.planarCount(M.complexWeights(0,M.SQ3)),4);assert.equal(M.planarCount(M.complexWeights(0,.3)),2);
});
test('strand and atlas outputs are finite and classifications are populated',()=>{
  const d=M.strandData([[-1,0],[1,0],[.25,1.35]],72);
  assert.equal(d.branches.length,3);assert.equal(d.parabolic.length,3);assert.ok(d.branches.every(b=>b.length>20));
  assert.ok(d.branches.flat().every(r=>r.point.every(Number.isFinite)));
  for(const metric of ['counts','parabolic','planar','structural','t9']){const a=atlasData({h:Math.SQRT2,metric,resolution:12});assert.ok(a.cells.bary.length>10);assert.ok(a.classes.length>0);}
});
