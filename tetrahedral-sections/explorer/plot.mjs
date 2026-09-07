// Small dependency-free SVG plotting surface, including orthographic 3D rotation.
import {sub,mean,norm} from './math.mjs';
const NS='http://www.w3.org/2000/svg';
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
let sequence=0;
export class Plot{
  constructor(title,range,{project=null,caption=''}={}){this.title=title;this.range=range;this.project=project;this.w=600;this.h=440;this.pad=42;this.parts=[];this.id='clip'+(++sequence);this.caption=caption;}
  xy(p){if(this.project)p=this.project(p);const [xmin,xmax,ymin,ymax]=this.range;
    const scale=Math.min((this.w-2*this.pad)/(xmax-xmin),(this.h-2*this.pad)/(ymax-ymin));
    return [this.w/2+scale*(p[0]-(xmin+xmax)/2),this.h/2-scale*(p[1]-(ymin+ymax)/2)];}
  unxy(x,y){const [a,b,c,d]=this.range,s=Math.min((this.w-2*this.pad)/(b-a),(this.h-2*this.pad)/(d-c));return [(x-this.w/2)/s+(a+b)/2,(this.h/2-y)/s+(c+d)/2];}
  path(points,color='#17233a',width=1.5,dash='',fill='none'){
    let d='',last=null;for(let p of points){if(!p||!p.every(Number.isFinite)){last=null;continue;}const a=this.xy(p);if(!a.every(Number.isFinite)||Math.max(...a.map(Math.abs))>1e6){last=null;continue;}
      d+=(last?'L':'M')+a.map(x=>x.toFixed(3)).join(',');last=a;}
    this.parts.push(`<path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:''}/>`);return this;}
  polygon(points,color,opacity=1){const p=points.map(x=>this.xy(x).map(v=>v.toFixed(3)).join(',')).join(' ');this.parts.push(`<polygon points="${p}" fill="${color}" opacity="${opacity}"/>`);return this;}
  point(p,label='',color='#a54418',radius=4){if(!p||!p.every(Number.isFinite))return this;const [x,y]=this.xy(p);this.parts.push(`<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" stroke="white" stroke-width="1.2"/>`);if(label)this.text(p,label,color,9,-8);return this;}
  text(p,label,color='#536174',dx=0,dy=0){const [x,y]=this.xy(p);this.parts.push(`<text x="${x+dx}" y="${y+dy}" fill="${color}" font-size="14" font-family="system-ui,sans-serif">${esc(label)}</text>`);return this;}
  grid(){const [a,b,c,d]=this.range,span=Math.max(b-a,d-c),step=span>8?2:span>4?1:.5;
    for(let x=Math.ceil(a/step)*step;x<=b;x+=step){this.path([[x,c],[x,d]],'#edf0f4',1);this.text([x,c],Number(x.toFixed(2)),undefined,-8,22);}
    for(let y=Math.ceil(c/step)*step;y<=d;y+=step){this.path([[a,y],[b,y]],'#edf0f4',1);this.text([a,y],Number(y.toFixed(2)),undefined,-30,4);}return this;}
  markup(){return `<svg xmlns="${NS}" viewBox="0 0 ${this.w} ${this.h}" role="img" aria-label="${esc(this.title)}"><title>${esc(this.title)}</title><rect width="600" height="440" fill="white"/><defs><clipPath id="${this.id}"><rect x="8" y="8" width="584" height="424"/></clipPath></defs><g clip-path="url(#${this.id})">${this.parts.join('')}</g></svg>`;}
  element(){const el=document.createElement('section');el.className='panel';el.innerHTML=`<div class="panel-head"><h2>${esc(this.title)}</h2><button type="button" aria-label="Download ${esc(this.title)} as SVG">SVG ↓</button></div>${this.markup()}<p class="caption">${esc(this.caption)}</p>`;
    el.querySelector('button').onclick=()=>download(this.title.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.svg',this.markup(),'image/svg+xml');return el;}
}
export function download(name,content,type='application/json'){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function projector(center,yaw=.55,pitch=.55){return p=>{const [x,y,z]=sub(p,center),u=Math.cos(yaw)*x-Math.sin(yaw)*y,v=Math.sin(yaw)*x+Math.cos(yaw)*y;return [u,Math.cos(pitch)*z-Math.sin(pitch)*v];};}
export function fit(points,factor=1.3){const ps=points.filter(p=>p&&p.every(Number.isFinite));if(!ps.length)return [-2,2,-2,2];const a=[0,1].map(i=>Math.min(...ps.map(p=>p[i]))),b=[0,1].map(i=>Math.max(...ps.map(p=>p[i]))),c=mean([a,b]),r=Math.max(.3,(b[0]-a[0])/2,(b[1]-a[1])/2)*factor;return [c[0]-r,c[0]+r,c[1]-r*.82,c[1]+r*.82];}
