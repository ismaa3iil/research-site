import assert from 'node:assert/strict';
import {buildFamilies,presets,frame,raw} from '../families.mjs';
import {V} from '../math.mjs';
const triangle=presets.find(p=>p.id==='acute1').triangle,f=frame(triangle),s=buildFamilies(triangle,{powerSheet:true,eisensteinSheet:true}),key=p=>p.map(x=>Math.round(x*1e7)).join(',');
const vertices=new Set(),branchEdges=new Map();let maxError=0,maxEdge=0;
for(let face of s.faces){for(let i=0;i<3;i++){let [k,h,rho]=face.coordinates[i],r=raw(f,face.family,k,rho);assert.ok(r);maxError=Math.max(maxError,Math.abs(r.h2-h*h));vertices.add(key(face.points[i]));let a=key(face.points[i]),b=key(face.points[(i+1)%3]),edge=[a,b].sort().join('|'),group=face.family+':'+face.branch;if(!branchEdges.has(group))branchEdges.set(group,new Set());branchEdges.get(group).add(edge);maxEdge=Math.max(maxEdge,V.norm(V.sub(face.points[i],face.points[(i+1)%3])));}}
assert.ok(maxError<1e-7,`height equation residual ${maxError}`);
let overlays=0;for(let line of s.lines)for(let points of line.segments)for(let point of points){assert.ok(vertices.has(key(point)),`strand leaves triangulation: ${line.id}`);overlays++;}
for(let family of ['power','eisenstein']){let a=branchEdges.get(family+':1'),b=branchEdges.get(family+':2');assert.ok(a&&b);let seam=[...a].filter(e=>b.has(e));assert.ok(seam.length>20,`insufficient shared fold edges for ${family}: ${seam.length}`);}
assert.ok(maxEdge<.3*f.g.scale,`unresolved long triangle edge ${maxEdge}`);
console.log(`Height-mesh checks passed: ${s.faces.length} facets; ${overlays} strand vertices belong to the mesh; both families share fold edges; maximum squared-height residual ${maxError}.`);
