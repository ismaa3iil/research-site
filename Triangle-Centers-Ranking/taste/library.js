/* Frozen model records shared by the Explorer and Personal Taste Studio. */
const TasteLibrary = (() => {
  const profilesKey = 'tc.personal-taste.profiles.v1';
  const prefix = 'tc.personal-taste.snapshot.v1.';
  const schema = 'tc-taste-snapshot/v1';
  const modelVersion = 'pairwise-logistic-v1';
  const repository = 'https://github.com/ismaa3iil/research-site';
  const issuePrefix = 'Taste registry · ';
  const uuid = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
  function working() {
    const db = JSON.parse(localStorage.getItem(profilesKey) || '{}');
    return {active: db.active, profiles: (db.profiles || []).filter(p => p.id && Array.isArray(p.votes))};
  }
  function snapshots() {
    return Object.keys(localStorage).filter(k => k.startsWith(prefix))
      .map(k => JSON.parse(localStorage.getItem(k))).filter(Boolean)
      .sort((a,b) => b.saved.localeCompare(a.saved));
  }
  function modelOnly(r) {
    return {schema, id:r.id, catalog:r.catalog, model:r.model, features:r.features,
      coefficients:r.coefficients, judgments:r.judgments};
  }
  function remember(r) {
    const key = prefix + r.id, prior = localStorage.getItem(key);
    if (prior) {
      const old = JSON.parse(prior);
      if (JSON.stringify(modelOnly(old)) !== JSON.stringify(modelOnly(r)))
        throw Error('This identifier already belongs to a different model.');
      if (old.votes || !r.votes) return old;
    }
    localStorage.setItem(key,JSON.stringify(r));
    return r;
  }
  function make(label,profile,catalog,beta) {
    if (!profile.votes.length) throw Error('Make a comparison in the Studio first.');
    return {schema,id:crypto.randomUUID(),name:label.trim() || 'Taste snapshot',
      saved:new Date().toISOString(),model:modelVersion,catalog:catalog.version,
      features:catalog.features.map(f=>f.name),coefficients:[...beta],
      judgments:profile.votes.length,votes:profile.votes.map(v=>({...v}))};
  }
  function validateVotes(votes,items) {
    if (!Array.isArray(votes) || !votes.length || votes.length>10000) throw Error('Expected 1 to 10,000 judgments.');
    return votes.map(v=>{
      if (!v || !items.has(v.win) || !items.has(v.lose) || v.win===v.lose ||
          ![1,2,3,4].includes(v.strength)) throw Error('The file contains an invalid comparison.');
      return {win:v.win,lose:v.lose,strength:v.strength,at:String(v.at || '').slice(0,32)};
    });
  }
  function read(input,catalog,items,issue) {
    if (input?.catalog!==catalog.version) throw Error('This taste uses a different picture catalogue.');
    if (!issue && input.schema==='tc-personal-taste/v1') {
      const votes = validateVotes(input.votes,items);
      return make(String(input.name || 'Imported profile').slice(0,80),{votes},catalog,
        TasteModel.fit(votes,items,catalog.features.length).beta);
    }
    if (input.schema!==schema || input.model!==modelVersion || !uuid.test(input.id) ||
        !Number.isSafeInteger(input.judgments) || input.judgments<1 ||
        JSON.stringify(input.features)!==JSON.stringify(catalog.features.map(f=>f.name)) ||
        !Array.isArray(input.coefficients) || input.coefficients.length!==catalog.features.length ||
        !input.coefficients.every(v=>Number.isFinite(v)&&Math.abs(v)<=100000))
      throw Error('Incompatible snapshot identifier, measurements or model.');
    const record = {...modelOnly(input),saved:new Date().toISOString(),name:'Registry #'+issue};
    if (!issue) {
      record.name=String(input.name || 'Imported taste').slice(0,80);
      if (typeof input.saved==='string' && Number.isFinite(Date.parse(input.saved))) record.saved=new Date(input.saved).toISOString();
      if (input.votes) {
        record.votes=validateVotes(input.votes,items);
        if(record.votes.length!==record.judgments) throw Error('Judgment count does not match the history.');
      }
    }
    return record;
  }
  function download(record) {
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'}));
    a.download='triangle-taste-'+record.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  function draft(record) {
    const url=new URL(repository+'/issues/new');
    url.searchParams.set('title',issuePrefix+record.id);
    url.searchParams.set('body',['I choose to publish this fitted taste model for reuse in studies of triangle diagrams.',
      'Recall it by entering this GitHub issue number in [My Taste](https://ismaa3iil.fyi/Triangle-Centers-Ranking/explorer/#mytaste).',
      '```json\n'+JSON.stringify(modelOnly(record))+'\n```'].join('\n\n'));
    return url.href;
  }
  async function recall(number,catalog,items) {
    if (!/^[1-9]\d{0,8}$/.test(number)) throw Error('Enter a positive GitHub issue number.');
    const res=await fetch('https://api.github.com/repos/ismaa3iil/research-site/issues/'+number,{credentials:'omit'});
    if (!res.ok) throw Error(res.status===404?'That registry number was not found.':'GitHub is unavailable or its request limit was reached. Try again later.');
    const issue=await res.json();
    if (issue.pull_request || !issue.title?.startsWith(issuePrefix)) throw Error('That issue is not a taste registry entry.');
    const match=(issue.body || '').match(/```json\s+([\s\S]*?)\s*```/);
    if (!match) throw Error('The registry entry contains no readable model.');
    const record=read(JSON.parse(match[1]),catalog,items,number);
    if (issue.title!==issuePrefix+record.id) throw Error('Registry title and model identifier disagree.');
    return record;
  }
  return {profilesKey,prefix,working,snapshots,remember,make,read,download,draft,recall};
})();
