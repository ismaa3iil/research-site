import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {etcCenter,astValue,sampledRanking,closestSample} from '../src/etc.js';
import {centerPair,norm,sub} from '../src/math.js';
import {etcResponse} from '../src/etc-response.js';
const data=JSON.parse(await readFile(new URL('../data/etc-matches.json',import.meta.url),'utf8'));
test('ETC browser formulas agree with the independently evaluated PITC coordinates',()=>{
  for(const f of data.browser_fixtures){const p=etcCenter(f.X,f.vertices,data.formulas);assert.ok(p,`X(${f.X}) missing`);assert.ok(norm(sub(p,f.center))<2e-9,`X(${f.X}): ${norm(sub(p,f.center))}`);}
});
test('ETC shortlist coordinates commute with vertex relabeling and similarities',()=>{
  const v=[[-1,0],[1,0],[.58,.92]],transform=p=>[3+1.8*(.8*p[0]-.6*p[1]),-7+1.8*(.6*p[0]+.8*p[1])];
  for(const id of [2,15810,52788,40175,25682,54788]){
    const p=etcCenter(id,v,data.formulas),q=etcCenter(id,v.map(transform).reverse(),data.formulas);assert.ok(p&&q);assert.ok(norm(sub(q,transform(p)))<2e-9);
  }
});
test('both power families have the exact X(2) identity at p=2',()=>{
  const v=[[-1,0],[1,0],[.58,.92]],pair=centerPair(v,2),g=etcCenter(2,v,data.formulas);assert.deepEqual(pair.atomic.center,g);assert.deepEqual(pair.hull.center,g);
  const r=sampledRanking(data,2);assert.equal(r.atomic[0].X,2);assert.equal(r.hull[0].X,2);assert.ok(r.atomic[0].training_rms<1e-14);
});
test('33 powers have three scored neighbors per family, without interpolating rankings',()=>{
  assert.equal(data.powers.length,33);assert.equal(sampledRanking(data,7.123),null);assert.equal(closestSample(data,7.123).p,7);
  for(const r of data.powers){assert.ok(r.p>1&&r.p<25);for(const k of ['atomic','hull']){assert.equal(r[k].length,3);for(const c of r[k])assert.ok(Number.isFinite(c.validation_rms)&&c.validation_rms>=0);}}
});
test('singular and unsupported ETC formulas are reported as missing',()=>{
  assert.equal(etcCenter(15810,[[0,0],[1,0],[2,0]],data.formulas),null);
  assert.equal(etcCenter(123456,[[-1,0],[1,0],[0,1]],data.formulas),null);
  assert.ok(Number.isNaN(astValue(['call','Unknown'],{})));
});
test('automatic differentiation agrees with independent centered differences',()=>{
  const v=[[0,0],[1,0],[.41,.72]],step=1e-5;
  for(const id of [2,15810,7934,7911,18236,25682,6554]){
    const r=etcResponse(id,v,data.formulas);assert.ok(r);assert.ok(norm(sub(r.center,etcCenter(id,v,data.formulas)))<1e-10);
    for(let i=0;i<3;i++)for(let k=0;k<2;k++){
      const p=v.map(q=>[...q]),m=v.map(q=>[...q]);p[i][k]+=step;m[i][k]-=step;
      const delta=sub(etcCenter(id,p,data.formulas),etcCenter(id,m,data.formulas));
      for(let j=0;j<2;j++)assert.ok(Math.abs(delta[j]/(2*step)-r.jacobians[i][j][k])<2e-7,`X${id} derivative`);
    }
  }
});
test('centroid response and X(7934) negative algebraic response',()=>{
  const v=[[0,0],[1,0],[.5,.625]],q=41/64;
  const g=etcResponse(2,v,data.formulas);for(const J of g.jacobians)assert.deepEqual(J,[[1/3,0],[0,1/3]]);
  const r=etcResponse(7934,v,data.formulas),exact=(3*q*q-4*q+1)/(7*q*q-2*q+4);
  assert.ok(Math.abs(r.jacobians[2][0][0]-exact)<1e-13);assert.ok(exact<0);
});
test('every certified ETC failure has a negative independently recomputed finite response',()=>{
  const selected=new Set(data.powers.flatMap(q=>[...q.atomic,...q.hull].map(c=>c.X)));
  assert.equal(selected.size,82);let count=0;
  for(const [id,r] of Object.entries(data.attractivity.records)){
    if(!r.witness)continue;const {vertices,vertex,h}=r.witness,after=vertices.map(q=>[...q]);after[vertex]=after[vertex].map((x,k)=>x+h[k]);
    const change=sub(etcCenter(id,after,data.formulas),etcCenter(id,vertices,data.formulas));
    assert.ok(h[0]*change[0]+h[1]*change[1]<0,`X(${id}) finite failure`);assert.ok(r.witness.normalized_dot_upper<0);count++;
  }
  assert.equal(count,34);assert.equal(data.attractivity.selected_status_counts['certified failure'],33);
});
test('positive-coefficient certificates reproduce independently differentiated response entries',async()=>{
  const certificates=JSON.parse(await readFile(new URL('../data/etc-positive-certificates.json',import.meta.url),'utf8'));
  const polynomial=(terms,u,v,w)=>terms.reduce((sum,t)=>sum+Number(t.coefficient)*u**t.powers[0]*v**t.powers[1]*w**t.powers[2],0);
  for(const record of certificates.records){
    assert.ok(record.finite_proper_endpoint_certificate);assert.ok(record.tests.Jyy.passed&&record.tests.determinant.passed);
    for(const key of ['Jyy','determinant','weight_sum_squared'])for(const t of record.tests[key].coefficients)assert.ok(Number(t.coefficient)>0);
    for(const vertices of [[[0,0],[1,0],[.41,.72]],[[0,0],[1,0],[-.23,.19]],[[0,0],[1,0],[.7,1.23]]]){
      const [a,b,c]=vertices.map((_,i)=>norm(sub(vertices[(i+1)%3],vertices[(i+2)%3]))),u=(b+c-a)/2,v=(a+c-b)/2,w=(a+b-c)/2;
      const J=etcResponse(record.X,vertices,data.formulas).jacobians[2],total2=polynomial(record.tests.weight_sum_squared.coefficients,u,v,w),factor=4*a*b*c*c*total2;
      const yy=polynomial(record.tests.Jyy.coefficients,u,v,w)/factor;
      const det=polynomial(record.tests.determinant.coefficients,u,v,w)/(4*c*c*factor*factor),independent=J[0][0]*J[1][1]-((J[0][1]+J[1][0])/2)**2;
      assert.ok(Math.abs(yy-J[1][1])<2e-10,`X${record.X} yy`);assert.ok(Math.abs(det-independent)<2e-10,`X${record.X} determinant`);
    }
  }
  assert.deepEqual(certificates.records.map(q=>q.X).sort((a,b)=>a-b),[18236,56203]);
});
