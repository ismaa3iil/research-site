'use strict';
const $=s=>document.querySelector(s),NS='http://www.w3.org/2000/svg',M=window.TCMath;
const presets={345:[[0,0],[4,0],[0,3]],equilateral:[[-1,0],[1,0],[0,Math.sqrt(3)]],acute:[[-1,0],[1,0],[.35,1.55]],obtuse:[[-1,0],[1,0],[1.35,.65]],thin:[[-1,0],[1,0],[.45,.15]]};
const classicalNames=['Incenter','Area centroid','Circumcenter','Orthocenter','Nine-point center','Symmedian point','Gergonne point','Nagel point','Mittenpunkt','Wire centroid','Feuerbach point','Harmonic conjugate of X11','First isogonic point','Second isogonic point','First isodynamic point','Second isodynamic point','First Napoleon point','Second Napoleon point','Clawson point','De Longchamps point'];
let DATA=null,vertices=presets['345'].map(p=>p.slice()),selected=new Set(['X1','X2','X10','Q0','F1']),objects=new Set(['steiner','axes','incircle']),focused='Q0',neighborsOn=false,comparisons=new Set(['Q0','F1','X1','X2','X10']),fpNeighborSources=new Set(),comparisonPalette=new Map(),camera=null,view='geometry',drag=null,shapeCache=new Map(),chartHover=null;
const color=id=>({X1:'#ac741a',X2:'#163e51',X10:'#14635b',X360:'#624aae',Q0:'#a64276',Q0m:'#b64f2c',F1:'#386abe',E0:'#b1483d',E1:'#654aa5',M1:'#8b5a24'}[id]||'hsl('+([...id].reduce((a,c)=>a*31+c.charCodeAt(0),0)>>>0)%360+' 57% 38%)');
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=x=>x===null||!Number.isFinite(x)?'—':Math.abs(x)<1e-10?'0':Number(x.toPrecision(5)).toString();
const title=id=>id.startsWith('X')?(classicalNames[+id.slice(1)-1]||(+id.slice(1)===360?'Angle-weighted centroid':'ETC neighbor '+id)):(DATA?.catalog[id]?.title||id);
function element(tag,attrs={},parent){let e=document.createElementNS(NS,tag);for(let[k,v]of Object.entries(attrs))e.setAttribute(k,v);if(parent)parent.appendChild(e);return e;}
function svg(tag,attrs={},parent=$('#triangle')){return element(tag,attrs,parent);}
function check(label,id,set,parent,callback=render){let e=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.dataset.center=id;c.checked=set.has(id);c.addEventListener('change',()=>{c.checked?set.add(id):set.delete(id);callback();});let dot=document.createElement('span');dot.className='swatch';dot.style.background=color(id);e.append(c,dot,document.createTextNode(label));parent.appendChild(e);}
function pointResult(id){if(shapeCache.has(id))return shapeCache.get(id);let result;if(id.startsWith('X'))result={point:M.classical(id,vertices,DATA),method:'Direct ETC center function'};else if(DATA.catalog[id]?.alias)result={point:M.classical(DATA.catalog[id].alias,vertices,DATA),method:'Exact identity: '+DATA.catalog[id].alias};else if(id==='M1')result={point:M.liveM1(vertices),method:'Live finite-wire field minimization (numerical)'};else if(id==='Illum')result={point:M.liveIllum(vertices),method:'Live illumination stationarity solve (numerical)'};else result=M.interpolate(id,vertices,DATA);shapeCache.set(id,result);return result;}
function neighborIds(){return DATA.catalog[focused].neighbors.map(n=>'X'+n.X);}
function activeIds(){return [...new Set([...selected,...(neighborsOn?neighborIds():[])])];}
function fitCamera(include=false){let points=vertices.slice();if(include&&DATA)for(let id of activeIds()){let p=pointResult(id).point;if(p&&M.norm(M.sub(p,vertices[0]))<M.geometry(vertices).D*30)points.push(p);}let x=points.map(p=>p[0]),y=points.map(p=>p[1]),dx=Math.max(...x)-Math.min(...x),dy=Math.max(...y)-Math.min(...y);camera={scale:Math.min(730/Math.max(dx,.001),480/Math.max(dy,.001)),cx:(Math.min(...x)+Math.max(...x))/2,cy:(Math.min(...y)+Math.max(...y))/2};}
function toScreen(p){return [450+(p[0]-camera.cx)*camera.scale,337-(p[1]-camera.cy)*camera.scale];}
function fromScreen(p){return [camera.cx+(p[0]-450)/camera.scale,camera.cy-(p[1]-337)/camera.scale];}
function segment(p,q,attrs){p=toScreen(p);q=toScreen(q);return svg('line',{x1:p[0],y1:p[1],x2:q[0],y2:q[1],...attrs});}
function circle(p,r,col){p=toScreen(p);svg('circle',{cx:p[0],cy:p[1],r:r*camera.scale,fill:'none',stroke:col,'stroke-width':1.8});}
function ellipse(S,center,factor,col,dashed=false,axes=false){let e=M.eig2(S),r=e.values.map(x=>Math.sqrt(Math.max(0,x)*factor)),p=toScreen(center);if(!axes)svg('ellipse',{cx:p[0],cy:p[1],rx:r[0]*camera.scale,ry:r[1]*camera.scale,transform:'rotate('+(-e.angle*180/Math.PI)+' '+p.join(' ')+')',fill:'none',stroke:col,'stroke-width':2,'stroke-dasharray':dashed?'7 5':''});else {if(Math.abs(e.values[0]-e.values[1])<1e-10*M.geometry(vertices).D**2)return;for(let[j,th]of[[0,e.angle],[1,e.angle+Math.PI/2]])segment(M.add(center,M.mul([Math.cos(th),Math.sin(th)],-r[j])),M.add(center,M.mul([Math.cos(th),Math.sin(th)],r[j])),{stroke:col,'stroke-width':1.2,'stroke-dasharray':'7 5'});}}
function render(){if(!DATA)return;if(presets[$('#preset').value]&&JSON.stringify(vertices)!==JSON.stringify(presets[$('#preset').value]))$('#preset').value='custom';let g=M.geometry(vertices),root=$('#triangle');root.replaceChildren();shapeCache.clear();if(!camera)fitCamera();let pts=vertices.map(toScreen);
 let defs=svg('defs'),pat=element('pattern',{id:'grid',width:40,height:40,patternUnits:'userSpaceOnUse'},defs);element('path',{d:'M40 0H0V40',fill:'none',stroke:'#e8eeed','stroke-width':.7},pat);svg('rect',{width:900,height:660,fill:'url(#grid)'});
 svg('polygon',{points:pts.map(p=>p.join(',')).join(' '),fill:'#e9f4f0b0',stroke:'#173d4c','stroke-width':2.6});
 $('#shapeinfo').textContent=g.valid?'Sides '+g.a.map(fmt).join(' · ')+'  |  Angles '+g.angles.map(t=>(t*180/Math.PI).toFixed(1)+'°').join(' · '):'Degenerate triangle — centers are undefined';
 if(g.valid){let G=M.weighted([1,1,1],vertices),I=M.weighted(g.a,vertices),O=M.classical('X3',vertices,DATA),H=M.classical('X4',vertices,DATA),areaCov=M.covariance(vertices);
 if(objects.has('incircle'))circle(I,g.area/g.s,'#ac741a');
 if(objects.has('circumcircle')&&O)circle(O,M.norm(M.sub(O,vertices[0])),'#728bb2');
 if(objects.has('euler')&&O&&H){let d=M.sub(H,O),len=M.norm(d);if(len>g.D*1e-8){segment(M.add(G,M.mul(d,-5*g.D/len)),M.add(G,M.mul(d,5*g.D/len)),{stroke:'#8f6f9b','stroke-width':1.6,'stroke-dasharray':'10 5'});}else svg('text',{x:24,y:30,fill:'#586675','font-size':16}).textContent='Equilateral: the Euler line has no unique direction';}
 if(objects.has('steiner'))ellipse(areaCov.matrix,G,2,'#0d736d');
 if(objects.has('axes'))ellipse(areaCov.matrix,G,2,'#0d736d',false,true);
 if(objects.has('wireellipse')){let S=M.covariance(vertices,true);ellipse(S.matrix,S.center,2,'#bf745d',true);ellipse(S.matrix,S.center,2,'#bf745d',false,true);}
 if(objects.has('foci')){let e=M.eig2(areaCov.matrix),f=Math.sqrt(Math.max(0,2*(e.values[0]-e.values[1])));for(let sign of[-1,1]){let p=toScreen(M.add(G,M.mul([Math.cos(e.angle),Math.sin(e.angle)],f*sign)));svg('path',{d:'M'+(p[0]-5)+' '+p[1]+'L'+p[0]+' '+(p[1]-5)+'L'+(p[0]+5)+' '+p[1]+'L'+p[0]+' '+(p[1]+5)+'Z',fill:'#0d736d'});}}
 let rows=[],occupied=[];
 for(let id of activeIds()){let r=pointResult(id),p=r.point,inside=p?M.bary(p,vertices).every(t=>t>=-1e-8):false,visible=p&&toScreen(p).every((q,k)=>q>=10&&q<=[890,650][k]);rows.push({id,r,inside,visible});if(!p||!visible)continue;let q=toScreen(p),neighbor=neighborsOn&&!selected.has(id);svg('circle',{cx:q[0],cy:q[1],r:neighbor?4.5:6,fill:neighbor?'white':color(id),stroke:color(id),'stroke-width':2}).appendChild(element('title'));root.lastChild.lastChild.textContent=id+' · '+title(id)+'\n'+r.method;
 if($('#labels').checked){let label=[q[0]+11,q[1]-11];for(let count=0;count<22&&occupied.some(z=>Math.abs(z[0]-label[0])<65&&Math.abs(z[1]-label[1])<21);count++)label[1]+=22;label[0]=Math.min(825,Math.max(20,label[0]));label[1]=Math.min(638,Math.max(22,label[1]));occupied.push(label);if(M.norm(M.sub(label,q))>30)svg('line',{x1:q[0],y1:q[1],x2:label[0]-3,y2:label[1]-6,stroke:color(id),'stroke-width':.7,opacity:.65});svg('text',{x:label[0],y:label[1],fill:color(id),'font-size':16,'font-weight':650,'paint-order':'stroke',stroke:'white','stroke-width':4}).textContent=id+(r.method.includes('interpolation')?' ≈':'');}}
 $('#readout').innerHTML='<div class="table-scroll"><table><thead><tr><th>Center</th><th>Position (x, y)</th><th>Barycentrics (A : B : C)</th><th>Evaluation</th></tr></thead><tbody>'+rows.map(({id,r,inside,visible})=>'<tr><td><button class="center-link" data-theory="'+escape(id)+'" style="color:'+color(id)+'">'+escape(id)+'</button></td><td>'+ (r.point?r.point.map(fmt).join(', '):'Unavailable')+(!visible&&r.point?' · outside view':'')+'</td><td>'+(r.point?M.bary(r.point,vertices).map(fmt).join(' : '):'—')+'</td><td>'+escape(r.method)+(r.refinement!=null?'<br><small>Last solver change / D: '+fmt(r.refinement)+'; interpolation error not bounded</small>':'')+'</td></tr>').join('')+'</tbody></table></div>';
 $('#readout').querySelectorAll('[data-theory]').forEach(b=>b.onclick=()=>{showTheory(b.dataset.theory);setView('theory');});
 $('#axis-note').textContent='Steiner: shape matrix = 2Σarea. Principal-axis directions '+(Math.max(...g.angles)-Math.min(...g.angles)<1e-7?'are undefined at equilateral.':'coincide with those of the uniform lamina.')+' The dashed wire covariance ellipse need not touch the sides.';
 }else{$('#readout').textContent='Move a vertex away from the line to restore the triangle.';$('#axis-note').textContent='';}
 pts.forEach((p,i)=>{let e=svg('circle',{cx:p[0],cy:p[1],r:12,fill:'white',stroke:'#173d4c','stroke-width':3,tabindex:0,'aria-label':'Vertex '+String.fromCharCode(65+i)+', arrow keys move this vertex',class:'vertex','data-vertex':i});svg('text',{x:p[0]+18,y:p[1]-15,fill:'#173d4c','font-size':20,'font-weight':650}).textContent=String.fromCharCode(65+i);e.onpointerdown=ev=>{ev.preventDefault();root.setPointerCapture(ev.pointerId);drag={i,id:ev.pointerId};};e.onkeydown=ev=>{let dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]},d=dirs[ev.key];if(d){ev.preventDefault();vertices[i]=M.add(vertices[i],M.mul(d,Math.max(g.D,.1)*(ev.shiftKey?.02:.002)));render();root.querySelector('[data-vertex="'+i+'"]').focus();}};});
 updateCoordinateInputs();$('#selected-count').textContent=selected.size+' selected';
}
function setView(v){view=v;document.querySelectorAll('nav button,.view').forEach(e=>e.classList.remove('active'));$('nav [data-view="'+v+'"]').classList.add('active');$('#'+v).classList.add('active');if(v==='fingerprints')renderFingerprints();if(v==='theory'&&!$('#theory-content').hasChildNodes())showTheory(focused);}
function updateCoordinateInputs(){document.querySelectorAll('[data-coord]').forEach(e=>{if(document.activeElement!==e){let[i,k]=e.dataset.coord.split(',').map(Number);e.value=vertices[i][k].toFixed(5);}});}
function picker(sel,all=true){let groups={};for(let[id,c]of Object.entries(DATA.catalog))(groups[c.group]??=[]).push([id,c.title]);if(all)groups['Classical & ETC']=[...Array.from({length:20},(_,i)=>['X'+(i+1),classicalNames[i]]),['X360','Angle-weighted centroid'],...Object.keys(DATA.etc).filter(k=>+k>20&&+k!==360).map(k=>['X'+k,'ETC neighbor'])];sel.innerHTML=Object.entries(groups).map(([g,rs])=>'<optgroup label="'+escape(g)+'">'+rs.map(([id,t])=>'<option value="'+id+'">'+escape(id+' · '+t)+'</option>').join('')+'</optgroup>').join('');}
function status(id){let text=DATA.catalog[id]?.attract||'';if(['E4','S3','S4','M3'].includes(id))return ['proven','Proven attractive'];if(['E0','E1','E2','M1'].includes(id))return ['negative','Certified nonattractive'];if(['Q0','Q1','Q2','Q3','Q4','E3','Bio1.1','Illum','M2','M4','M5','M7','L3','L4','Dark1.0b8.0','Dark2.0b8.0','Dark4.0b8.0','Persist8.0'].includes(id)||id.startsWith('H'))return ['evidence','Numerical negative evidence'];if(id==='M6'||id.startsWith('Abs')||text.includes('No negative response was found')||text.includes('No violation')||text.includes('No failure found')||text.includes('coarse screen has no negative'))return ['open','Positive screens · open'];return ['open','Attractivity unresolved'];}
function math(tex,display=true){let e=document.createElement('div');e.className='math';try{katex.render(tex,e,{displayMode:display,throwOnError:false,strict:'ignore'});}catch{e.textContent=tex;}return e.outerHTML;}
function renderInlineMath(){if(typeof renderMathInElement==='function')renderMathInElement($('#theory-content'),{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false,strict:'ignore',ignoredClasses:['katex']});}
function metric(r,names){for(let name of names)if(r[name]!=null)return fmt(r[name]);return '—';}
function neighborTable(id){let rs=DATA.catalog[id].neighbors;return '<div class="table-scroll"><table><thead><tr><th>ETC neighbor</th><th>Grid RMS / D</th><th>Holdout RMS / D</th><th>Derivative RMS</th></tr></thead><tbody>'+rs.map(r=>'<tr><td><a href="https://faculty.evansville.edu/ck6/encyclopedia/part1.html" target="_blank" rel="noopener">X'+r.X+'</a></td><td>'+metric(r,['grid_rms_D','grid_rms'])+'</td><td>'+metric(r,['holdout_rms_D','holdout_rms'])+'</td><td>'+metric(r,['fingerprint_derivative_rms','family_derivative_rms','family_derivative_rms_difference','fingerprint_derivative_rms_difference'])+'</td></tr>').join('')+'</tbody></table></div><p class="hint">Three lowest sampled location RMS errors, normalized by the longest side D. The survey visits 72,807 cached entries; 70,853 are finite on the common 100-shape grid and 1,954 are excluded. Forty independent holdouts test the shortlist. Closeness does not establish identity or matching attractivity. Missing cells mean no reported value.</p>';}
const certificateLinks={E0:'E0_interval_certificate.json',E1:'E1_interval_certificate.json',E2:'E2_interval_certificate.json',M1:'M1_certificate.json'};
function showTheory(id){if(!DATA)return;let c=DATA.catalog[id];if(c){focused=id;$('#focus').value=id;$('#theory-select').value=id;updateNeighbors();let[s,label]=status(id);$('#theory-content').innerHTML='<div class="theory-heading"><span class="center-id" style="color:'+color(id)+'">'+escape(id)+'</span><div><h2>'+escape(c.title)+'</h2><span class="badge '+s+'">'+label+'</span></div></div><div class="theory-grid"><article><h3>Physical experiment</h3><p>'+escape(c.scenario)+'</p><h3>The mathematical center</h3>'+math(c.equation)+'<h3>Numerical treatment</h3><p>'+escape(c.algorithm)+'</p><p class="hint">'+(c.alias?'This selector is exactly '+escape(c.alias)+'.':id==='M1'||id==='Illum'?'The geometry lab solves this definition directly in the browser.':'The geometry lab interpolates the archived barycentric locations on a triangulation of ordered-angle shape space. It does not rerun the continuum solver. No extrapolation is allowed.')+'</p></article><article><h3>Location & uniqueness</h3><p>'+escape(c.location)+'</p><h3>Response to vertex motion</h3><p>'+escape(c.attract)+'</p>'+(certificateLinks[id]?'<a class="text-link" href="certificates/'+certificateLinks[id]+'" download>Download the retained certificate / proof record ↗</a>':'')+'<h3>Qualifications</h3><p>'+escape(c.extra||'No additional qualifications recorded.')+'</p></article></div><h3>Its three ETC neighbors</h3>'+neighborTable(id)+'<div class="actions"><button id="theory-overlay">Show this center + neighbors</button><button id="theory-compare">Compare its fingerprints</button></div>';$('#theory-overlay').onclick=()=>{selected.add(id);neighborsOn=true;$('#neighbors').checked=true;renderChecks();render();setView('geometry');};$('#theory-compare').onclick=()=>{comparisons=new Set([id,'X1','X2','X10']);fpNeighborSources=new Set([id]);setView('fingerprints');};}
 else{$('#theory-select').value='';let n=+id.slice(1),description={1:'The point of maximum distance from the boundary is the incenter. It is also the center of the incircle, and the small-time heat-maximum limit.',2:'A uniform triangular lamina, an immobile uniform area charge, and the area average of an observable have the centroid. Its covariance eigenvectors define the principal axes; the Steiner inellipse has shape matrix twice the area covariance.',3:'The circumcenter is equidistant from the three vertices. It may lie outside an obtuse triangle.',4:'The orthocenter is the concurrence of the three altitudes. Together with the centroid and circumcenter it defines the Euler line.',10:'The centroid of uniform arc length on the perimeter has barycentric weights b+c : c+a : a+b. Equal boundary-distance cutoffs of the singular loop-field means also give X10.',13:'The first isogonic center minimizes the sum of distances to the vertices when every angle is less than 120°. For an angle at least 120°, the physical distance minimizer is that vertex; the algebraic ETC point must not be substituted blindly.',360:'The angle-weighted center has barycentrics A : B : C. Equal axial vertex currents with equal circular core cutoffs give M3 = X360. It is proven globally attractive.'}[n]||'This center is evaluated from its cyclic barycentric center function in the local ETC snapshot. Exceptional triangles can make a formula singular or send a center to infinity.';
 $('#theory-content').innerHTML='<div class="theory-heading"><span class="center-id" style="color:'+color(id)+'">'+escape(id)+'</span><h2>'+escape(title(id))+'</h2></div><p>'+escape(description)+'</p>'+([1,2,10,360].includes(n)?'<span class="badge proven">Proven attractive</span>':'<span class="badge open">No global attractivity claim in this interface</span>')+'<h3>Barycentric center function</h3><p>A point has weights f(a,b,c) : f(b,c,a) : f(c,a,b), normalized by their sum. Here a=|BC|, b=|CA| and c=|AB|.</p><pre class="formula-code">'+escape(DATA.etc[String(n)]?.expression||'Direct geometric evaluation')+'</pre><a href="https://faculty.evansville.edu/ck6/encyclopedia/part1.html" target="_blank" rel="noopener">Clark Kimberling’s Encyclopedia of Triangle Centers ↗</a>';}
 renderInlineMath();
}
function updateNeighbors(){let c=DATA.catalog[focused];$('#neighbor-note').textContent=neighborIds().join(' · ')+' — closest by sampled location';$('#focus').value=focused;}
function renderChecks(){document.querySelectorAll('#classical [data-center],#pitcs [data-center]').forEach(e=>e.checked=selected.has(e.dataset.center));}

