// Adaptive categorical atlas. The original physical inverse solver is unchanged.
import * as M from './math.mjs';
export const ATLAS_VERSION='2.0.0';
export function classify(q,metric,h){
 if(!q||!M.validWeights(q))return 'Outside';
 if(metric==='parabolic')return 'P'+M.parabolicCount(q);
 if(metric==='planar')return 'L'+M.planarCount(q);
 if(metric==='structural')return M.structural(q);
 const c=M.counts(M.inverse(q,metric==='t9'?Math.sqrt(3):h));return `E${c[0]} P${c[1]} H${c[2]}`;
}
const palette=['#edf1f6','#bdd6ef','#c2dfcb','#f1d498','#d4bde2','#aacfcf','#e7b7ae','#bac7ef'];
export function classColor(label){
 if(label==='Outside')return '#ffffff';if(label==='Boundary')return '#50566a';
 if(label.startsWith('Φ'))return palette[Number(label.slice(1))%palette.length];
 if(/^[PL]\d+$/.test(label))return palette[Number(label.slice(1))%palette.length];
 const [,e,p,h]=label.match(/E(\d+) P(\d+) H(\d+)/)||[0,0,0,0];
 const key=Number(e)*5+Number(h)+Number(p)*13;
 const fixed={0:'#edf1f6',1:'#b8d7eb',2:'#b4c2e3',5:'#d5e5bc',6:'#a6d5ca',7:'#c5b9df',10:'#f3d997',11:'#e6c1a1',15:'#e5bacd'};
 return fixed[key]||palette[key%palette.length];
}
export function defaultView(mode,range=2.5){return mode==='bary'?[-1,1,0,M.SQ3]:[-range,range,0,range];}
function escapeWeights(H,l){
 const d=16*H*l+2*H+8*l+5;
 const p=(H+1)*(192*H*l*l+48*H*l+3*H+64*l*l+48*l+21)/(3*d*d);
 const r=(H+1)**2*(8*l-3)**2*(32*H*l+8*l+9)/(27*d**3);
 const roots=M.realRoots([-r,p,-1,1],0,1);return roots.length===3&&M.validWeights(roots)?roots:null;
}
export function eventCurves(h,mode,n=1600){
 const map=mode==='bary'?M.baryPoint:M.complexPoint,H=h*h;
 const q=M.boundaryCurves(h,n);q.escape=Array.from({length:n+1},(_,i)=>escapeWeights(H,3*i/(8*n)));
 return Object.entries(q).flatMap(([kind,rows])=>M.permutations.map(perm=>({kind,points:rows.map(q=>q?map(perm.map(i=>q[i])):null)})));
}
function featureIntegral(curves,view,n){
 const bins=Math.ceil(n/4),mask=new Uint8Array(bins*bins),[a,b,c,d]=view;
 for(const curve of curves){let last=null;for(const p of curve.points){
  if(!p||!p.every(Number.isFinite)){last=null;continue;}
  const v=[(p[0]-a)/(b-a)*bins,(d-p[1])/(d-c)*bins];
  if(last){const dx=v[0]-last[0],dy=v[1]-last[1],steps=Math.ceil(Math.max(Math.abs(dx),Math.abs(dy)));
   if(steps<bins*2)for(let i=0;i<=steps;i++){const t=steps?i/steps:0,x=Math.floor(last[0]+t*dx),y=Math.floor(last[1]+t*dy);if(x>=0&&x<bins&&y>=0&&y<bins)mask[y*bins+x]=1;}
  }last=v;
 }}
 const stride=bins+1,integral=new Uint32Array(stride*stride);
 for(let y=0;y<bins;y++)for(let x=0,row=0;x<bins;x++){row+=mask[y*bins+x];integral[(y+1)*stride+x+1]=integral[y*stride+x+1]+row;}
 return (x,y,w,h)=>{const a=Math.max(0,Math.floor(x/4)),b=Math.min(bins,Math.ceil((x+w)/4)),c=Math.max(0,Math.floor(y/4)),d=Math.min(bins,Math.ceil((y+h)/4));return integral[d*stride+b]-integral[c*stride+b]-integral[d*stride+a]+integral[c*stride+a]>0;};
}
export function renderAtlas({mode='bary',metric='counts',h=Math.SQRT2,resolution=1024,view=defaultView(mode),progress=()=>{}}){
 if(!['bary','complex'].includes(mode)||!Number.isInteger(resolution)||resolution<64||resolution>4096||!view.every(Number.isFinite)||view[1]<=view[0]||view[3]<=view[2])throw Error('Invalid atlas view or resolution.');
 const effectiveH=metric==='t9'?Math.sqrt(3):h;if(!(effectiveH>0))throw Error('Height must be positive.');
 const started=performance.now(),n=resolution,pixels=new Uint8Array(n*n),labels=['Outside'],ids=new Map([['Outside',0]]),cache=new Map();let evaluations=0;
 const curves=['counts','t9'].includes(metric)?eventCurves(effectiveH,mode,Math.max(1600,n)):[],nearEvent=featureIntegral(curves,view,n);
 const [a,b,c,d]=view,at=(ix,iy)=>{
  const key=iy*n+ix;if(cache.has(key))return cache.get(key);
  const x=a+(ix+.5)*(b-a)/n,y=d-(iy+.5)*(d-c)/n,q=mode==='bary'?M.baryWeights(x,y):M.complexWeights(x,y),label=classify(q,metric,effectiveH);
  if(!ids.has(label)){ids.set(label,labels.length);labels.push(label);}const id=ids.get(label);cache.set(key,id);evaluations++;return id;
 };
 function tile(x,y,w,h){
  if(w===1&&h===1){pixels[y*n+x]=at(x,y);return;}
  const xs=[x,x+Math.floor((w-1)/2),x+w-1],ys=[y,y+Math.floor((h-1)/2),y+h-1];
  const samples=ys.flatMap(j=>xs.map(i=>at(i,j))),same=samples.every(v=>v===samples[0]);
  if(same&&!nearEvent(x,y,w,h)){for(let j=y;j<y+h;j++)pixels.fill(samples[0],j*n+x,j*n+x+w);return;}
  const wl=Math.max(1,Math.floor(w/2)),hl=Math.max(1,Math.floor(h/2));
  tile(x,y,wl,hl);if(w>wl)tile(x+wl,y,w-wl,hl);if(h>hl)tile(x,y+hl,wl,h-hl);if(w>wl&&h>hl)tile(x+wl,y+hl,w-wl,h-hl);
 }
 // A 128-cell baseline plus nine tests per tile avoids a coarse single-center fill.
 const block=Math.max(1,Math.floor(n/128));
 for(let y=0;y<n;y+=block){for(let x=0;x<n;x+=block)tile(x,y,Math.min(block,n-x),Math.min(block,n-y));progress(Math.min(1,(y+block)/n));}
 return {version:ATLAS_VERSION,mode,metric,h:effectiveH,resolution:n,view,pixels,labels,curves,evaluations,seconds:(performance.now()-started)/1000,method:'Adaptive categorical sampling with event-curve refinement; not an exact cell certificate'};
}
