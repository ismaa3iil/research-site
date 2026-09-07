import * as M from './math.mjs';
export function atlasData({h,metric='counts',resolution=40,range=2.5}){
  const cells={bary:[],complex:[]},classes=new Set();
  const label=q=>{if(metric==='parabolic')return 'P'+M.parabolicCount(q);if(metric==='planar')return 'L'+M.planarCount(q);if(metric==='structural')return M.structural(q);
    const c=M.counts(M.inverse(q,metric==='t9'?Math.sqrt(3):h));return 'E'+c[0]+' P'+c[1]+' H'+c[2];};
  for(const mode of ['bary','complex']){
    const xmin=mode==='bary'?-1:-range,xmax=mode==='bary'?1:range,ymax=mode==='bary'?M.SQ3:range,dx=(xmax-xmin)/resolution,dy=ymax/resolution;
    for(let j=0;j<resolution;j++)for(let i=0;i<resolution;i++){
      const x=xmin+(i+.5)*dx,y=(j+.5)*dy,q=mode==='bary'?M.baryWeights(x,y):M.complexWeights(x,y);if(!q||!M.validWeights(q))continue;
      const l=label(q);classes.add(l);cells[mode].push({x,y,dx,dy,label:l});
    }
  }
  return {h,metric,cells,classes:[...classes].sort()};
}
if(typeof WorkerGlobalScope!=='undefined'&&self instanceof WorkerGlobalScope)self.onmessage=({data})=>{
  try{const result=data.kind==='strands'?M.strandData(data.tri,data.samples,data.maxH):atlasData(data);self.postMessage({id:data.id,result});}
  catch(e){self.postMessage({id:data.id,error:e.message});}
};
