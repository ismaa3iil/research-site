// SPDX-License-Identifier: MIT
// All planar half-planes use n.x >= b. Calculations normalize coordinates.
export const EPS=1e-9;
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const mul=(a,s)=>a.map(v=>v*s);
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const norm=a=>Math.hypot(...a);
export const mean=p=>mul(p.reduce(add,Array(p[0].length).fill(0)),1/p.length);
export const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const cross3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function unique(p,t=EPS){return p.filter((v,i)=>p.findIndex(q=>norm(sub(v,q))<t)===i);}
export function hull(p){p=unique(p).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);if(p.length<3)return p;const half=ps=>{let h=[];for(const x of ps){while(h.length>1&&cross(sub(h.at(-1),h.at(-2)),sub(x,h.at(-1)))<=1e-12)h.pop();h.push(x);}return h;};const a=half(p),b=half([...p].reverse());return a.slice(0,-1).concat(b.slice(0,-1));}
export function area(p){return p.length<3?0:Math.abs(p.reduce((s,v,i)=>s+cross(v,p[(i+1)%p.length]),0))/2;}
export function hp(n,b){let l=norm(n);return l>1e-12?{n:mul(n,1/l),b:b/l}:null;}
export function inside(x,hs,t=EPS){return hs.every(h=>dot(h.n,x)>=h.b-t);}
export function polyHP(p){p=hull(p);if(!p.length)return [];if(p.length===1)return [[1,0],[-1,0],[0,1],[0,-1]].map(n=>hp(n,dot(n,p[0])));if(p.length===2){let d=sub(p[1],p[0]),n=[-d[1],d[0]];return [hp(n,dot(n,p[0])),hp(mul(n,-1),-dot(n,p[0])),hp(d,dot(d,p[0])),hp(mul(d,-1),-dot(d,p[1]))];}return p.map((v,i)=>{let d=sub(p[(i+1)%p.length],v),n=[-d[1],d[0]];return hp(n,dot(n,v));}).filter(Boolean);}
export function clip(p,h){if(!h||!p.length)return p;let out=[];for(let i=0;i<p.length;i++){let a=p[i],b=p[(i+1)%p.length],u=dot(h.n,a)-h.b,v=dot(h.n,b)-h.b;if(u>=-EPS)out.push(a);if((u>EPS&&v< -EPS)||(u< -EPS&&v>EPS)){out.push(add(a,mul(sub(b,a),u/(u-v))));}}return unique(out);}
export const clipAll=(p,hs)=>hs.reduce((q,h)=>clip(q,h),p);
export function meet(h,k){let d=cross(h.n,k.n);return Math.abs(d)<1e-11?null:[(h.b*k.n[1]-k.b*h.n[1])/d,(h.n[0]*k.b-k.n[0]*h.b)/d];}
export function normalize(p){let g=mean(p),s=Math.max(...p.map(v=>norm(sub(v,g))));if(s<1e-13)throw Error('The configuration has collapsed to one point.');return {p:p.map(v=>mul(sub(v,g),1/s)),g,s};}
const partitions=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]];
export function pairPlanes(p){let hs=[],central=null;for(const [a,b] of partitions){let m=mean(a.map(i=>p[i])),q=mean(b.map(i=>p[i])),d=sub(m,q);if(norm(d)<1e-11){central=m;continue;}hs.push(hp(d,Math.min(dot(d,m),dot(d,q))),hp(mul(d,-1),-Math.max(dot(d,m),dot(d,q))));}return {hs,central};}
export function parallelogram(p){let h=hull(p),{hs,central}=pairPlanes(p);return {poly:central?[central]:clipAll(h,hs),hs:[...polyHP(h),...hs],central};}
export function bisectors(p){let hs=[],pairs=[];for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){let u=sub(p[j],p[i]),m=mean([p[i],p[j]]);if(norm(u)<1e-12)continue;let vals=p.filter((_,k)=>k!==i&&k!==j).map(v=>dot(u,sub(v,m)));let signs=vals.every(x=>Math.abs(x)<1e-12)?[-1,1]:vals.every(x=>x>=-1e-12)?[1]:vals.every(x=>x<=1e-12)?[-1]:[];if(signs.length){for(let sign of signs){let n=mul(u,sign);hs.push(hp(n,dot(n,m)));}pairs.push([i,j]);}}return {hs,pairs};}
export function triangle(p){if(area(p)<1e-11)return {poly:hull(p),cp:hull(p),cnt:hull(p),degenerate:true};let cpHS=[],ns=[];let orientation=Math.sign(cross(sub(p[1],p[0]),sub(p[2],p[0])));for(let i=0;i<3;i++){let a=p[i],b=p[(i+1)%3],c=p[(i+2)%3],d=sub(b,a),m=mean([a,b]);let lo=Math.min(dot(d,m),dot(d,c)),hi=Math.max(dot(d,m),dot(d,c));cpHS.push(hp(d,lo),hp(mul(d,-1),-hi));let e=add(m,mul([-d[1],d[0]],orientation*Math.sqrt(3)/2));ns.push(mean([a,b,e]));}let sum=mul(mean(ns),3),cnt=hull(ns.map(n=>sub(sum,mul(n,2))));let cp=clipAll(hull(p),cpHS),poly=cnt.length===1?cnt:clipAll(cp,polyHP(cnt));return {poly,cp,cnt,ns,cpHS,degenerate:false};}
const permutations=p=>p.length===1?[p]:p.flatMap((v,i)=>permutations(p.filter((_,j)=>j!==i)).map(t=>[v,...t]));
export function network(p){let hs=[],skipped=0,scenarios=0;for(let perm of permutations([0,1,2,3]))for(let sign of [-1,1]){let [a,b,c,d]=perm.map(i=>p[i]),edge=sub(b,a);if(norm(edge)<1e-10){skipped++;continue;}let c0=add(mean([a,b]),mul([-edge[1],edge[0]],sign*Math.sqrt(3)/2)),d0=mean([a,b,c0]),u=sub(c,c0),v=sub(d,d0);for(let [target,first,second] of [[[a,b,c,d0],u,v],[[a,b,c0,d],v,u]]){let q=clip(parallelogram(target).poly,hp(first,dot(first,d0)));if(!q.length){skipped++;continue;}let h=hp(second,Math.min(...q.map(x=>dot(second,x))));if(h)hs.push(h);}scenarios++;}let dedup=[];for(let h of hs)if(!dedup.some(k=>norm(sub(h.n,k.n))<1e-8&&Math.abs(h.b-k.b)<1e-8))dedup.push(h);return {hs:dedup,scenarios,skipped};}
export function stable(p,base=hull(p)){let clauses=p.map((pi,i)=>triangle(p.filter((_,j)=>j!==i)).poly.map(q=>hp(sub(pi,q),dot(sub(pi,q),q))));
  // If pi itself is a possible q, its clause is identically true.
  clauses=clauses.filter(c=>!c.includes(null));let lines=[...polyHP(base),...clauses.flat()],points=[...base];for(let i=0;i<lines.length;i++)for(let j=i+1;j<lines.length;j++){let x=meet(lines[i],lines[j]);if(x)points.push(x);}let bh=polyHP(base);return hull(points.filter(x=>inside(x,bh)&&clauses.every(c=>c.some(h=>dot(h.n,x)>=h.b-EPS))));}
