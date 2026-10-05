/** Numerical mathematics for uniform-barycentric simplex power centers.
 * Copyright 2026 Ismail Hammoudeh. MIT license.
 * Developed with extensive use of ChatGPT. Floating results are not certificates.
 */
export const P_MIN = 4 - 2 * Math.SQRT2;
export const RANGE_MIN = { triangle: 1.01, tetrahedron: P_MIN };
export const LIMITS = { triangle: 24.99, tetrahedron: 19.95 };
export const dot = (a,b) => a.reduce((s,x,i) => s+x*b[i],0);
export const norm = a => Math.hypot(...a);
export const sub = (a,b) => a.map((x,i) => x-b[i]);
export const add = (a,b) => a.map((x,i) => x+b[i]);
export const mul = (a,s) => a.map(x => x*s);
export const centroid = vertices => vertices[0].map((_,i) => vertices.reduce((s,v)=>s+v[i],0)/vertices.length);
export const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const zero = d => Array(d).fill(0);
const matrix = d => Array.from({length:d},()=>zero(d));
const quadrature = new Map();

export function gauss(order) {
  if (quadrature.has(order)) return quadrature.get(order);
  const nodes=Array(order), weights=Array(order);
  for(let i=0;i<Math.ceil(order/2);i++) {
    let z=Math.cos(Math.PI*(i+0.75)/(order+0.5)), derivative;
    for(let k=0;k<30;k++) {
      let p0=1,p1=z;
      for(let j=2;j<=order;j++) { const pn=((2*j-1)*z*p1-(j-1)*p0)/j; p0=p1;p1=pn; }
      derivative=order*(z*p1-p0)/(z*z-1);
      const delta=p1/derivative; z-=delta;
      if(Math.abs(delta)<2e-15) break;
    }
    // Re-evaluate at the final root before constructing the positive weight.
    let p0=1,p1=z;
    for(let j=2;j<=order;j++){const pn=((2*j-1)*z*p1-(j-1)*p0)/j;p0=p1;p1=pn;}
    derivative=order*(z*p1-p0)/(z*z-1);
    const w=1/((1-z*z)*derivative*derivative);
    nodes[i]=(1-z)/2;nodes[order-1-i]=(1+z)/2;
    weights[i]=weights[order-1-i]=w;
  }
  const result={nodes,weights}; quadrature.set(order,result); return result;
}

export function solveLinear(input, rhs) {
  const d=rhs.length, a=input.map((row,i)=>[...row,rhs[i]]);
  const scale=Math.max(...input.flat().map(Math.abs),1e-300);
  for(let k=0;k<d;k++) {
    let pivot=k;
    for(let i=k+1;i<d;i++) if(Math.abs(a[i][k])>Math.abs(a[pivot][k])) pivot=i;
    if(Math.abs(a[pivot][k])<scale*1e-15) return null;
    [a[k],a[pivot]]=[a[pivot],a[k]];
    for(let i=k+1;i<d;i++) {
      const ratio=a[i][k]/a[k][k];
      for(let j=k;j<=d;j++) a[i][j]-=ratio*a[k][j];
    }
  }
  const x=zero(d);
  for(let i=d-1;i>=0;i--) x[i]=(a[i][d]-a[i].slice(i+1,d).reduce((s,v,j)=>s+v*x[i+j+1],0))/a[i][i];
  return x.every(Number.isFinite)?x:null;
}

function normalize(vertices) {
  const d=vertices.length-1;
  if(![2,3].includes(d)||vertices.some(v=>v.length!==d||v.some(x=>!Number.isFinite(x))))
    throw new Error('Use three finite 2D vertices or four finite 3D vertices.');
  const origin=centroid(vertices);
  let scale=0;
  for(let i=0;i<vertices.length;i++) for(let j=0;j<i;j++) scale=Math.max(scale,norm(sub(vertices[i],vertices[j])));
  const v=vertices.map(point=>point.map((x,i)=>(x-origin[i])/(scale||1)));
  let determinant;
  if(d===2) {const a=sub(v[1],v[0]),b=sub(v[2],v[0]); determinant=a[0]*b[1]-a[1]*b[0];}
  else determinant=dot(sub(v[1],v[0]),cross(sub(v[2],v[0]),sub(v[3],v[0])));
  return {d,v,origin,scale,determinant,volume:Math.abs(determinant)/(d===2?2:6)};
}

function barycentrics(v,x) {
  const d=x.length, a=Array.from({length:d},(_,k)=>v.slice(1).map(q=>q[k]-v[0][k]));
  const tail=solveLinear(a,sub(x,v[0]));
  return tail?[1-tail.reduce((s,q)=>s+q,0),...tail]:null;
}

