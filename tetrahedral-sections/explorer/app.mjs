import * as M from './math.mjs';
import {Plot,projector,fit,download,esc} from './plot.mjs';
const $=s=>document.querySelector(s),controls=$('#controls'),plots=$('#plots'),status=$('#status'),legend=$('#legend'),dataEl=$('#data');
const colors={phi:'#3679bb',alpha:'#b55687',par:'#c19700',fold:'#17233a',C1:'#2475b0',C2:'#a43f29',C3:'#7e46a2',C4:'#2a855c',E:'#17233a',H:'#d13f3f'};
const state={tab:'sections',h:Math.SQRT2,alpha:.55,phi:.45,range:2.5,samples:240,porism:true,porismStep:15,euler:false,steiner:false,kiepert:false,kimberling:false,isosceles:true,right:true,regions:false,views:[true,true,true,true],tri:[[-1,0],[1,0],[.25,1.35]],strandSamples:144,maxH:120,radius:1.3,showCenters:[true,true,true,true],showTransitionCenters:[true,false,false,false],showParabolic:true,showTransitions:true,showLabels:true,showEdges:false,metric:'counts',resolution:40,yaw:.55,pitch:.55};
let cachedStrands=null,strandKey='',cachedBoundary=null,boundaryH=-1,cachedRegion=null,regionKey='',lastAtlas=null,job=0,worker=null;
function request(kind,extra,done){
  if(worker)worker.terminate();const id=++job;worker=new Worker(new URL('./worker.mjs',import.meta.url),{type:'module'});
  worker.onmessage=({data})=>{if(data.id!==job)return;worker.terminate();worker=null;if(data.error){status.textContent=data.error;return;}done(data.result);};
  worker.onerror=()=>{status.textContent='The calculation could not finish. Reduce the sampling resolution and try again.';};
  worker.postMessage({kind,id,...extra});
}
function el(tag,text='',cls=''){const e=document.createElement(tag);e.textContent=text;e.className=cls;return e;}
function group(title){const e=el('fieldset');e.append(el('legend',title));controls.append(e);return e;}
function hint(text,parent=controls){parent.append(el('p',text,'hint'));}
function range(label,key,min,max,step,parent=controls,callback=render){
  const wrap=el('div','','control'),row=el('div','','labelrow'),id='control-'+key,lab=el('label',label);lab.htmlFor=id;
  const num=el('input');num.type='number';num.value=state[key];num.min=min;num.max=max;num.step=step;num.setAttribute('aria-label',label+' value');
  const slider=el('input');slider.type='range';slider.id=id;slider.min=min;slider.max=max;slider.step=step;slider.value=state[key];
  const set=v=>{if(!Number.isFinite(v))return;state[key]=M.clamp(v,min,max);num.value=Number(state[key].toFixed(5));slider.value=state[key];callback();};
  num.onchange=()=>set(num.valueAsNumber);slider.oninput=()=>{num.value=Number(Number(slider.value).toFixed(5));};slider.onchange=()=>set(Number(slider.value));row.append(lab,num);wrap.append(row,slider);parent.append(wrap);
}
function check(label,value,onchange,parent){const lab=el('label','','check'),input=el('input');input.type='checkbox';input.checked=value;input.onchange=()=>onchange(input.checked);lab.append(input,document.createTextNode(label));parent.append(lab);}
function select(label,value,items,onchange,parent=controls){const box=el('div','','control'),lab=el('label',label),input=el('select');input.setAttribute('aria-label',label);for(const [v,l] of items){const o=el('option',l);o.value=v;input.append(o);}input.value=value;input.onchange=()=>onchange(input.value);box.append(lab,input);parent.append(box);}
function button(label,fn,parent){const b=el('button',label);b.type='button';b.onclick=fn;parent.append(b);}
function showLegend(items){legend.innerHTML=items.map(([label,color])=>`<span><i class="swatch" style="background:${color}"></i>${esc(label)}</span>`).join('');}
function buildControls(){
  controls.replaceChildren();
  if(state.tab==='sections'){
    range('Height h','h',.03,8,.001,controls,()=>{state.alpha=Math.min(state.alpha,Math.atan(2*state.h));buildControls();render();});
    range('Plane angle α (rad)','alpha',0,Math.atan(2*state.h),.001);
    range('Rotation φ (rad)','phi',0,M.TAU,.001);
    const presets=group('Presets'),buttons=el('div','','buttons');presets.append(buttons);
    for(const [label,h] of [['T1 · orthogonal',1/Math.SQRT2],['T5 · regular',Math.SQRT2],['T9',Math.sqrt(3)],['h → 0',.05],['Near prism',8]])button(label,()=>{state.h=h;state.alpha=Math.min(state.alpha,Math.atan(1.95*h));buildControls();render();},buttons);
    for(const [label,mu,phi] of [['Elliptic porism',.65,.4],['Hyperbolic porism',1.25,.9],['Parabolic',1,.9]])button(label,()=>{state.h=Math.SQRT2;state.alpha=Math.atan(state.h*mu);state.phi=phi;state.porism=true;buildControls();render();},buttons);
    const views=group('Views');['Angle-barycentric space','Complex triangle space','Produced triangle','Tetrahedron in 3D'].forEach((l,i)=>check(l,state.views[i],v=>{state.views[i]=v;render();},views));
    const overlays=group('Geometry overlays');for(const [key,label] of [['porism','φ-orbit triangles'],['euler','Euler line'],['kiepert','Kiepert hyperbola'],['steiner','Steiner ellipses'],['kimberling','Kimberling X(1)–X(20)'],['isosceles','Isosceles loci'],['right','Right-triangle loci'],['regions','Color inverse-count regions']])check(label,state[key],v=>{state[key]=v;render();},overlays);
    range('Porism step (°)','porismStep',5,45,5);range('Orbit samples','samples',90,480,30);range('Complex plot range','range',1.5,5,.25);
  }else if(state.tab==='strands'){
    select('Triangle examples','', [['','Choose a triangle…'],...M.examples.map((x,i)=>[i,x[0]])],v=>{if(v==='')return;const e=M.examples[Number(v)];state.tri=[[-1,0],[1,0],[e[1],e[2]]];buildControls();render();});
    const coords=group('Vertex coordinates');state.tri.forEach((p,i)=>{const row=el('div','','vertex');row.append(el('span','ABC'[i]));p.forEach((v,j)=>{const input=el('input');input.type='number';input.step=.01;input.value=Number(v.toFixed(5));input.setAttribute('aria-label','ABC'[i]+' '+['x','y'][j]);input.onchange=()=>{if(Number.isFinite(input.valueAsNumber)){state.tri[i][j]=input.valueAsNumber;render();}};row.append(input);});coords.append(row);});
    hint('Drag A, B or C in the triangle-plane plot. Drag the 3D plot to rotate.');
    range('Strand samples','strandSamples',72,480,24);range('View radius / longest side','radius',.85,4.5,.05);range('Maximum shape height','maxH',8,120,1);
    const g=group('Stars and labels');for(const [key,label] of [['showParabolic','Parabolic stars P'],['showTransitions','Transition stars T1–T12'],['showLabels','Point labels'],['showEdges','Connect stars to vertices']])check(label,state[key],v=>{state[key]=v;render();},g);
    const c=group('Center loci');['C1 · apex shadow','C2 · axis intersection','C3 · circumconic center','C4 · inconic center'].forEach((label,i)=>{check(label,state.showCenters[i],v=>{state.showCenters[i]=v;render();},c);check('Transition markers on C'+(i+1),state.showTransitionCenters[i],v=>{state.showTransitionCenters[i]=v;render();},c);});
  }else{
    select('Classification',state.metric,[['counts','Physical E / P / H counts'],['parabolic','Positive parabolic-height count'],['planar','Planar-apex endpoint count'],['structural','Structural strand phase'],['t9','T9 physical section counts']],v=>{state.metric=v;render();});
    range('Height h','h',.03,8,.001);range('Complex plot range','range',1.5,5,.25);range('Grid resolution','resolution',24,96,8);
    select('Transition slice','', [['','Choose a transition…'],...M.transitions.map((H,i)=>[i,`T${i+1} · h = ${Math.sqrt(H).toFixed(6)}`])],v=>{if(v==='')return;state.h=Math.sqrt(M.transitions[+v]);buildControls();render();});
    const b=el('div','','buttons');controls.append(b);button('Just below',()=>{state.h*=.999;buildControls();render();},b);button('Just above',()=>{state.h*=1.001;buildControls();render();},b);
    button('Build 13-phase height atlas',heightAtlas,controls);
    hint('Colors sample cell centers. Narrow regions may need a higher resolution. E/P/H counts are unordered shapes, not labeled spatial apices.');
  }
  const actions=el('div','','buttons');controls.append(actions);button('Export data',exportData,actions);button('Reset',()=>location.reload(),actions);
}
function addPlot(p){const element=p.element();plots.append(element);return element;}
function close(tri){return [...tri,tri[0]];}
function triangleBackground(mode,p){
  if(mode==='bary'){
    const v=[[-1,0],[1,0],[0,M.SQ3]];p.path(close(v),'#9cabbc');['A','B','C'].forEach((l,i)=>p.text(v[i],l,undefined,i===0?-18:5,i===2?-10:18));
    if(state.isosceles)for(let i=0;i<3;i++)p.path([v[i],M.mean([v[(i+1)%3],v[(i+2)%3]])],'#9c88ad',1,'6 5');
    if(state.right){const mid=v.map((_,i)=>M.mean([v[(i+1)%3],v[(i+2)%3]]));p.path(close(mid),'#c17d78',1,'6 5');}
  }else{p.grid();const r=state.range,n=160;
    if(state.isosceles){p.path([[0,0],[0,r]],'#9c88ad',1,'6 5');for(const x of [-1,1])p.path(Array.from({length:n+1},(_,i)=>[x+2*Math.cos(Math.PI*i/n),2*Math.sin(Math.PI*i/n)]),'#9c88ad',1,'6 5');}
    if(state.right){p.path([[-1,0],[-1,r]],'#c17d78',1,'6 5');p.path([[1,0],[1,r]],'#c17d78',1,'6 5');p.path(Array.from({length:n+1},(_,i)=>[Math.cos(Math.PI*i/n),Math.sin(Math.PI*i/n)]),'#c17d78',1,'6 5');}
    p.point([-1,0],'A','#536174',3);p.point([1,0],'B','#536174',3);
  }
}
function drawBoundary(mode,p,h=state.h){if(h!==boundaryH){cachedBoundary=M.boundaryCurves(h);boundaryH=h;}const map=mode==='bary'?M.baryPoint:M.complexPoint;
  p.path(cachedBoundary.par.map(q=>q?map(q):null),colors.par,2.2);p.path(cachedBoundary.fold.map(q=>q?map(q):null),colors.fold,2.2);}
