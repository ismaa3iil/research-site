/* Pairwise logistic utility, with a Gaussian penalty and per-pair revision weights. */
const TasteModel=(()=>{
 const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
 const key=(a,b)=>a<b?a+'|'+b:b+'|'+a;
 function fit(votes,items,k){
  const latest=new Map(),samples=[],seen=new Map(),pairs=new Map();
  for(let i=votes.length-1;i>=0;i--){
   const v=votes[i],a=items.get(v.win),b=items.get(v.lose);if(!a||!b)continue;
   const pk=key(v.win,v.lose),repeats=latest.get(pk)||0;latest.set(pk,repeats+1);
   if(!pairs.has(pk))pairs.set(pk,{v,i,opposed:false});else if(repeats===1 && pairs.get(pk).v.win!==v.win)pairs.get(pk).opposed=true;
   seen.set(a.id,(seen.get(a.id)||0)+1);seen.set(b.id,(seen.get(b.id)||0)+1);
   const weight=[0,1,1.6,2.4,3.4][v.strength]*Math.pow(.5,(votes.length-1-i)/100)*Math.pow(.12,repeats);
   if(weight>1e-7)samples.push([a.x.map((v,j)=>v-b.x[j]),weight]);
  }
  const beta=Array(k).fill(0),information=Array(k).fill(2);
  // Cyclic Newton updates with a global coordinate curvature bound ensure convergence.
  const margin=samples.map(()=>0),curvature=beta.map((_,j)=>2+samples.reduce((s,[x,w])=>s+.25*w*x[j]*x[j],0));
  for(let it=0;it<100;it++){
   let peak=0;
   for(let j=0;j<k;j++){
    let grad=-2*beta[j];
    samples.forEach(([x,w],i)=>grad+=w*x[j]/(1+Math.exp(Math.max(-36,Math.min(36,margin[i])))));
    const step=grad/curvature[j]; beta[j]+=step;peak=Math.max(peak,Math.abs(step));
    samples.forEach(([x],i)=>margin[i]+=step*x[j]);
   }
   if(peak<1e-5)break;
  }
  samples.forEach(([x,w],i)=>{const p=1/(1+Math.exp(-margin[i]));x.forEach((v,j)=>information[j]+=w*p*(1-p)*v*v);});
  const score=a=>dot(a.x,beta);
  return {beta,information,score,pairs,seen};
 }
 function conflicts(model){
  const graph=new Map(),list=[];
  for(const {v,i,opposed} of model.pairs.values()){
   if(!graph.has(v.win))graph.set(v.win,new Set());graph.get(v.win).add(v.lose);
   if(opposed)list.push({a:v.win,b:v.lose,i,why:'Your history includes preferences in both directions for this pair.'});
  }
  for(const {v,i} of model.pairs.values()){
   for(const c of graph.get(v.lose)||[]){
    if(graph.get(c)?.has(v.win)){list.push({a:v.win,b:v.lose,i,why:'Your latest judgments form a cycle through '+c+'. Which image do you prefer now?'});break;}
   }
  }
  return list;
 }
 function next(pool,model,history,force=false){
  const valid=new Set(pool.map(x=>x.id)),eligible=conflicts(model).filter(q=>valid.has(q.a)&&valid.has(q.b));
  const last=new Map();history.forEach((v,i)=>last.set(key(v.win,v.lose),i));
  eligible.sort((x,y)=>x.i-y.i);
  if(eligible.length&&(force||history.length%5===4&&history.length-1-eligible[0].i>3))return eligible[0];
  let best,quality=-Infinity;
  for(let i=0;i<240;i++){
   const a=pool[Math.floor(Math.random()*pool.length)],b=pool[Math.floor(Math.random()*pool.length)];
   if(a.id===b.id||a.n===b.n&&a.m===b.m)continue;
   const prior=last.get(key(a.id,b.id));const gap=Math.abs(model.score(a)-model.score(b));
   const variance=a.x.reduce((s,v,j)=>s+(v-b.x[j])**2/model.information[j],0);
   const value=Math.log1p(variance)/(1+gap)+Math.random()*.65-.18*((model.seen.get(a.id)||0)+(model.seen.get(b.id)||0))-(prior===undefined?0:3);
   if(value>quality){best={a:a.id,b:b.id,why:history.length?'Suggested comparison to refine your current model.':'Choose the picture you prefer, then indicate how strongly.'};quality=value;}
  }
  return best||{a:pool[0].id,b:pool[1].id,why:'Compare these pictures.'};
 }
 return {fit,conflicts,next,key};
})();
