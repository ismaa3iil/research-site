import {heightAtlas} from './height-mesh.mjs';
// MIT. Generalized from the supplied Power-k / Eisenstein Wolfram programs.
import {V,geometry,evaluate,result} from './math.mjs';
import {strandData,apexRows,inverse,weights} from '../../tetrahedral-sections/explorer/math.mjs';
const {add:A,sub:S,mul:M,dot:D,cross:X,norm:N}=V;
export function fromSides(a,b,c){if(Math.min(a,b,c)<=0||a+b<=c||a+c<=b||b+c<=a)throw Error('Triangle inequality');let x=(b*b+c*c-a*a)/(2*c);return [[0,0,0],[c,0,0],[x,Math.sqrt(Math.max(0,b*b-x*x)),0]];}
// Each shape is distinct up to similarity. Side order is a=BC, b=CA, c=AB.
export const presets=[
 ['eq','Isosceles · equilateral',[1,1,1]],['iso1','Isosceles · acute, 50° apex',[2*Math.sin(25*Math.PI/180),1,1]],['iso2','Isosceles · acute, 80° apex',[2*Math.sin(40*Math.PI/180),1,1]],['isor','Isosceles · right',[Math.SQRT2,1,1]],['isoo','Isosceles · obtuse, 120° apex',[Math.sqrt(3),1,1]],
 ['right1','Scalene · right, 3–4–5',[3,4,5]],['right2','Scalene · right, 5–12–13',[5,12,13]],
 ['obtuse1','Scalene · obtuse, 4–5–7',[4,5,7]],['obtuse2','Scalene · obtuse, 6–9–13',[6,9,13]],['obtuse3','Scalene · obtuse, 3–5–7',[3,5,7]],
 ['acute1','Scalene · acute, 13–20–21',[13,20,21]],['acute2','Scalene · acute, 4–5–6',[4,5,6]],['acute3','Scalene · acute, 5–6–7',[5,6,7]],['acute4','Scalene · acute, 6–7–8',[6,7,8]],['acute5','Scalene · acute, 7–8–10',[7,8,10]],['acute6','Scalene · acute, 8–11–12',[8,11,12]]
].map(([id,name,sides])=>({id,name,sides,triangle:fromSides(...sides.map(x=>x*21/Math.max(...sides)))}));
export function frame(t){let g=geometry(t),u=M(S(t[1],t[0]),1/N(S(t[1],t[0]))),v=X(g.n,u),local=t.map(p=>[D(S(p,t[0]),u)/g.scale,D(S(p,t[0]),v)/g.scale]),sides=g.sides.map(x=>x/g.scale);return {t,g,u,v,local,sides,world:p=>A(t[0],M(A(A(M(u,p[0]),M(v,p[1])),M(g.n,p[2])),g.scale))};}
export function trilaterate(f,r){if(r.some(x=>!Number.isFinite(x)||x<=0))return null;let c=f.local[1][0],[cx,cy]=f.local[2],x=(c*c+r[0]**2-r[1]**2)/(2*c),y=(cx*cx+cy*cy+r[0]**2-r[2]**2-2*cx*x)/(2*cy),h2=r[0]**2-x*x-y*y;return Number.isFinite(h2)?{x,y,h2,r}:null;}
export function eisensteinParameters(sides,k){if(Math.abs(k)<1e-9)return null;let logs=sides.map(x=>k*Math.log(x)),m=Math.max(...logs),[a,b,c]=logs.map(x=>Math.exp(x-m)),disc=(a+b+c)*(-a+b+c)*(a-b+c)*(a+b-c);if(disc<=1e-14)return null;let sigma=(a*a+b*b+c*c+Math.sqrt(3*disc))/2,u=[(sigma+b*b+c*c-2*a*a),(sigma+c*c+a*a-2*b*b),(sigma+a*a+b*b-2*c*c)].map(x=>x/(3*Math.sqrt(sigma)));return Math.min(...u)>1e-12?{u,m}:null;}
export function raw(f,family,k,rho,positive=false){if(!(rho>0))return null;let [a,b,c]=f.sides,r=[rho];if(Math.abs(k)<1e-8)r.push(rho*a/b,rho*a/c);else if(family==='power'){
 let powers=f.sides.map(x=>x**k),q=powers.map((x,i)=>(powers[(i+1)%3]+powers[(i+2)%3]-x)/2);if(positive&&(Math.min(...q)<=0||rho**k-q[0]<=0))return null;
 for(let side of [b,c]){let value=Math.expm1(k*Math.log(a/rho))-Math.expm1(k*Math.log(side/rho));if(value<=-1)return null;r.push(rho*Math.exp(Math.log1p(value)/k));}
 }else{let pars=eisensteinParameters(f.sides,k);if(!pars)return null;let {u,m}=pars,rr=Math.exp(2*k*Math.log(rho)-2*m),disc=4*rr-3*u[0]**2;if(disc<=0)return null;let v=(-u[0]+Math.sqrt(disc))/2;if(v<=0)return null;for(let j of [1,2])r.push(Math.exp((m+.5*Math.log(v*v+u[j]*v+u[j]**2))/k));}
 return trilaterate(f,r);}