const palette=['#e9eef5','#b9d7ed','#bfe0c9','#f0d49a','#dab9dc','#b8ced0','#e9bbb6','#b9c5ed','#d3df9c','#e4c5a0'];
function classColor(label){if(label==='Boundary')return '#333';if(label.startsWith('Φ'))return palette[Number(label.slice(1))+1];if(/^[PL]\d+$/.test(label))return palette[Number(label.slice(1))];const m=label.match(/E(\d+) P(\d+) H(\d+)/);if(!m)return palette[0];const [e,par,h]=m.slice(1).map(Number);if(e+par+h===0)return '#e9eef5';return `hsl(${(e*91+h*43+par*157)%360} 48% ${87-3*e-2*h-par}%)`;}
function fill(p,cells,mode){for(const c of cells){let poly=[[c.x-c.dx/2,c.y-c.dy/2],[c.x+c.dx/2,c.y-c.dy/2],[c.x+c.dx/2,c.y+c.dy/2],[c.x-c.dx/2,c.y+c.dy/2]];
  if(mode==='bary')for(const f of [p=>p[1],p=>M.SQ3*(1-p[0])-p[1],p=>M.SQ3*(1+p[0])-p[1]]){const next=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],fa=f(a),fb=f(b);if(fa>=0)next.push(a);if((fa>=0)!==(fb>=0))next.push(M.add(a,M.mul(M.sub(b,a),fa/(fa-fb))));}poly=next;}
  if(poly.length)p.polygon(poly,classColor(c.label));}}
