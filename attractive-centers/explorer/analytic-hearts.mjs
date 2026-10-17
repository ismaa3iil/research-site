// SPDX-License-Identifier: MIT
import {normalize,add,mul,hull,norm,sub} from './geometry.mjs?v=b46-20261001';
import {FIRST_SHAPE_MAPS,INDEPENDENT_RAYS,CONSTANT_ARC_BOUNDS,EXTENSION_RAYS,EXACT_COLLINEAR_ENDPOINTS,rational} from './analytic-hearts-data.mjs?v=hearts-20261017';
export {FIRST_SHAPE_MAPS,INDEPENDENT_RAYS};

export function shapeWeights(sides,coefficients){
  const squared=sides.map(a=>a*a),total=squared.reduce((a,b)=>a+b,0);
  if(!(total>0)||!Number.isFinite(total))throw Error('Analytic hearts need finite, noncollapsed triangle data.');
  const s=squared.map(a=>a/total),meanSquare=s.reduce((a,b)=>a+b*b,0)/3;
  const q=(9*meanSquare-1)/2,p=36*s.reduce((sum,a)=>sum+(a-1/3)**3,0);
  let f,g;
  if(coefficients.length===6){const [f0,fq,fp,g0,gq,gp]=coefficients;f=f0+fq*q+fp*p;g=g0+gq*q+gp*p;}
  else if(coefficients.length===4){const [f0,fq,g0,gq]=coefficients;f=f0+fq*q;g=g0+gq*q;}
  else throw Error('An analytic map needs four or six coefficients.');
  return s.map(a=>1/3+(f+4*g)*(a-1/3)-6*g*(a*a-meanSquare));
}

export function shapeCenter(points,coefficients){
  const {p,g,s}=normalize(points),sides=p.map((_,i)=>norm(sub(p[(i+1)%3],p[(i+2)%3])));
  const weights=shapeWeights(sides,coefficients);
  return add(g,mul([0,1].map(j=>p.reduce((sum,v,i)=>sum+weights[i]*v[j],0)),s));
}

function endpoint(row){
  const lower=rational(row.lower),coefficients=row.seed.map(v=>lower*rational(v));
  const interval=row.upper?`${lower.toFixed(8)} ≤ λ* < ${rational(row.upper).toFixed(8)}`:'';
  return {...row,coefficients,name:row.name||`${row.id} · certified λ = ${lower.toFixed(8)}`,
    description:interval?`${row.id}: globally certified lower map; radial boundary ${interval}.`:`${row.id}: globally certified attractive shape-dependent map.`};
}
export const CERTIFIED_SHAPE_MAPS=FIRST_SHAPE_MAPS.map(endpoint);
export const CERTIFIED_RAYS=INDEPENDENT_RAYS.map(endpoint);
export const CERTIFIED_EXTENSION_RAYS=EXTENSION_RAYS.map(endpoint);
export function bridgeCoefficients(t){
  if(!Number.isFinite(t)||t<0||t>1)throw Error('Bridge parameter must lie in [0,1].');
  const left=[3/4,23/10,-1,6/5],right=[9/20,6/5,-8/5,13/5],bow=[-1/4,1,3/10,-6/5];
  const d=1329*t*t+2042*t+9081;
  return left.map((a,i)=>(640*(5*t+14)*((1-t)*a+t*right[i])+10560*t*(1-t)*bow[i])/d);
}

export function constantSamples(samplesPerArc=129){
  if(!Number.isInteger(samplesPerArc)||samplesPerArc<2||samplesPerArc>1025)throw Error('Choose 2–1025 samples per arc.');
  const out=[{id:'G',name:'G · centroid',coefficients:[0,0,0,0]},
    {id:'ΩT',name:'Constant family vertex T',coefficients:[-1/6,0,5/6,0]},
    {id:'ΩL',name:'Constant family vertex L',coefficients:[-2/3,0,1/3,0]}];
  for(const [arc,bounds] of Object.entries(CONSTANT_ARC_BOUNDS)){
    const [low,high]=bounds.map(rational);
    for(let i=0;i<samplesPerArc;i++){
      const t=low+(high-low)*i/(samplesPerArc-1);let f,g;
      if(arc==='I'){f=8*t/(t*t+8);g=-8/(t*t+8);}
      else {const d=54*t**4-108*t**3+63*t*t-12*t+1;f=-2*(9*t*t-7*t+1)/d;g=(2*t-1)/d;}
      out.push({id:`Ω${arc}-${i}`,name:`Constant arc ${arc} · parameter ${t.toFixed(6)}`,coefficients:[f,0,g,0],arc,parameter:t});
    }
  }
  return out;
}

function region(centers,failed=0){
  const poly=hull(centers.map(c=>c.point));
  const boundary=centers.filter(c=>poly.some(p=>norm(sub(p,c.point))<2e-9));
  return {centers,poly,boundary,failed};
}

export function analyticHearts(points,b46,samplesPerArc=129){
  const evaluate=row=>({...row,point:shapeCenter(points,row.coefficients)});
  const constant=constantSamples(samplesPerArc).map(evaluate);
  const first=CERTIFIED_SHAPE_MAPS.map(evaluate),rays=CERTIFIED_RAYS.map(evaluate);
  const exact=EXACT_COLLINEAR_ENDPOINTS.map(endpoint).map(evaluate);
  const bridge=Array.from({length:129},(_,i)=>({id:`Bridge-${i}`,name:`Repaired conic bridge · t = ${(i/128).toFixed(5)}`,coefficients:bridgeCoefficients(i/128),parameter:i/128})).map(evaluate);
  const extension=CERTIFIED_EXTENSION_RAYS.map(evaluate);
  const base=b46.centers.map(c=>({...c,id:`B46-${c.b46Position}`,name:`B46 #${c.b46Position}: ${c.name}`}));
  const six=[...base,...constant,...first,...rays],conic=[...six,...exact,...bridge];
  return {
    constant:region([...base,...constant],b46.failed),
    shape:region([...base,...constant,...first],b46.failed),
    six:region(six,b46.failed),conic:region(conic,b46.failed),
    expanded:region([...conic,...extension],b46.failed),
    rays:region(rays),extensionRays:region(extension),bridge:region(bridge),firstMaps:first,samplesPerArc,
    scope:'Certified maps; continuous arcs and conic bridge rendered by finite samples. Certified lower endpoints are used for bracketed rays. Maximal Heart remains open.'
  };
}