export function four(p){let h=hull(p),para=parallelogram(p),bi=bisectors(p),net=network(p),st=stable(p,h);return {hull:h,para,bisector:clipAll(h,bi.hs),bisectorHP:bi.hs,pairs:bi.pairs,network:clipAll(h,net.hs),networkHP:net.hs,scenarios:net.scenarios,skipped:net.skipped,stable:st,triangle:triangle(p.slice(0,3)).poly};}
export function fourCombined(d,on){let q=d.hull;if(on.para)q=d.para.poly;if(on.bisector)q=clipAll(q,d.bisectorHP);if(on.network)q=clipAll(q,d.networkHP);if(on.stable)q=d.stable.length?clipAll(q,polyHP(d.stable)):[];return q;}
// Convex power objective. Newton with backtracking in normalized coordinates.
export function powerCenter(p,exponent){let x=mean(p);if(exponent===2)return {point:x,residual:0,converged:true};const val=q=>p.reduce((s,v)=>s+norm(sub(q,v))**exponent/exponent,0);let converged=false,residual=Infinity;for(let it=0;it<180;it++){let g=[0,0],H=[0,0,0];for(let v of p){let d=sub(x,v),r=Math.max(norm(d),1e-15),w=r**(exponent-2),k=(exponent-2)*w/(r*r);g=add(g,mul(d,w));H[0]+=w+k*d[0]*d[0];H[1]+=k*d[0]*d[1];H[2]+=w+k*d[1]*d[1];}residual=norm(g);if(residual<1e-10){converged=true;break;}let det=H[0]*H[2]-H[1]*H[1];let step=det>1e-24?[(H[2]*g[0]-H[1]*g[1])/det,(H[0]*g[1]-H[1]*g[0])/det]:mul(g,.01);let f=val(x),t=1;while(t>1e-12&&val(sub(x,mul(step,t)))>f-1e-4*t*dot(g,step))t/=2;let next=sub(x,mul(step,t));if(norm(sub(next,x))<1e-13){converged=residual<1e-7;break;}x=next;}return {point:x,residual,converged};}
export function heart(p,count=49){let sides=p.map((_,i)=>norm(sub(p[(i+1)%3],p[(i+2)%3]))),L=sides.reduce((a,b)=>a+b,0);let weighted=w=>p.reduce((s,v,i)=>add(s,mul(v,w[i])),[0,0]);let centers=[{name:'X(1) · incenter',point:weighted(sides.map(a=>a/L))},{name:'X(10) · boundary-wire center',point:weighted(sides.map(a=>(L-a)/(2*L)))},{name:'X(2) · centroid',point:mean(p)}],failed=0;for(let i=0;i<count;i++){let exp=4-2*Math.sqrt(2)+4*Math.sqrt(2)*i/(count-1),r=powerCenter(p,exp);if(r.converged)centers.push({name:`M${exp.toFixed(4)} · power center`,p:exp,...r});else failed++;}let poly=hull(centers.map(c=>c.point)),boundary=centers.filter(c=>poly.some(q=>norm(sub(q,c.point))<EPS));return {centers,poly,boundary,failed};}

