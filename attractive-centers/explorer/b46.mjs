// SPDX-License-Identifier: MIT
import {B46_DATA} from './b46-data.mjs?v=b46-20261001';
import {norm,sub,add,mul,normalize,hull,EPS,powerCenterND,POWER_MIN,POWER_MAX} from './geometry.mjs?v=b46-20261001';

// Exact arithmetic on dyadic side lengths, then on the ordered-side cone.
// These integer polynomials are the freshly audited models, not floating-point
// evaluations of cancellation-prone high-degree source expressions.
function dyadic(value){
  const view=new DataView(new ArrayBuffer(8));view.setFloat64(0,value);
  const bits=view.getBigUint64(0),exponent=Number((bits>>52n)&2047n);
  return {n:(bits&((1n<<52n)-1n))+(exponent?1n<<52n:0n),e:exponent?exponent-1075:-1074};
}
function ratio(n,d){
  if(d===0n)throw Error('B46 denominator vanished; move away from a degenerate triangle.');
  const sign=(n<0n)!==(d<0n)?-1:1;n=n<0n?-n:n;d=d<0n?-d:d;
  if(n===0n)return 0;
  const sn=Math.max(0,n.toString(2).length-53),sd=Math.max(0,d.toString(2).length-53);
  return sign*(Number(n>>BigInt(sn))/Number(d>>BigInt(sd)))*2**(sn-sd);
}
const models=B46_DATA.map(row=>({...row,polys:row.polys.map(poly=>poly.map(([i,j,k,c])=>[i,j,k,BigInt(c)]))}));
const degree=Math.max(...models.flatMap(r=>r.polys.flatMap(p=>p.flatMap(t=>t.slice(0,3)))));

export function b46Weights(sides){
  if(sides.length!==3||sides.some(v=>!Number.isFinite(v)||v<=0))throw Error('B46 needs three positive finite side lengths.');
  const order=[0,1,2].sort((i,j)=>sides[j]-sides[i]);
  const dy=order.map(i=>dyadic(sides[i])),e=Math.min(...dy.map(q=>q.e));
  const [a,b,c]=dy.map(q=>q.n<<BigInt(q.e-e));
  // Doubled x,y,z share a scale: x=(b+c-a)/2,y=a-b,z=b-c.
  const vars=[b+c-a,2n*(a-b),2n*(b-c)];
  if(vars[0]<=0n)throw Error('The triangle is too flat for reliable B46 side lengths.');
  const powers=vars.map(q=>{let out=[1n];for(let i=1;i<=degree;i++)out.push(out.at(-1)*q);return out;});
  const evalPoly=poly=>poly.reduce((sum,[i,j,k,c])=>sum+c*powers[0][i]*powers[1][j]*powers[2][k],0n);
  return models.map(row=>{
    const values=row.polys.map(evalPoly),weights=[0,0,0];
    order.forEach((original,j)=>{weights[original]=ratio(values[j],values[3]);});
    if(weights.some(v=>!Number.isFinite(v)||v< -1e-10)||Math.abs(weights.reduce((s,v)=>s+v,0)-1)>1e-10)
      throw Error(`B46 evaluation could not be resolved: ${row.name}.`);
    return {name:row.name,index:row.index,lambda:row.lambda_,position:row.position,b46Position:row.position,
      necessity:'certified attractive generator; minimum family size unresolved',weights};
  });
}

export function b46Heart(points){
  const sides=points.map((_,i)=>norm(sub(points[(i+1)%3],points[(i+2)%3])));
  let centers=b46Weights(sides).map(row=>({...row,point:[0,1].map(j=>points.reduce((sum,p,i)=>sum+row.weights[i]*p[j],0))}));
  const normalized=normalize(points);
  for(const [tag,p,position] of [['−',POWER_MIN,34],['+',POWER_MAX,35]]){
    const result=powerCenterND(normalized.p,p);
    result.point=add(normalized.g,mul(result.point,normalized.s));
    if(result.converged)centers.push({name:`M${tag} = M(${p.toFixed(8)})`,index:null,lambda:null,
      position,b46Position:position,necessity:'certified power endpoint; numerical minimizer',p,...result});
  }
  centers.sort((a,b)=>a.position-b.position);
  const poly=hull(centers.map(c=>c.point));
  return {centers,poly,boundary:centers.filter(c=>poly.some(p=>norm(sub(p,c.point))<EPS)),failed:46-centers.length};
}
