// SPDX-License-Identifier: MIT
// Fixed barycentric-anchor weights, never geometry-dependent masses.
// Proof and conservative analytic domains: tetra-hearts-proof.html.
import {add,sub,mul,dot,norm,mean,pointCloudHull3,POWER_MIN,POWER_MAX} from './geometry.mjs?v=b46-20261001';
import {CERTIFIED_TETRA_RAYS} from './tetra-sos-rays-data.mjs?v=tetra-sos-20261017';

const I=()=>[[1,0,0],[0,1,0],[0,0,1]];
const matVec=(A,v)=>A.map(r=>dot(r,v));
const matMul=(A,B)=>A.map(r=>B[0].map((_,j)=>r.reduce((s,x,k)=>s+x*B[k][j],0)));
const trace=A=>A[0][0]+A[1][1]+A[2][2];
function solve(A,b){
  A=A.map((r,i)=>[...r,b[i]]);const scale=Math.max(...A.flatMap(r=>r.slice(0,3).map(Math.abs)));
  for(let k=0;k<3;k++){
    let pivot=k;for(let j=k+1;j<3;j++)if(Math.abs(A[j][k])>Math.abs(A[pivot][k]))pivot=j;
    if(Math.abs(A[pivot][k])<1e-16*scale||!Number.isFinite(scale)||scale===0)return null;
    [A[pivot],A[k]]=[A[k],A[pivot]];
    for(let j=k+1;j<3;j++){let f=A[j][k]/A[k][k];for(let t=k;t<4;t++)A[j][t]-=f*A[k][t];}
  }
  const x=[0,0,0];for(let k=2;k>=0;k--)x[k]=(A[k][3]-A[k].slice(k+1,3).reduce((s,v,j)=>s+v*x[k+1+j],0))/A[k][k];
  return x.every(Number.isFinite)?x:null;
}

export function barycentricAnchors(p){
  if(p.length!==4||p.some(v=>v.length!==3))throw Error('Four 3D vertices required.');
  const edges=[];for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)edges.push(mul(add(p[i],p[j]),.5));
  const faces=p.map((_,i)=>mean(p.filter((_,j)=>j!==i)));
  return {vertices:p,edges,faces,all:[...p,...edges,...faces]};
}

export function tetraCovariants(p){
  const G=mean(p),r=p.map(v=>sub(v,G)),L=r.reduce((s,v)=>s+dot(v,v),0);
  if(!(L>0))return {G,U1:[0,0,0],K1:[0,0,0],K2:[0,0,0],V2:[0,0,0],V3:[0,0,0]};
  const delta=r.map(v=>dot(v,v)/L-.25),U=m=>r.reduce((s,v,i)=>add(s,mul(v,delta[i]**m)),[0,0,0]);
  const S=I().map((row,i)=>row.map((_,j)=>r.reduce((s,v)=>s+v[i]*v[j],0)/L));
  const H=S.map((row,i)=>row.map((v,j)=>v-(i===j?1/3:0))),H2=matMul(H,H);
  const A=H2.map((row,i)=>row.map((v,j)=>v-(i===j?trace(H2)/3+2/9:0)));
  const U1=U(1),U2=U(2),U3=U(3);
  return {G,U1,K1:sub(matVec(S,U1),U1),K2:matVec(A,U1),V2:sub(U2,mul(U1,1/3)),V3:sub(U3,mul(U1,7/36))};
}

export function safeTetraCenters(p){
  const v=tetraCovariants(p),out=[];
  for(const [basis,denominator] of [['U1',16],['K1',28],['K2',32],['V2',24],['V3',16]]){
    for(const sign of [-1,1])out.push({id:`safe-${basis}-${sign}`,name:`G ${sign>0?'+':'−'} ${basis}/${denominator}`,point:add(v.G,mul(v[basis],sign/denominator)),analytic:true,proof:'Conservative global operator-norm certificate; not claimed boundary-sharp.'});
  }
  return out;
}

export function certifiedTetraCenters(p){
  const v=tetraCovariants(p);
  return CERTIFIED_TETRA_RAYS.map(c=>({...c,name:`G ${c.numerator>0?'+':'−'} ${Math.abs(c.numerator)}/${c.denominator} ${c.basis}`,
    point:add(v.G,mul(v[c.basis],c.numerator/c.denominator)),analytic:true,
    proof:'Independently replayed exact global SOS certificate; inward endpoint, not claimed maximal.'}));
}

