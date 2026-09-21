// SPDX-License-Identifier: MIT
import {B41_DATA,B41_META} from './b41-data.mjs';
import {norm,sub,hull,EPS} from './geometry.mjs';
export {B41_META};

// Use exact dyadic side inputs and integer polynomial arithmetic. This avoids
// catastrophic cancellation in high-degree ETC formulas near flat triangles.
function dyadic(value){
  const buf=new ArrayBuffer(8),v=new DataView(buf);v.setFloat64(0,value);
  const bits=v.getBigUint64(0),exponent=Number((bits>>52n)&2047n);
  return {n:(bits&((1n<<52n)-1n))+(exponent?1n<<52n:0n),e:exponent?exponent-1075:-1074};
}
function ratio(n,d){
  if(d===0n)throw Error('B41 denominator vanished at this triangle.');
  const sign=(n<0n)!==(d<0n)?-1:1;n=n<0n?-n:n;d=d<0n?-d:d;
  if(n===0n)return 0;
  const sn=Math.max(0,n.toString(2).length-53),sd=Math.max(0,d.toString(2).length-53);
  return sign*(Number(n>>BigInt(sn))/Number(d>>BigInt(sd)))*2**(sn-sd);
}
const models=B41_DATA.map(row=>({...row,polys:row.polys.map(poly=>poly.map(([i,j,k,c])=>[i,j,k,BigInt(c)]))}));
const degree=Math.max(...models.flatMap(r=>r.polys.flatMap(p=>p.flatMap(t=>t.slice(0,3)))));

export function b41Weights(sides){
  if(sides.length!==3||sides.some(v=>!Number.isFinite(v)||v<=0))throw Error('B41 needs three positive finite side lengths.');
  const dy=sides.map(dyadic),e=Math.min(...dy.map(q=>q.e));
  const [a,b,c]=dy.map(q=>q.n<<BigInt(q.e-e));
  const slack=[b+c-a,c+a-b,a+b-c];
  if(slack.some(q=>q<=0n))throw Error('The triangle is too flat for reliable side lengths. Move a vertex away from the line.');
  const powers=slack.map(q=>{let out=[1n];for(let i=1;i<=degree;i++)out.push(out.at(-1)*q);return out;});
  const evalPoly=poly=>poly.reduce((sum,[i,j,k,c])=>sum+c*powers[0][i]*powers[1][j]*powers[2][k],0n);
  return models.map(row=>{
    const values=row.polys.map(evalPoly),weights=values.slice(0,3).map(n=>ratio(n,values[3]));
    if(weights.some(v=>!Number.isFinite(v)||v< -1e-10)||Math.abs(weights.reduce((s,v)=>s+v,0)-1)>1e-10)
      throw Error(`B41 evaluation could not be resolved: ${row.name}.`);
    return {name:row.name,index:row.index,lambda:row.lambda,position:row.position,necessity:row.necessity,weights};
  });
}

export function b41Heart(points){
  const sides=points.map((_,i)=>norm(sub(points[(i+1)%3],points[(i+2)%3])));
  const centers=b41Weights(sides).map(row=>({...row,point:[0,1].map(j=>points.reduce((sum,p,i)=>sum+row.weights[i]*p[j],0))}));
  const poly=hull(centers.map(c=>c.point));
  return {centers,poly,boundary:centers.filter(c=>poly.some(p=>norm(sub(p,c.point))<EPS)),failed:0};
}