// Dimension-independent Newton solver for the convex power objective
//   Phi_p(x) = Sum_i ||x-p_i||^p / p.
// It is used for four planar points and tetrahedra.  The older 2D routine is
// retained above so the original comparison layer remains bit-for-bit stable.
function linearSolve(A,b){
  A=A.map((r,i)=>[...r,b[i]]);const n=b.length;
  for(let k=0;k<n;k++){
    let pivot=k;for(let i=k+1;i<n;i++)if(Math.abs(A[i][k])>Math.abs(A[pivot][k]))pivot=i;
    if(Math.abs(A[pivot][k])<1e-14)return null;
    [A[k],A[pivot]]=[A[pivot],A[k]];
    for(let i=k+1;i<n;i++){let f=A[i][k]/A[k][k];for(let j=k;j<=n;j++)A[i][j]-=f*A[k][j];}
  }
  let x=Array(n).fill(0);for(let i=n-1;i>=0;i--){let s=A[i][n];for(let j=i+1;j<n;j++)s-=A[i][j]*x[j];x[i]=s/A[i][i];}return x;
}
export function powerCenterND(points,exponent){
  const d=points[0].length;let x=mean(points);if(Math.abs(exponent-2)<1e-14)return {point:x,residual:0,converged:true};
  const value=q=>points.reduce((s,v)=>s+norm(sub(q,v))**exponent/exponent,0);
  let residual=Infinity,converged=false;
  for(let it=0;it<240;it++){
    let g=Array(d).fill(0),H=Array.from({length:d},()=>Array(d).fill(0));
    for(const v of points){const z=sub(x,v),r=Math.max(norm(z),1e-14),w=r**(exponent-2),k=(exponent-2)*w/(r*r);for(let i=0;i<d;i++){g[i]+=w*z[i];for(let j=0;j<d;j++)H[i][j]+=w*(i===j?1:0)+k*z[i]*z[j];}}
    residual=norm(g);if(residual<2e-11){converged=true;break;}
    let step=linearSolve(H,g);if(!step)step=mul(g,.02);
    const f=value(x),descent=dot(g,step);let t=1;
    while(t>1e-13&&value(sub(x,mul(step,t)))>f-1e-4*t*descent)t/=2;
    const next=sub(x,mul(step,t));if(norm(sub(next,x))<2e-13){x=next;converged=residual<2e-7;break;}x=next;
  }
  return {point:x,residual,converged};
}