function materialSamples(v,order) {
  const {nodes:n,weights:w}=gauss(order), d=v.length-1, samples=[];
  const push=(lambda,weight)=>samples.push({y:zero(d).map((_,k)=>lambda.reduce((s,l,i)=>s+l*v[i][k],0)),weight});
  for(let i=0;i<order;i++)for(let j=0;j<order;j++) {
    const u=n[i],t=n[j];
    if(d===2)push([1-u,u*(1-t),u*t],2*u*w[i]*w[j]);
    else for(let k=0;k<order;k++)push([1-u,u*(1-t),u*t*(1-n[k]),u*t*n[k]],6*u*u*t*w[i]*w[j]*w[k]);
  }
  return samples;
}

function pointEvaluation(samples,x,p,reference) {
  const d=x.length,g=zero(d),K=matrix(d);let energy=0;
  const ref2=reference*reference,t=p-2;
  for(const {y,weight} of samples) {
    const w=sub(x,y), raw=dot(w,w),r2=Math.max(raw,1e-28), density=weight*Math.pow(r2/ref2,t/2);
    energy+=density*r2/p;
    for(let i=0;i<d;i++) {
      g[i]+=density*w[i];
      for(let j=0;j<d;j++)K[i][j]+=density*((i===j?1:0)+t*w[i]*w[j]/r2);
    }
  }
  return {g,K,energy};
}

function edgePanels(a,b,x,p) {
  if(p>=8||(p>=4&&Math.abs(p/2-Math.round(p/2))<1e-12))return [[0,1]];
  const delta=sub(b,a),length2=dot(delta,delta);
  const projection=Math.max(0,Math.min(1,dot(sub(x,a),delta)/length2));
  const separation=norm(sub(add(a,mul(delta,projection)),x))/Math.sqrt(length2);
  const cuts=[0,1,projection];let width=Math.max(separation,1e-12);
  while(width<2) {for(const q of [projection-width,projection+width])if(q>0&&q<1)cuts.push(q);width*=2;}
  cuts.sort((a,b)=>a-b);
  return cuts.slice(1).map((end,i)=>[cuts[i],end]).filter(([a,b])=>b-a>1e-15);
}

function boundaryEvaluator(shape,order,p) {
  const {v,d,volume,determinant}=shape,{nodes,weights}=gauss(order),faces=[];
  if(d===2) {
    for(const [j,k] of [[0,1],[1,2],[2,0]]) {
      const edge=sub(v[k],v[j]),sign=Math.sign(determinant);
      faces.push({a:v[j],b:v[k],N:[sign*edge[1],-sign*edge[0]]});
    }
  } else {
    for(let i=0;i<4;i++) {
      const [a,b,c]=v.filter((_,j)=>j!==i),N=mul(cross(sub(b,a),sub(c,a)),0.5);
      faces.push({a,b,c,N:dot(N,sub(v[i],a))>0?mul(N,-1):N});
    }
  }
  return (x,reference)=> {
    const g=zero(d),K=matrix(d),ref2=reference*reference,t=p-2;let energy=0;
    for(const face of faces) {
      const {a,b,c,N}=face,moment=zero(d);let radial=0;
      const accumulate=(y,weight)=> {
        const w=sub(y,x),r2=Math.max(dot(w,w),1e-30),density=weight*Math.pow(r2/ref2,t/2);
        radial+=density*r2;
        for(let i=0;i<d;i++)moment[i]+=density*w[i];
      };
      if(d===2) {
        for(const [lo,hi] of edgePanels(a,b,x,p))for(let i=0;i<order;i++) {
          const s=lo+(hi-lo)*nodes[i];accumulate(add(a,mul(sub(b,a),s)),weights[i]*(hi-lo));
        }
      } else for(let i=0;i<order;i++)for(let j=0;j<order;j++) {
        const s=nodes[i],u=nodes[j];
        accumulate(a.map((x,k)=>(1-s)*x+s*(1-u)*b[k]+s*u*c[k]),2*s*weights[i]*weights[j]);
      }
      const height=dot(sub(a,x),N);
      energy+=height*radial/(p*(p+d)*volume);
      for(let i=0;i<d;i++) {
        g[i]-=N[i]*radial/(p*volume);
        for(let j=0;j<d;j++)K[i][j]+=moment[i]*N[j]/volume;
      }
    }
    // Exact boundary matrices are symmetric; average quadrature roundoff.
    for(let i=0;i<d;i++)for(let j=0;j<i;j++)K[i][j]=K[j][i]=(K[i][j]+K[j][i])/2;
    return {g,K,energy};
  };
}

/** Returns a center and meaningful convergence diagnostics. All coordinates
 * are normalized internally to make the stopping rule invariant under scale. */
