import {P_MIN,RANGE_MIN,LIMITS,centroid,dot,norm,sub,cross} from './math.js';
import {etcCenter,etcURL,sampledRanking,closestSample} from './etc.js';
import {etcResponse} from './etc-response.js';

const $=id=>document.getElementById(id);
const COLORS={atomic:'#8355ba',hull:'#078b82',ink:'#163345',muted:'#7b8c96'};
const clone=value=>JSON.parse(JSON.stringify(value));
const presets={
  triangle:[
    {name:'Asymmetric triangle',v:[[-1,0],[1,0],[.58,.92]]},
    {name:'Equilateral triangle',v:[[-1,0],[1,0],[0,Math.sqrt(3)]]},
    {name:'Near the upper failure branch',v:[[-1,0],[1,0],[.7177942823,.7218044717]],p:21.63},
    {name:'Thin triangle',v:[[-1,0],[1,0],[.35,.025]]},
    {name:'Atomic failure probe at p = 7',v:(()=>{const e=1e-4/Math.sqrt(2);return [[1-e/2,-e/2],[-1-e/2,-e/2],[e,e]].map(f=>f.map(q=>-q*Math.pow(norm(f),1/6-1)));})(),p:7}
  ],
  tetrahedron:[
    {name:'Asymmetric tetrahedron',v:[[-1,0,0],[1,0,0],[-.3,.9,.75],[.25,.5,-.8]]},
    {name:'Regular tetrahedron',v:[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]]},
    {name:'Near the upper failure branch',v:[[-1,0,0],[1,0,0],[-.52,.56,.89],[-.52,.56,-.89]],p:19.95},
    {name:'Flattened tetrahedron',v:[[-1,0,0],[1,0,0],[.2,1,0],[-.3,.5,.03]]}
  ]
};
const state={mode:'triangle',p:8,vertices:clone(presets.triangle[0].v),yaw:.58,pitch:.38,selected:0,curves:[],pair:null,baseline:null,probeVertex:null,quality:'standard',curveComplete:false};
let camera={target:[0,0,0],scale:160},dimensions={width:800,height:540},pointId=0,curveId=0,curveTimer,pointTimer,drag=null,animation=null,toastTimer;
const canvas=$('geometry'),ctx=canvas.getContext('2d'),chart=$('coordinate-chart'),cc=chart.getContext('2d');
let pointWorker,curveWorker;
let etcData=null;
let etcWitness=null;
const minimum=()=>RANGE_MIN[state.mode];
const ETC_COLORS={atomic:['#b2762b','#a65c6d','#b89b25'],hull:['#3578bd','#62899f','#5963aa']};
const order=()=>state.mode==='triangle'?(state.quality==='high'?32:20):(state.quality==='high'?22:12);
const pad=v=>[v[0],v[1],v[2]||0];
const fmt=n=>Math.abs(n)<5e-8?'0':Number(n.toPrecision(7)).toString();
const coords=v=>'('+v.map(fmt).join(', ')+')';
const checked=id=>$(id).checked;
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
function basis(){
  if(state.mode==='triangle')return {right:[1,0,0],up:[0,1,0],depth:[0,0,1]};
  const {yaw:y,pitch:p}=state,right=[Math.cos(y),0,-Math.sin(y)],up=[Math.sin(p)*Math.sin(y),Math.cos(p),Math.sin(p)*Math.cos(y)];
  return {right,up,depth:cross(right,up)};
}
function project(v,cam=camera,box=dimensions){const b=basis(),q=sub(pad(v),cam.target);return [box.width/2+dot(q,b.right)*cam.scale,box.height/2-dot(q,b.up)*cam.scale,dot(q,b.depth)];}
function fit(points=state.vertices,margin=.68){
  if(!points.length)return;
  camera.target=pad(centroid(points));const b=basis(),projected=points.map(v=>{const q=sub(pad(v),camera.target);return [dot(q,b.right),dot(q,b.up)];});
  const width=Math.max(...projected.map(q=>q[0]))-Math.min(...projected.map(q=>q[0])),height=Math.max(...projected.map(q=>q[1]))-Math.min(...projected.map(q=>q[1]));
  camera.scale=Math.min(dimensions.width*margin/Math.max(width,.04),dimensions.height*margin/Math.max(height,.04),6000);draw();
}
function resize(){
  const dpr=Math.min(window.devicePixelRatio||1,2),rect=canvas.getBoundingClientRect();
  dimensions={width:rect.width,height:rect.height};
  for(const c of [canvas,chart]){const r=c.getBoundingClientRect();c.width=Math.round(r.width*dpr);c.height=Math.round(r.height*dpr);c.getContext('2d').setTransform(dpr,0,0,dpr,0,0);}
  draw();drawChart();
}
function rounded(context,x,y,w,h,r=12){context.beginPath();context.roundRect(x,y,w,h,r);}
function line(context,points,color,width=2,dash=[]){if(!points.length)return;context.beginPath();context.strokeStyle=color;context.lineWidth=width;context.setLineDash(dash);points.forEach((p,i)=>i?context.lineTo(p[0],p[1]):context.moveTo(p[0],p[1]));context.stroke();context.setLineDash([]);}
function mark(context,p,kind,size=5){context.fillStyle=COLORS[kind];context.strokeStyle='white';context.lineWidth=2;context.beginPath();if(kind==='hull'){context.moveTo(p[0],p[1]-size*1.3);context.lineTo(p[0]+size*1.3,p[1]);context.lineTo(p[0],p[1]+size*1.3);context.lineTo(p[0]-size*1.3,p[1]);context.closePath();}else context.arc(p[0],p[1],size,0,2*Math.PI);context.fill();context.stroke();}
function curveLines(context,projection){
  if(!checked('show-curves'))return;
  for(const kind of ['atomic','hull'])if(checked('show-'+kind)){
    let segment=[];for(const pair of state.curves){if(pair[kind].converged)segment.push(projection(pair[kind].center));else{line(context,segment,COLORS[kind],2);segment=[];}}
    line(context,segment,COLORS[kind],2);
  }
}
function draw(){
  const {width:w,height:h}=dimensions;ctx.clearRect(0,0,w,h);ctx.fillStyle='#f9fcfc';ctx.fillRect(0,0,w,h);
  // A quiet screen grid remains useful while orbiting or zooming.
  ctx.strokeStyle='#e8eeee';ctx.lineWidth=1;ctx.beginPath();for(let x=24;x<w;x+=36){ctx.moveTo(x,0);ctx.lineTo(x,h);}for(let y=24;y<h;y+=36){ctx.moveTo(0,y);ctx.lineTo(w,y);}ctx.stroke();
  const points=state.vertices.map(v=>project(v));
  if(state.mode==='triangle'){
    ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle='rgba(44,134,145,.07)';ctx.fill();ctx.strokeStyle='#698791';ctx.lineWidth=2;ctx.stroke();
  }else{
    const faces=[[0,1,2],[0,1,3],[0,2,3],[1,2,3]].sort((a,b)=>a.reduce((s,i)=>s+points[i][2],0)-b.reduce((s,i)=>s+points[i][2],0));
    for(const face of faces){ctx.beginPath();face.forEach((i,j)=>j?ctx.lineTo(points[i][0],points[i][1]):ctx.moveTo(points[i][0],points[i][1]));ctx.closePath();ctx.fillStyle='rgba(44,134,145,.045)';ctx.fill();}
    for(let i=0;i<4;i++)for(let j=0;j<i;j++)line(ctx,[points[i],points[j]],'#8ba1a9',1.6);
  }
  curveLines(ctx,v=>project(v));
  for(const q of etcOverlays()){
    const point=project(q.center);ctx.beginPath();ctx.arc(point[0],point[1],4.5,0,Math.PI*2);ctx.fillStyle=q.color;ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=1.5;ctx.stroke();ctx.font='600 10px system-ui';ctx.fillStyle=q.color;
    const labelX=point[0]+10,labelY=point[1]+(q.kind==='atomic'?-22-13*q.rank:28+13*q.rank);line(ctx,[point,[labelX-3,labelY-4]],q.color,.6);ctx.fillText('X('+q.X+')',labelX,labelY);
  }
  if(state.pair)for(const kind of ['atomic','hull'])if(checked('show-'+kind)&&state.pair[kind].converged){const p=project(state.pair[kind].center);mark(ctx,p,kind,7);ctx.fillStyle=COLORS[kind];ctx.font='600 12px system-ui';ctx.fillText(kind==='atomic'?'Mₚ':'Uₚ',p[0]+12,p[1]+(kind==='atomic'?-10:18));}
  points.forEach((p,i)=>{ctx.beginPath();ctx.arc(p[0],p[1],state.selected===i?10:8,0,Math.PI*2);ctx.fillStyle=state.selected===i?'#163345':'#486876';ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=3;ctx.stroke();ctx.font='600 13px system-ui';ctx.fillStyle=COLORS.ink;ctx.fillText(String.fromCharCode(65+i),p[0]+13,p[1]-12);});
  ctx.fillStyle=COLORS.muted;ctx.font='12px system-ui';ctx.textAlign='right';ctx.fillText('p = '+fmt(state.p),w-20,25);ctx.textAlign='left';
  ctx.font='10px system-ui';ctx.fillText('Ismail Hammoudeh · Power Centers Explorer',20,h-39);
  if(state.mode==='tetrahedron')drawAxes();
  if(checked('show-inset')&&(state.curves.length||state.pair))drawInset();
  // Screen locations also give automated interaction tests a geometry-neutral target.
  canvas.dataset.vertexPositions=JSON.stringify(points.map(p=>p.slice(0,2)));
}
function drawAxes(){
  const b=basis(),x=45,y=dimensions.height-67;ctx.font='600 11px system-ui';
  for(const [i,color] of ['#d2756d','#658d50','#627ec5'].entries()){const end=[x+b.right[i]*25,y-b.up[i]*25];line(ctx,[[x,y],end],color,2);ctx.fillStyle=color;ctx.fillText('xyz'[i],end[0]+3,end[1]-3);}
}
function curvePoints(){const points=[];for(const q of state.curves)for(const kind of ['atomic','hull'])if(checked('show-'+kind)&&q[kind].converged)points.push(q[kind].center);if(state.pair)for(const kind of ['atomic','hull'])if(checked('show-'+kind)&&state.pair[kind].converged)points.push(state.pair[kind].center);points.push(...etcOverlays().map(q=>q.center));return points;}
function drawInset(){
  const points=curvePoints();if(!points.length)return;
  const w=Math.min(220,dimensions.width*.43),h=148,left=dimensions.width-w-16,top=dimensions.height-h-16;
  ctx.save();rounded(ctx,left,top,w,h);ctx.fillStyle='rgba(255,255,255,.96)';ctx.fill();ctx.strokeStyle='#d8e4e5';ctx.lineWidth=1;ctx.stroke();ctx.clip();
  ctx.fillStyle=COLORS.ink;ctx.font='600 10px system-ui';ctx.fillText(w<175?'MAGNIFIED CENTERS':'CENTER CURVES · MAGNIFIED',left+10,top+20);
  const b=basis(),all=points.map(v=>[dot(pad(v),b.right),dot(pad(v),b.up)]),min=all[0].slice(),max=all[0].slice();
  for(const p of all)for(let k=0;k<2;k++){min[k]=Math.min(min[k],p[k]);max[k]=Math.max(max[k],p[k]);}
  const span=Math.max(max[0]-min[0],max[1]-min[1],.0001),scale=Math.min((w-38)/span,(h-52)/span),mid=min.map((q,i)=>(q+max[i])/2);
  const projection=v=>[left+w/2+(dot(pad(v),b.right)-mid[0])*scale,top+34+(h-44)/2-(dot(pad(v),b.up)-mid[1])*scale];
  curveLines(ctx,projection);if(state.pair)for(const kind of ['atomic','hull'])if(checked('show-'+kind)&&state.pair[kind].converged)mark(ctx,projection(state.pair[kind].center),kind,4.5);
  for(const q of etcOverlays()){const point=projection(q.center);ctx.beginPath();ctx.arc(point[0],point[1],3,0,Math.PI*2);ctx.fillStyle=q.color;ctx.fill();}
  ctx.restore();
}
let chartBounds;
function drawChart(){
  const rect=chart.getBoundingClientRect(),w=rect.width,h=rect.height,axis=Number($('chart-axis').value),left=53,right=w-18,top=17,bottom=h-32;
  cc.clearRect(0,0,w,h);let values=[];for(const pair of state.curves)for(const kind of ['atomic','hull'])if(checked('show-'+kind)&&pair[kind].converged)values.push(pair[kind].center[axis]);
  if(!values.length)values=[-.1,.1];let min=Math.min(...values),max=Math.max(...values),span=Math.max(max-min,.00001);min-=span*.15;max+=span*.15;
  const xp=p=>left+(p-minimum())/(LIMITS[state.mode]-minimum())*(right-left),yp=y=>bottom-(y-min)/(max-min)*(bottom-top);chartBounds={left,right};
  cc.font='11px system-ui';cc.fillStyle=COLORS.muted;cc.textAlign='right';
  for(let i=0;i<4;i++){const y=min+(max-min)*i/3;line(cc,[[left,yp(y)],[right,yp(y)]],'#e7ecee',1);cc.fillText(Number(y.toPrecision(3)).toString(),left-9,yp(y)+4);}
  cc.textAlign='center';for(const p of [minimum(),4,8,12,16,LIMITS[state.mode]]){cc.fillText(p===minimum()?minimum().toFixed(2):fmt(p),xp(p),h-12);}
  for(const kind of ['atomic','hull'])if(checked('show-'+kind)){let segment=[];for(const pair of state.curves){if(pair[kind].converged)segment.push([xp(pair.p),yp(pair[kind].center[axis])]);else{line(cc,segment,COLORS[kind],2);segment=[];}}line(cc,segment,COLORS[kind],2);}
  line(cc,[[xp(state.p),top],[xp(state.p),bottom]],'#789099',1,[4,4]);
  if(state.pair)for(const kind of ['atomic','hull'])if(checked('show-'+kind)&&state.pair[kind].converged)mark(cc,[xp(state.p),yp(state.pair[kind].center[axis])],kind,4);
  cc.textAlign='left';
}
function createWorkers(){
  pointWorker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});curveWorker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});
  pointWorker.onmessage=({data})=>{if(data.id!==pointId)return;if(data.kind==='error'){setStatus(data.message,true);return;}state.pair=data.result;updateReadouts(data.baseline);draw();drawChart();updateStatus();};
  curveWorker.onmessage=({data})=>{if(data.id!==curveId)return;if(data.kind==='error'){setStatus(data.message,true);return;}state.curves=data.points;state.curveComplete=data.complete;draw();drawChart();updateStatus(data.total);};
  for(const worker of [pointWorker,curveWorker])worker.onerror=e=>setStatus('Calculation could not start: '+e.message,true);
}
function requestPoint(){clearTimeout(pointTimer);pointId++;pointWorker.postMessage({kind:'point',id:pointId,vertices:state.vertices,p:state.p,order:order(),baseline:state.baseline});}
function requestCurve(){clearTimeout(curveTimer);curveId++;state.curveComplete=false;state.curves=[];curveWorker.postMessage({kind:'curve',id:curveId,vertices:state.vertices,mode:state.mode,order:order(),count:state.quality==='high'?91:65});updateStatus();}
function geometryChanged({defer=false}={}){
  pointId++;state.pair=null;state.curves=[];state.curveComplete=false;curveId++;setStatus('Calculating centers…');updateVertexInputs();updateETC();draw();drawChart();
  clearTimeout(pointTimer);pointTimer=setTimeout(requestPoint,defer?45:0);clearTimeout(curveTimer);curveTimer=setTimeout(requestCurve,defer?200:20);
}
function setStatus(message,warning=false){$('calculation-status').textContent=message;$('calculation-status').classList.toggle('warning',warning);}
function updateStatus(total){
  if(!state.pair){setStatus('Calculating centers…');return;}
  const {atomic,hull}=state.pair;
  if(!atomic.converged||!hull.converged||!hull.checkedConvergence){setStatus('Unresolved numerical calculation · try More precise',true);return;}
  if(hull.relativeOrderDifference>5e-7){setStatus('Quadrature-sensitive shape · try More precise',true);return;}
  if(!state.curveComplete){setStatus('Centers ready · tracing curves'+(total?' '+Math.round(state.curves.length/total*100)+'%':'…'));return;}
  const failed=state.curves.filter(q=>!q.atomic.converged||!q.hull.converged).length;
  setStatus(failed?`${failed} unresolved curve samples · try More precise`:'Centers ready · '+state.curves.length+' power samples',failed>0);
}
function updateReadouts(baseline){
  const pair=state.pair;for(const kind of ['atomic','hull'])$(kind+'-coordinates').textContent=pair[kind].converged?coords(pair[kind].center):'Calculation unresolved';
  updateETC();
  $('center-distance').textContent=pair.atomic.converged&&pair.hull.converged?fmt(norm(sub(pair.atomic.center,pair.hull.center))):'—';
  $('accuracy-info').textContent=`The selected hull center is checked at quadrature orders ${order()} and ${order()+(state.mode==='triangle'?12:6)}. Their centers differ by ${pair.hull.relativeOrderDifference.toExponential(2)} of the longest edge. This is a numerical stability estimate, not a rigorous error bound. Flat shapes use the fixed barycentric measure.`;
  if(!baseline||state.probeVertex===null)return;
  const h=sub(state.vertices[state.probeVertex],state.baseline[state.probeVertex]);
  const disagreement=pair.hull.orderDifference+(baseline.hull.orderDifference||0),estimate=norm(h)*disagreement;
  for(const kind of ['atomic','hull']){
    const out=$(kind+'-probe');out.classList.remove('positive','negative');
    if(!pair[kind].converged||!baseline[kind].converged){out.textContent='Calculation unresolved';continue;}
    const value=dot(h,sub(pair[kind].center,baseline[kind].center)),uncertain=Math.abs(value)<Math.max(1e-13,kind==='hull'?10*estimate:1e-13);
    out.textContent=(value>=0?'+':'')+value.toExponential(3)+(uncertain?' · near zero':value<0?' · negative':' · positive');
    if(!uncertain)out.classList.add(value<0?'negative':'positive');
  }
  $('probe-note').textContent=`Vertex ${String.fromCharCode(65+state.probeVertex)} moved by ${fmt(norm(h))}. The quantity h · Δcenter compares both shapes at p = ${fmt(state.p)}. Its sign describes this motion only. Floating-point and quadrature errors are not certified.`;
}
function clearProbe(){state.baseline=null;state.probeVertex=null;for(const kind of ['atomic','hull']){$(kind+'-probe').textContent='Drag a vertex to begin';$(kind+'-probe').classList.remove('negative','positive');}$('probe-note').textContent='The quantity is h · (center after − center before), evaluated at the current power. A negative value is a numerical indication of failure for that motion.';}
function updatePowerUI(){
  const max=LIMITS[state.mode];$('power-slider').min=$('power-number').min=minimum();$('power-slider').max=$('power-number').max=max;$('power-slider').value=state.p;$('power-number').value=Number(state.p.toFixed(5));$('range-max').textContent=max;
  $('range-min').innerHTML=state.mode==='triangle'?'1.01 <small>selected powers in 1 &lt; p &lt; 25</small>':'4 − 2√2 <small>≈ 1.1716</small>';
  document.querySelectorAll('[data-power]').forEach(button=>{button.hidden=Number(button.dataset.power)>max;button.classList.toggle('chosen',Math.abs(Number(button.dataset.power)-state.p)<.003);});
}
function setPower(value,{animate=false}={}){if(!Number.isFinite(value))return;if(!animate)stopAnimation();state.p=Math.max(minimum(),Math.min(LIMITS[state.mode],value));updatePowerUI();pointId++;state.pair=null;updateETC();draw();drawChart();clearTimeout(pointTimer);pointTimer=setTimeout(requestPoint,animate?0:35);}
function stopAnimation(){if(animation!==null)cancelAnimationFrame(animation);animation=null;$('play').textContent='▶';$('play').setAttribute('aria-label','Animate power');}
function animate(){if(animation!==null){stopAnimation();return;}let last=performance.now(),sample=last;$('play').textContent='Ⅱ';$('play').setAttribute('aria-label','Pause animation');const step=now=>{state.p+=(now-last)/1000*(LIMITS[state.mode]-minimum())/20;last=now;if(state.p>LIMITS[state.mode])state.p=minimum();updatePowerUI();if(now-sample>120){sample=now;setPower(state.p,{animate:true});}animation=requestAnimationFrame(step);};animation=requestAnimationFrame(step);}
function renderVertexEditor(){
  const box=$('vertex-editor');box.replaceChildren();const labels=document.createElement('div');labels.className='vertex-axis-labels';labels.innerHTML='<span></span>'+['x','y','z'].slice(0,state.vertices[0].length).map(a=>'<span>'+a+'</span>').join('');box.append(labels);
  state.vertices.forEach((v,i)=>{const row=document.createElement('div');row.className='vertex-row';row.style.gridTemplateColumns=`30px repeat(${v.length},minmax(0,1fr))`;const button=document.createElement('button');button.textContent=String.fromCharCode(65+i);button.type='button';button.setAttribute('aria-label','Select vertex '+button.textContent);button.classList.toggle('selected',i===state.selected);button.onclick=()=>{state.selected=i;renderVertexEditor();canvas.focus();draw();};row.append(button);
    v.forEach((q,k)=>{const input=document.createElement('input');input.type='number';input.step='.01';input.value=Number(q.toFixed(6));input.setAttribute('aria-label',`Vertex ${String.fromCharCode(65+i)} ${'xyz'[k]}`);input.dataset.vertex=i;input.dataset.axis=k;input.addEventListener('change',()=>{const n=Number(input.value);if(!Number.isFinite(n)||Math.abs(n)>10000){input.value=fmt(q);toast('Enter a finite coordinate between −10,000 and 10,000.');return;}state.baseline=clone(state.vertices);state.probeVertex=i;state.vertices[i][k]=n;state.selected=i;geometryChanged();});row.append(input);});box.append(row);});
}
function updateVertexInputs(){for(const input of document.querySelectorAll('#vertex-editor input'))if(document.activeElement!==input)input.value=Number(state.vertices[Number(input.dataset.vertex)][Number(input.dataset.axis)].toFixed(6));}
function setMode(mode,{reset=true}={}){
  stopAnimation();state.mode=mode;state.selected=0;clearProbe();
  if(reset)state.vertices=clone(presets[mode][0].v);state.p=Math.max(minimum(),Math.min(state.p,LIMITS[mode]));
  $('etc-panel').hidden=mode!=='triangle';
  for(const m of ['triangle','tetrahedron']){$(m+'-mode').classList.toggle('active',m===mode);$(m+'-mode').setAttribute('aria-pressed',m===mode);}
  $('shape-label').textContent=mode==='triangle'?'Triangle':'Tetrahedron';$('plane-field').hidden=$('view-front').hidden=mode==='triangle';$('chart-axis').querySelector('[value="2"]').hidden=mode==='triangle';if(mode==='triangle'&&$('chart-axis').value==='2')$('chart-axis').value='0';
  $('canvas-hint').textContent=mode==='triangle'?'Drag a vertex':'Drag vertices · Orbit the solid';$('canvas-help').textContent=mode==='triangle'?'Drag a vertex · Scroll to zoom':'Drag a vertex · Drag empty space to orbit · Scroll to zoom';canvas.setAttribute('aria-label',`Draggable ${mode} vertices and center curves. Coordinate controls provide a keyboard alternative.`);
  $('preset').replaceChildren(...presets[mode].map((q,i)=>{const o=document.createElement('option');o.value=i;o.textContent=q.name;return o;}));
  renderVertexEditor();updatePowerUI();fit();geometryChanged();
}
function moveVector(dx,dy){
  const b=basis(),u=dx/camera.scale,v=-dy/camera.scale,plane=$('drag-plane').value;
  if(state.mode==='triangle'||plane==='view')return b.right.map((q,k)=>u*q+v*b.up[k]).slice(0,state.vertices[0].length);
  const axes=plane==='xy'?[0,1]:plane==='xz'?[0,2]:[1,2],[i,j]=axes,det=b.right[i]*b.up[j]-b.right[j]*b.up[i];
  if(Math.abs(det)<.015){toast('This drag plane is edge-on. Orbit the tetrahedron or choose View plane.');return null;}
  const result=[0,0,0];result[i]=(u*b.up[j]-v*b.right[j])/det;result[j]=(v*b.right[i]-u*b.up[i])/det;return result;
}
function pointerLocation(event){const r=canvas.getBoundingClientRect();return [event.clientX-r.left,event.clientY-r.top];}
canvas.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;stopAnimation();canvas.focus();const p=pointerLocation(event),hits=state.vertices.map((v,i)=>({i,dist:norm(sub(project(v).slice(0,2),p))})).filter(q=>q.dist<19).sort((a,b)=>a.dist-b.dist),hit=hits[0];
  drag={pointer:event.pointerId,start:p,last:p,vertex:hit?.i,vertices:clone(state.vertices),target:[...camera.target],yaw:state.yaw,pitch:state.pitch};
  if(hit){state.selected=hit.i;state.baseline=clone(state.vertices);state.probeVertex=hit.i;renderVertexEditor();}
  canvas.setPointerCapture(event.pointerId);canvas.classList.add('dragging');draw();
});
canvas.addEventListener('pointermove',event=>{
  if(!drag){const p=pointerLocation(event);canvas.style.cursor=state.vertices.some(v=>norm(sub(project(v).slice(0,2),p))<19)?'grab':state.mode==='tetrahedron'?'move':'default';return;}
  const p=pointerLocation(event),dx=p[0]-drag.start[0],dy=p[1]-drag.start[1];
  if(drag.vertex!==undefined){const delta=moveVector(dx,dy);if(!delta)return;state.vertices[drag.vertex]=drag.vertices[drag.vertex].map((q,k)=>q+delta[k]);geometryChanged({defer:true});}
  else if(state.mode==='tetrahedron'){state.yaw=drag.yaw+dx*.008;state.pitch=Math.max(-1.5,Math.min(1.5,drag.pitch+dy*.008));draw();}
  else {const delta=moveVector(dx,dy);camera.target=drag.target.map((q,k)=>q-(delta[k]||0));draw();}
  drag.last=p;
});
function endDrag(){if(!drag)return;const moved=drag.vertex!==undefined;drag=null;canvas.classList.remove('dragging');if(moved){requestPoint();requestCurve();}}
canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);
canvas.addEventListener('wheel',event=>{event.preventDefault();camera.scale=Math.max(8,Math.min(20000,camera.scale*Math.exp(-event.deltaY*.001)));draw();},{passive:false});
canvas.addEventListener('keydown',event=>{
  const keys={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!keys[event.key])return;event.preventDefault();const pixels=(event.shiftKey?.1:.02)*camera.scale,delta=moveVector(keys[event.key][0]*pixels,keys[event.key][1]*pixels);if(!delta)return;state.baseline=clone(state.vertices);state.probeVertex=state.selected;state.vertices[state.selected]=state.vertices[state.selected].map((q,k)=>q+delta[k]);geometryChanged();
});
for(const mode of ['triangle','tetrahedron'])$(mode+'-mode').onclick=()=>setMode(mode);
$('preset').onchange=()=>{stopAnimation();const preset=presets[state.mode][Number($('preset').value)];state.vertices=clone(preset.v);clearProbe();if(preset.p)state.p=preset.p;renderVertexEditor();updatePowerUI();fit();geometryChanged();};
$('reset').onclick=()=>{stopAnimation();const i=Number($('preset').value)||0;state.vertices=clone(presets[state.mode][i].v);clearProbe();renderVertexEditor();fit();geometryChanged();};
$('power-slider').oninput=()=>setPower(Number($('power-slider').value));$('power-number').onchange=()=>setPower(Number($('power-number').value));
document.querySelectorAll('[data-power]').forEach(button=>button.onclick=()=>setPower(Number(button.dataset.power)));
$('play').onclick=animate;
for(const id of ['show-atomic','show-hull','show-curves','show-inset'])$(id).onchange=()=>{draw();drawChart();};
$('quality').onchange=()=>{state.quality=$('quality').value;geometryChanged();};
$('zoom-in').onclick=()=>{camera.scale=Math.min(20000,camera.scale*1.35);draw();};$('zoom-out').onclick=()=>{camera.scale=Math.max(8,camera.scale/1.35);draw();};$('fit').onclick=()=>fit();
$('focus').onclick=()=>{const points=curvePoints();if(points.length)fit(points,.6);else toast('Wait for the centers to finish calculating.');};
$('view-front').onclick=()=>{state.yaw=state.pitch=0;fit();};
$('chart-axis').onchange=drawChart;
chart.addEventListener('pointerdown',event=>{if(!chartBounds)return;const x=event.clientX-chart.getBoundingClientRect().left;setPower(minimum()+(x-chartBounds.left)/(chartBounds.right-chartBounds.left)*(LIMITS[state.mode]-minimum()));});
chart.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();setPower(state.p+(event.key==='ArrowRight'?1:-1)*(event.shiftKey?.5:.05));});
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('export-png').onclick=()=>canvas.toBlob(blob=>blob&&download(blob,`power-centers-${state.mode}-p${state.p.toFixed(3)}.png`));
$('export-csv').onclick=()=>{
  if(!state.curveComplete){toast('The full curves are still calculating. Try the export again shortly.');return;}
  const d=state.vertices[0].length,header=['p',...['atomic','hull'].flatMap(kind=>['x','y','z'].slice(0,d).map(axis=>kind+'_'+axis).concat(kind+'_converged'))],rows=state.curves.map(pair=>[pair.p,...['atomic','hull'].flatMap(kind=>[...pair[kind].center,pair[kind].converged])].join(','));
  download(new Blob([header.join(',')+'\n'+rows.join('\n')+'\n'],{type:'text/csv;charset=utf-8'}),`power-centers-${state.mode}.csv`);
};
$('share').onclick=async()=>{
  const shared={mode:state.mode,p:state.p,vertices:state.vertices,yaw:state.yaw,pitch:state.pitch};const url=new URL(location.href);url.hash=encodeURIComponent(JSON.stringify(shared));
  history.replaceState(null,'',url);
  try{await navigator.clipboard.writeText(url.href);toast('Link copied. It includes your shape and power.');}catch{toast('Your shape is saved in the address bar. Copy the address to share it.');}
};
function restore(){
  if(!location.hash)return false;try{const q=JSON.parse(decodeURIComponent(location.hash.slice(1))),d=q.mode==='triangle'?2:q.mode==='tetrahedron'?3:0;if(!d||!Number.isFinite(q.p)||!Array.isArray(q.vertices)||q.vertices.length!==d+1||q.vertices.some(v=>!Array.isArray(v)||v.length!==d||v.some(n=>!Number.isFinite(n)||Math.abs(n)>10000)))throw Error();state.mode=q.mode;state.vertices=q.vertices;state.p=Math.max(RANGE_MIN[q.mode],Math.min(q.p,LIMITS[q.mode]));if(Number.isFinite(q.yaw))state.yaw=q.yaw;if(Number.isFinite(q.pitch))state.pitch=Math.max(-1.5,Math.min(1.5,q.pitch));return true;}catch{toast('The shared shape could not be read. Showing the default triangle.');return false;}
}
function etcOverlays(){
  if(!etcData||state.mode!=='triangle')return [];const row=sampledRanking(etcData,state.p),choice=$('etc-overlay').value;if(!row||choice==='none')return [];
  return ['atomic','hull'].flatMap(kind=>choice==='both'||choice===kind?row[kind].map((q,rank)=>({...q,kind,rank,color:ETC_COLORS[kind][rank],center:etcCenter(q.X,state.vertices,etcData.formulas)})).filter(q=>q.center):[]);
}
function updateETC(){
  if(!etcData||state.mode!=='triangle')return;
  const row=sampledRanking(etcData,state.p);$('etc-results').hidden=!row;$('etc-empty').hidden=!!row;
  if(!row){const nearest=closestSample(etcData,state.p);$('etc-empty').textContent=`No precomputed comparison at p = ${fmt(state.p)}. Choose one of the 33 sampled powers above; the closest is ${fmt(nearest.p)}. Rankings are not interpolated.`;$('etc-power').value='';return;}
  $('etc-power').value=String(row.p);
  const D=Math.max(...state.vertices.map((v,i)=>norm(sub(v,state.vertices[(i+1)%3]))));
  for(const kind of ['atomic','hull']){
    const tbody=$(kind+'-etc');tbody.replaceChildren();
    row[kind].forEach((q,rank)=>{const tr=document.createElement('tr'),cell=document.createElement('td'),link=document.createElement('a'),key=document.createElement('span');key.className='key';key.style.background=ETC_COLORS[kind][rank];link.href=etcURL(q.X);link.target='_blank';link.rel='noopener';link.textContent='X('+q.X+')';cell.append(key,link);tr.append(cell);
      const response=etcData.attractivity.records[q.X],badge=document.createElement('span');badge.className='etc-status '+(response.status==='certified failure'?'failure':response.status==='proved attractive'?'proved':'sampled');badge.textContent=response.status==='certified failure'?'Proved failure':response.status==='proved attractive'?'Proved attractive':'No sampled failure';badge.title=`Independent of p. Minimum sampled symmetric response eigenvalue: ${response.minimum_eigenvalue}. ${response.status==='no sampled failure'?'983 proper triangles; universal attractivity remains unproved.':''}`;cell.append(badge);
      if(response.witness){const button=document.createElement('button');button.className='etc-witness-button';button.textContent='Show failure';button.type='button';button.onclick=()=>showETCWitness(q.X,kind,response.witness);cell.append(button);}
      const point=etcCenter(q.X,state.vertices,etcData.formulas),center=state.pair?.[kind],here=point&&center?.converged&&D?100*norm(sub(point,center.center))/D:null;
      for(const value of [100*q.training_rms,q.validation_rms===null?null:100*q.validation_rms,here]){const td=document.createElement('td');td.textContent=value===null?'—':value<1e-9?'0':value.toFixed(3);tr.append(td);}tr.title=`Training maximum ${100*q.training_max}% of diameter; validation maximum ${q.validation_max===null?'unresolved':100*q.validation_max+'%'}. ${point?'':'ETC formula is undefined on this shape.'}`;tbody.append(tr);
    });
  }
  $('etc-identity').hidden=Math.abs(state.p-2)>1e-10;
  updateETCWitness();
}
function showETCWitness(id,kind,witness){
  stopAnimation();etcWitness={id,kind,...clone(witness),original:clone(witness.vertices)};state.vertices=clone(witness.vertices);state.selected=witness.vertex;$('etc-overlay').value=kind;$('etc-witness').hidden=false;geometryChanged();fit();updateETCWitness();
}
function updateETCWitness(){
  if(!etcWitness)return;const q=etcWitness,current=etcResponse(q.id,state.vertices,etcData.formulas);
  $('etc-witness-text').textContent=`X(${q.id}) has a certified finite failure: move vertex ${'ABC'[q.vertex]} by ${coords(q.h)}. The exact dot product divided by squared motion is at most ${q.normalized_dot_upper.toPrecision(7)}. ${current?'The minimum local response eigenvalue on this triangle is '+Math.min(...current.minimumEigenvalues).toPrecision(6)+'.':'Its formula is undefined on this triangle.'} The certificate concerns the stored witness; dragging lets you explore other shapes.`;
}
$('etc-witness-move').onclick=()=>{if(!etcWitness)return;state.vertices=clone(etcWitness.original);state.vertices[etcWitness.vertex]=state.vertices[etcWitness.vertex].map((x,k)=>x+etcWitness.h[k]);geometryChanged();};
$('etc-witness-reset').onclick=()=>{if(!etcWitness)return;state.vertices=clone(etcWitness.original);geometryChanged();fit();};
$('etc-power').onchange=()=>{if($('etc-power').value)setPower(Number($('etc-power').value));};
$('etc-overlay').onchange=draw;
fetch(new URL('../data/etc-matches.json',import.meta.url)).then(response=>{if(!response.ok)throw Error('ETC data could not be loaded');return response.json();}).then(data=>{
  etcData=data;$('etc-power').replaceChildren();const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Choose a sampled power';$('etc-power').append(placeholder);
  for(const q of data.powers){const option=document.createElement('option');option.value=String(q.p);option.textContent=Math.abs(q.p-P_MIN)<1e-10?'4 − 2√2':q.p===65/64?'65/64 = 1.015625':fmt(q.p);$('etc-power').append(option);}
  updateETC();draw();
}).catch(error=>{$('etc-empty').textContent=error.message;$('etc-empty').hidden=false;});
try{createWorkers();const restored=restore();resize();setMode(state.mode,{reset:!restored});new ResizeObserver(resize).observe(canvas);new ResizeObserver(resize).observe(chart);}catch(error){setStatus('The explorer could not start: '+error.message,true);}