// Residual-to-root estimate uses a global stiffness lower bound for p>=2,
// or a bound on the segment from the computed point to the true convex-hull
// minimizer for p<2. Floating-point estimates are not interval certificates.
export function weightedPowerCenter(anchors,weights,p){
  if(!(p>1)||anchors.length!==weights.length||weights.some(w=>w<0||!Number.isFinite(w)))throw Error('Invalid fixed positive-mass power problem.');
  const total=weights.reduce((s,w)=>s+w,0);if(!(total>0))throw Error('No anchor mass.');
  const ids=weights.map((w,i)=>w>0?i:-1).filter(i=>i>=0),A=ids.map(i=>anchors[i]),W=ids.map(i=>weights[i]/total);
  let x=A.reduce((s,a,i)=>add(s,mul(a,W[i])),[0,0,0]);
  if(Math.abs(p-2)<1e-14)return {point:x,residual:0,errorEstimate:0,converged:true,iterations:0};
  let diameter=0,muPair=0;
  for(let i=0;i<A.length;i++)for(let j=i+1;j<A.length;j++){
    const d=norm(sub(A[i],A[j]));diameter=Math.max(diameter,d);
    if(p>=2)muPair=Math.max(muPair,Math.min(W[i],W[j])*(d/2)**(p-2));
  }
  if(diameter<1e-15)return {point:x,residual:0,errorEstimate:0,converged:true,iterations:0};
  const value=q=>A.reduce((s,a,i)=>s+W[i]*norm(sub(q,a))**p/p,0);
  const evaluate=q=>{
    const g=[0,0,0],H=I().map(r=>r.map(()=>0));let nearest=Infinity;
    for(let k=0;k<A.length;k++){
      const z=sub(q,A[k]),rr=norm(z);nearest=Math.min(nearest,rr);
      const rg=rr>0?W[k]*rr**(p-2):0,rh=Math.max(rr,diameter*1e-7),wh=W[k]*rh**(p-2);
      for(let i=0;i<3;i++){g[i]+=rg*z[i];for(let j=0;j<3;j++)H[i][j]+=wh*(i===j?1:0)+(p-2)*wh*z[i]*z[j]/(rh*rh);}
    }
    const residual=norm(g),R=Math.max(diameter,...A.map(a=>norm(sub(q,a))));
    const mu=p>=2?muPair:(p-1)*R**(p-2);
    return {g,H,nearest,residual,errorEstimate:mu>0?residual/mu:Infinity};
  };
  let it=0,reason='iteration limit';
  for(;it<140;it++){
    const e=evaluate(x);
    if(e.residual<2e-11&&e.errorEstimate<2e-7){reason='converged';break;}
    let step=solve(e.H,e.g);if(!step||dot(e.g,step)<=0)step=mul(e.g,diameter/Math.max(norm(e.g),1e-30));
    const old=value(x),slope=dot(e.g,step);let t=1,accepted=false,next=x;
    for(let back=0;back<45;back++){
      next=sub(x,mul(step,t));const f=value(next);
      // The roundoff allowance is only used together with a smaller residual.
      if(f<=old-1e-4*t*slope||(Math.abs(f-old)<2e-16*Math.max(1,old)&&evaluate(next).residual<e.residual)){accepted=true;break;}
      t*=.5;
    }
    if(!accepted){reason='line search stalled';break;}
    if(norm(sub(next,x))<1e-15*diameter){x=next;reason='step stagnation';break;}
    x=next;
  }
  const e=evaluate(x),converged=x.every(Number.isFinite)&&e.residual<2e-9&&e.errorEstimate<2e-7;
  return {point:x,residual:e.residual,errorEstimate:e.errorEstimate,converged,iterations:it,reason:converged?'converged':reason};
}

const region=centers=>({centers,...pointCloudHull3(centers.map(c=>c.point))});
export function tetraHearts(p,previousPower,{refine=false}={}){
  const G=mean(p),A=barycentricAnchors(p).all,steps=refine?8:4,pCount=refine?61:31;
  const exponents=Array.from({length:pCount},(_,i)=>POWER_MIN+(POWER_MAX-POWER_MIN)*i/(pCount-1));
  for(const v of [2,4,6])if(!exponents.some(p=>Math.abs(p-v)<1e-12))exponents.push(v);
  exponents.sort((a,b)=>a-b);
  const polynomial=safeTetraCenters(p),sos=certifiedTetraCenters(p),faces=previousPower.centers.map(c=>({name:`Face-only ${c.name}`,point:add(G,mul(sub(c.point,G),-1/3)),p:c.p,analytic:Math.abs(c.p-2)<1e-12||c.p===4||c.p===6}));
  const samples=[],even=[],failures=[];let maxResidual=0,maxErrorEstimate=0;
  for(const exponent of exponents)for(let i=0;i<=steps;i++)for(let j=0;j<=steps-i;j++){
    const wE=i/steps,wF=j/steps,wV=1-wE-wF;
    // Pure vertices and faces are evaluated by the same stricter weighted
    // solver as mixtures. The old baseline is retained independently.
    const W=[...Array(4).fill(wV/4),...Array(6).fill(wE/6),...Array(4).fill(wF/4)];
    const r=weightedPowerCenter(A,W,exponent);
    if(!r.converged){failures.push({p:exponent,wE,wF,residual:r.residual,errorEstimate:r.errorEstimate,reason:r.reason});continue;}
    maxResidual=Math.max(maxResidual,r.residual);maxErrorEstimate=Math.max(maxErrorEstimate,r.errorEstimate);
    const analytic=[2,4,6].some(q=>Math.abs(q-exponent)<1e-12);
    const c={id:`anchor-${exponent}-${i}-${j}`,name:`Anchors p=${exponent.toFixed(5)}; edge mass=${wE}; face mass=${wF}`,point:r.point,p:exponent,wE,wF,analytic,residual:r.residual,errorEstimate:r.errorEstimate};
    samples.push(c);if(analytic)even.push(c);
  }
  const all=[...previousPower.centers,...faces,...samples,...polynomial];
  return {expanded:region([...all,...sos]),conservativeExpanded:region(all),sosPolynomial:region(sos),
    constellation:region([...previousPower.centers,...faces,...samples]),
    polynomial:region(polynomial),analytic:region([...even,...polynomial,...sos]),face:region([...previousPower.centers,...faces]),
    diagnostics:{attempted:exponents.length*(steps+1)*(steps+2)/2,accepted:samples.length,failed:failures.length,
      failures,maxResidual,maxErrorEstimate,exponentSamples:exponents.length,weightSubdivisions:steps,
      numerical:'Finite parameter samples; residual/error estimates use double precision, not directed interval bounds.'}};
}