// Incremental convex hull of a small three-dimensional point cloud.  A fixed
// point inside the initial tetrahedron orients every triangular face, avoiding
// the duplicate near-coplanar planes produced by brute-force triple scans.
export function pointCloudHull3(input){
  const points=unique(input,2e-10);if(points.length<4)return {vertices:points,faces:[],volume:0};
  const i0=0;let i1=1;for(let i=2;i<points.length;i++)if(norm(sub(points[i],points[i0]))>norm(sub(points[i1],points[i0])))i1=i;
  const line=sub(points[i1],points[i0]),lineLength=norm(line);if(lineLength<1e-11)return {vertices:[points[i0]],faces:[],volume:0};
  let i2=-1,lineDistance=-1;for(let i=0;i<points.length;i++){if(i===i0||i===i1)continue;const d=norm(cross3(line,sub(points[i],points[i0])))/lineLength;if(d>lineDistance){lineDistance=d;i2=i;}}
  if(lineDistance<2e-10)return {vertices:unique(points,2e-8),faces:[],volume:0};
  let planeNormal=cross3(line,sub(points[i2],points[i0]));planeNormal=mul(planeNormal,1/norm(planeNormal));let i3=-1,planeDistance=-1;
  for(let i=0;i<points.length;i++){if(i===i0||i===i1||i===i2)continue;const d=Math.abs(dot(planeNormal,sub(points[i],points[i0])));if(d>planeDistance){planeDistance=d;i3=i;}}
  if(planeDistance<2e-10)return {vertices:unique(points,2e-8),faces:[],volume:0};
  const initial=[i0,i1,i2,i3],interior=mean(initial.map(i=>points[i]));
  const makeFace=(a,b,c)=>{let n=cross3(sub(points[b],points[a]),sub(points[c],points[a])),L=norm(n);if(L<1e-12)return null;n=mul(n,1/L);let plane=dot(n,points[a]);if(dot(n,interior)>plane){[b,c]=[c,b];n=mul(n,-1);plane=-plane;}return {ids:[a,b,c],n,b:plane};};
  let faces=[[i0,i1,i2],[i0,i3,i1],[i0,i2,i3],[i1,i3,i2]].map(f=>makeFace(...f)).filter(Boolean);
  for(let i=0;i<points.length;i++){
    if(initial.includes(i))continue;const visible=faces.filter(f=>dot(f.n,points[i])-f.b>3e-10);if(!visible.length)continue;
    const edgeMap=new Map();for(const f of visible)for(const [a,b] of [[f.ids[0],f.ids[1]],[f.ids[1],f.ids[2]],[f.ids[2],f.ids[0]]]){const key=a<b?`${a},${b}`:`${b},${a}`;edgeMap.set(key,(edgeMap.get(key)||{a,b,count:0}));edgeMap.get(key).count++;}
    const gone=new Set(visible);faces=faces.filter(f=>!gone.has(f));for(const e of edgeMap.values())if(e.count===1){const f=makeFace(e.a,e.b,i);if(f)faces.push(f);}
  }
  const vertices=unique(faces.flatMap(f=>f.ids.map(i=>points[i])),2e-8),facePoints=faces.map(f=>f.ids.map(i=>points[i]));let volume=0;
  for(const f of facePoints)volume+=Math.abs(dot(sub(f[0],interior),cross3(sub(f[1],interior),sub(f[2],interior))))/6;
  return {vertices,faces:facePoints,volume};
}