export function powerCenter(vertices,p,{hull=false,order,guess,tolerance=2e-11,maxIterations=110}={}) {
  if(!Number.isFinite(p)||p<=1||p>100)throw new Error('The numerical solver requires 1 < p <= 100.');
  const shape=normalize(vertices),{d,v,origin,scale}=shape;
  const result=(x,extra)=>({center:x.map((q,i)=>origin[i]+scale*q),...extra});
  if(scale===0||Math.abs(p-2)<1e-13)return {center:[...origin],converged:true,residual:0,iterations:0,method:scale===0?'coincident vertices':'exact centroid',quality:Math.abs(shape.determinant)};
  const proper=Math.abs(shape.determinant)>(d===2?1e-7:2e-6);
  const effectiveOrder=order??(d===2?20:12);
  const useBoundary=hull&&proper;
  const samples=useBoundary?null:hull?materialSamples(v,effectiveOrder):v.map(y=>({y,weight:1/v.length}));
  const evaluate=useBoundary?boundaryEvaluator(shape,effectiveOrder,p):(x,r)=>pointEvaluation(samples,x,p,r);
  let x=guess?guess.map((q,i)=>(q-origin[i])/scale):zero(d);
  if(useBoundary&&(!barycentrics(v,x)||Math.min(...barycentrics(v,x))<=1e-9))x=zero(d);
  // For 1<p<2, quadratic majorization (generalized Weiszfeld) supplies a
  // stable starting point even when the minimizer is extremely near a vertex.
  // A direct Newton start can oscillate there as p approaches one.
  if(!hull&&p<2){
    for(let k=0;k<1500;k++){
      const reference=Math.max(...v.map(q=>norm(sub(q,x))),1e-6);
      const weights=v.map(q=>Math.pow(Math.max(dot(sub(q,x),sub(q,x)),1e-28)/(reference*reference),(p-2)/2));
      const total=weights.reduce((s,q)=>s+q,0),next=zero(d).map((_,i)=>v.reduce((s,q,j)=>s+weights[j]*q[i],0)/total);
      const difference=norm(sub(next,x));x=next;if(difference<Math.max(2e-16,tolerance*1e-4))break;
    }
  }
  let converged=false,residual=Infinity,iterations=0,reason='iteration limit';
  for(let iteration=0;iteration<maxIterations;iteration++) {
    iterations=iteration+1;
    const reference=Math.max(...v.map(q=>norm(sub(q,x))),1e-6),current=evaluate(x,reference);
    let step=solveLinear(current.K,current.g);
    if(!step) {reason='ill-conditioned stiffness';break;}
    residual=norm(step);
    if(residual<tolerance){converged=true;reason='converged';break;}
    const descent=dot(current.g,step);
    let accepted=false;
    for(let alpha=1,k=0;k<48;k++,alpha/=2) {
      const candidate=sub(x,mul(step,alpha));
      if(useBoundary) {const bary=barycentrics(v,candidate);if(!bary||Math.min(...bary)<=1e-14)continue;}
      const trial=evaluate(candidate,reference);
      const roundoff=4e-15*Math.max(1,Math.abs(current.energy));
      if(Number.isFinite(trial.energy)&&(trial.energy<=current.energy-1e-4*alpha*descent+roundoff||norm(trial.g)<norm(current.g))) {
        x=candidate;accepted=true;break;
      }
    }
    if(!accepted){reason='line search unresolved';break;}
  }
  return result(x,{converged,residual,iterations,reason,method:useBoundary?'boundary Gaussian quadrature':hull?'fixed barycentric quadrature':'atomic Newton solve',quality:Math.abs(shape.determinant),order:effectiveOrder});
}

export function centerPair(vertices,p,options={}) {
  const atomic=powerCenter(vertices,p,{...options,hull:false,guess:options.atomicGuess});
  const hull=powerCenter(vertices,p,{...options,hull:true,guess:options.hullGuess});
  return {p,atomic,hull};
}

export function verifyPair(vertices,p,options={}) {
  const pair=centerPair(vertices,p,options), d=vertices.length-1;
  const higher=powerCenter(vertices,p,{hull:true,order:(options.order??(d===2?20:12))+(d===2?12:6),guess:pair.hull.center});
  const longest=Math.max(...vertices.flatMap((v,i)=>vertices.slice(i+1).map(q=>norm(sub(v,q)))),1e-30);
  const difference=norm(sub(higher.center,pair.hull.center));
  if(higher.converged)pair.hull=higher;
  pair.hull.orderDifference=difference;
  pair.hull.relativeOrderDifference=difference/longest;
  pair.hull.checkedConvergence=higher.converged;
  return pair;
}

export function powerSamples(mode,count=65) {
  const first=RANGE_MIN[mode],last=LIMITS[mode];
  const values=Array.from({length:count},(_,i)=>first+(last-first)*i/(count-1));
  for(const p of [P_MIN,2,4,4+2*Math.SQRT2,8,10,12,14,16,18,20,21,21.63,22,24])if(p>=first&&p<last)values.push(p);
  return [...new Set(values)].sort((a,b)=>a-b);
}