function sectionPlot(mode,mu,q){
  const map=mode==='bary'?M.baryPoint:M.complexPoint,r=state.range;
  const p=new Plot(mode==='bary'?'1 · Angle-barycentric triangle space':'2 · Complex triangle space',mode==='bary'?[-1.12,1.12,-.08,1.9]:[-r,r,-.1,r],{caption:mode==='bary'?'Weights are the three angles divided by π.':'C = ξ + iη, with A = −1 and B = 1.'});
  if(state.regions&&cachedRegion&&regionKey===`${state.h}/${r}`)fill(p,cachedRegion.cells[mode],mode);
  triangleBackground(mode,p);drawBoundary(mode,p);
  const orbit=[],sweep=[];for(let i=0;i<=state.samples;i++){const phi=M.TAU*i/state.samples,mm=M.muMax(state.phi)*.999*i/state.samples;
    orbit.push(M.physical(mu,phi)?map(M.weights(M.section(state.h,mu,phi))):null);sweep.push(map(M.weights(M.section(state.h,mm,state.phi))));}
  p.path(orbit,colors.phi,1.6);p.path(sweep,colors.alpha,1.6);if(q)p.point(map(q),'selected','#a54418',5);addPlot(p);
}
function planarPlot(mu,tri){
  const pt=tri.map(p=>M.plane(state.h,mu,p)),g=M.mean(pt),scale=Math.max(...M.sides2(pt).map(Math.sqrt)),norm=p=>M.mul(M.sub(p,g),1/scale),t=pt.map(norm);
  const p=new Plot('3 · Produced triangle & conics',[-.95,.95,-.78,.78],{caption:'Orthonormal plane coordinates; longest side scaled to 1. Distant portions are clipped.'});
  for(const [rho,color] of [[1,'#526b8b'],[.5,'#ba8f3c']])p.path(M.conic(state.h,mu,rho).map(x=>x?norm(M.plane(state.h,mu,x)):null),color,1.8);
  if(state.porism)for(let phi=0;phi<M.TAU;phi+=state.porismStep*Math.PI/180)if(M.physical(mu,phi))p.path(close(M.section(state.h,mu,phi).map(x=>norm(M.plane(state.h,mu,x)))),'#b7bec7',.8);
  p.path(close(t),'#17233a',2.8);t.forEach((v,i)=>p.point(v,'ABC'[i],'#17233a'));
  M.centers(state.h,mu).forEach((u,i)=>{if(Number.isFinite(u))p.point(norm([u,0]),'C'+(i+1),colors['C'+(i+1)],4);});
  const b=M.basicCenters(t);if(state.euler&&b.O&&b.H){const d=M.sub(b.H,b.O);p.path([M.sub(b.O,M.mul(d,3)),M.add(b.H,M.mul(d,3))],'#b43c3c',1.5);[['G',b.G],['O',b.O],['H',b.H],['N',b.N]].forEach(([l,v])=>p.point(v,l,'#b43c3c',3));}
  if(state.steiner){const g=M.mean(t),u=M.sub(t[0],g),v=M.mul(M.sub(t[1],t[2]),1/M.SQ3);for(const rho of [1,.5])p.path(Array.from({length:161},(_,i)=>M.add(g,M.mul(M.add(M.mul(u,Math.cos(M.TAU*i/160)),M.mul(v,Math.sin(M.TAU*i/160))),rho))),'#2a855c',1.7,rho===.5?'5 4':'');}
  if(state.kiepert){const s=M.sides2(t),f=(x,y)=>{const b=M.barycentric([x,y],t);return (s[1]-s[2])*b[1]*b[2]+(s[2]-s[0])*b[2]*b[0]+(s[0]-s[1])*b[0]*b[1];};contour(p,f,[-.95,.95,-.78,.78],'#7553a6');}
  if(state.kimberling)M.kimberling(t).forEach((v,i)=>{if(v)p.point(v,'X'+(i+1),'#85428c',3);});addPlot(p);
}
function contour(p,f,range,color,n=50){const [a,b,c,d]=range,dx=(b-a)/n,dy=(d-c)/n;
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const ps=[[a+i*dx,c+j*dy],[a+(i+1)*dx,c+j*dy],[a+(i+1)*dx,c+(j+1)*dy],[a+i*dx,c+(j+1)*dy]],v=ps.map(p=>f(...p)),cross=[];
    for(let k=0;k<4;k++){const l=(k+1)%4;if(v[k]*v[l]<0){const t=v[k]/(v[k]-v[l]);cross.push(M.add(ps[k],M.mul(M.sub(ps[l],ps[k]),t)));}}if(cross.length===2)p.path(cross,color,1.4);}
}
function bindRotate(element){const svg=element.querySelector('svg');let down=null;svg.style.cursor='grab';svg.onpointerdown=e=>{down=[e.clientX,e.clientY,state.yaw,state.pitch];svg.setPointerCapture(e.pointerId);};svg.onpointerup=e=>{if(!down)return;state.yaw=down[2]+(e.clientX-down[0])*.008;state.pitch=M.clamp(down[3]+(e.clientY-down[1])*.008,-1.5,1.5);down=null;render();};}
function threeD(mu,tri){const all=[[0,0,state.h],...tri],g=M.mean(all),scale=Math.max(...all.map(p=>M.norm(M.sub(p,g)))),norm=p=>M.mul(M.sub(p,g),1/scale),t=tri.map(norm),S=norm([0,0,state.h]),project=projector([0,0,0],state.yaw,state.pitch);
  const p=new Plot('4 · Tetrahedral cone in 3D',[-1.25,1.25,-1,1],{project,caption:'Drag to rotate. The cutting triangle meets three forward cone rays.'});
  for(let i=0;i<3;i++){p.polygon([S,t[i],t[(i+1)%3]],'#718ca9',.09);p.path([S,t[i]],'#718ca9',1.5);}p.polygon(t,'#e7b08a',.22);p.path(close(t),'#a54418',2.4);
  for(const rho of [1,.5])p.path(M.conic(state.h,mu,rho).map(x=>x?norm(x):null),rho===1?'#718ca9':'#c4a05a',1);
  p.point(S,'S','#17233a',4);t.forEach((v,i)=>p.point(v,'ABC'[i],'#a54418'));bindRotate(addPlot(p));}