function point(f,r,clip){if(!r||r.h2< -1e-10)return null;let h=Math.sqrt(Math.max(0,r.h2)),cent=f.local.reduce((s,p)=>[s[0]+p[0]/3,s[1]+p[1]/3],[0,0]);if(h>clip||Math.hypot(r.x-cent[0],r.y-cent[1])>clip)return null;return f.world([r.x,r.y,h]);}
function rhoGrid(f,family,k,n,clip){let lower=0;if(family==='power'&&k>1e-8){let [a,b,c]=f.sides;lower=Math.max(0,b**k-a**k,c**k-a**k)**(1/k);}let max=2*clip+3;if(lower>=max)return [];let lo=Math.log(1e-7),hi=Math.log(max-lower);return Array.from({length:n+1},(_,i)=>lower+Math.exp(lo+(hi-lo)*i/n));}
export function sampleStrand(f,family,k,{samples=400,clip=2.5,positive=false}={}){let grid=rhoGrid(f,family,k,samples,clip),segments=[],segment=[],trace=[];let previous=null;
 for(let rho of grid){let r=raw(f,family,k,rho,positive),p=point(f,r,clip);
  if(previous?.r&&r&&r.h2*previous.r.h2<0){let lo=previous.rho,hi=rho,flo=previous.r.h2,mid,r0;for(let j=0;j<48;j++){mid=(lo+hi)/2;r0=raw(f,family,k,mid,positive);if(!r0)break;if(flo*r0.h2<=0)hi=mid;else{lo=mid;flo=r0.h2;}}if(r0){let root=point(f,{...r0,h2:0},clip);if(root){trace.push(root);if(p)segment.push(root);else segment.push(root);}}}
  if(p&&(!segment.length||N(S(p,segment.at(-1)))<.55*f.g.scale))segment.push(p);else{if(segment.length>1)segments.push(segment);segment=p?[p]:[];}previous={r,rho};
 }if(segment.length>1)segments.push(segment);return {segments,trace};}
