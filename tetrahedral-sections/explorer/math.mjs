/* MIT licensed numerical port. Source equations: RegularTetrahedralSections.wl.
 * All polynomials use ascending coefficients. Browser arithmetic is Float64;
 * repeated roots and limiting configurations are numerical, not certificates.
 */
import {coefficients} from './coefficients.mjs';
export const TAU=2*Math.PI, SQ3=Math.sqrt(3);
export const clamp=(x,a=-1,b=1)=>Math.max(a,Math.min(b,x));
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const mul=(a,t)=>a.map(v=>v*t);
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const norm=a=>Math.hypot(...a);
export const unit=a=>mul(a,1/norm(a));
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const mean=a=>mul(a.reduce(add),1/a.length);
export const sum=a=>a.reduce((s,x)=>s+x,0);
export const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
export const unique=(a,tol=1e-8)=>a.sort((x,y)=>x-y).filter((x,i,b)=>!i||Math.abs(x-b[i-1])>tol*Math.max(1,Math.abs(x)));
export function polyval(c,x){let y=0;for(let i=c.length-1;i>=0;i--)y=y*x+c[i];return y;}
// Rolle isolation includes even-multiplicity candidates at derivative roots.
export function realRoots(c,lo,hi){
  c=c.slice(); while(c.length>1&&c.at(-1)===0)c.pop();
  const scale=Math.max(...c.map(Math.abs)); if(!scale||c.length<2)return [];
  c=c.map(x=>x/scale);
  if(c.length===2){const x=-c[0]/c[1];return x>=lo&&x<=hi?[x]:[];}
  const cuts=[lo,...realRoots(c.slice(1).map((v,i)=>v*(i+1)),lo,hi),hi];
  const roots=[]; const small=x=>Math.abs(polyval(c,x))<2e-13*Math.max(1e-20,polyval(c.map(Math.abs),Math.abs(x)));
  for(const x of cuts)if(small(x))roots.push(x);
  for(let i=1;i<cuts.length;i++){
    let a=cuts[i-1],b=cuts[i],fa=polyval(c,a),fb=polyval(c,b);
    if(fa*fb>=0||small(a)||small(b))continue;
    for(let j=0;j<70;j++){const m=(a+b)/2,fm=polyval(c,m);if(fa*fm<=0){b=m;fb=fm;}else{a=m;fa=fm;}}
    roots.push((a+b)/2);
  }
  return unique(roots,2e-8);
}
export function polynomial(terms,values,index){
  const out=Array(Math.max(...terms.map(t=>t[index+1]))+1).fill(0),correction=out.slice();
  for(const t of terms){let v=t[0];for(let j=0;j<values.length;j++)if(j!==index)v*=values[j]**t[j+1];
    const k=t[index+1],y=v-correction[k],s=out[k]+y;correction[k]=(s-out[k])-y;out[k]=s;}
  return out;
}
export function physical(mu,phi){return Number.isFinite(mu)&&mu>=0&&[0,1,2].every(k=>1-mu*Math.cos(phi+TAU*k/3)>1e-10);}
export const muMax=phi=>1/Math.max(...[0,1,2].map(k=>Math.cos(phi+TAU*k/3)));
export const conicType=mu=>Math.abs(mu-1)<2e-6?'Parabolic':mu<1?'Elliptic':'Hyperbolic';
export function section(h,mu,phi){
  return [0,1,2].map(k=>{const t=phi+TAU*k/3,a=(1+mu)/(1-mu*Math.cos(t));return [a*Math.cos(t),a*Math.sin(t),h*(1-a)];});
}
export const sides2=tri=>[0,1,2].map(i=>dot(sub(tri[(i+1)%3],tri[(i+2)%3]),sub(tri[(i+1)%3],tri[(i+2)%3])));
export const weights=tri=>{const s=sides2(tri);return mul(s,1/sum(s));};
export function angles(q){return q.map((v,i)=>Math.acos(clamp((q[(i+1)%3]+q[(i+2)%3]-v)/(2*Math.sqrt(q[(i+1)%3]*q[(i+2)%3])))));}
export function invariants(q){const v=q.map(x=>x-1/3);return {p:q[0]*q[1]+q[1]*q[2]+q[2]*q[0],r:q[0]*q[1]*q[2],d:dot(v,v)/2,e:v[0]*v[1]*v[2]};}
export const validWeights=q=>q.every(x=>x>0&&Number.isFinite(x))&&4*invariants(q).p-1>1e-11;
export function pair(mu,c,h){const q=weights(section(h,mu,Math.acos(clamp(c))/3));const {p,r}=invariants(q);return [p,r];}
export function centers(h,mu){const d=Math.hypot(1,h*mu);return [(1-h*h*mu)/d,d,d/(1-mu),d*(4+mu)/(4-mu*mu)];}
export const center3=(h,mu,u)=>{const d=Math.hypot(1,h*mu);return [-1+u/d,0,-h*mu*u/d];};
export const plane=(h,mu,p)=>[Math.hypot(1,h*mu)*(p[0]+1),p[1]];
export const complexPoint=q=>[(q[1]-q[0])/q[2],Math.sqrt(Math.max(0,2*(q[0]+q[1])/q[2]-1-((q[1]-q[0])/q[2])**2))];
export const complexWeights=(x,y)=>{const q=[(x-1)**2+y*y,(x+1)**2+y*y,4];return mul(q,1/sum(q));};
export const baryPoint=q=>{const a=angles(q);return [(a[1]-a[0])/Math.PI,SQ3*a[2]/Math.PI];};
export function baryWeights(x,y){const c=y/SQ3,b=(1-c+x)/2,a=1-b-c;if(Math.min(a,b,c)<=0)return null;const q=[a,b,c].map(t=>Math.sin(Math.PI*t)**2);return mul(q,1/sum(q));}
export function recover(q,mu,h){
  if(!(mu>0&&mu<2&&h>=0))return [];
  const {d}=invariants(q),m3=mu**3,co=polynomial(coefficients.recovery,[0,mu*mu,h*h,d],0);
  const target=q.slice().sort((a,b)=>a-b),out=[];
  for(const z of realRoots(co,-m3,m3)){
    const c=clamp(z/m3),phi=Math.acos(c)/3;
    if(!physical(mu,phi))continue;
    const shape=weights(section(h,mu,phi)).sort((a,b)=>a-b),error=Math.max(...shape.map((v,i)=>Math.abs(v-target[i])));
    if(error<2e-6)out.push({mu,h,c,phi,type:conicType(mu),error});
  }
  return out;
}
export function inverse(q,h){
  if(!validWeights(q)||!Number.isFinite(h)||h<0)return [];
  const {d,e}=invariants(q),out=[];
  if(d<1e-24){
    out.push({mu:0,h,c:1,phi:0,type:'Elliptic',error:0});
    if(h*h>2+1e-10)out.push(...recover(q,2/(h*h-1),h));
    return out;
  }
  const co=polynomial(coefficients.core,[0,h*h,d,e],0);
  for(const x of realRoots(co,0,4))if(x>1e-12&&x<4-1e-10)out.push(...recover(q,Math.sqrt(x),h));
  return out.filter((v,i,a)=>!a.slice(0,i).some(w=>Math.abs(v.mu-w.mu)<2e-5&&Math.abs(v.c-w.c)<2e-5));
}
export function inverseAtMu(q,mu,maxH=120){
  if(!validWeights(q)||mu<=0||mu>=2)return [];
  const {d,e}=invariants(q),co=polynomial(coefficients.core,[mu*mu,0,d,e],1),out=[];
  for(const H of realRoots(co,0,maxH*maxH))if(H>1e-12)out.push(...recover(q,mu,Math.sqrt(H)));
  return out.filter((v,i,a)=>!a.slice(0,i).some(w=>Math.abs(v.h-w.h)<2e-5*Math.max(1,v.h)&&Math.abs(v.c-w.c)<2e-5));
}
export function counts(rows){return ['Elliptic','Parabolic','Hyperbolic'].map(t=>rows.filter(r=>r.type===t).length);}
export function conic(h,mu,rho,n=480){
  return Array.from({length:n+1},(_,i)=>{const th=TAU*i/n,den=1-mu*rho*Math.cos(th),prev=1-mu*rho*Math.cos(TAU*(i-1)/n);if(Math.abs(den)<.004||(i&&den*prev<0))return null;const t=(1+mu)/den;return [t*rho*Math.cos(th),t*rho*Math.sin(th),h*(1-t)];});
}
export function critical(h,phi){const H=h*h;return realRoots([4,0,-(1+2*H+4*H*H),-H*(1+2*H)*Math.cos(3*phi)],0,Math.min(2,muMax(phi)*(1-1e-7)));}
export function boundaryCurves(h,n=240){
  const par=[],fold=[];
  for(let i=0;i<=n;i++){const phi=TAU*i/n;
    par.push(physical(1,phi)?weights(section(h,1,phi)):null);
    const r=critical(h,phi);fold.push(r.length?weights(section(h,r[0],phi)):null);
  }return {par,fold};
}
export function barycentric(p,tri){const a=sub(tri[0],tri[2]),b=sub(tri[1],tri[2]),v=sub(p,tri[2]),det=a[0]*b[1]-a[1]*b[0];const x=(v[0]*b[1]-v[1]*b[0])/det,y=(a[0]*v[1]-a[1]*v[0])/det;return [x,y,1-x-y];}
export function weightedPoint(w,tri){const s=sum(w);return !Number.isFinite(s)||Math.abs(s)<1e-12*Math.max(...w.map(Math.abs))?null:tri[0].map((_,j)=>sum(w.map((x,i)=>x*tri[i][j]))/s);}
export function mapPoint(model,target,p,upper=false){
  const u=unit(sub(model[1],model[0])),v=unit(sub(sub(model[2],model[0]),mul(u,dot(sub(model[2],model[0]),u)))),n=cross(u,v);
  const U=unit(sub(target[1],target[0])),V=unit(sub(sub(target[2],target[0]),mul(U,dot(sub(target[2],target[0]),U)))),N=cross(U,V);
  const scale=norm(sub(target[1],target[0]))/norm(sub(model[1],model[0])),d=sub(p,model[0]);
  const answer=add(target[0],mul(add(add(mul(U,dot(d,u)),mul(V,dot(d,v))),mul(N,dot(d,n))),scale));
  if(upper)answer[2]=Math.abs(answer[2]);return answer;
}
export function apexRows(tri,rows){
  const target=tri.map(p=>[...p,0]),qt=weights(target),out=[];
  for(const row of rows){const model=section(row.h,row.mu,row.phi);
    for(const perm of permutations){const m=perm.map(i=>model[i]),qm=weights(m);if(Math.max(...qm.map((v,i)=>Math.abs(v-qt[i])))>2e-6)continue;
      const point=mapPoint(m,target,[0,0,row.h],true);
      if(!point.every(Number.isFinite)||out.some(r=>norm(sub(r.point,point))<2e-5))continue;
      const cc=centers(row.h,row.mu).map(u=>Number.isFinite(u)?mapPoint(m,target,center3(row.h,row.mu,u)):null);cc[0]=[point[0],point[1],0];
      out.push({...row,point,centers:cc,bary:barycentric(point,tri)});
    }
  }return out;
}
export function fermat(tri){const a=angles(weights(tri));if(Math.max(...a)>=2*Math.PI/3-1e-9)return null;return weightedPoint(sides2(tri).map((v,i)=>Math.sqrt(v)/Math.sin(a[i]+Math.PI/3)),tri);}
export function planarCount(q){const a=angles(q),m=Math.max(...a);return m<2*Math.PI/3-1e-8?4:Math.abs(m-2*Math.PI/3)<1e-8?3:2;}
export function parabolicCount(q){
  if(!validWeights(q))return 0;const {p,r,d}=invariants(q);if(d<1e-22)return 1;
  for(let i=0;i<3;i++)if(Math.abs(q[i]-q[(i+1)%3])<1e-9){const a=(q[i]+q[(i+1)%3])/2;return Math.abs(a-(3+Math.sqrt(33))/36)<1e-8||a<=7/30+1e-8?2:3;}
  const g=-7+57*p-120*p*p+16*p**3-108*r+432*p*r-432*r*r;return Math.abs(g)<1e-10?2:g>0?3:2;
}
export const transitions=[.5,5/7,
  ...realRoots([-48,-259,-300,328,608,336,64],.72,.99),1,2,
  ...realRoots([-1,-4,-8,4],2,3),...realRoots([16,-51,-24,16],2,3),
  ...realRoots([64,1249,8815,25931,14237,-98080,-219392,-106496,65536],2,3),3,
  ...realRoots([1,0,-8,-12,4],3,4),2+3*Math.SQRT2/2,(11+Math.sqrt(129))/4].sort((a,b)=>a-b);
