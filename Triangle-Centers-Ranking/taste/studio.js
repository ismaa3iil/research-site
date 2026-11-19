'use strict';
(async function(){
 const $=id=>document.getElementById(id);
 const catalog=await fetch('catalog.json').then(r=>{if(!r.ok)throw Error('Catalogue unavailable');return r.json()});
 const items=new Map(catalog.items.map(item=>[item.id,item])), features=catalog.features.map(f=>f.name);
 const storageKey='tc.personal-taste.profiles.v1', levels=['Only a little better','Better','Clearly better','Better by far'];
 const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node};
 const option=(value,text)=>new Option(text,value);
 const label=x=>'X('+x.n+') · '+x.m+' · '+x.src.join(' / ');
 const status=t=>$('feedback').textContent=t;
 const sources=[...new Set(catalog.items.flatMap(x=>x.src))].sort();
 sources.forEach(s=>$('source').add(option(s,s)));
 const newProfile=name=>({id:crypto.randomUUID(),name,votes:[]});
 let db;try{db=JSON.parse(localStorage.getItem(storageKey));}catch{}
 if(!db?.profiles?.length){const p=newProfile('My taste');db={active:p.id,profiles:[p]};}
 let profile,model,pool,pair,locked=false,journalError='';
 function save(){try{localStorage.setItem(storageKey,JSON.stringify(db));journalError='';}catch{journalError='Browser storage is unavailable. Export this profile before leaving.';status(journalError);}}
 function selectProfile(){profile=db.profiles.find(p=>p.id===db.active)||db.profiles[0];db.active=profile.id;
  $('profiles').replaceChildren(...db.profiles.map(p=>option(p.id,p.name)));$('profiles').value=profile.id;refit();propose();}
 function refit(){
  model=TasteModel.fit(profile.votes,items,features.length);
  pool=catalog.items.filter(x=>$('source').value==='All'||x.src.includes($('source').value));
  $('summary').textContent=profile.name+' · '+profile.votes.length+' judgments';
  $('snapSave').disabled=!profile.votes.length;$('snapStatus').textContent='';
  $('undo').disabled=!profile.votes.length;$('forecast').disabled=!profile.votes.length;
  const ids=new Set(pool.map(x=>x.id));$('review').disabled=!TasteModel.conflicts(model).some(q=>ids.has(q.a)&&ids.has(q.b));
  if($('model').open)showStandings();showHistory();
 }
 function propose(force=false){const q=TasteModel.next(pool,model,profile.votes,force);show(q.a,q.b,q.why);}
 let generation=0;
 function show(a,b,why){generation++;const gen=generation;pair=[items.get(a),items.get(b)];locked=false;
  $('pickA').value=a;$('pickB').value=b;$('context').textContent=why;status(journalError);
  $('left').disabled=true;$('right').disabled=true;let arrived=0;
  $('duo').replaceChildren(...pair.map((x,i)=>{
   const fig=el('figure');fig.className='plate';
   const button=el('button');button.setAttribute('aria-label','Enlarge '+label(x));
   const img=el('img');img.alt=label(x);img.decoding='async';
   img.onload=()=>{if(gen===generation&&++arrived===2)$('left').disabled=$('right').disabled=false};
   img.onerror=()=>{if(gen===generation)status('A picture could not load. Select another pair or retry.')};img.src=x.img;
   button.append(img);button.onclick=()=>{$('large').src=x.original||x.img;$('large').alt=label(x);$('zoom').showModal()};
   const cap=el('figcaption');cap.append(el('strong',(i?'Right':'Left')+'  ·  X('+x.n+')  '+x.m));
   const meta=el('div',x.src.join(' / ')+(x.family?' · family '+x.family:'')+(x.rep?' · member illustration, registered representative '+x.rep:'')+(x.render?' · '+x.render:''));meta.className='meta';cap.append(meta);fig.append(button,cap);return fig;
  }));
 }
 function vote(side){if(locked||$('left').disabled)return;locked=true;const [win,lose]=[pair[side],pair[1-side]];
  const strength=Number(document.querySelector('[name=strength]:checked').value);
  profile.votes.push({win:win.id,lose:lose.id,strength,at:new Date().toISOString()});save();refit();propose();
  status(journalError||'Recorded X('+win.n+') '+win.m+' · '+levels[strength-1]+'. The model now includes this judgment.');
 }
 function forecast(){const gap=model.score(pair[0])-model.score(pair[1]);status(Math.abs(gap)<.03?'Your model scores these pictures almost equally. You can resolve the pair with your own preference.':
  'Your current model prefers the '+(gap>0?'left':'right')+' picture (score difference '+Math.abs(gap).toFixed(2)+'). Your next judgment will update the model.');}
 function showHistory(){$('history').replaceChildren(...profile.votes.slice(-12).reverse().map(v=>{const li=el('li');
  const b=el('button','Revisit');b.onclick=()=>show(v.win,v.lose,'Reconsider a previous pair. Your new judgment receives greater weight.');
  li.append(document.createTextNode(label(items.get(v.win))+' over '+label(items.get(v.lose))+' · '+levels[v.strength-1]+' '),b);return li;}));}
 function showStandings(){const list=$('standings');list.replaceChildren();$('weights').replaceChildren();
  $('modelInfo').textContent=profile.votes.length?'Current predicted top 30 in '+$('source').value+'. Scores measure relative preference within this profile.':'Make a comparison to start your personal standings.';
  if(!profile.votes.length)return;
  const table=el('table'),head=table.createTHead().insertRow();['Place','Picture','Model score'].forEach(t=>head.append(el('th',t)));
  const body=table.createTBody();let lastScore=null,lastRank=0;
  pool.map(x=>[model.score(x),x]).sort((a,b)=>b[0]-a[0]||a[1].id.localeCompare(b[1].id)).slice(0,30).forEach(([score,x],i)=>{const r=body.insertRow();if(lastScore===null||Math.abs(score-lastScore)>1e-10)lastRank=i+1;
   lastScore=score;r.insertCell().textContent=lastRank;const btn=el('button',label(x));btn.onclick=()=>{const other=pair.find(p=>p.id!==x.id)||pool.find(p=>p.id!==x.id);show(x.id,other.id,'Compare this predicted leader.');window.scrollTo(0,0)};
   r.insertCell().append(btn);r.insertCell().textContent=score.toFixed(3);});list.append(table);
  const ol=el('ol');features.map((name,i)=>[name,model.beta[i]]).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,8).forEach(([name,value])=>ol.append(el('li',name+'  '+(value>=0?'+':'')+value.toFixed(3))));$('weights').append(ol);
 }
 function valid(v){return v&&items.has(v.win)&&items.has(v.lose)&&v.win!==v.lose&&[1,2,3,4].includes(v.strength);}
 levels.forEach((l,i)=>{const label=el('label'),r=el('input');r.type='radio';r.name='strength';r.value=i+1;r.checked=i===1;label.append(r,document.createTextNode(' '+l));$('strength').append(label)});
 $('pictures').replaceChildren(...catalog.items.map(x=>option(x.id,label(x))));
 $('source').onchange=()=>{refit();propose()};$('next').onclick=()=>propose();$('review').onclick=()=>propose(true);
 $('forecast').onclick=forecast;$('left').onclick=()=>vote(0);$('right').onclick=()=>vote(1);
 $('compare').onclick=()=>{const a=$('pickA').value,b=$('pickB').value;if(!items.has(a)||!items.has(b)||a===b){status('Select two different catalogue entries.');return}show(a,b,'Your selected comparison.');window.scrollTo(0,0)};
 $('model').ontoggle=()=>{if($('model').open)showStandings()};
 $('undo').onclick=()=>{profile.votes.pop();save();refit();propose();status(journalError||'Last judgment removed and model refitted.')};
 $('new').onclick=()=>{$('newName').value='';$('newDialog').showModal()};$('cancelNew').onclick=()=>$('newDialog').close();
 $('newDialog').querySelector('form').onsubmit=e=>{e.preventDefault();const name=$('newName').value.trim();if(!name)return;profile=newProfile(name);db.profiles.push(profile);db.active=profile.id;save();selectProfile();$('newDialog').close()};
 $('profiles').onchange=()=>{db.active=$('profiles').value;save();selectProfile()};
 $('close').onclick=()=>$('zoom').close();$('zoom').onclick=e=>{if(e.target===$('zoom'))$('zoom').close()};
 $('snapSave').onclick=()=>{try{
   const snapshot=TasteLibrary.remember(TasteLibrary.make($('snapName').value.trim()||profile.name,profile,catalog,model.beta));
   $('snapStatus').textContent='Saved '+snapshot.name+' · '+snapshot.id.slice(0,8)+'. Select it in My Taste.';
  }catch(e){$('snapStatus').textContent='Could not save the snapshot. '+e.message}};
 $('download').onclick=()=>{const obj={schema:'tc-personal-taste/v1',catalog:catalog.version,name:profile.name,exported:new Date().toISOString(),features,coefficients:model.beta,votes:profile.votes};
  const a=el('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));a.download='triangle-taste-'+profile.name.replace(/[^\p{L}\p{N}_-]/gu,'_')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
 $('upload').onchange=async()=>{try{const f=$('upload').files[0];if(!f)return;if(f.size>4000000)throw Error('File exceeds 4 MB');
  let o=JSON.parse(await f.text());
  if(o.schema==='tc-taste-snapshot/v1'){
    o=TasteLibrary.read(o,catalog,items);
    if(!o.votes)throw Error('This model-only snapshot can be ranked in the Explorer. A working profile needs the private comparison history.');
    o={...o,schema:'tc-personal-taste/v1'};
  }
  if(o.schema!=='tc-personal-taste/v1'||o.catalog!==catalog.version||!Array.isArray(o.votes)||o.votes.length>10000||!o.votes.every(valid))throw Error('Incompatible profile or image identifiers');
  const p=newProfile(String(o.name||'Imported').slice(0,60)+' (imported)');p.votes=o.votes.map(({win,lose,strength,at})=>({win,lose,strength,at:String(at||'').slice(0,32)}));db.profiles.push(p);db.active=p.id;save();selectProfile();status(journalError||'Profile imported and refitted.');
 }catch(e){status('Import failed: '+e.message)}finally{$('upload').value=''}};
 window.addEventListener('storage',e=>{if(e.key===storageKey&&e.newValue){db=JSON.parse(e.newValue);selectProfile();status('Profile updated in another tab.')}});
 $('methods').append(el('p',catalog.items.length.toLocaleString()+' distinct catalogue records include both new atlases, both historical atlases and the recurrent M1/M3 families. Different editions can render the same construction differently. Select a picture to enlarge it.'),
 el('p','The model fits a regularized pairwise logistic regression to differences in '+features.length+' measurements. Each comparison has one of four strength weights (1, 1.6, 2.4 or 3.4). Earlier evidence halves in weight every 100 judgments. Each newer judgment on the same pair multiplies the weight of the previous judgment by 0.12.'),
 el('p','Features include raster structure and available survey measurements. Features need at least 40 measured pictures and five distinct values. If two measurements have absolute Spearman correlation of 0.85 or more on at least 40 common pictures, we retain the more widely available one, using catalogue order to break ties. Measured values are transformed to standardized percentiles; a missing value receives the neutral midpoint.'),
 el('p','Suggested pairs balance close predicted scores, differences in underexplored features and exposure to new pictures. Review a conflict revisits a reversal or a triangle of preferences (A over B, B over C and C over A). You may keep any of the three choices.'),
 el('p','An exported profile includes image IDs, ordered judgments, feature names, the catalogue version and fitted coefficients. These let another tool reproduce the score as the dot product with the catalogue feature vector.'));
 const audit=el('a','Feature screening and family coverage (JSON)');audit.href='features.json';$('methods').append(audit);
 selectProfile();save();
})().catch(e=>{document.getElementById('summary').textContent='Unable to start the studio: '+e.message;});
