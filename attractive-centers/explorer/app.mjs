import {add,sub,mul,dot,mean,norm,area} from './geometry.mjs?v=b46-20261001';
const $=id=>document.getElementById(id),canvas=$('plot'),ctx=canvas.getContext('2d');
const colors={expanded:'#087e67',six:'#b65c29',conic:'#8751a0',newrays:'#bf4e39',shape:'#b65c29',constant:'#5c74ad',rays:'#a84368',orbit:'#74634d',edge:'#386ba5',transfer:'#138159',ball:'#b76820',hull:'#526170',chest:'#a87819',cp:'#3979ad',cnt:'#8e569c',heart:'#bc5277',b46:'#3185a2',b36:'#5f7e99',power:'#2f9e44',para:'#a87819',bisector:'#8e569c',network:'#3979ad',stable:'#bd5275',combined:'#087b82',triangle:'#158368'};
Object.assign(colors,{tetraExpanded:'#087e67',anchors:'#a66129',polynomial:'#aa4877',sosTetra:'#9e335c',conservativeTetra:'#b17b34',analyticTetra:'#6553a5',facePower:'#347ca4'});
const diagnostic=[[0,0],[21,0],[5,12]],presets={triangle:{'13–20–21 triangle':diagnostic,'Equilateral':[[0,0],[2,0],[1,Math.sqrt(3)]],'Thin isosceles':[[-1,0],[1,0],[0,.3]],'Scalene obtuse':[[-1,0],[1,0],[-.7,.5]]},four:{'Triangle + its centroid':[...diagnostic,[26/3,4]],'Bundle planar example':[[0,0],[4,0],[3,2],[0,3]],'Convex quadrilateral':[[0,0],[6,.2],[4.7,4],[.5,3]],'Parallelogram':[[0,0],[5,0],[6,3],[1,3]],'Independent bisector':[[0,0],[4,7],[2,4],[3,3]]},tetra:{'Bundle tetrahedron':[[0,0,0],[4,0,0],[0,3,0],[1,1,2]],'Face-pyramid counterexample':[[1,0,0],[-.5,Math.sqrt(3)/2,0],[-.5,-Math.sqrt(3)/2,0],[1,0,1]],'Generic tetrahedron':[[0,0,0],[2,0,0],[.3,1.8,0],[.5,.6,2.2]],'Regular tetrahedron':[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]],'Flat but nondegenerate':[[0,0,0],[2,0,0],[.3,1.8,0],[.5,.6,.22]]}};
const optionSets={triangle:[['chest','Standard chest',true],['expanded','Latest heart · bridge + new rays',true],['conic','Repaired conic-bridge enlargement',false],['six','Previous six-ray heart (R1–R6)',false],['newrays','New maps R7–R10 and P1–P3 alone',false],['shape','First shape-dependent enlargement',false],['constant','B46 + constant families',false],['b46','B46 heart · 44 rational + 2 power endpoints',false],['rays','Six new maps R1–R6 alone',false],['b36','Historical B36 comparison',false],['heart','Earlier sampled power-family hull',false],['cp','Characteristic strips',false],['cnt','Internal Napoleon triangle',false],['centers','Show exposed center points',true]],four:[['power','Sampled power-center heart',true],['para','Parallelogram strips',true],['bisector','Useful bisectors',true],['network','Two-order network',true],['orbit','Involution orbit bounds',false],['edge','Edge-projection slabs',true],['transfer','Face-centroid transfer (general)',true],['ball','Diameter balls (power family)',false],['stable','Absorption (conditional)',false],['combined','Show intersection',true],['triangle','Standard chest of A,B,C',false]],tetra:[['power','Sampled power-center heart',true],['para','Opposite-edge slabs',true],['bisector','Useful bisector planes',true],['orbit','Involution orbit bounds',false],['edge','Edge-projection slabs',true],['transfer','Face-centroid transfer',true],['ball','Diameter balls (power family)',false]]};
const theory={triangle:'A chest contains every attractive center. The standard triangle chest intersects the triangle, the three side-normal strips, and the anticomplementary triangle of the internal Napoleon centroids. It shrinks to the centroid for an equilateral triangle. The green B46 polygon is the established constructive approximation: 44 rational maps plus two attractive power endpoints. It is proved hull-equivalent to the fixed B76 reference on every proper triangle. All 1,142 currently proved native ETC maps are contained in its rational subfamily. Minimum size within B76 is bounded by 44 and 46, not yet settled; the maximal Heart remains unknown. Historical B36 and the earlier sampled power hull are optional comparisons. See the guide for regularity classes and certificates.',four:'The green inner region is the convex hull of sampled power centers Mₚ for 4−2√2 ≤ p ≤ 4+2√2. Every sample is always attractive for any finite point set in Euclidean space, hence their convex hull is a genuine heart; finite sampling only approximates the continuous power-family hull. The outer chest methods use symmetry and restoration: parallelogram strips, useful bisectors, a two-order network, edge slabs, and centroid transfer. Stability is an extra absorption assumption.',tetra:'The green inner polyhedron is the convex hull of sampled power centers Mₚ in the universal attractive interval. It is a genuine finite constructive heart, though not the whole continuous power-family hull or maximal Heart. The outer chest uses opposite-edge slabs, useful bisector planes, involution bounds, edge-projection slabs and face-centroid transfer. Its numerical polyhedron is not asserted optimal; intersections and volumes use documented tolerances.'};
theory.triangle='The gold chest bounds every attractive center. The green latest heart combines B46, the constant-coefficient arcs, the first shape-dependent maps, R1–R6, the repaired continuous conic bridge, four further rays R7–R10, and the cubic-phase maps P1–P3. Their global attractivity was checked with exact polynomial certificates. Continuous curves are sampled for drawing; bracketed rays use certified lower endpoints. The comparison layers show successive enlargements. The guide explains the formulas, verified results, and remaining questions.';
Object.assign(presets.triangle,{
 'New rays · sides 6–5–3':[[0,0],[3,0],[-1/3,4*Math.sqrt(14)/3]],
 'New rays · sides 9–8–7':[[0,0],[7,0],[16/7,24*Math.sqrt(5)/7]],
 'New rays · sides 9–6–5':[[0,0],[5,0],[-2,4*Math.sqrt(2)]],
 'First shape map · sides 30–21–11':[[0,0],[11,0],[-169/11,20*Math.sqrt(62)/11]],
 'Power comparison · C=(5,8)':[[0,0],[21,0],[5,8]],
 'Power comparison · C=(5,3)':[[0,0],[21,0],[5,3]]
 ,'Bridge midpoint · sides 12–8–6':[[0,0],[6,0],[-11/3,Math.sqrt(455)/3]]
 ,'R7 witness · sides 14–11–5':[[0,0],[5,0],[-5,4*Math.sqrt(6)]]
});
theory.four += ' Revision 2: edge-projection slabs place n·X between the minimum and maximum of the pair midpoint and remaining-point projections, using reflection and parallel restoration. Centroid insertion is unconditional: Y(P)=X(P,G(P)) is attractive. Restoring the omitted vertex gives a supporting half-plane; when D=G(ABC), the whole standard chest transfers. Diameter balls use a different, proved insertion inequality for coherent convex power means only; 64 sampled support directions enclose the curved region. Dragging any vertex leaves the other vertices fixed: D is not locked to the centroid. The transfer layer recalculates all four omitted-face inequalities. Exact centroid coincidence supplies a whole face chest; away from coincidence only its directional support bound transfers. This finite outer construction may therefore enlarge abruptly near a centroid configuration. The ABC chest overlay is only a reference and is not intersected automatically. The default intersection is unconditional in its mathematical derivation; the displayed polygon is numerical. No claim of optimality is made.';
theory.tetra += ' Revision 2 adds edge-projection slabs and face-centroid transfer. A face pyramid over a triangle chest is NOT generally valid (see the counterexample preset). The optional diameter-ball construction is valid for coherent power means in the universal attractive interval, not for every attractive map. Its 26 sampled support normals give an outer polyhedral approximation. Recursive 3D network optimization is not implemented in this preview.';
presets.tetra['Heart enlargement benchmark']=[[0,0,0],[1,0,0],[0,1,0],[3,-2,.5]];
optionSets.tetra=[['tetraExpanded','Enlarged tetrahedron heart',true],['sosTetra','Ten SOS-certified polynomial maps',false],['conservativeTetra','Earlier conservative enlargement',false],['power','Previous vertex-power heart',false],['anchors','Barycentric-anchor family alone',false],['facePower','Vertex + reflected face-power curves',false],['polynomial','Ten conservative analytic maps alone',false],['analyticTetra','Analytic subheart · even powers + SOS maps',false],['refineAnchors','Refine anchor sampling (slower)',false],['centers','Show exposed center points',false],['tetraChest','Show selected 3D chest',true],...optionSets.tetra.filter(([k])=>k!=='power')];
theory.tetra='The green enlarged inner hull combines the previous vertex-power curve, fixed-weight mixtures of vertices, six edge midpoints and four face centroids, and ten SOS-certified polynomial ray maps. All ten inward endpoints passed independent exact polynomial and rational matrix replay; they are not asserted to be the exact maximal endpoints. The earlier conservative construction is retained for comparison. Faces alone give G−(Mₚ−G)/3; edges alone give G, but mixtures can add new positions. The analytic subheart uses p=2,4,6 and the polynomial maps. Other real powers obey the global finite motion law but need not be analytic across collisions. Continuous families are sampled, failed solves omitted and counted. The outer chest methods are unchanged. Diameter balls are conditional bounds for the original coherent power family and need not contain the new anchor/polynomial maps. No optimal chest or maximal Heart is asserted. See the guide and both proof downloads.';
let mode='triangle',points=structuredClone(diagnostic),on={},data=null,error='',busy=false,seq=0,pending=false,view={center:[10.5,6],scale:25},yaw=.55,pitch=.4,drag=null,hover=[],width=900,height=550;
const worker=new Worker(new URL('./worker.mjs?v=tetra-sos-20261017',import.meta.url),{type:'module'});
function request(){seq++;pending=true;data=null;error='';$('metrics').textContent='Recomputing for the current vertices…';$('measure-note').textContent='';$('status').textContent='Calculating…';draw();dispatch();}
function dispatch(){if(busy||!pending)return;busy=true;pending=false;$('status').textContent='Calculating…';worker.postMessage({id:seq,mode,points,on});}
worker.onmessage=({data:r})=>{busy=false;if(r.id===seq){error=r.error||'';data=r.error?null:r;draw();metrics();$('status').textContent=error||(mode==='tetra'?tetraStatus(r.result):mode==='triangle'?`Latest heart: ${r.result.analytic.expanded.poly.length} hull vertices · conic bridge + 13 ray maps · B46: ${r.result.b46.centers.length}/46${r.result.b46.failed?' · '+r.result.b46.failed+' unresolved power endpoints omitted':''}`:`Power heart: ${r.result.power.centers.length} samples · ${r.result.power.poly.length} hull vertices${r.result.power.failed?' · '+r.result.power.failed+' failed samples omitted':''} · ${r.result.transferNote}`);}dispatch();};
function tetraStatus(d){const h=d.tetraHearts;return `Enlarged heart: ${h.expanded.vertices.length} hull vertices · ${h.diagnostics.accepted}/${h.diagnostics.attempted} anchor solves · 10 exact SOS ray maps${h.diagnostics.failed?' · '+h.diagnostics.failed+' failed anchor samples omitted':''}${d.power.failed?' · '+d.power.failed+' old power samples omitted':''}. Drag empty space to rotate.`;}
worker.onerror=e=>{$('status').textContent='Calculation error. Reload the page to retry.';busy=false;};
function options(){
  on=Object.fromEntries(optionSets[mode].map(([k,l,v])=>[k,v]));
  const color=k=>mode==='tetra'&&k==='power'?colors.b46:colors[k]||colors.heart;
  $('options').innerHTML=optionSets[mode].map(([k,l,v])=>`<label><input type="checkbox" data-opt="${k}" ${v?'checked':''}><span><span class="swatch" style="color:${color(k)}"></span>${l}</span></label>`).join('');
  const displayOnly=['tetraExpanded','sosTetra','conservativeTetra','power','anchors','polynomial','analyticTetra','facePower','centers','tetraChest'];
  $('options').querySelectorAll('input').forEach(input=>input.onchange=()=>{
    on[input.dataset.opt]=input.checked;
    if(mode==='triangle'||mode==='tetra'&&displayOnly.includes(input.dataset.opt)){draw();metrics();}else request();
  });
  $('focus-hearts').hidden=mode!=='tetra';$('theory').innerHTML=`<p>${theory[mode]}</p>`;
  $('instructions').textContent=mode==='tetra'?'Drag empty space to rotate. Drag a vertex parallel to the screen. Edit x, y, z below for exact placement. Scroll to zoom, or use Focus hearts; Fit view restores the whole tetrahedron.':'Drag any vertex. Scroll to zoom. The coordinate scales stay equal. Edit coordinates below for exact placement.';
  $('preset').innerHTML=Object.keys(presets[mode]).map(k=>`<option>${k}</option>`).join('');
}
function loadPreset(){points=structuredClone(presets[mode][$('preset').value]);data=null;error='';fit();coords();request();}
function coords(){let dim=mode==='tetra'?3:2;$('coordinates').innerHTML=points.map((p,i)=>`<div class="coord-row"><strong>${'ABCD'[i]}</strong>${p.map((v,j)=>`<input type="number" step="0.01" value="${+v.toFixed(6)}" aria-label="${'ABCD'[i]} ${'xyz'[j]}" data-i="${i}" data-j="${j}">`).join('')}</div>`).join('');$('coordinates').querySelectorAll('input').forEach(el=>el.onchange=()=>{let v=Number(el.value);if(!Number.isFinite(v)||Math.abs(v)>1e8){coords();return;}points[+el.dataset.i][+el.dataset.j]=v;request();draw();});}
function camera(p){let cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);return [cy*p[0]+sy*p[2],-sp*sy*p[0]+cp*p[1]+sp*cy*p[2],-cp*sy*p[0]-sp*p[1]+cp*cy*p[2]];}
function project(p){if(mode==='tetra'){let q=camera(sub(p,view.center));return [width/2+q[0]*view.scale,height/2-q[1]*view.scale,q[2]];}return [width/2+(p[0]-view.center[0])*view.scale,height/2-(p[1]-view.center[1])*view.scale,0];}
function fit(){view.center=mean(points);let r=Math.max(...points.map(p=>norm(sub(p,view.center))));view.scale=Math.min(width,height)/Math.max(r*2.5,1e-6);if(mode!=='tetra'){let xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);view.center=[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2];view.scale=Math.min((width-90)/Math.max(1e-7,Math.max(...xs)-Math.min(...xs)),(height-90)/Math.max(1e-7,Math.max(...ys)-Math.min(...ys)));}draw();}
const world=p=>add(data.g,mul(p,data.s));
function path(poly,color,fill=true,dash=false,lw=2){if(!poly?.length)return;let q=poly.map(project);ctx.beginPath();ctx.moveTo(q[0][0],q[0][1]);for(let v of q.slice(1))ctx.lineTo(v[0],v[1]);if(q.length>2)ctx.closePath();ctx.setLineDash(dash?[6,5]:[]);ctx.strokeStyle=color;ctx.lineWidth=lw;if(fill&&q.length>2){ctx.fillStyle=color+'24';ctx.fill();}ctx.stroke();ctx.setLineDash([]);if(q.length===1){ctx.fillStyle=color;ctx.beginPath();ctx.arc(q[0][0],q[0][1],5,0,2*Math.PI);ctx.fill();}}
function grid(){
  if(mode==='tetra')return;
  const rawStep=75/view.scale,unit=10**Math.floor(Math.log10(rawStep)),mantissa=rawStep/unit;
  const step=unit*(mantissa<=1?1:mantissa<=2?2:mantissa<=5?5:10);
  const x0=view.center[0]-width/(2*view.scale),x1=x0+width/view.scale;
  const y0=view.center[1]-height/(2*view.scale),y1=y0+height/view.scale;
  const label=value=>Math.abs(value)<step*1e-9?'0':String(+value.toPrecision(5));
  ctx.font='12px system-ui';ctx.fillStyle='#697584';ctx.strokeStyle='#e1e6eb';ctx.lineWidth=.7;
  for(let k=Math.ceil(x0/step);k<=Math.floor(x1/step);k++){
    const x=k*step,a=project([x,y0]),b=project([x,y1]);ctx.beginPath();ctx.moveTo(...a.slice(0,2));ctx.lineTo(...b.slice(0,2));ctx.stroke();ctx.fillText(label(x),a[0]+3,height-29);
  }
  for(let k=Math.ceil(y0/step);k<=Math.floor(y1/step);k++){
    const y=k*step,a=project([x0,y]),b=project([x1,y]);ctx.beginPath();ctx.moveTo(...a.slice(0,2));ctx.lineTo(...b.slice(0,2));ctx.stroke();ctx.fillText(label(y),5,a[1]-3);
  }
}
function triangleLayers(d){return [
  ['b36',d.b36,'Historical B36'],['heart',d.heart,'Earlier sampled power family'],
  ['b46',d.b46,'B46 reference'],['constant',d.analytic.constant,'B46 + constant families'],
  ['shape',d.analytic.shape,'First shape-dependent enlargement'],
  ['six',d.analytic.six,'Previous six-ray heart (R1–R6)'],['conic',d.analytic.conic,'Repaired conic-bridge enlargement'],
  ['expanded',d.analytic.expanded,'Latest expanded heart'],['newrays',d.analytic.extensionRays,'R7–R10 and P1–P3 alone'],
  ['rays',d.analytic.rays,'Six new maps R1–R6 alone']
];}
function drawTriangle(d,legend){
  for(const [key,poly,label] of [['cp',d.cp,'Strips clipped to triangle'],['cnt',d.cnt,'Internal Napoleon'],['chest',d.poly,'Standard chest']]){
    if(on[key]){path(poly.map(world),colors[key],true,key==='cp',2);legend.push([colors[key],label]);}
  }
  const layers=triangleLayers(d);
  for(const [key,region,label] of layers){
    if(!on[key])continue;
    path(region.poly.map(world),colors[key],key==='expanded'||key==='rays',key!=='expanded'&&key!=='rays',key==='expanded'?3:2);
    legend.push([colors[key],label]);
  }
  if(on.centers){
    const shown=new Set(),visible=[];
    for(const [key,region] of layers){
      if(!on[key])continue;
      const exposed=region.boundary||region.centers;
      for(const c of exposed){
        const id=c.id||c.name;if(shown.has(id))continue;shown.add(id);
        visible.push({...c,color:colors[key],tooltip:c.description||c.name});
      }
    }
    // New ray points are labelled even when a particular triangle hides one in the hull interior.
    if(on.expanded)for(const c of [...d.analytic.rays.centers,...d.analytic.extensionRays.centers]){
      if(shown.has(c.id))continue;shown.add(c.id);visible.push({...c,color:colors.rays,tooltip:c.description||c.name});
    }
    for(const c of visible){
      const q=project(world(c.point));ctx.fillStyle=c.color;ctx.beginPath();ctx.arc(q[0],q[1],/^[RP]\d/.test(c.id||'')?4:3,0,2*Math.PI);ctx.fill();
      hover.push({x:q[0],y:q[1],text:c.tooltip});
    }
  }
  path(points,colors.hull,false,false,1.6);
}
function tetraLayers(d){return [
  ['power',d.power,'Previous vertex-power heart'],
  ['facePower',d.tetraHearts.face,'Vertex + reflected face curves'],
  ['anchors',d.tetraHearts.constellation,'Barycentric-anchor heart'],
  ['polynomial',d.tetraHearts.polynomial,'Ten conservative analytic maps'],
  ['analyticTetra',d.tetraHearts.analytic,'Even-power analytic subheart'],
  ['sosTetra',d.tetraHearts.sosPolynomial,'Ten SOS-certified polynomial maps'],
  ['conservativeTetra',d.tetraHearts.conservativeExpanded,'Earlier conservative enlargement'],
  ['tetraExpanded',d.tetraHearts.expanded,'Enlarged tetrahedron heart']
];}
function drawTetra(d,legend){
  const drawRegion=(r,color,filled,lw)=>{
    const faces=r.faces.map(f=>f.map(world));
    faces.sort((a,b)=>project(mean(a))[2]-project(mean(b))[2]);
    for(const f of faces)path(f,color,filled,false,lw);
    if(!faces.length)path(r.vertices.map(world),color,filled,false,lw);
  };
  if(on.tetraChest){drawRegion(d,colors.combined,true,1.3);legend.push([colors.combined,'Selected 3D chest']);}
  const shown=[];
  for(const [key,r,label] of tetraLayers(d))if(on[key]){
    const color=key==='power'?colors.b46:colors[key];
    drawRegion(r,color,key==='tetraExpanded',key==='tetraExpanded'?2.3:1.7);
    legend.push([color,label]);
    if(on.centers)for(const c of r.centers){
      if(!r.vertices.some(v=>norm(sub(c.point,v))<3e-8)||shown.some(v=>norm(sub(c.point,v))<3e-8))continue;
      shown.push(c.point);const q=project(world(c.point));
      ctx.fillStyle=color;ctx.beginPath();ctx.arc(q[0],q[1],3,0,2*Math.PI);ctx.fill();
      hover.push({x:q[0],y:q[1],text:c.name+(c.proof?' · '+c.proof:'')});
    }
  }
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)path([points[i],points[j]],colors.hull,false,false,1.2);
  legend.push([colors.hull,'Tetrahedron']);
}
function draw(){ctx.clearRect(0,0,width,height);hover=[];grid();let legend=[];if(data&&data.mode===mode){let d=data.result;if(mode==='triangle'){drawTriangle(d,legend);}else if(mode==='four'){for(let [k,poly] of [['para',d.para.poly],['bisector',d.bisector],['network',d.network],['orbit',d.orbit],['edge',d.edge],['transfer',d.transfer],['ball',d.ball],['stable',d.stable],['triangle',d.triangle],['combined',d.combined],['power',d.power.poly]])if(on[k]){path(poly.map(world),colors[k],k==='combined'||k==='power',k==='triangle',k==='combined'?3:k==='power'?2.6:1.8);legend.push([colors[k],{orbit:'Involution orbit bounds',edge:'Edge slabs',transfer:'Centroid transfer',ball:'Diameter balls (conditional)',para:'Parallelogram',bisector:'Bisectors',network:'Network',stable:'Stability (conditional)',triangle:'ABC chest only',combined:'Selected chest intersection',power:'Sampled power-center heart'}[k]]);}path(d.hull.map(world),colors.hull,false);}else drawTetra(d,legend);}
  points.forEach((p,i)=>{let [x,y]=project(p);ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fillStyle=i===3?'#bd5275':'#243849';ctx.fill();ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.stroke();ctx.font='bold 15px system-ui';ctx.fillStyle='#243849';ctx.fillText('ABCD'[i],x+11,y-10);});$('legend').innerHTML=legend.map(([c,l])=>`<span><span class="swatch" style="color:${c}"></span>${l}</span>`).join('');}
