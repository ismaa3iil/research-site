import * as M from './math.mjs';
import {classColor,defaultView,ATLAS_VERSION} from './atlas-core.mjs?v=atlas2';
import {esc,download} from './plot.mjs';
let svgSequence=0;
const colors={par:'#ac7900',fold:'#18283e',escape:'#9563a9'};
const titles={counts:'Physical inverse shapes',t9:'T9 physical inverse shapes',parabolic:'Positive roots of the parabolic-height eliminant',planar:'Planar apex limits (computational model)',structural:'Structural strand classification (computational model)'};
function el(tag,text,cls){const p=document.createElement(tag);if(text)p.textContent=text;if(cls)p.className=cls;return p;}
function btn(text,fn){const b=el('button',text);b.type='button';b.onclick=fn;return b;}
function step(span){const p=10**Math.floor(Math.log10(span/5)),v=span/5/p;return (v>5?10:v>2?5:v>1?2:1)*p;}
function pixelsURL(result){const c=document.createElement('canvas');c.width=c.height=result.resolution;const cx=c.getContext('2d'),im=cx.createImageData(c.width,c.height),rgb=result.labels.map(l=>{const hex=classColor(l);return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16),255];});for(let i=0;i<result.pixels.length;i++)im.data.set(rgb[result.pixels[i]],4*i);cx.putImageData(im,0,0);return c.toDataURL('image/png');}
export function atlasSVG(r,{references=true,events=true}={}){
 const uid='atlas-'+(++svgSequence);
 const W=1080,H=1080,pad=92,[a,b,c,d]=r.view,scale=Math.min((W-2*pad)/(b-a),(H-2*pad-90)/(d-c)),left=(W-scale*(b-a))/2,top=70+(H-2*pad-90-scale*(d-c))/2;
 const xy=([x,y])=>[left+(x-a)*scale,top+(d-y)*scale],width=scale*(b-a),height=scale*(d-c),parts=[];
 const path=(points,color,width=1.6,dash='')=>{let str='',last=null;for(const p of points){if(!p||!p.every(Number.isFinite)){last=null;continue;}const v=xy(p);if(Math.max(...v.map(Math.abs))>1e7){last=null;continue;}if(last&&Math.hypot(v[0]-last[0],v[1]-last[1])>W*2)last=null;str+=(last?'L':'M')+v.map(x=>x.toFixed(3)).join(',');last=v;}parts.push(`<path d="${str}" fill="none" stroke="${color}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:''}/>`);};
 const defs=r.mode==='bary'?`<polygon points="${[[-1,0],[1,0],[0,M.SQ3]].map(p=>xy(p).join(',')).join(' ')}"/>`:`<rect x="${left}" y="${top}" width="${width}" height="${height}"/>`;
 parts.push(`<g clip-path="url(#${uid}-domain)"><image xlink:href="${pixelsURL(r)}" x="${left}" y="${top}" width="${width}" height="${height}" preserveAspectRatio="none"/>`);
 if(events)for(const curve of r.curves)path(curve.points,colors[curve.kind],2,curve.kind==='escape'?'8 5':'');
 if(references){if(r.mode==='bary'){
 const v=[[-1,0],[1,0],[0,M.SQ3]];for(let i=0;i<3;i++)path([v[i],M.mean([v[(i+1)%3],v[(i+2)%3]])],'#89718e',1.1,'5 5');const mid=v.map((_,i)=>M.mean([v[(i+1)%3],v[(i+2)%3]]));path([...mid,mid[0]],'#b66962',1.2,'9 5');
 }else{path([[0,c],[0,d]],'#89718e',1.1,'5 5');for(const x of [-1,1]){path([[x,c],[x,d]],'#b66962',1.1,'9 5');path(Array.from({length:1001},(_,i)=>[x+2*Math.cos(Math.PI*i/1000),2*Math.sin(Math.PI*i/1000)]),'#89718e',1.1,'5 5');}path(Array.from({length:1001},(_,i)=>[Math.cos(Math.PI*i/1000),Math.sin(Math.PI*i/1000)]),'#b66962',1.1,'9 5');}}
 parts.push('</g>');if(r.mode==='bary')path([[-1,0],[1,0],[0,M.SQ3],[-1,0]],'#687b8d',1.4);
 parts.push(`<rect x="${left}" y="${top}" width="${width}" height="${height}" fill="none" stroke="#94a2b1"/>`);
 for(let x=Math.ceil(a/step(b-a))*step(b-a);x<=b+1e-10;x+=step(b-a)){const [px,py]=xy([x,c]);parts.push(`<path d="M${px},${py}v7" stroke="#536174"/><text x="${px}" y="${py+29}" text-anchor="middle">${Number(x.toPrecision(5))}</text>`);}
 for(let y=Math.ceil(c/step(d-c))*step(d-c);y<=d+1e-10;y+=step(d-c)){const [px,py]=xy([a,y]);parts.push(`<path d="M${px},${py}h-7" stroke="#536174"/><text x="${px-12}" y="${py+6}" text-anchor="end">${Number(y.toPrecision(5))}</text>`);}
 parts.push(`<text x="${left+width/2}" y="${top+height+59}" text-anchor="middle">${r.mode==='bary'?'(B − A) / π':'ξ'}</text><text x="${left-66}" y="${top+height/2}" text-anchor="middle" transform="rotate(-90 ${left-66} ${top+height/2})">${r.mode==='bary'?'√3 C / π':'η'}</text>`);
 const labels=r.labels.filter(l=>l!=='Outside');let legend='';labels.forEach((l,i)=>{const x=50+(i%5)*205,y=995+Math.floor(i/5)*28;legend+=`<rect x="${x}" y="${y-14}" width="19" height="16" fill="${classColor(l)}" stroke="#aeb9c5"/><text x="${x+26}" y="${y}">${esc(l)}</text>`;});
 return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1080" height="1080" viewBox="0 0 1080 1080" role="img" aria-label="${esc(titles[r.metric])}"><title>${esc(titles[r.metric])}</title><desc>h=${r.h}; ${r.mode} chart; ${r.resolution} by ${r.resolution} adaptive categorical image; vector boundaries and text. Numerical sampling, not a proof.</desc><rect width="1080" height="1080" fill="white"/><defs><clipPath id="${uid}-viewport"><rect x="${left}" y="${top}" width="${width}" height="${height}"/></clipPath><clipPath id="${uid}-domain">${defs}</clipPath></defs><g font-family="system-ui,sans-serif" font-size="19" fill="#243247"><text x="540" y="32" text-anchor="middle" font-size="23">${esc(titles[r.metric])} · h = ${r.h.toPrecision(7)}</text><g clip-path="url(#${uid}-viewport)">${parts.slice(0,parts.findIndex(v=>v.includes('<rect x=')&&v.includes('fill="none"'))).join('')}</g>${parts.slice(parts.findIndex(v=>v.includes('<rect x=')&&v.includes('fill="none"'))).join('')}${legend}</g></svg>`;
}
export class AtlasExplorer{
 constructor({plots,status,legend,data}){Object.assign(this,{plots,status,legend,data});this.token=0;this.workers=new Map();this.views={};this.results=[];this.options={events:true,references:true};}
 cancel(){this.token++;for(const [worker,reject] of this.workers){worker.terminate();reject(new Error('Cancelled'));}this.workers.clear();}
 calculate(params,token,progress){return new Promise((resolve,reject)=>{if(token!==this.token){reject(new Error('Cancelled'));return;}const w=new Worker(new URL('./worker.mjs?v=atlas2',import.meta.url),{type:'module'});this.workers.set(w,reject);const end=()=>{w.terminate();this.workers.delete(w);};w.onmessage=({data})=>{if(token!==this.token){end();reject(new Error('Cancelled'));return;}if(data.progress!==undefined){progress?.(data.progress);return;}end();data.error?reject(new Error(data.error)):resolve(data.result);};w.onerror=e=>{end();reject(new Error(e.message||'Atlas worker failed'));};w.postMessage({id:token,kind:'atlas-hi',...params});});}
 async render(state,phases=false){
 this.cancel();const token=this.token;this.state={...state};if(this.range!==state.range){this.views={};this.range=state.range;}this.results=[];this.plots.replaceChildren();this.data.replaceChildren();this.legend.textContent='Gold: parabolic divider · dark: physical fold · purple dashed: escape boundary · muted dashed: isosceles/right references. Colors are numerical classifications.';
 this.plots.classList.add('atlas-plots');const Hs=phases?[.25,...M.transitions.slice(0,-1).map((v,i)=>(v+M.transitions[i+1])/2),8]:[(state.metric==='t9'?3:state.h**2)];
 try{for(let k=0;k<Hs.length;k++){
  if(token!==this.token)return;
  if(phases){const title=el('h2',`Phase ${k+1} · H = ${Hs[k].toPrecision(7)} · h = ${Math.sqrt(Hs[k]).toPrecision(7)}`,'atlas-title');this.plots.append(title);}
  for(const mode of ['bary','complex']){
   const panel=el('section',null,'panel atlas-panel');panel.append(el('p','Computing detailed atlas…','caption'));this.plots.append(panel);
   const params={mode,metric:phases?'counts':state.metric,h:Math.sqrt(Hs[k]),resolution:state.resolution,view:this.views[mode]||defaultView(mode,state.range)};
   const r=await this.calculate(params,token,p=>this.status.textContent=`${phases?`Phase ${k+1}/13 · `:''}${mode==='bary'?'Angle-barycentric':'Complex'} atlas · ${state.resolution}² · ${Math.round(100*p)}%`);
   this.results.push(r);this.draw(panel,r,token);
  }
 }
 this.status.textContent=`${phases?'13 phases completed · ':''}${state.resolution} × ${state.resolution} adaptive atlas images · vector event curves · zoom recalculates detail. Numerical shading does not certify tiny cells.`;
 }catch(e){if(token===this.token)this.status.textContent='Atlas could not finish: '+e.message;}
 }
 draw(panel,r,token){
 panel.replaceChildren();const heading=el('div',null,'panel-head');heading.append(el('h2',r.mode==='bary'?'Angle-barycentric triangle space':'Complex triangle space'));panel.append(heading);
 const toolbar=el('div',null,'atlas-toolbar'),image=el('div',null,'atlas-image');image.innerHTML=atlasSVG(r,this.options);panel.append(toolbar,image);
 let busy=false;
 const redraw=async(view,resolution=r.resolution,exportOnly=false)=>{
  if(token!==this.token||busy)return;busy=true;const buttons=panel.querySelectorAll('button');buttons.forEach(b=>b.disabled=true);
  try{const next=await this.calculate({...r,view,resolution,pixels:undefined,curves:undefined},token,p=>this.status.textContent=`${exportOnly?'Preparing 4096-pixel export':'Recomputing zoom'} · ${Math.round(p*100)}%`);
   if(exportOnly)await this.png(next);else{this.views[r.mode]=view;this.results[this.results.indexOf(r)]=next;this.draw(panel,next,token);}
   this.status.textContent=`${resolution}² detail ready · ${next.evaluations.toLocaleString()} physical classifications evaluated. Zoom and export use newly computed data.`;
  }catch(e){if(token===this.token)this.status.textContent=e.message;}finally{busy=false;buttons.forEach(b=>b.disabled=false);}
 };
 const zoom=(factor,center=null)=>{const [a,b,c,d]=r.view,[x,y]=center||[(a+b)/2,(c+d)/2],w=(b-a)*factor/2,h=(d-c)*factor/2;redraw([x-w,x+w,y-h,y+h]);};
 toolbar.append(btn('Zoom +',()=>zoom(.5)),btn('Zoom −',()=>zoom(2)),btn('Reset view',()=>redraw(defaultView(r.mode,this.state.range))),btn('Equilateral detail',()=>redraw(r.mode==='bary'?[-.16,.16,M.SQ3/3-.16,M.SQ3/3+.16]:[-.22,.22,M.SQ3-.22,M.SQ3+.22])),btn('SVG ↓',()=>download(`atlas-${r.mode}-${r.metric}-h${r.h.toFixed(5)}.svg`,atlasSVG(r,this.options),'image/svg+xml')),btn('PNG 4096 ↓',()=>redraw(r.view,4096,true)),btn('Enlarge',()=>{panel.classList.toggle('atlas-enlarged');panel.scrollIntoView({block:'start',behavior:'smooth'});}));
 const svg=image.querySelector('svg');svg.tabIndex=0;svg.setAttribute('aria-label','Atlas: double-click a point to zoom, or use the zoom buttons.');svg.ondblclick=e=>{const matrix=svg.getScreenCTM();if(!matrix)return;const point=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse()),[a,b,c,d]=r.view,scale=Math.min(896/(b-a),806/(d-c)),left=(1080-scale*(b-a))/2,top=70+(806-scale*(d-c))/2;zoom(.5,[a+(point.x-left)/scale,d-(point.y-top)/scale]);};
 panel.append(el('p',`${r.resolution}² adaptive image; ${r.evaluations.toLocaleString()} evaluated points. Double-click a location to zoom there. SVG preserves sharp text and curves with the image embedded; PNG 4096 recomputes the view at 4096².`, 'caption'));
 }
 async png(r){const markup=atlasSVG(r,this.options),url=URL.createObjectURL(new Blob([markup],{type:'image/svg+xml'}));try{const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=4096;canvas.getContext('2d').drawImage(img,0,0,4096,4096);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));download(`atlas-${r.mode}-${r.metric}-h${r.h.toFixed(5)}-4096.png`,blob,'image/png');}finally{URL.revokeObjectURL(url);}}
 exportData(){const summaries=this.results.map(({pixels,curves,...meta})=>({...meta,legend:meta.labels.map(label=>({label,color:classColor(label)}))}));download('atlas-parameters-and-classifications.json',JSON.stringify({version:ATLAS_VERSION,views:summaries,note:'Reproduce from these view parameters using atlas-core.mjs; dense pixel arrays are embedded in image exports.'},null,2));}
}
