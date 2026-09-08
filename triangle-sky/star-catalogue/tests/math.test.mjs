import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluate,geometry,optimize,objective,V,parse} from '../math.mjs';
const {add,sub,mul,dot,norm}=V,t=[[0,0,0],[21,0,0],[16,12,0]],rows=JSON.parse(fs.readFileSync(new URL('../data/catalogue.json',import.meta.url)));
const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`),pointNear=(a,b,tol=1e-7)=>a.forEach((v,i)=>near(v,b[i],tol));
assert.equal(rows.length,167);assert.equal(rows.filter(r=>r.EffectiveIndexNumeric<=4).length,53);
const g=geometry(t);pointNear(g.sides,[13,20,21]);near(g.area,126);
let es=evaluate('TSZ[1]',t).point;[13,20,21].forEach((d,i)=>near(norm(sub(es,t[i])),d));
let os=evaluate('TSZ[2]',t).point;for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)near(dot(sub(t[i],os),sub(t[j],os)),0);
pointNear(evaluate('TSZ[3]',t).point,mul([...t,es].reduce(add),.25));
assert.throws(()=>parse('TSZ[1]; alert(1)'));assert.ok(evaluate('TSZ[1]',[[0,0,0],[1,0,0],[2,0,0]]).error);
// Proper rotation followed by uniform scaling and translation; all catalogue entries.
const rotate=p=>[p[2],p[0],p[1]],transform=p=>add(mul(rotate(p),2.73),[3,-8,2]);let real=0,complex=0,maxFootError=0;
for(let row of rows){let a=evaluate(row.StarExpression,t),b=evaluate(row.StarExpression,t.map(transform));assert.equal(!!a.error,!!b.error,row.StarExpression);if(a.error){complex++;continue;}real++;pointNear(b.point,transform(a.point),2e-6);near(a.bary.reduce((a,b)=>a+b),1);maxFootError=Math.max(maxFootError,Math.abs(dot(sub(a.foot,t[0]),g.n)));}
assert.ok(real>100);near(maxFootError,0);
const eq=[[0,0,0],[1,0,0],[.5,Math.sqrt(3)/2,0]],regular=[.5,Math.sqrt(3)/6,Math.sqrt(2/3)];
near(objective('O-DGS',eq,regular),0);near(objective('O-NFIS',eq,regular),2/3);near(objective('O-ERS',eq,regular),3);
for(let id of ['IVS','CVS','EVS','DGS','ERS','NFIS']){let r=optimize('O-'+id,eq);assert.ok(r.point,id);pointNear(r.point,regular,3e-6);let a=optimize('O-'+id,t),b=optimize('O-'+id,t.map(transform));pointNear(b.point,transform(a.point),2e-5);}
const slender=[[0,0,0],[13,0,0],[107/13,Math.sqrt(81-(107/13)**2),0]];
assert.ok(evaluate('TSZ[1]',slender).error);assert.ok(evaluate('TSZ[2]',slender).error);
console.log(`Passed: ${rows.length} catalogue entries, ${real} real on 13–20–21, ${complex} unavailable; primitive identities, covariance, degenerate/non-real cases and all six regular optimization stars.`);