const comparisonColor=id=>comparisonPalette.get(id)||color(id);
function comparisonIds(){
 for(let id of [...fpNeighborSources])if(!comparisons.has(id))fpNeighborSources.delete(id);
 return [...new Set([...comparisons,...[...fpNeighborSources].flatMap(id=>DATA.catalog[id]?.neighbors.map(n=>'X'+n.X)||[])])];
}
function neighborSourcesFor(id){return [...fpNeighborSources].filter(source=>DATA.catalog[source].neighbors.some(n=>'X'+n.X===id));}
const fpCurveCache=new Map();
function rawSeriesFor(id,index,eps){
 let alias=DATA.catalog[id]?.alias;if(alias)id=alias;
 let profile=DATA.profiles[id];if(!profile)return [];
 let family=index<2?'iso':index<6?'right':'thin';
 if(family==='thin')return profile.thin.filter(r=>Math.abs(r[1]-eps)<1e-8).sort((a,b)=>a[0]-b[0]).map(r=>[r[0],r[2]?.[0]??null]);
 return profile[family].map(r=>[r[0],(index===0?r[1]?.[1]:index===1?r[2]?.[1]:index===2?r[1]?.[0]:index===3?r[1]?.[1]:index===4?r[2]?.[0]:r[2]?.[1])??null]);
}
function angularSettings(){return {minimum:+$('#angle-min').value,maximum:+$('#angle-max').value,derivative:$('#derivative-mode').value};}
function plotTitle(index){
 let response=$('#derivative-mode').value==='angle'?'dθ':'dh';
 return ['Isosceles · vertical position cᵧ(θ)','Isosceles · response dcᵧ/'+response,'Right · horizontal position cₓ(θ)','Right · vertical position cᵧ(θ)','Right · response dcₓ/'+response,'Right · response dcᵧ/'+response,'Thin triangle · longitudinal position cₓ(x)'][index];
}
function seriesFor(id,index,eps){
 let settings=angularSettings(),key=[id,index,eps,settings.minimum,settings.maximum,settings.derivative].join('|');
 if(fpCurveCache.has(key))return fpCurveCache.get(key);
 let rows;
 if(index<6&&id.startsWith('X')){
  // Evaluate classical curves over the full requested angular range, rather than extrapolating cached profiles.
  rows=Array.from({length:241},(_,i)=>{
   let angle=settings.minimum+(settings.maximum-settings.minimum)*i/240,h=FPMath.toHeight(angle);
   let v=t=>index<2?[[-1,0],[1,0],[0,t]]:[[0,0],[1,0],[0,t]],point=M.classical(id,v(h),DATA),value=null;
   if(point){
    if([1,4,5].includes(index)){
     let step=1e-5*Math.max(h,1),up=M.classical(id,v(h+step),DATA),down=M.classical(id,v(h-step),DATA),component=index===4?0:1;
     if(up&&down)value=(up[component]-down[component])/(2*step);
     if(settings.derivative==='angle'&&value!==null)value=FPMath.perDegree(value,angle);
    }else value=point[index===2?0:1];
   }
   return [angle,Number.isFinite(value)?value:null];
  });
 }else{
  rows=FPMath.transform(rawSeriesFor(id,index,eps),index,settings.derivative);
  if(index<6){
   let lo=settings.minimum,hi=settings.maximum;
   rows=[[lo,FPMath.valueAt(rows,lo)],...rows.filter(r=>r[0]>lo&&r[0]<hi),[hi,FPMath.valueAt(rows,hi)]];
  }
 }
 // Cache only one reasonable working set across repeated range changes.
 if(fpCurveCache.size>1500)fpCurveCache.clear();
 fpCurveCache.set(key,rows);return rows;
}
function comparisonChips(ids){
 $('#comparison-chips').innerHTML=ids.map(id=>{
  let col=comparisonColor(id),sources=neighborSourcesFor(id),primary=comparisons.has(id);
  if(!primary)return '<span class="chip neighbor-chip" style="--chip-color:'+col+'" title="ETC neighbor of '+escape(sources.join(', '))+'"><span class="swatch" style="background:'+col+'"></span>'+escape(id)+' <small>· '+escape(sources.join(', '))+'</small></span>';
  let neighbors=DATA.catalog[id]?.neighbors;
  return '<div class="comparison-chip" style="--chip-color:'+col+'"><button class="chip" data-remove="'+id+'" title="'+escape(title(id))+'" aria-label="Remove '+escape(id)+' from comparison"><span class="swatch" style="background:'+col+'"></span>'+escape(id)+' ×</button>'+
   (neighbors?'<label class="neighbor-toggle" title="'+neighbors.map(n=>'X'+n.X).join(', ')+'"><input type="checkbox" data-neighbors="'+id+'" aria-label="Include three ETC neighbors of '+escape(id)+'"'+(fpNeighborSources.has(id)?' checked':'')+'> +3 ETC</label>':'')+'</div>';
 }).join('');
 $('#comparison-chips').querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{comparisons.delete(b.dataset.remove);fpNeighborSources.delete(b.dataset.remove);renderFingerprints();});
 $('#comparison-chips').querySelectorAll('[data-neighbors]').forEach(c=>c.onchange=()=>{c.checked?fpNeighborSources.add(c.dataset.neighbors):fpNeighborSources.delete(c.dataset.neighbors);renderFingerprints();});
}
function renderFingerprints(){
 if(!DATA)return;
 let ids=comparisonIds(),eps=+$('#epsilon').value,settings=angularSettings(),lo=settings.minimum,hi=settings.maximum;
 if(!Number.isFinite(lo)||!Number.isFinite(hi)||lo<=0||hi>=90||hi<=lo){$('#fp-message').textContent='Choose 0° < minimum angle < maximum angle < 90°.';return;}
 comparisonPalette=FPMath.paletteFor(ids);comparisonChips(ids);
 $('#fp-message').textContent=ids.length+' curves · θ=arctan(h) in degrees · PITCs stop at saved-data limits; no extrapolation'+(settings.derivative==='angle'?' · responses per degree':' · responses dc/dh');
 $('#plots').replaceChildren();
 for(let index=0;index<7;index++){
  let card=document.createElement('article');card.className='plot';card.dataset.plot=index;
  let heading=document.createElement('h3');heading.textContent=plotTitle(index);card.appendChild(heading);
  let root=element('svg',{viewBox:'0 0 640 330',role:'img','aria-label':plotTitle(index)});card.appendChild(root);
  let pts=ids.map(id=>({id,values:seriesFor(id,index,eps)})),ys=pts.flatMap(s=>s.values.filter(r=>r[1]!==null&&Number.isFinite(r[1])).map(r=>r[1]));
  let xm=index===6?0:lo,xM=index===6?1:hi,ym=ys.length?Math.min(...ys):0,yM=ys.length?Math.max(...ys):1;
  if($('#includezero').checked){ym=Math.min(0,ym);yM=Math.max(0,yM);}
  let pad=Math.max((yM-ym)*.08,.005);ym-=pad;yM+=pad;
  let x=t=>65+(t-xm)/(xM-xm)*550,y=t=>280-(t-ym)/(yM-ym)*250;
  for(let i=0;i<=5;i++){
   let xx=xm+(xM-xm)*i/5,yy=ym+(yM-ym)*i/5;
   element('line',{x1:65,y1:y(yy),x2:615,y2:y(yy),stroke:'#e3eae9'},root);
   element('text',{x:57,y:y(yy)+4,'text-anchor':'end','font-size':12,fill:'#526875'},root).textContent=fmt(yy);
   element('text',{x:x(xx),y:301,'text-anchor':'middle','font-size':12,fill:'#526875','data-axis':'x'},root).textContent=fmt(xx)+(index===6?'':'°');
  }
  element('path',{d:'M65 30V280H615',fill:'none',stroke:'#79908d'},root);
  element('text',{x:610,y:324,'text-anchor':'end','font-size':13,fill:'#526875'},root).textContent=index===6?'apex x':'θ = arctan(h) [degrees]';
  for(let {id,values}of pts){
   let d='',connected=false;
   for(let r of values){if(r[1]===null||!Number.isFinite(r[1])){connected=false;continue;}d+=(connected?'L':'M')+x(r[0])+' '+y(r[1])+' ';connected=true;}
   element('path',{d,fill:'none',stroke:comparisonColor(id),'stroke-width':id.startsWith('X')?2:2.8,'stroke-dasharray':id.startsWith('X')?'7 3':'','data-curve':id},root);
   if(!id.startsWith('X'))for(let r of values)if(r[1]!==null&&Number.isFinite(r[1]))element('circle',{cx:x(r[0]),cy:y(r[1]),r:2.6,fill:comparisonColor(id)},root);
  }
  let cursor=element('line',{y1:30,y2:280,stroke:'#173d4c',opacity:0,'stroke-dasharray':'4 4'},root),tip=document.createElement('div');tip.className='plot-tip';tip.setAttribute('aria-live','off');
  tip.innerHTML='<span class="hover-instruction">Hover for values at one shared '+(index===6?'apex x':'angle θ')+'. Click to inspect this triangle.</span>';
  card.appendChild(tip);
  let caption=document.createElement('p');caption.className='plot-caption';caption.textContent=index===6?'Finite ε='+eps+'; this probes the limiting behavior without certifying the limit.':'Readout follows the plotted lines. Missing data and gaps remain unavailable.';card.appendChild(caption);
  function pointerValue(ev){let p=new DOMPoint(ev.clientX,ev.clientY).matrixTransform(root.getScreenCTM().inverse());return Math.min(xM,Math.max(xm,xm+(p.x-65)/550*(xM-xm)));}
  root.addEventListener('pointermove',ev=>{
   let value=pointerValue(ev);cursor.setAttribute('x1',x(value));cursor.setAttribute('x2',x(value));cursor.setAttribute('opacity',.5);
   tip.innerHTML='<strong class="hover-coordinate">'+(index===6?'x = ':'θ = ')+fmt(value)+(index===6?'':'°')+'</strong><div class="hover-values">'+pts.map(s=>{
    let val=FPMath.valueAt(s.values,value);
    return '<span class="hover-value" data-value="'+s.id+'" style="color:'+comparisonColor(s.id)+'"><span class="swatch" style="background:'+comparisonColor(s.id)+'"></span><b>'+escape(s.id)+'</b>: '+(val===null?'unavailable':fmt(val))+'</span>';
   }).join('')+'</div>';
  });
  root.addEventListener('click',ev=>{
   let parameter=pointerValue(ev),h=index===6?parameter:FPMath.toHeight(parameter);
   vertices=index<2?[[-1,0],[1,0],[0,h]]:index<6?[[0,0],[1,0],[0,h]]:[[-1,0],[1,0],[h,eps]];
   selected=new Set(ids);shapeCache.clear();fitCamera();renderChecks();render();setView('geometry');
  });
  let unavailable=pts.filter(s=>!s.values.some(r=>r[1]!==null&&Number.isFinite(r[1]))).map(s=>s.id);
  if(unavailable.length){let p=document.createElement('p');p.className='hint';p.textContent='No values in this range for '+unavailable.join(', ')+'.';card.appendChild(p);}
  $('#plots').appendChild(card);
 }
 renderTaylor(ids);
}
function setupFingerprintControls(){
 $('#fingerprint-controls').innerHTML='<div class="fp-toolbar"><label>Add a center<select id="compare-add"></select></label><button id="add-compare">Add to comparison</button><button id="clear-compare">Clear comparison</button><label>Thin ε<select id="epsilon"><option>0.2</option><option>0.1</option><option>0.05</option><option selected>0.025</option></select></label><label>θ from (°)<input id="angle-min" type="number" value="0.5" min="0.001" max="89.999" step="0.5"></label><label>to (°)<input id="angle-max" type="number" value="89.5" min="0.001" max="89.999" step="0.5"></label></div>'+
 '<div class="fp-toggles"><label class="response-mode">Response units<select id="derivative-mode"><option value="height">dc/dh · per unit height</option><option value="angle">dc/dθ · per degree</option></select></label><label class="inline-check"><input id="includezero" type="checkbox" checked> Include zero on the vertical axes</label><button id="export-data">Export comparison data</button></div><p class="neighbor-help">Use <b>+3 ETC</b> beside any selected PITC to compare its three neighbors. Multiple PITCs can include neighbors at the same time; shared neighbors appear once.</p>'+
 '<div id="comparison-chips" class="chips"></div><p id="fp-message" class="hint"></p><details class="normalizations"><summary>Triangle families and reading the curves</summary>'+
 math('\\theta=\\arctan(h)\\cdot\\frac{180}{\\pi},\\qquad h=\\tan\\!\\left(\\frac{\\pi\\theta}{180}\\right)')+
 math('T_{\\rm iso}(h):(-1,0),(1,0),(0,h)\\qquad T_{\\rm right}(h):(0,0),(1,0),(0,h)')+
 math('\\frac{dc}{d\\theta}=\\frac{dc}{dh}\\,\\frac{\\pi}{180}\\sec^2\\!\\left(\\frac{\\pi\\theta}{180}\\right)')+
 math('T_{\\rm thin}(x,\\epsilon):(-1,0),(1,0),(x,\\epsilon),\\quad0\\le x\\le1')+
 '<p>The first six horizontal axes use θ in degrees, not the apex angle of the isosceles triangle. Response values remain dc/dh by default; the units control converts them to dc/dθ per degree. The default axis spans 0.5°–89.5°. Archived PITCs may cover less of this interval; they are never extrapolated. Classical ETC functions are evaluated across the chosen range. Solid lines and dots are PITC data; dashed lines are ETC functions. Hover values interpolate the displayed line at the one common abscissa, without bridging gaps. Click a graph to inspect its family triangle.</p></details>';
 picker($('#compare-add'));
 $('#add-compare').onclick=()=>{comparisons.add($('#compare-add').value);renderFingerprints();};
 $('#clear-compare').onclick=()=>{comparisons.clear();fpNeighborSources.clear();renderFingerprints();};
 for(let key of ['#epsilon','#angle-min','#angle-max','#derivative-mode','#includezero'])$(key).onchange=renderFingerprints;
 $('#export-data').onclick=()=>{
  let ids=comparisonIds(),eps=+$('#epsilon').value,settings=angularSettings();
  download(JSON.stringify({metadata:DATA.metadata,selected:ids,neighbor_sources:[...fpNeighborSources],epsilon:eps,angular_axis:{definition:'theta=atan(h)*180/pi',degrees_range:[settings.minimum,settings.maximum],response_derivative:settings.derivative==='angle'?'dc/dtheta per degree':'dc/dh'},fingerprints:ids.map(id=>({id,seven_diagrams:Array.from({length:7},(_,i)=>({name:plotTitle(i),abscissa:i===6?'apex x':'theta in degrees',samples:seriesFor(id,i,eps)})),near_equilateral:DATA.catalog[id]?.jet||DATA.jets[id]}))},null,2),'triangle-fingerprint-comparison.json','application/json');
 };
}
function renderTaylor(ids){let rows=ids.map(id=>{let j=DATA.catalog[id]?.jet||DATA.jets[id],z=j?.coefficients;return '<tr><td style="color:'+comparisonColor(id)+'">'+escape(id)+'</td>'+[0,1,2,3,4].map(i=>'<td>'+fmt(z?.[i]??null)+'</td>').join('')+'<td>'+escape(j?.method||'No saved coefficients.')+'</td></tr>';});
 $('#taylor').innerHTML='<h2>Near-equilateral Taylor fingerprint</h2><p>A=(−1,0), B=(1,0), C=(x, √3+y). Reflection symmetry gives the form below for a smooth, unique center.</p>'+math('c_x=a x+bxy+O(\\|(x,y)\\|^3),\\qquad c_y=\\frac{\\sqrt3}{3}+c y+d x^2+e y^2+O(\\|(x,y)\\|^3)')+'<div class="table-scroll"><table><thead><tr><th>Center</th><th>a</th><th>b</th><th>c</th><th>d</th><th>e</th><th>Evidence / limitations</th></tr></thead><tbody>'+rows.join('')+'</tbody></table></div><p class="hint">The linear identity a+c=2/3 follows from similarity covariance when derivatives exist. For records with only a and c, the remainder is O(‖(x,y)‖²). Blank entries mean not determined; Q1, Q2 and Q4 do not have a unique individual-state expansion at equilateral. Numerical coefficients are not symbolic identities or interval certificates.</p>';
}
function download(content,name,type){let a=document.createElement('a'),url=URL.createObjectURL(new Blob([content],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function setup(){document.querySelector('aside h1').textContent='A triangle is a laboratory';document.querySelector('#pitcs').previousElementSibling.remove();$('#classical').replaceChildren();for(let i=1;i<=20;i++)check('X'+i+' · '+classicalNames[i-1],'X'+i,selected,$('#classical'));check('X360 · angle mean','X360',selected,$('#classical'));$('#objects').replaceChildren();for(let[id,label]of[['euler','Euler line'],['steiner','Steiner inellipse'],['axes','Lamina axes'],['incircle','Incircle'],['circumcircle','Circumcircle'],['wireellipse','Wire covariance'],['foci','Steiner foci']])check(label,id,objects,$('#objects'));
 let extra=document.createElement('div');extra.innerHTML='<label class="inline-check"><input id="labels" type="checkbox" checked> Center labels</label><details><summary>Vertex coordinates</summary><div class="coordinates">'+vertices.map((p,i)=>'<label>'+String.fromCharCode(65+i)+' <input data-coord="'+i+',0" type="number" step="0.01" aria-label="Vertex '+String.fromCharCode(65+i)+' x"><input data-coord="'+i+',1" type="number" step="0.01" aria-label="Vertex '+String.fromCharCode(65+i)+' y"></label>').join('')+'</div></details>';$('#objects').after(extra);$('#labels').onchange=render;extra.querySelectorAll('[data-coord]').forEach(e=>e.onchange=()=>{let[i,k]=e.dataset.coord.split(',').map(Number),q=Number(e.value);if(Number.isFinite(q)){vertices[i][k]=q;render();}});
 let filter=document.createElement('label');filter.innerHTML='Physical discipline<select id="discipline"><option value="All">All disciplines</option>'+[...new Set(Object.values(DATA.catalog).map(c=>c.group))].map(g=>'<option>'+g+'</option>').join('')+'</select>';$('#pitcs').before(filter);$('#pitcs').className='pitc-choices';let selectedCount=document.createElement('p');selectedCount.className='hint';selectedCount.id='selected-count';$('#pitcs').before(selectedCount);
 for(let[id,c]of Object.entries(DATA.catalog)){let row=document.createElement('div');row.className='pitc-row';row.dataset.group=c.group;check(id+' · '+c.title,id,selected,row);let b=document.createElement('button');b.textContent='i';b.title='Theory and evidence for '+id;b.setAttribute('aria-label','Theory and evidence for '+id);b.onclick=()=>{showTheory(id);setView('theory');};row.appendChild(b);$('#pitcs').appendChild(row);}
 $('#discipline').onchange=()=>document.querySelectorAll('.pitc-row').forEach(e=>e.hidden=$('#discipline').value!=='All'&&e.dataset.group!==$('#discipline').value);
 let focusbox=document.createElement('div');focusbox.className='neighbor-box';focusbox.innerHTML='<h2>ETC neighbors</h2><label>Physical center <select id="focus"></select></label><label class="inline-check"><input id="neighbors" type="checkbox"> Overlay its three ETC neighbors</label><p id="neighbor-note" class="hint"></p><p class="hint">PITC ≈ markers use atlas interpolation unless the readout says direct solve or exact identity. Attractivity is never inferred from interpolation.</p>';$('#pitcs').after(focusbox);picker($('#focus'),false);$('#focus').onchange=()=>{focused=$('#focus').value;updateNeighbors();render();};$('#neighbors').onchange=()=>{neighborsOn=$('#neighbors').checked;render();};
 let note=document.createElement('p');note.id='axis-note';note.className='hint';$('#readout').after(note);$('#reset').textContent='Fit triangle';$('#reset').onclick=()=>{fitCamera();render();};let fit=document.createElement('button');fit.textContent='Fit selected centers';fit.onclick=()=>{fitCamera(true);render();};$('#reset').after(fit);
 let theorySelect=document.createElement('label');theorySelect.className='theory-picker';theorySelect.innerHTML='Choose a center <select id="theory-select"></select>';$('#theory-content').before(theorySelect);picker($('#theory-select'));$('#theory-select').onchange=()=>showTheory($('#theory-select').value);
 setupFingerprintControls();
 document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{setView(b.dataset.view);});
 $('#preset').onchange=()=>{vertices=presets[$('#preset').value].map(p=>p.slice());shapeCache.clear();fitCamera();render();};$('#export').onclick=()=>download(new XMLSerializer().serializeToString($('#triangle')),'triangle-physics.svg','image/svg+xml');$('#help').onclick=()=>$('#guide').showModal();$('#close-help').onclick=()=>$('#guide').close();
 $('#triangle').onpointermove=ev=>{if(!drag)return;let root=$('#triangle'),p=new DOMPoint(ev.clientX,ev.clientY).matrixTransform(root.getScreenCTM().inverse());vertices[drag.i]=fromScreen([p.x,p.y]);render();};$('#triangle').onpointerup=$('#triangle').onpointercancel=()=>drag=null;
 $('#guide').innerHTML='<button id="close-help">Close</button><h2>Explore a shape, then explore its behavior</h2><p>Drag A, B or C. Keyboard: Tab to a vertex, then use arrow keys; Shift moves farther. Fit triangle resets the camera without changing the shape. Vertex coordinates allow exact examples.</p><h3>Triangle centers and barycentrics</h3><p>A center commutes with rigid motions, uniform scaling and vertex relabeling. Barycentric weights λA:λB:λC give c=(λA A+λB B+λC C)/(λA+λB+λC). Negative weights are permitted for exterior classical centers. ETC is Kimberling’s catalogue of named center functions.</p><h3>Attractivity</h3>'+math('\\delta v\\cdot\\delta c\\ge0')+'<p>Only one vertex moves. For a differentiable center, the symmetric part of each 2×2 vertex Jacobian must be positive semidefinite. Interior location and physical equilibrium stability are different properties. A positive sampled screen is not a proof.</p><h3>Why implicit PITCs need an atlas</h3><p>Many are defined by PDE solutions, equilibrium measures or variational extrema. An implicit definition does not prove transcendence. ETC is not restricted to algebraic functions: X360 uses angles. The atlas supplies numerical behavior, parameter conventions and evidence of uniqueness.</p><h3>Steiner and wire ellipses</h3><p>The Steiner inellipse is centered at X2 and tangent to the three side midpoints. Its shape matrix equals twice the uniform-area covariance. The perimeter also has a covariance ellipse, centered at X10, but generally no matching midpoint-tangent relation. Principal-axis directions are undefined when the covariance is isotropic.</p><p>Classical and ETC neighbors use direct cyclic formulas. Most PITCs use atlas interpolation in ordered-angle space, with extrapolation disabled. M1 and Illum are solved in the browser. Approximation is explicit; field stability and global attractivity are not tested by the interpolant.</p><a href="README.html">Data provenance, methods and free software ↗</a>';$('#close-help').onclick=()=>$('#guide').close();
 // Put the physical selection in the first viewport; keep all classical choices available.
 let classicalPanel=document.createElement('details'),classHeading=$('#classical').previousElementSibling;classicalPanel.innerHTML='<summary>Classical centers · X1–X20, X360</summary>';classHeading.replaceWith(classicalPanel);classicalPanel.appendChild($('#classical'));
 let physicalSection=document.createElement('section'),physicalHeading=filter.previousElementSibling;physicalSection.append(physicalHeading,filter,selectedCount,$('#pitcs'));classicalPanel.before(physicalSection);physicalSection.after(focusbox);
 let custom=document.createElement('option');custom.value='custom';custom.textContent='Custom triangle';custom.disabled=true;$('#preset').appendChild(custom);
 updateNeighbors();showTheory(focused);fitCamera();render();registerTools();
}
function registerTools(){let ctx=document.modelContext;if(!ctx?.registerTool)return;let ctrl=new AbortController();window.addEventListener('pagehide',()=>ctrl.abort(),{once:true});let report=()=>({vertices:vertices.map(p=>p.slice()),selected:[...selected],focused,view,centers:activeIds().map(id=>({id,...pointResult(id)}))});for(let tool of[{name:'read_triangle_explorer',description:'Read the current triangle, selected centers and their evaluation provenance.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>report()},{name:'configure_triangle_explorer',description:'Set three finite noncollinear vertex coordinates, selected center IDs and an explorer view; updates the visible scientific app.',inputSchema:{type:'object',properties:{vertices:{type:'array',minItems:3,maxItems:3,items:{type:'array',minItems:2,maxItems:2,items:{type:'number'}}},centers:{type:'array',items:{type:'string'}},view:{type:'string',enum:['geometry','theory','fingerprints']}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(input.vertices&&(!Array.isArray(input.vertices)||input.vertices.length!==3||input.vertices.some(p=>!Array.isArray(p)||p.length!==2||p.some(x=>typeof x!=='number'||!Number.isFinite(x)))||!M.geometry(input.vertices).valid))throw new Error('Require three finite noncollinear vertices.');if(input.centers&&(!Array.isArray(input.centers)||input.centers.some(id=>typeof id!=='string'||(!DATA.catalog[id]&&!DATA.etc[id.slice(1)]))))throw new Error('Unknown center ID.');if(input.view&&!['geometry','theory','fingerprints'].includes(input.view))throw new Error('Unknown view.');if(input.vertices)vertices=input.vertices.map(p=>p.slice());if(input.centers){selected=new Set(input.centers);comparisons=new Set(input.centers);}shapeCache.clear();fitCamera();renderChecks();render();if(input.view)setView(input.view);return report();}}])try{Promise.resolve(ctx.registerTool(tool,{signal:ctrl.signal})).catch(()=>{});}catch{}}
fetch('atlas.json').then(r=>{if(!r.ok)throw new Error('Atlas download failed');return r.json();}).then(data=>{DATA=data;setup();}).catch(e=>{$('#readout').textContent=e.message+'. Serve this folder with a local HTTP server; opening file:// does not permit atlas loading.';});
