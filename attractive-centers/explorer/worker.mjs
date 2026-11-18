import {mean,sub,norm,normalize,triangle,heart,powerHeart,four,fourCombined,tetra,area,hull,clipAll,polyHP,polyhedron,pointCloudHull3,inside} from './geometry.mjs?v=b46-20261001';
import {revisedFour,revisedTetra} from './revision.mjs?v=b46-20261001';
import {b36Heart} from './b41.mjs?v=b46-20261001';
import {b46Heart} from './b46.mjs?v=b46-20261001';
import {analyticHearts} from './analytic-hearts.mjs?v=four-20261118';
import {tetraHearts,planarFourHearts,trianglePullbackCenters} from './tetra-hearts.mjs?v=all-hearts-20261018';
import {steinerHearts} from './steiner-hearts.mjs?v=batch2-20261118';
import {faceMeanHeart,faceMeanCenters3} from './face-means.mjs?v=batch2-20261118';
import {tetraPinPlanes,facePlanes,twoStepCuts3} from './tetra-chests.mjs?v=four-20261118';
import {fourChestLayers} from './four-chests.mjs?v=four-20261118';
let tetraCache=null,fourCache=null,fourChestCache=null;
export function compute({mode,points,on={},count=49}){
  const {p,g,s}=normalize(points);let d,result;
  if(mode==='triangle'){
    d=triangle(p);if(d.degenerate)throw Error('The triangle is collinear. Move a vertex away from the line.');
    let inner=heart(p,count),b46=b46Heart(p);
    const analytic=analyticHearts(p,b46),centers=trianglePullbackCenters(p),poly=hull(centers.map(c=>c.point));
    analytic.pullback={centers,poly,boundary:centers.filter(c=>poly.some(v=>norm(sub(v,c.point))<2e-8))};
    analytic.previousExpanded=analytic.expanded;
    const steiner=steinerHearts(p);analytic.steiner=steiner;
    const beforeSteiner=[...analytic.expanded.centers,...centers],beforePoly=hull(beforeSteiner.map(c=>c.point));
    analytic.beforeSteiner={centers:beforeSteiner,poly:beforePoly,boundary:beforeSteiner.filter(c=>beforePoly.some(v=>norm(sub(v,c.point))<2e-8))};
    const all=[...beforeSteiner,...steiner.centers.filter(c=>c.id!=='G')],allPoly=hull(all.map(c=>c.point));
    analytic.expanded={...analytic.expanded,centers:all,poly:allPoly,boundary:all.filter(c=>allPoly.some(v=>norm(sub(v,c.point))<2e-8))};
    result={...d,heart:inner,b36:b36Heart(p),b46,analytic,hull:hull(p),baseArea:area(p)};
  }else if(mode==='four'){
    if(area(hull(p))<1e-10)throw Error('The four points are collinear. Move a vertex away from the line.');
    d=revisedFour(p,on);const gap=norm(sub(p[3],mean(p.slice(0,3))));
    const key=JSON.stringify([p,!!on.refineAnchors]);
    if(fourCache?.key!==key){
      const power=powerHeart(p,49),hearts=planarFourHearts(p,power,{refine:!!on.refineAnchors}),face=faceMeanHeart(p);
      // Face means of the certified triangle centers enlarge the heart; the previous hull stays available.
      const all=[...hearts.expanded.centers,...face.centers],poly=hull(all.map(c=>c.point));
      hearts.faceMeans=face;hearts.beforeFaceMeans=hearts.expanded;
      hearts.expanded={centers:all,poly,boundary:all.filter(c=>poly.some(v=>norm(sub(v,c.point))<2e-8))};
      fourCache={key,power,hearts};
    }
    // The two-step scan depends only on the points; chest toggles reuse it.
    const chestKey=JSON.stringify([p,!!on.refineChest]);
    if(fourChestCache?.key!==chestKey)fourChestCache={key:chestKey,layers:fourChestLayers(p,d.hull,d.hull,on.refineChest?{grid:20,loci:300,transfer:true}:{grid:8,loci:80})};
    const layers=fourChestCache.layers;d.pins=layers.pins;d.twostep=layers.twostep;
    if(on.pins)d.combined=clipAll(d.combined,layers.pinPlanes);
    if(on.twostep)d.combined=clipAll(d.combined,layers.cutPlanes);
    result={...d,power:fourCache.power,fourHearts:fourCache.hearts,baseArea:area(d.hull),centroidGapNormalized:gap,
      transferNote:gap<1e-13?'D = centroid(ABC) within numerical tolerance; full ABC transfer':'D is free; directional face-centroid transfer'};
  }else{
    d=revisedTetra(p,on);
    if(d.degenerate||!d.base||d.base.volume<1e-10)throw Error('The tetrahedron is flat. Change a vertex coordinate to restore volume.');
    const para=tetra(p,{para:true,bisector:false}),bi=tetra(p,{para:false,bisector:true});
    const key=JSON.stringify([p,!!on.refineAnchors]);
    if(tetraCache?.key!==key){
      const power=powerHeart(p,41),hearts=tetraHearts(p,power,{refine:!!on.refineAnchors}),face=faceMeanCenters3(p);
      // Face means of the certified triangle centers, evaluated in the plane of each face.
      const all=[...hearts.expanded.centers,...face];
      hearts.faceMeans={centers:face,...pointCloudHull3(face.map(c=>c.point))};hearts.beforeFaceMeans=hearts.expanded;
      hearts.expanded={centers:all,...pointCloudHull3(all.map(c=>c.point))};
      tetraCache={key,power,hearts};
    }
    // Axis pins, median pins and moved-vertex transfer: keep the planes that cut the selected chest.
    const pinPlanes=tetraPinPlanes(p);d.pins=polyhedron([...facePlanes(d.base),...pinPlanes]);
    if(on.pins&&d.vertices.length>3){
      const cutting=pinPlanes.filter(h=>d.vertices.some(v=>h.n[0]*v[0]+h.n[1]*v[1]+h.n[2]*v[2]<h.b-1e-9));
      if(cutting.length){const base=d.base;d={...d,...polyhedron([...facePlanes(d),...cutting]),base};}
    }
    if(on.twostep&&d.vertices.length>3){
      // The refined scan adds to the default cuts, so refinement can only shrink the chest.
      const cuts=[...twoStepCuts3(p,d.vertices),...(on.refineChest?twoStepCuts3(p,d.vertices,{samples:360,keep:60}):[])];
      if(cuts.length){const base=d.base;d={...d,...polyhedron([...facePlanes(d),...cuts]),base};}
      d.twoStepCuts=cuts.length;
    }
    result={...d,para,bi,power:tetraCache.power,tetraHearts:tetraCache.hearts};
  }
  return {mode,result,g,s};
}
if(typeof self!=='undefined')self.onmessage=({data})=>{try{self.postMessage({id:data.id,...compute(data)});}catch(e){self.postMessage({id:data.id,error:e.message});}};