function renderSections(){
  const mu=Math.tan(state.alpha)/state.h,physical=M.physical(mu,state.phi),tri=M.section(state.h,mu,state.phi),q=physical?M.weights(tri):null,c=q?M.counts(M.inverse(q,state.h)):null;
  status.textContent=`h = ${state.h.toFixed(5)} · μ = ${mu.toFixed(5)} · ${M.conicType(mu)} circumsection · `+(physical?`angles ${M.angles(q).map(a=>(a*180/Math.PI).toFixed(2)+'°').join(', ')} · inverse shapes E${c[0]} P${c[1]} H${c[2]}`:'The plane misses at least one forward ray. Reduce α or change φ.');
  if(state.views[0])sectionPlot('bary',mu,q);if(state.views[1])sectionPlot('complex',mu,q);
  if(physical){if(state.views[2])planarPlot(mu,tri);if(state.views[3])threeD(mu,tri);}else if(state.views[2]||state.views[3])plots.append(el('p','Produced-triangle views are hidden for a nonphysical section.','hint'));
  showLegend([['φ orbit',colors.phi],['α orbit',colors.alpha],['Parabolic boundary',colors.par],['Fold boundary',colors.fold],...['C1','C2','C3','C4'].map(x=>[x,colors[x]])]);
  if(!state.views.some(Boolean))plots.append(el('p','Select a view from the controls.'));
  if(state.regions&&regionKey!==`${state.h}/${state.range}`){status.textContent+=' · calculating region colors…';const key=`${state.h}/${state.range}`;
    request('atlas',{h:state.h,range:state.range,resolution:32},result=>{cachedRegion=result;regionKey=key;render();});}
}
function drawStrands(d){
  const scale=Math.sqrt(Math.max(...M.sides2(d.tri))),g=[...d.centroid,0],r=state.radius*scale,range=[-r,r,-.8*r,.8*r];
  const proj3=projector(g,state.yaw,state.pitch),proj2=p=>M.sub(p,g).slice(0,2),p3=new Plot('1 · Inverse-apex strands',range,{project:proj3,caption:'Drag to rotate. Finite sampling and view radius clip the unbounded branches.'}),p2=new Plot('2 · Triangle plane',range,{project:proj2,caption:'Drag the vertices to change the triangle. C1 is the apex shadow.'});
  for(const p of [p3,p2]){
    p.path(close(d.tri.map(v=>[...v,0])),'#7a8798',1.5);
    for(const branch of d.branches){for(let i=1;i<branch.length;i++){const a=branch[i-1],b=branch[i];if(M.norm(M.sub(a.point,b.point))>r*2)continue;
      if(p===p3)p.path([a.point,b.point],b.type==='Hyperbolic'?colors.H:colors.E,2);
      for(let k=0;k<4;k++)if(state.showCenters[k]&&a.centers[k]&&b.centers[k]&&(k!==2||(a.mu-1)*(b.mu-1)>0)){
        if(M.norm(M.sub(a.centers[k],b.centers[k]))<r*5)p.path([a.centers[k],b.centers[k]],colors['C'+(k+1)],b.type==='Hyperbolic'?.9:1.8);
      }
    }}
    if(state.showParabolic)d.parabolic.forEach((row,i)=>{p.point(row.point,state.showLabels?'P'+(i+1):'',colors.par,5);for(let k=0;k<4;k++)if(state.showCenters[k]&&row.centers[k])p.point(row.centers[k],'',colors.par,3);});
    if(state.showTransitions)d.stars.forEach((s,i)=>s.rows.forEach(row=>{p.point(row.point,state.showLabels?(i===0?'H / T1':s.label):'',i===0?'#ae398f':'#087f89',3.5);
      if(state.showEdges&&p===p3)for(const v of d.tri)p.path([row.point,[...v,0]],'#b7c5ca',.7);
      for(let k=0;k<4;k++)if(state.showCenters[k]&&state.showTransitionCenters[k]&&row.centers[k])p.point(row.centers[k],state.showLabels?s.label:'',colors['C'+(k+1)],3);
    }));
    p.point([...d.centroid,0],state.showLabels?'G':'','#536174',4);if(d.fermat)p.point([...d.fermat,0],state.showLabels?'F':'','#1d9346',5);
    d.tri.forEach((v,i)=>p.point([...v,0],'ABC'[i],'#2676b3',6));
  }
  bindRotate(addPlot(p3));const element=addPlot(p2),svg=element.querySelector('svg');let chosen=-1;
  const xy=e=>{const r=svg.getBoundingClientRect();return p2.unxy((e.clientX-r.left)*600/r.width,(e.clientY-r.top)*440/r.height);};
  svg.onpointerdown=e=>{const p=xy(e);let distance=Infinity;d.tri.forEach((v,i)=>{const dis=M.norm(M.sub(proj2([...v,0]),p));if(dis<distance){distance=dis;chosen=i;}});if(distance>scale*.16){chosen=-1;return;}svg.setPointerCapture(e.pointerId);};
  svg.onpointerup=e=>{if(chosen<0)return;const p=xy(e);state.tri[chosen]=M.add(p,d.centroid);chosen=-1;buildControls();render();};
  status.textContent=`Angles ${d.angles.map(a=>(a*180/Math.PI).toFixed(2)+'°').join(', ')} · ${d.branches.length} sampled strands · ${d.parabolic.length} labeled parabolic stars · ${M.structural(d.q)} · `+(d.fermat?'interior Fermat endpoint':'no distinct interior Fermat endpoint');
  if(state.showCenters[2]&&d.asymptoteAngles.length)dataEl.append(el('p',`C3 asymptote orientations (mod 180°): ${d.asymptoteAngles.map(x=>x.toFixed(2)+'°').join(', ')}. Cyclic sectors: ${d.asymptoteSectors.map(x=>x.toFixed(2)+'°').join(', ')}.`,'small'));
  showLegend([['Elliptic strand',colors.E],['Hyperbolic strand',colors.H],['Parabolic stars',colors.par],...['C1','C2','C3','C4'].map(x=>[x,colors[x]])]);
  const rows=[...d.parabolic.map((r,i)=>({...r,label:'P'+(i+1)})),...d.stars.flatMap(s=>s.rows.map(r=>({...r,label:s.label})))];
  const details=el('details');details.innerHTML='<summary>Star coordinates and barycentrics</summary><div class="table-wrap"><table><thead><tr><th>Star</th><th>h</th><th>μ</th><th>Apex (x, y, z)</th><th>Projection barycentrics</th></tr></thead><tbody>'+rows.map(r=>`<tr><td>${r.label}</td><td>${r.h.toFixed(6)}</td><td>${r.mu.toFixed(6)}</td><td>${r.point.map(x=>x.toFixed(6)).join(', ')}</td><td>${r.bary.map(x=>x.toFixed(6)).join(', ')}</td></tr>`).join('')+'</tbody></table></div>';dataEl.append(details);
}
function renderStrands(){const key=JSON.stringify([state.tri,state.strandSamples,state.maxH]);
  if(cachedStrands&&strandKey===key){drawStrands(cachedStrands);return;}
  status.textContent='Tracing inverse-apex strands…';request('strands',{tri:state.tri,samples:state.strandSamples,maxH:state.maxH},result=>{strandKey=key;cachedStrands=result;render();});
}
function drawAtlas(result){
  for(const mode of ['bary','complex']){const r=state.range,p=new Plot((mode==='bary'?'Angle-barycentric':'Complex')+` · h = ${result.h.toFixed(5)}`,mode==='bary'?[-1.12,1.12,-.08,1.9]:[-r,r,-.1,r],{caption:'Cell colors are numerical samples; use SVG to download this view.'});fill(p,result.cells[mode],mode);triangleBackground(mode,p);if(['counts','t9'].includes(result.metric))drawBoundary(mode,p,result.metric==='t9'?Math.sqrt(3):result.h);addPlot(p);}
  showLegend(result.classes.map(l=>[l,classColor(l)]));
}
function renderAtlas(){lastAtlas=null;status.textContent='Computing triangle-space classifications…';request('atlas',{h:state.h,metric:state.metric,resolution:state.resolution,range:state.range},result=>{lastAtlas=result;plots.replaceChildren();drawAtlas(result);status.textContent=`${state.resolution} × ${state.resolution} sample grid · h = ${state.h.toFixed(6)} · ${result.classes.length} sampled classes`;});}
async function heightAtlas(){
  if(worker)worker.terminate();const token=++job;plots.replaceChildren();dataEl.replaceChildren();
  const H=[.25,...M.transitions.slice(0,-1).map((v,i)=>(v+M.transitions[i+1])/2),8];
  const {atlasData}=await import('./worker.mjs');lastAtlas=[];
  for(let i=0;i<H.length;i++){
    if(token!==job)return;status.textContent=`Building phase ${i+1} of 13…`;
    await new Promise(r=>setTimeout(r,0));const result=atlasData({h:Math.sqrt(H[i]),metric:'counts',resolution:Math.min(state.resolution,40),range:state.range});
    lastAtlas.push(result);const title=el('h2',`Phase ${i+1} · h = ${Math.sqrt(H[i]).toFixed(6)}`,'atlas-title');plots.append(title);drawAtlas(result);
  }status.textContent='13 open height phases · one representative height in each interval between transitions. Cell colors are sampled.';
}
function exportData(){const mu=Math.tan(state.alpha)/state.h;if(worker){status.textContent='Wait for the current calculation to finish before exporting.';return;}const content=state.tab==='strands'?cachedStrands:state.tab==='atlas'?lastAtlas:{parameters:state,vertices:M.section(state.h,mu,state.phi),physical:M.physical(mu,state.phi)};download('tetrahedral-'+state.tab+'.json',JSON.stringify(content,null,2));}
function render(){plots.replaceChildren();legend.replaceChildren();dataEl.replaceChildren();try{if(state.tab==='sections')renderSections();else if(state.tab==='strands')renderStrands();else renderAtlas();}catch(e){status.textContent='Calculation unavailable: '+e.message;}}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{if(worker){worker.terminate();worker=null;}job++;state.tab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));buildControls();render();});
buildControls();render();
