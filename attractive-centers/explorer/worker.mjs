import {mean,sub,norm,normalize,triangle,heart,powerHeart,four,fourCombined,tetra,area,hull,clipAll,polyHP} from './geometry.mjs?v=b46-20261001';
import {revisedFour,revisedTetra} from './revision.mjs?v=b46-20261001';
import {b36Heart} from './b41.mjs?v=b46-20261001';
import {b46Heart} from './b46.mjs?v=b46-20261001';
import {analyticHearts} from './analytic-hearts.mjs?v=hearts-20261017';
import {tetraHearts,planarFourHearts,trianglePullbackCenters} from './tetra-hearts.mjs?v=all-hearts-20261018';
let tetraCache=null,fourCache=null;
export function compute({mode,points,on={},count=49}){
  const {p,g,s}=normalize(points);let d,result;
  if(mode==='triangle'){
    d=triangle(p);if(d.degenerate)throw Error('The triangle is collinear. Move a vertex away from the line.');
    let inner=heart(p,count),b46=b46Heart(p);
    const analytic=analyticHearts(p,b46),centers=trianglePullbackCenters(p),poly=hull(centers.map(c=>c.point));
    analytic.pullback={centers,poly,boundary:centers.filter(c=>poly.some(v=>norm(sub(v,c.point))<2e-8))};
    analytic.previousExpanded=analytic.expanded;
    const all=[...analytic.expanded.centers,...centers],allPoly=hull(all.map(c=>c.point));
    analytic.expanded={...analytic.expanded,centers:all,poly:allPoly,boundary:all.filter(c=>allPoly.some(v=>norm(sub(v,c.point))<2e-8))};
    result={...d,heart:inner,b36:b36Heart(p),b46,analytic,hull:hull(p),baseArea:area(p)};
  }else if(mode==='four'){
    if(area(hull(p))<1e-10)throw Error('The four points are collinear. Move a vertex away from the line.');
    d=revisedFour(p,on);const gap=norm(sub(p[3],mean(p.slice(0,3))));
    const key=JSON.stringify([p,!!on.refineAnchors]);
    if(fourCache?.key!==key){const power=powerHeart(p,49);fourCache={key,power,hearts:planarFourHearts(p,power,{refine:!!on.refineAnchors})};}
    result={...d,power:fourCache.power,fourHearts:fourCache.hearts,baseArea:area(d.hull),centroidGapNormalized:gap,
      transferNote:gap<1e-13?'D = centroid(ABC) within numerical tolerance; full ABC transfer':'D is free; directional face-centroid transfer'};
  }else{
    d=revisedTetra(p,on);
    if(d.degenerate||!d.base||d.base.volume<1e-10)throw Error('The tetrahedron is flat. Change a vertex coordinate to restore volume.');
    const para=tetra(p,{para:true,bisector:false}),bi=tetra(p,{para:false,bisector:true});
    const key=JSON.stringify([p,!!on.refineAnchors]);
    if(tetraCache?.key!==key){const power=powerHeart(p,41);tetraCache={key,power,hearts:tetraHearts(p,power,{refine:!!on.refineAnchors})};}
    result={...d,para,bi,power:tetraCache.power,tetraHearts:tetraCache.hearts};
  }
  return {mode,result,g,s};
}
if(typeof self!=='undefined')self.onmessage=({data})=>{try{self.postMessage({id:data.id,...compute(data)});}catch(e){self.postMessage({id:data.id,error:e.message});}};
