import test from 'node:test';import assert from 'node:assert/strict';
import * as M from '../math.mjs';import {renderAtlas,classify,eventCurves,defaultView} from '../atlas-core.mjs';
test('paper regular-cell witnesses retain their E/P/H labels',()=>{
 for(const [xy,label] of [[[.5,.5],'E0 P0 H0'],[[.5,1],'E0 P0 H1'],[[.75,.9],'E1 P0 H0'],[[.1,1.5],'E1 P0 H1'],[[.1,1.45],'E2 P0 H0'],[[.3,1.4],'E2 P0 H1'],[[.3,1.5],'E1 P0 H2'],[[.5,1.3],'E3 P0 H0']])assert.equal(classify(M.complexWeights(...xy),'counts',Math.SQRT2),label);
});
test('adaptive atlas agrees with direct pixel-center classification across both charts',()=>{
 for(const mode of ['bary','complex']){
 const r=renderAtlas({mode,resolution:512}),[a,b,c,d]=r.view;let disagreements=0;
 for(let k=0;k<2000;k++){const i=(k*173+13)%512,j=(k*239+71)%512,x=a+(i+.5)*(b-a)/512,y=d-(j+.5)*(d-c)/512,q=mode==='bary'?M.baryWeights(x,y):M.complexWeights(x,y);if(r.labels[r.pixels[j*512+i]]!==classify(q,'counts',Math.SQRT2))disagreements++;}
 assert.ok(disagreements<=2,`${mode}: ${disagreements}/2000 mismatches`);assert.equal(r.pixels.length,512**2);assert.ok(r.evaluations<=512**2);
 }
});
test('T9 ignores general h, zoom changes domain, and all classifications render',()=>{
 const v=[-.03,.03,1.70,1.76];
 for(const metric of ['t9','parabolic','planar','structural']){
 const r=renderAtlas({mode:'complex',metric,h:.4,resolution:64,view:v});assert.deepEqual(r.view,v);assert.equal(r.h,metric==='t9'?Math.sqrt(3):.4);assert.ok(r.labels.length>1);
 }
 const curves=eventCurves(Math.SQRT2,'bary',120);assert.equal(curves.filter(c=>c.kind==='escape').length,6);assert.ok(curves.filter(c=>c.kind==='escape').every(c=>c.points.some(Boolean)));
 assert.deepEqual(defaultView('bary'),[-1,1,0,Math.sqrt(3)]);
 assert.throws(()=>renderAtlas({resolution:8192}));
});