export const POWER_MIN=4-2*Math.sqrt(2),POWER_MAX=4+2*Math.sqrt(2);
export function powerHeart(points,count=49){
  let exponents=Array.from({length:Math.max(2,count)},(_,i)=>POWER_MIN+(POWER_MAX-POWER_MIN)*i/(Math.max(2,count)-1));
  if(!exponents.some(p=>Math.abs(p-2)<1e-12))exponents.push(2);exponents.sort((a,b)=>a-b);
  let failed=0,centers=[];
  for(const exponent of exponents){const r=powerCenterND(points,exponent);if(r.converged)centers.push({name:`M${exponent.toFixed(6)} · power center`,p:exponent,...r});else failed++;}
  if(points[0].length===2){const poly=hull(centers.map(c=>c.point));return {centers,poly,boundary:centers.filter(c=>poly.some(q=>norm(sub(q,c.point))<2e-8)),failed};}
  return {centers,...pointCloudHull3(centers.map(c=>c.point)),failed};
}
export function solve3(rows,bs){let [a,b,c]=rows,det=dot(a,cross3(b,c));if(Math.abs(det)<1e-11)return null;return mul(add(add(mul(cross3(b,c),bs[0]),mul(cross3(c,a),bs[1])),mul(cross3(a,b),bs[2])),1/det);}
export function tetraPlanes(p){return p.map((v,i)=>{let f=p.filter((_,j)=>j!==i),n=cross3(sub(f[1],f[0]),sub(f[2],f[0]));if(dot(n,sub(v,f[0]))<0)n=mul(n,-1);return hp(n,dot(n,f[0]));}).filter(Boolean);}
export function polyhedron(hs){let vertices=[];for(let i=0;i<hs.length;i++)for(let j=i+1;j<hs.length;j++)for(let k=j+1;k<hs.length;k++){let h=[hs[i],hs[j],hs[k]],x=solve3(h.map(h=>h.n),h.map(h=>h.b));if(x&&inside(x,hs,1e-8))vertices.push(x);}vertices=unique(vertices,1e-7);if(vertices.length<4)return {vertices,faces:[],volume:0};let faces=[],volume=0,g=mean(vertices);for(let h of hs){let f=vertices.filter(v=>Math.abs(dot(h.n,v)-h.b)<1e-7);if(f.length<3)continue;let center=mean(f),e=mul(sub(f[0],center),1/norm(sub(f[0],center))),v=cross3(h.n,e);f.sort((a,b)=>Math.atan2(dot(sub(a,center),v),dot(sub(a,center),e))-Math.atan2(dot(sub(b,center),v),dot(sub(b,center),e)));if(faces.some(old=>old.length===f.length&&old.every(a=>f.includes(a))))continue;faces.push(f);for(let j=1;j<f.length-1;j++)volume+=Math.abs(dot(sub(f[0],g),cross3(sub(f[j],g),sub(f[j+1],g))))/6;}return {vertices,faces,volume};}
export function tetra(p,on={para:true,bisector:true}){let hs=tetraPlanes(p);if(hs.length<4)return {vertices:[],faces:[],volume:0,degenerate:true};let base=polyhedron(hs),pair=pairPlanes(p),bi=bisectors(p);if(on.para&&pair.central)return {vertices:[pair.central],faces:[],volume:0,base,bisectors:bi.pairs.length};if(on.para)hs.push(...pair.hs);if(on.bisector)hs.push(...bi.hs);return {...polyhedron(hs),base,bisectors:bi.pairs.length};}
