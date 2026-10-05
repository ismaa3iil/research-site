import {centerPair,verifyPair,powerSamples} from './math.js';
let generation=0;
self.onmessage=async ({data})=> {
  const mine=++generation;
  try {
    if(data.kind==='point') {
      const result=verifyPair(data.vertices,data.p,{order:data.order});
      const baseline=data.baseline?verifyPair(data.baseline,data.p,{order:data.order}):null;
      self.postMessage({kind:'point',id:data.id,result,baseline});return;
    }
    const powers=powerSamples(data.mode,data.count),points=[];
    let atomicGuess,hullGuess;
    for(let i=0;i<powers.length;i++) {
      if(mine!==generation)return;
      const pair=centerPair(data.vertices,powers[i],{order:data.order,atomicGuess,hullGuess});
      atomicGuess=pair.atomic.converged?pair.atomic.center:undefined;
      hullGuess=pair.hull.converged?pair.hull.center:undefined;
      points.push(pair);
      if(i%6===0||i===powers.length-1) {
        self.postMessage({kind:'curve',id:data.id,points:[...points],complete:i===powers.length-1,total:powers.length});
        await new Promise(resolve=>setTimeout(resolve,0));
      }
    }
  } catch(error) {self.postMessage({kind:'error',id:data.id,message:error.message});}
};