export function admissibleEisenstein(f,lo=-3,hi=5){let admissible=k=>Math.abs(k)<1e-8||!!eisensteinParameters(f.sides,k);let boundary=(a,b)=>{for(let i=0;i<55;i++){let m=(a+b)/2;if(admissible(m))a=m;else b=m;}return a;};return [admissible(lo)?lo:boundary(0,lo),admissible(hi)?hi:boundary(0,hi)];}
export function centers(t){let g=geometry(t),f=frame(t),out=[],put=(id,name,p)=>{if(p&&p.every(Number.isFinite)&&N(S(p,t[0]))<1e6*g.scale)out.push({id,name,point:p});},bary=w=>{let s=w.reduce((a,b)=>a+b);return Math.abs(s)>1e-12*Math.max(...w.map(Math.abs))?M(t.map((p,i)=>M(p,w[i])).reduce(A),1/s):null;};
 for(let i=1;i<=4;i++)put('X'+i,['','Incenter','Centroid','Circumcenter','Orthocenter'][i],evaluate(`TSX[${i}]`,t).point);
 let H=evaluate('TSX[4]',t).point;put('X5','Nine-point center',M(A(g.o,H),.5));put('X6','Symmedian point',bary(g.sides.map(a=>a*a)));put('X20','De Longchamps point',S(M(g.o,2),H));
 let ss=f.sides,angles=ss.map((a,i)=>Math.acos(Math.max(-1,Math.min(1,(ss[(i+1)%3]**2+ss[(i+2)%3]**2-a*a)/(2*ss[(i+1)%3]*ss[(i+2)%3])))));
 for(let [id,shift,name,reciprocal]of [['X13',Math.PI/3,'First isogonic center',true],['X14',-Math.PI/3,'Second isogonic center',true],['X15',Math.PI/3,'First isodynamic center',false],['X16',-Math.PI/3,'Second isodynamic center',false]]){let sin=angles.map(a=>Math.sin(a+shift)),w=ss.map((a,i)=>a*(reciprocal?sin[(i+1)%3]*sin[(i+2)%3]:sin[i]));put(id,name,bary(w));}
 let area2=2*g.area/g.scale**2;for(let [id,sgn,name]of [['X175',1,'Isoperimetric point'],['X176',-1,'Equal-detour point']])put(id,name,bary(ss.map((a,i)=>{let b=ss[(i+1)%3],c=ss[(i+2)%3];return (a+b-c)*(a-b+c)*(a*(a-b-c)+sgn*area2);})));return out;
}
function splitPoints(points,maxGap,valid){let result=[],run=[];for(let p of points){if(p&&valid(p)&&(!run.length||N(S(p,run.at(-1)))<maxGap))run.push(p);else{if(run.length>1)result.push(run);run=p&&valid(p)?[p]:[];}}if(run.length>1)result.push(run);return result;}
export function buildFamilies(t,options={}){let o={power:true,eisenstein:false,prekite:false,symmetric:false,powerSheet:false,eisensteinSheet:false,powerK:2,eisensteinK:1,clip:2.5,quality:'balanced',positive:false,...options},f=frame(t),lines=[],faces=[],contours=[],stars=[],notes=[],centerPoints=centers(t),samples=o.quality==='fine'?720:400,nk=o.quality==='fine'?96:56,nr=o.quality==='fine'?240:144,clip=o.clip;
 const addLine=(id,name,family,k,data,emphasis=false)=>lines.push({id,name,family,k,...data,emphasis});
 for(let family of ['power','eisenstein']){let sheet=o[family+'Sheet'];if(!o[family]&&!sheet)continue;let k=family==='power'?o.powerK:o.eisensteinK,range=family==='power'?[-3,5]:admissibleEisenstein(f),ks=sheet?Array.from({length:9},(_,i)=>i-3).filter(x=>x>=range[0]&&x<=range[1]):[];ks.push(k);if(sheet){ks.push(0,1);if(family==='power')ks.push(2);}
  for(let value of [...new Set(ks)].sort((a,b)=>a-b)){let data=sampleStrand(f,family,value,{samples,clip,positive:o.positive}),name=family==='power'?({0:'Isodynamic',1:'Balloon',2:'Orthocentric'}[value]||'Power'):'Eisenstein';if(family==='eisenstein'&&value===1)name='Isogonic';addLine(`${family}-${value}`,`${name} · k = ${Number(value.toFixed(3))}`,family,value,data,Math.abs(k-value)<1e-8);}
  if(family==='eisenstein')notes.push(`Eisenstein positive-base range in [−3,5]: ${range.map(v=>v.toFixed(4)).join(' to ')}; endpoints may be excluded.`);
  if(!sheet)continue;
  let atlas=heightAtlas({raw:(k,r)=>raw(f,family,k,r,o.positive),world:f.world,range,kValues:[...new Set(ks)].filter(k=>k>=range[0]&&k<=range[1]),clip,scale:f.g.scale,centroid:f.local.reduce((a,p)=>a.map((x,i)=>x+p[i]/3),[0,0]),resolution:o.quality==='fine'?96:56,family});
  faces.push(...atlas.faces);contours.push(...atlas.contours.map(c=>({...c,family,h:c.h*f.g.scale})));
  // Replace independently sampled overlays with the exact mesh chart columns.
  for(let line of lines.filter(l=>l.family===family)){let chartLines=atlas.lines.filter(l=>Math.abs(l.k-line.k)<1e-9);line.segments=chartLines.map(l=>l.points);line.branches=chartLines.map(l=>l.branch);}
  notes.push(`${family==='power'?'Power-k':'Eisenstein'}: ${atlas.charts} numbered height graphs; constant-k strands and constant-h contours share the sheet geometry.`);
  if(Math.max(...f.sides)-Math.min(...f.sides)<1e-9)notes.push(`${family==='power'?'Power-k':'Eisenstein'} sheet collapses to the circumcenter's vertical strand for this equilateral base.`);
 }
 const inClip=p=>{let r=result(p,t,f.g);return r.height<=clip*f.g.scale&&N(S(r.foot,M(t.reduce(A),1/3)))<=clip*f.g.scale;};
 if(o.prekite){for(let i=0;i<3;i++){let j=(i+1)%3,mid=M(A(t[i],t[j]),.5),edge=S(t[j],t[i]),u=X(f.g.n,M(edge,1/N(edge))),r=Math.sqrt(3)*N(edge)/2,pts=Array.from({length:181},(_,n)=>{let a=Math.PI*n/180;return A(mid,M(A(M(u,Math.cos(a)),M(f.g.n,Math.sin(a))),r));});addLine('prekite-'+i,`Prekite · equilateral D${'ABC'[i]}${'ABC'[j]}`,'prekite',null,{segments:splitPoints(pts,f.g.scale,inClip),trace:[pts[0],pts.at(-1)]});}if(Math.max(...f.sides)-Math.min(...f.sides)<1e-9)notes.push('ABC is equilateral: every apex is a prekite. The three arcs mark an additional equilateral face.');}
 if(o.symmetric){let tri=f.local.map(p=>p.map(x=>x*21)),d=strandData(tri,o.quality==='fine'?200:110,80),toWorld=p=>f.world(p.map(x=>x/21));d.branches.forEach((b,i)=>addLine('symmetric-'+i,`Symmetrical apex · branch ${i+1}`,'symmetric',null,{segments:splitPoints(b.map(r=>toWorld(r.point)),.7*f.g.scale,inClip),trace:[]}));let q=weights(tri),regular=apexRows(tri,inverse(q,Math.SQRT2));for(let [name,rows]of [['Parabolic',d.parabolic],['Regular',regular]])rows.forEach((r,i)=>{let p=toWorld(r.point);if(inClip(p))stars.push({id:`${name}-${i+1}`,name:`${name} star ${i+1}`,point:p,description:name==='Regular'?'Symmetric cone with h = √2 (equal pairwise apex angles of 60°). The completed tetrahedron need not have six equal edges.':'μ = 1 in the symmetric-apex construction.'});});let os=evaluate('TSZ[2]',t);if(os.point&&inClip(os.point))stars.push({id:'OS',name:'Orthostar',point:os.point,description:'The three edges at D are pairwise perpendicular.'});}
 return {lines,faces,contours,stars,centers:centerPoints,notes,clip};
}
