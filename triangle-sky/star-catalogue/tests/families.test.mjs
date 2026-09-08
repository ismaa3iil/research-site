import assert from 'node:assert/strict';
import {presets,frame,raw,buildFamilies,centers,admissibleEisenstein,eisensteinParameters} from '../families.mjs';
import {V,geometry} from '../math.mjs';
const {sub:S,dot:D,norm:N,cross:X}=V;
const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
let counts={iso:{acute:0,right:0,obtuse:0},scalene:{acute:0,right:0,obtuse:0}},verified=0;
for(let p of presets){let ss=p.sides.slice().sort((a,b)=>a-b),tol=1e-8*ss[2]**2,delta=ss[2]**2-ss[0]**2-ss[1]**2,type=Math.abs(delta)<tol?'right':delta>0?'obtuse':'acute',iso=Math.abs(ss[0]-ss[1])<1e-8||Math.abs(ss[1]-ss[2])<1e-8;counts[iso?'iso':'scalene'][type]++;
 let t=p.triangle,f=frame(t),scene=buildFamilies(t,{powerSheet:true,eisensteinSheet:true,symmetric:true,prekite:true});
 assert.ok(scene.lines.length>=12,p.name);assert.ok(scene.lines.every(l=>l.segments.every(s=>s.every(p=>p.every(Number.isFinite)))));
 for(let family of ['power','eisenstein'])for(let k of [-3,-1,0,.001,.5,1,2,3,5])for(let rho of [.4,.8,1.2,2,4]){let r=raw(f,family,k,rho);if(!r||r.h2<0)continue;let v=f.world([r.x,r.y,Math.sqrt(r.h2)]),ds=t.map(p=>N(S(v,p))/f.g.scale);ds.forEach((d,i)=>near(d,r.r[i]));if(Math.abs(k)<1e-8){near(ds[0]*f.sides[0],ds[1]*f.sides[1]);near(ds[1]*f.sides[1],ds[2]*f.sides[2]);}else if(family==='power'){let sums=ds.map((d,i)=>d**k+f.sides[i]**k);near(sums[0],sums[1],2e-6);near(sums[0],sums[2],2e-6);}else{let {u,m}=eisensteinParameters(f.sides,k),v=(-u[0]+Math.sqrt(4*ds[0]**(2*k)*Math.exp(-2*m)-3*u[0]**2))/2;ds.forEach((d,i)=>near(d**(2*k)*Math.exp(-2*m),v*v+u[i]*v+u[i]**2,2e-6));}verified++;}
 for(let line of scene.lines.filter(l=>l.family==='prekite')){let i=+line.id.at(-1),j=(i+1)%3,edge=N(S(t[i],t[j]));for(let p of line.segments.flat()){near(N(S(p,t[i])),edge);near(N(S(p,t[j])),edge);}}
 for(let s of scene.stars.filter(s=>s.id.startsWith('Regular'))){let v=t.map(p=>S(p,s.point));near(D(v[0],v[1])/(N(v[0])*N(v[1])),.5,3e-5);near(D(v[0],v[2])/(N(v[0])*N(v[2])),.5,3e-5);}
 for(let c of scene.centers)near(D(S(c.point,t[0]),f.g.n),0);if(p.id==='eq'){assert.equal(scene.faces.length,0);assert.ok(scene.notes.some(n=>n.includes('every apex')));}
}
assert.deepEqual(counts,{iso:{acute:3,right:1,obtuse:1},scalene:{acute:6,right:2,obtuse:3}});
const base=presets.find(p=>p.id==='acute1').triangle,f=frame(base),range=admissibleEisenstein(f);near(range[0],-1.2080658561524769,1e-7);near(range[1],3.031828066735777,1e-7);
for(let id of ['X15','X16']){let p=centers(base).find(c=>c.id===id).point,ds=base.map((v,i)=>N(S(v,p))*f.g.sides[i]);near(ds[0],ds[1]);near(ds[1],ds[2]);}
for(let rho of [1,2,3]){let r=raw(f,'power',2,rho);if(r&&r.h2>=0){let p=f.world([r.x,r.y,0]),h=centers(base).find(c=>c.id==='X4').point;near(N(S(p,h)),0);}}
const transform=p=>[3+2.7*p[2],-8+2.7*p[0],2+2.7*p[1]],tilt=frame(base.map(transform));for(let family of ['power','eisenstein'])for(let k of [0,1,2]){let a=raw(f,family,k,1.4),b=raw(tilt,family,k,1.4);if(a&&b){near(a.h2,b.h2);near(a.x,b.x);near(a.y,b.y);}}
console.log(`All 16 preset classifications, ${verified} family-equation samples, prekite arcs, regular-star angles, planar centers, sheet collapse, Eisenstein bounds and tilted-base covariance passed.`);