export function strandData(tri,samples=120,maxH=120){
  const q=weights(tri);if(!validWeights(q)||Math.abs((tri[1][0]-tri[0][0])*(tri[2][1]-tri[0][1])-(tri[1][1]-tri[0][1])*(tri[2][0]-tri[0][0]))<1e-6)throw Error('Move the vertices apart: the triangle is degenerate.');
  const a=angles(q),g=mean(tri),F=fermat(tri),branches=[];
  for(let i=0;i<3;i++)if(a[i]<2*Math.PI/3+1e-8){const j=(i+1)%3,k=(i+2)%3,dj=norm(sub(tri[i],tri[j])),dk=norm(sub(tri[i],tri[k]));
    const c4=mul(add(tri[i],mul(add(mul(tri[j],dk),mul(tri[k],dj)),1/(dj+dk))),.5);
    branches.push([{mu:2,type:'Hyperbolic',point:[...tri[i],0],centers:[[...tri[i],0],[...tri[i],0],[...tri[i],0],[...c4,0]],h:Math.sqrt(Math.max(0,(1+2*Math.cos(a[i]))/(2*(1-Math.cos(a[i])))))}]);}
  const endRows=F?apexRows(tri,inverse(q,0)):[],fermatRow=endRows.find(row=>norm(sub(row.point,[...F,0]))<1e-5);
  const mus=Array.from({length:samples+1},(_,j)=>1.999-(1.999-.008)*(1-Math.cos(Math.PI*j/samples))/2);
  mus.push(1);if(fermatRow)for(let k=0;k<16;k++)mus.push(fermatRow.mu+.04*2**(-k));
  for(const mu of unique(mus).reverse()){
    const rows=apexRows(tri,inverseAtMu(q,mu,maxH));
    if(rows.length<=branches.length&&rows.length){
      let best=null,score=Infinity;
      for(const perm of permutations){const ids=perm.slice(0,rows.length);if(ids.some(i=>i>=branches.length))continue;
        const s=sum(rows.map((r,k)=>norm(sub(r.point,branches[ids[k]].at(-1).point))));if(s<score){score=s;best=ids;}}
      if(best)rows.forEach((r,k)=>branches[best[k]].push(r));
    }
  }
  if(fermatRow&&branches.length){let bi=0;for(let i=1;i<branches.length;i++)if(norm(sub(branches[i].at(-1).point,fermatRow.point))<norm(sub(branches[bi].at(-1).point,fermatRow.point)))bi=i;branches[bi].push(fermatRow);}
  // The axial equilateral family is additional to its three off-axis strands.
  if(invariants(q).d<1e-24){const scale=Math.sqrt(sides2(tri)[0]/3);branches.push(Array.from({length:60},(_,i)=>({mu:0,h:i*maxH/59,type:'Elliptic',point:[...g,scale*i*maxH/59],centers:Array.from({length:4},()=>[...g,0])})));}
  const parabolic=apexRows(tri,inverseAtMu(q,1,maxH));
  const stars=transitions.map((H,i)=>({label:'T'+(i+1),h:Math.sqrt(H),rows:apexRows(tri,inverse(q,Math.sqrt(H)))}));
  const asymptoteAngles=parabolic.filter(r=>r.centers[1]&&r.centers[3]).map(r=>{const d=sub(r.centers[1],r.centers[3]);return ((Math.atan2(d[1],d[0])+Math.PI)%Math.PI)*180/Math.PI;}).sort((a,b)=>a-b);
  const asymptoteSectors=asymptoteAngles.map((a,i)=>(i===asymptoteAngles.length-1?asymptoteAngles[0]+180:asymptoteAngles[i+1])-a);
  return {tri,q,angles:a,branches,parabolic,stars,fermat:F,centroid:g,asymptoteAngles,asymptoteSectors};
}
export function basicCenters(tri){
  const [a,b,c]=sides2(tri).map(Math.sqrt),q=[a*a,b*b,c*c],ang=angles(q),s=(a+b+c)/2,G=mean(tri);
  const O=weightedPoint(ang.map(x=>Math.sin(2*x)),tri);
  const H=O?sub(mul(G,3),mul(O,2)):null;
  return {I:weightedPoint([a,b,c],tri),G,O,H,N:O&&H?mul(add(O,H),.5):null,K:weightedPoint(q,tri),s,a,b,c,ang};
}
// Kimberling numbering and trilinears: Clark Kimberling's ETC, Part 1.
// Convert trilinears to barycentrics before forming Cartesian points.
export function kimberling(tri){
  const b=basicCenters(tri),side=[b.a,b.b,b.c],ang=b.ang;
  const wp=w=>weightedPoint(w,tri),cyc=f=>side.map((a,i)=>f(a,side[(i+1)%3],side[(i+2)%3],ang[i],ang[(i+1)%3],ang[(i+2)%3]));
  const reciprocal=values=>values.map((v,i)=>side[i]*values[(i+1)%3]*values[(i+2)%3]);
  const sinShift=t=>ang.map(a=>Math.sin(a+t));
  const answer=[b.I,b.G,b.O,b.H,b.N,b.K,
    wp(side.map(a=>1/(b.s-a))),wp(side.map(a=>b.s-a)),wp(side.map(a=>a*(b.s-a))),wp(side.map(a=>2*b.s-a)),
    wp(cyc((a,bb,c,A,B,C)=>a*2*Math.sin((B-C)/2)**2)),wp(cyc((a,bb,c,A,B,C)=>a*(1+Math.cos(B-C)))),
    wp(reciprocal(sinShift(Math.PI/3))),wp(reciprocal(sinShift(-Math.PI/3))),
    wp(sinShift(Math.PI/3).map((x,i)=>side[i]*x)),wp(sinShift(-Math.PI/3).map((x,i)=>side[i]*x)),
    wp(reciprocal(sinShift(Math.PI/6))),wp(reciprocal(sinShift(-Math.PI/6))),
    wp(reciprocal(cyc((a,bb,c)=>bb*bb+c*c-a*a))),b.O&&b.H?sub(mul(b.O,2),b.H):null];
  if(Math.max(...ang)-Math.min(...ang)<1e-10){answer[10]=null;answer[13]=null;answer[15]=null;}
  return answer;
}
export function structural(q){
  const a=angles(q),{p,r}=invariants(q),g=-7+57*p-120*p*p+16*p**3-108*r+432*p*r-432*r*r;
  if(Math.max(...a)>=2*Math.PI/3-1e-8)return 'Φ1';
  if(g<=1e-8)return 'Φ2';
  if(Math.max(...q)>=.5-1e-8)return 'Φ3';
  const t=q.map(x=>1/Math.sqrt((1-2*x)/2)),v=sum(t)**2-2*dot(t,t);return Math.abs(v)<1e-8?'Boundary':v>0?'Φ4':'Φ5';
}
export const examples=[
 ['Scalene acute · paper example',.25,1.35],['Equilateral',0,SQ3],['Isosceles acute',0,1.35],['Isosceles right',0,1],['Isosceles obtuse < 120°',0,.7],['Isosceles 120°',0,1/SQ3],['Isosceles obtuse > 120°',0,.42],['3–4–5 right triangle',.6,.8],['Right triangle, reflected',-.8,.6],['Right at A',-1,1.3],['Right at B',1,.75],['Acute, right leaning',.65,1.1],['Acute, left leaning',-.55,1.35],['Tall scalene',.2,2.8],['Scalene obtuse < 120°',.35,.65],['Scalene 120°',.3,Math.sqrt((5-2*Math.sqrt(4-3*.3**2))/3-.3**2)],['Scalene obtuse > 120°',.35,.35],['Obtuse at A',-1.35,.8],['Obtuse at B',1.4,.75],['Near-degenerate',.45,.16],['Tall, near-isosceles',.05,2.2],['Shallow obtuse',-.55,.45],['Strongly scalene acute',.78,.95],['Strongly scalene obtuse',.75,.5]
];