function metrics(){if(!data){$('metrics').textContent=error;return;}let d=data.result,rows=[],base=mode==='tetra'?d.base.volume:d.baseArea;const pct=q=>(q>0&&q<.00005?q.toExponential(3):q.toFixed(4))+'%';const row=(label,m,n)=>{let ratio=100*m/base;rows.push(`<tr><td>${label}</td><td>${n}</td><td>${pct(ratio)}</td><td>${pct(100-ratio)}</td></tr>`);};if(mode==='triangle'){
  row('Standard chest',area(d.poly),d.poly.length);
  const layers=triangleLayers(d),order=['expanded','conic','six','shape','constant','b46','b36','heart','rays','newrays'];
  for(const [key,region,label] of order.map(key=>layers.find(row=>row[0]===key))){
    if((key==='rays'||key==='newrays')&&!on[key])continue;
    row(label+(on[key]?'':' (hidden)'),area(region.poly),region.poly.length);
  }
  const oldArea=area(d.analytic.six.poly),increase=oldArea>1e-14?100*(area(d.analytic.expanded.poly)/oldArea-1):0;
  $('measure-note').textContent='Areas are percentages of the triangle. Latest extension: '+increase.toFixed(3)+'% more inner-hull area than the six-ray heart. Each generator is globally certified; the three continuous curves and the drawing are numerical. Maximal Heart remains open.';
}else if(mode==='four'){row('Sampled power-center heart'+(on.power?'':' (hidden)'),area(d.power.poly),d.power.poly.length);for(let [k,label,poly] of [['para','Parallelogram',d.para.poly],['bisector','Bisectors alone',d.bisector],['network','Network alone',d.network],['orbit','Orbit bounds alone',d.orbit],['edge','Edge slabs alone',d.edge],['transfer','Centroid transfer alone',d.transfer],['ball','Diameter balls (conditional)',d.ball],['stable','Absorption alone (conditional)',d.stable]])if(on[k])row(label,area(poly),poly.length);row(on.ball||on.stable?'Conditional chest intersection':'Unconditional chest intersection',area(d.combined),d.combined.length);rows[rows.length-1]=rows.at(-1).replace('<tr>','<tr class="total">');$('measure-note').textContent='The power hull is an inner heart; the other rows are outer chests. Do not compare “smaller is better” across inner and outer rows.';}else{
  for(const key of ['tetraExpanded','sosTetra','conservativeTetra','anchors','facePower','power','analyticTetra','polynomial']){
    const [_,r,label]=tetraLayers(d).find(row=>row[0]===key);row(label+(on[key]?'':' (hidden)'),r.volume,r.vertices.length);
  }
  if(on.para)row('Opposite-edge slabs',d.para.volume,d.para.vertices.length);if(on.bisector)row('Bisector planes',d.bi.volume,d.bi.vertices.length);
  for(let [k,label] of [['edge','Edge slabs alone'],['transfer','Centroid transfer alone'],['ball','Diameter balls (conditional)']])if(on[k]&&d[k])row(label,d[k].volume,d[k].vertices.length);
  row(on.ball?'Conditional 3D chest':'Unconditional 3D chest',d.volume,d.vertices.length);
  const h=d.tetraHearts,ratio=d.power.volume>1e-14?(h.expanded.volume/d.power.volume).toFixed(3)+'× the old sampled volume':'zero-volume symmetry limit';
  $('measure-note').textContent=`Volumes are fractions of the input tetrahedron. Enlarged heart: ${ratio}. ${h.diagnostics.exponentSamples} exponents; weight subdivisions ${h.diagnostics.weightSubdivisions}; ${h.diagnostics.failed} failed anchor solves omitted. Residual and root-error checks use double precision, not interval certification. The ten-map and even-power layers are analytic subhearts. Chest rows are outer bounds; inner and outer percentages have different meanings.`;
} $('metrics').innerHTML=`<table><thead><tr><th>Region</th><th>Vertices</th><th>Retained</th><th>Outside region</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;}
function eventPos(e){let r=canvas.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];}
canvas.onpointerdown=e=>{let q=eventPos(e),idx=points.findIndex(p=>norm(sub(project(p).slice(0,2),q))<17);drag={idx,start:q,point:idx>=0?[...points[idx]]:null,yaw,pitch,center:[...view.center]};canvas.setPointerCapture(e.pointerId);$('tooltip').hidden=true;};
canvas.onpointermove=e=>{let q=eventPos(e);if(drag){let dx=(q[0]-drag.start[0])/view.scale,dy=-(q[1]-drag.start[1])/view.scale;if(drag.idx>=0){if(mode==='tetra'){let cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);points[drag.idx]=add(drag.point,[cy*dx-sp*sy*dy,cp*dy,sy*dx+sp*cy*dy]);}else points[drag.idx]=add(drag.point,[dx,dy]);request();}else if(mode==='tetra'){yaw=drag.yaw+(q[0]-drag.start[0])*.007;pitch=Math.max(-1.5,Math.min(1.5,drag.pitch+(q[1]-drag.start[1])*.007));}else view.center=sub(drag.center,[dx,dy]);draw();return;}let items=hover.filter(h=>Math.hypot(h.x-q[0],h.y-q[1])<10),tip=$('tooltip');tip.hidden=!items.length;if(items.length){tip.textContent=items.slice(0,4).map(h=>h.text).join(' / ');tip.style.left=Math.min(width-265,q[0]+15)+'px';tip.style.top=Math.max(5,q[1]-40)+'px';}canvas.style.cursor=points.some(p=>norm(sub(project(p).slice(0,2),q))<17)?'grab':mode==='tetra'?'move':'crosshair';};
function release(){if(drag){drag=null;coords();}}canvas.onpointerup=release;canvas.onpointercancel=release;canvas.onlostpointercapture=release;canvas.onpointerleave=()=>{$('tooltip').hidden=true;};canvas.onwheel=e=>{e.preventDefault();view.scale=Math.max(1e-5,Math.min(1e8,view.scale*Math.exp(-e.deltaY*.001)));draw();};canvas.onkeydown=e=>{if(e.key==='0')fit();if(mode==='tetra'&&e.key.startsWith('Arrow')){e.preventDefault();if(e.key==='ArrowLeft')yaw-=.1;if(e.key==='ArrowRight')yaw+=.1;if(e.key==='ArrowUp')pitch-=.1;if(e.key==='ArrowDown')pitch+=.1;draw();}};
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(q=>q.setAttribute('aria-pressed',String(q===b)));options();loadPreset();});$('preset').onchange=loadPreset;$('reset').onclick=loadPreset;$('fit').onclick=fit;
$('focus-hearts').onclick=()=>{if(mode!=='tetra'||!data)return;const vertices=data.result.tetraHearts.expanded.vertices.map(world);if(!vertices.length)return;view.center=mean(vertices);const radius=Math.max(...vertices.map(v=>norm(sub(v,view.center)))),outer=Math.max(...points.map(v=>norm(sub(v,mean(points)))));view.scale=Math.min(width,height)/Math.max(2.6*radius,.06*outer,1e-12);draw();};
new ResizeObserver(entries=>{let rect=entries[0].contentRect,old=width;width=rect.width;height=rect.height;let dpr=window.devicePixelRatio||1;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);view.scale*=width/old;if(!data)fit();draw();}).observe(canvas.parentElement);options();coords();fit();request();
// Optional browser tool interface, sharing the coordinate controls' state.
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 try{Promise.resolve(document.modelContext.registerTool({
  name:'set_attractive_center_configuration',description:'Set the explorer mode and vertex coordinates, and wait for the displayed regions to be computed.',
  annotations:{readOnlyHint:false,untrustedContentHint:false},
  inputSchema:{type:'object',properties:{mode:{enum:['triangle','four','tetra']},points:{type:'array',items:{type:'array',items:{type:'number'}}}},required:['mode','points'],additionalProperties:false},
  execute:async input=>{
   let dim=input?.mode==='tetra'?3:2,n=input?.mode==='triangle'?3:4;
   if(!presets[input?.mode]||!Array.isArray(input.points)||input.points.length!==n||!input.points.every(p=>Array.isArray(p)&&p.length===dim&&p.every(v=>Number.isFinite(v)&&Math.abs(v)<1e8)))throw Error('Invalid mode or coordinates');
   mode=input.mode;document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
   options();points=structuredClone(input.points);data=null;coords();fit();request();const id=seq;
   await new Promise((resolve,reject)=>{
    let timer;const cleanup=()=>{clearTimeout(timer);worker.removeEventListener('message',handler);};
    const handler=({data:r})=>{if(r.id<id)return;cleanup();if(r.id!==id)reject(Error('Configuration changed during calculation'));else if(r.error)reject(Error(r.error));else resolve();};
    worker.addEventListener('message',handler);timer=setTimeout(()=>{cleanup();reject(Error('Calculation timed out'));},30000);
   });
   return {mode,points,regionVertices:mode==='triangle'?data.result.poly.length:mode==='four'?data.result.combined.length:data.result.vertices.length};
  }
 },{signal:lifecycle.signal})).catch(()=>{});}catch{}
}
