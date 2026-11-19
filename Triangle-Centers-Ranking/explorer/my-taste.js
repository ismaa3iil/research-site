/* Personal standings use the same standardized image vectors and fit as the Studio. */
const MyTaste = (() => {
  let catalogPromise, chosen='', collection='All', grouping='center', offset=0;
  const size=25;
  const repository='https://github.com/ismaa3iil/research-site';
  function element(tag,text) {
    const node=document.createElement(tag);
    if(text!==undefined)node.textContent=text;
    return node;
  }
  async function open(app,limit,reference) {
    const view=element('section');view.className='taste-view';app.replaceChildren(view);
    view.innerHTML='<h1>My Taste</h1><p class="lede">Rank triangle diagrams with your own comparisons. <a href="../taste/">Make or revise comparisons in the Studio</a>.</p><p role="status">Opening your taste library…</p>';
    const status=view.querySelector('[role=status]');
    try {
      catalogPromise ||= fetch('../taste/catalog.json').then(r=>{if(!r.ok)throw Error('Picture catalogue unavailable');return r.json()}).catch(e=>{catalogPromise=null;throw e});
      const catalog=await catalogPromise;
      if(!view.isConnected)return;
      const items=new Map(catalog.items.map(it=>[it.id,it]));
      const field=element('div');field.className='row';status.before(field);
      function select(label,id,parent=field){
        const l=element('label',label); l.className='field'; const node=element('select');node.id=id;l.append(node);parent.append(l);return node;
      }
      const menu=select('Use a taste','taste-choice');
      const collections=select('Collection','taste-collection');
      for(const s of ['All',...new Set(catalog.items.flatMap(x=>x.src))])collections.add(new Option(s,s));
      collections.value=collection;
      const mode=select('Rank','taste-group');
      mode.add(new Option('Centers by best picture','center')); mode.add(new Option('Individual pictures','image'));mode.value=grouping;
      const library=element('details');library.open=false;view.append(library);
      library.innerHTML='<summary>Save, import or share a taste</summary><div class="taste-actions"><label>Snapshot name <input id="taste-name" maxlength="80" placeholder="e.g. P07, first session"></label> <button id="taste-save">Save snapshot</button> <button id="taste-export">Download snapshot</button></div><p>A snapshot freezes the fitted weights. Private downloads from a working profile include its ordered comparisons and recorded times. Use a participant code to link repeat visits.</p><label>Import a Studio profile or snapshot <input id="taste-file" type="file" accept=".json,application/json"></label><h3>Public taste registry</h3><p>A public entry shares the fitted weights, catalogue version, snapshot ID and judgment count under your GitHub username. The draft omits the private label, individual choices and times. Review it on GitHub and submit it if you want others to reuse it.</p><div class="taste-actions"><a id="taste-draft" target="_blank" rel="noopener noreferrer">Review a public draft on GitHub ↗</a> · <a id="taste-browse" target="_blank" rel="noopener noreferrer">Browse public entries ↗</a></div><div class="taste-actions"><label>Public entry number <input id="taste-number" inputmode="numeric" size="8" placeholder="e.g. 12"></label> <button id="taste-recall">Recall entry</button></div>';
      const $=s=>view.querySelector(s);
      const recallLink=element('a','Open this public taste by link');recallLink.hidden=true;$('#taste-recall').after(recallLink);
      $('#taste-browse').href=repository+'/issues?q='+encodeURIComponent('is:issue "Taste registry" in:title');
      const result=element('div');view.append(result);
      let db, records, current, rows=[], votingProfile;
      function notify(message){status.textContent=message;}
      function refresh(prefer) {
        db=TasteLibrary.working();records=TasteLibrary.snapshots();
        menu.replaceChildren();
        function group(title,values,kind){
          if(!values.length)return;
          const g=element('optgroup');g.label=title;menu.append(g);
          for(const v of values)g.append(new Option(v.name+' · '+(kind==='live'?v.votes.length:v.judgments)+' judgments'+(kind==='fixed'?' · '+v.saved.slice(0,10)+' · '+v.id.slice(0,8):''),kind+':'+v.id));
        }
        group('Working profiles',db.profiles,'live');group('Saved snapshots',records,'fixed');
        const keys=Array.from(menu.options,o=>o.value);
        const next=[prefer,chosen,'live:'+db.active,keys[0]].find(k=>keys.includes(k));
        menu.value=next || ''; chosen=menu.value; selectTaste();
      }
      function selectTaste(){
        chosen=menu.value;offset=0;recallLink.hidden=true;
        votingProfile=db.profiles.find(x=>'live:'+x.id===chosen);
        current=records.find(x=>'fixed:'+x.id===chosen);
        if(votingProfile?.votes.length)current=TasteLibrary.make(votingProfile.name,votingProfile,catalog,TasteModel.fit(votingProfile.votes,items,catalog.features.length).beta);
        $('#taste-save').disabled=!votingProfile?.votes.length;
        $('#taste-export').disabled=!current;
        const link=$('#taste-draft');
        if(current && !votingProfile){link.href=TasteLibrary.draft(current);link.hidden=false;}
        else {link.removeAttribute('href');link.hidden=true;}
        $('#taste-name').disabled=!votingProfile?.votes.length;
        notify(current?(votingProfile?'Working profile. Save a snapshot to preserve or publish this version.':'Saved snapshot '+current.id+'.'):
          'To see your standings, make a comparison in the Studio, import a file, or recall a public entry.');
        library.open=library.open||!current;rank();
      }
      function rank(){
        result.replaceChildren();if(!current)return;
        const pool=catalog.items.filter(it=>it.n<=limit&&(collection==='All'||it.src.includes(collection)));
        rows=pool.map(it=>({it,score:it.x.reduce((s,v,i)=>s+v*current.coefficients[i],0)}))
          .sort((a,b)=>b.score-a.score||a.it.id.localeCompare(b.it.id));
        if(grouping==='center'){const seen=new Set();rows=rows.filter(({it})=>{if(seen.has(it.n))return false;seen.add(it.n);return true;});}
        for(let i=0;i<rows.length;i++)rows[i].place=i&&Math.abs(rows[i].score-rows[i-1].score)<1e-10?rows[i-1].place:i+1;
        render();
      }
      function render(){
        result.replaceChildren(element('h2',grouping==='center'?'Your center standings':'Your picture standings'));
        result.append(element('p',grouping==='center'?'Each center takes the score of its highest-scoring available picture in the selected collection and ETC range. More pictures give a center more chances to place highly.':'Each available picture receives its own model score in the selected collection and ETC range.'));
        if(!rows.length){result.append(element('p','No scored pictures in this selection.'));return;}
        const controls=element('div');controls.className='taste-actions';
        const prev=element('button','Previous'),next=element('button','Next');prev.disabled=offset===0;next.disabled=offset+size>=rows.length;
        prev.onclick=()=>{offset-=size;render()};next.onclick=()=>{offset+=size;render()};controls.append(prev,element('span',(offset+1)+'–'+Math.min(offset+size,rows.length)+' of '+rows.length),next);result.append(controls);
        const box=element('div');box.className='tablebox';const t=element('table');box.append(t);result.append(box);
        const head=t.createTHead().insertRow();for(const col of ['Rank','Picture','Center','Map / edition','Taste score'])head.append(element('th',col));
        const body=t.createTBody();
        for(const {it,score,place} of rows.slice(offset,offset+size)){
          const r=body.insertRow();r.insertCell().textContent=place;
          const zoom=element('a');zoom.href='../taste/'+it.img;zoom.target='_blank';zoom.rel='noopener';
          const img=element('img');img.src=zoom.href;img.alt='Enlarge X('+it.n+') '+it.m;img.width=68;img.height=54;img.loading='lazy';img.style.objectFit='contain';zoom.append(img);r.insertCell().append(zoom);
          const center=element('a','X('+it.n+')');center.href='#center';center.dataset.center=it.n;r.insertCell().append(center);
          r.insertCell().textContent=it.m+' · '+it.src.join(' / ');r.insertCell().textContent=score.toFixed(4);
        }
      }
      menu.onchange=selectTaste;
      collections.onchange=()=>{collection=collections.value;offset=0;rank()};
      mode.onchange=()=>{grouping=mode.value;offset=0;rank()};
      $('#taste-save').onclick=()=>{try{
        const snap=TasteLibrary.remember({...current,name:$('#taste-name').value.trim()||votingProfile.name});
        refresh('fixed:'+snap.id);notify('Saved '+snap.name+' in this browser. Download a copy to keep it elsewhere.');
      }catch(e){notify('Could not save this snapshot. '+e.message)}};
      $('#taste-export').onclick=()=>TasteLibrary.download(current);
      $('#taste-file').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>4000000)throw Error('File exceeds 4 MB.');
        const record=TasteLibrary.remember(TasteLibrary.read(JSON.parse(await f.text()),catalog,items));refresh('fixed:'+record.id);notify('Imported '+record.name+'.');
      }catch(err){notify('Import failed. '+err.message)}finally{e.target.value=''}};
      $('#taste-recall').onclick=async()=>{const button=$('#taste-recall');button.disabled=true;
        try{const number=$('#taste-number').value.trim();const record=TasteLibrary.remember(await TasteLibrary.recall(number,catalog,items));refresh('fixed:'+record.id);recallLink.href='#mytaste/entry/'+number;recallLink.hidden=false;notify('Recalled public entry #'+number+' and saved a local copy.');}
        catch(e){notify('Recall failed. '+e.message)}finally{button.disabled=false}};
      refresh();
      if(reference){library.open=true;$('#taste-number').value=reference;$('#taste-recall').click();}
    } catch(e){status.textContent='Could not open the taste library. '+e.message;}
  }
  return {open};
})();
