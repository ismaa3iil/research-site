import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gauss,P_MIN,RANGE_MIN,centroid,centerPair,powerCenter,verifyPair,norm,sub,powerSamples,LIMITS} from '../src/math.js';
const close=(a,b,tolerance=2e-9)=>assert.ok(norm(sub(a,b))<tolerance,`distance ${norm(sub(a,b))}: ${a} vs ${b}`);
const triangle=[[-1,0],[1,0],[.58,.92]],tetra=[[-1,0,0],[1,0,0],[-.3,.9,.75],[.25,.5,-.8]];
test('Gaussian weights integrate moments through degree 2n−1',()=>{
  for(const n of [1,4,12,32]){const {nodes,weights}=gauss(n);for(let k=0;k<2*n;k++)assert.ok(Math.abs(nodes.reduce((s,x,i)=>s+weights[i]*x**k,0)-1/(k+1))<2e-14);}
});
test('both p=2 centers are exactly the vertex centroid, including collapsed shapes',()=>{
  for(const v of [triangle,tetra,[[0,0],[0,0],[3,0]],[[0,0,0],[0,0,0],[0,0,0],[4,0,0]]]){
    const pair=verifyPair(v,2);assert.deepEqual(pair.atomic.center,centroid(v));assert.deepEqual(pair.hull.center,centroid(v));assert.equal(pair.hull.relativeOrderDifference,0);
  }
});
test('regular triangle and tetrahedron centers remain at their symmetry centers',()=>{
  for(const v of [[[-1,0],[1,0],[0,Math.sqrt(3)]],[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]]])for(const p of [P_MIN,1.5,4,8,16,19.95]){
    const pair=verifyPair(v,p,{order:24});for(const kind of ['atomic','hull']){assert.ok(pair[kind].converged);close(pair[kind].center,centroid(v),5e-9);}
  }
});
test('hull centers match independent Python boundary and volume implementations',async()=>{
  const cases=JSON.parse(await readFile(new URL('./reference.json',import.meta.url),'utf8'));
  for(const fixture of cases){const result=verifyPair(fixture.vertices,fixture.p,{order:24});assert.ok(result.hull.converged);close(result.hull.center,fixture.center,fixture.tolerance);}
});
test('centers commute with similarities and vertex permutations',()=>{
  const transform=v=>[7+2.5*(.6*v[0]-.8*v[1]),-3+2.5*(.8*v[0]+.6*v[1])];
  for(const p of [P_MIN,8,21.63]){const first=centerPair(triangle,p),second=centerPair(triangle.map(transform).reverse(),p);for(const kind of ['atomic','hull'])close(second[kind].center,transform(first[kind].center),5e-9);}
});
test('proper centers are in the simplex and report quadrature stability',()=>{
  for(const v of [triangle,tetra])for(const p of [P_MIN,4,12,19.95]){
    const pair=verifyPair(v,p,{order:24});for(const kind of ['atomic','hull']){assert.ok(pair[kind].converged);assert.ok(pair[kind].center.every(Number.isFinite));}
    assert.ok(pair.hull.relativeOrderDifference<3e-7);
  }
});
test('p=4 flat barycentric triangle agrees with its analytic stationarity equation',()=>{
  // With vertices (0,0),(0,0),(3,0), y/3 ~ Beta(1,2), E[y]=1,E[y²]=1.5,E[y³]=2.7.
  const result=powerCenter([[0,0],[0,0],[3,0]],4,{hull:true,order:12});assert.ok(result.converged);const x=result.center[0];assert.ok(Math.abs(x**3-3*x*x+4.5*x-2.7)<2e-10);assert.equal(result.center[1],0);
});
test('coincident shapes and endpoint samples are finite and exact',()=>{
  assert.deepEqual(powerCenter([[2,3],[2,3],[2,3]],21.63,{hull:true}).center,[2,3]);
  for(const mode of ['triangle','tetrahedron']){const powers=powerSamples(mode);assert.equal(powers[0],RANGE_MIN[mode]);assert.equal(powers.at(-1),LIMITS[mode]);assert.ok(powers.includes(2));}
  assert.throws(()=>powerCenter(triangle,1));assert.throws(()=>powerCenter([[0,0],[1,0],[0,NaN]],8));
});
