// Height-coordinate atlas. Each monotone rho interval is a numbered h-graph.
// Turning points are explicit shared vertices; no aspect-ratio deletion at folds.
const dist=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
function bisect(fn,a,b){let fa=fn(a);for(let i=0;i<55;i++){let m=(a+b)/2,fm=fn(m);if(!Number.isFinite(fm))break;if(fa*fm<=0)b=m;else{a=m;fa=fm;}}return (a+b)/2;}
function extremum(fn,a,b,max){const g=(Math.sqrt(5)-1)/2;let c=b-g*(b-a),d=a+g*(b-a),fc=fn(c),fd=fn(d);for(let i=0;i<65;i++){if((max?fc>fd:fc<fd)){b=d;d=c;fd=fc;c=b-g*(b-a);fc=fn(c);}else{a=c;c=d;fc=fd;d=a+g*(b-a);fd=fn(d);}}return (a+b)/2;}
export function heightAtlas({raw,world,range,kValues,clip=2.5,resolution=64,scale=1,centroid=[0,0],family}){
 const cache=new Map(),maxR=2*clip+3,scan=[...new Set([...Array.from({length:641},(_,i)=>Math.exp(Math.log(1e-7)+(Math.log(maxR)-Math.log(1e-7))*i/640)),...Array.from({length:641},(_,i)=>maxR*i/640).slice(1)])].sort((a,b)=>a-b);
 function profile(k){if(cache.has(k))return cache.get(k);const fn=r=>{let v=raw(k,r);return v&&Math.hypot(v.x-centroid[0],v.y-centroid[1])<=clip?v:null;},h2=r=>fn(r)?.h2??NaN,groups=[];let run=[];
  for(let rho of scan){let r=fn(rho);if(r&&Number.isFinite(r.h2)){run.push({rho,...r});}else if(run.length){groups.push(run);run=[];}}if(run.length)groups.push(run);
  let branches=[];
  for(let group of groups){if(group.length<2)continue;let first=group[0].rho,last=group.at(-1).rho,ii=scan.indexOf(first),jj=scan.indexOf(last);
   if(ii>0){let a=scan[ii-1],b=first;for(let i=0;i<48;i++){let m=(a+b)/2;if(fn(m))b=m;else a=m;}first=b;}
   if(jj<scan.length-1){let a=last,b=scan[jj+1];for(let i=0;i<48;i++){let m=(a+b)/2;if(fn(m))a=m;else b=m;}last=a;}
   let cuts=[first];for(let i=1;i<group.length-1;i++){let a=group[i-1],b=group[i],c=group[i+1],d1=b.h2-a.h2,d2=c.h2-b.h2;if(d1*d2<0)cuts.push(extremum(h2,a.rho,c.rho,d1>0));}cuts.push(last);
   for(let j=1;j<cuts.length;j++){let a=cuts[j-1],b=cuts[j],ha=h2(a),hb=h2(b);if(!Number.isFinite(ha)||!Number.isFinite(hb)||Math.max(ha,hb)<0)continue;let direction=hb>=ha?1:-1;if(ha<0){a=bisect(r=>h2(r),a,b);ha=0;}if(hb<0){b=bisect(r=>h2(r),a,b);hb=0;}if(Math.min(ha,hb)>clip*clip)continue;if(ha>clip*clip){a=bisect(r=>h2(r)-clip*clip,a,b);ha=clip*clip;}if(hb>clip*clip){b=bisect(r=>h2(r)-clip*clip,a,b);hb=clip*clip;}
    let low=Math.sqrt(Math.max(0,Math.min(ha,hb))),high=Math.sqrt(Math.max(0,Math.max(ha,hb)));if(high-low<1e-9)continue;
    const at=h=>{let rho=Math.abs(h*h-ha)<1e-12?a:Math.abs(h*h-hb)<1e-12?b:bisect(r=>h2(r)-h*h,a,b),r=fn(rho);return r?{point:world([r.x,r.y,h]),h,k,rho}:null;};
    // Equal-height samples plus cosine refinement near both endpoints resolve rounded folds.
    let hs=[low,high,...Array.from({length:resolution+1},(_,i)=>i*clip/resolution).filter(h=>h>low&&h<high),...Array.from({length:33},(_,i)=>low+(high-low)*(1-Math.cos(Math.PI*i/32))/2)];hs=[...new Set(hs)].sort((a,b)=>a-b);let nodes=hs.map(at).filter(Boolean);for(let pass=0;pass<8;pass++){let refined=[];let changed=false;for(let i=1;i<nodes.length;i++){let a=nodes[i-1],b=nodes[i];refined.push(a);if(dist(a.point,b.point)>.075*scale){let m=at((a.h+b.h)/2);if(m){refined.push(m);changed=true;}}}refined.push(nodes.at(-1));nodes=refined;if(!changed)break;}branches.push({direction,low,high,nodes,at,rho:(a+b)/2});
   }
  }
  branches.sort((a,b)=>a.rho-b.rho);branches.forEach((b,i)=>b.branch=i+1);cache.set(k,branches);return branches;
 }
 let ks=[...new Set([...kValues,...Array.from({length:resolution+1},(_,i)=>range[0]+(range[1]-range[0])*i/resolution)])].filter(k=>k>=range[0]&&k<=range[1]).sort((a,b)=>a-b);
 // Refine k near chart births, disappearing roots, and rapid motion of fold edges.
 for(let pass=0;pass<6;pass++){let extra=[];for(let i=1;i<ks.length;i++){let a=profile(ks[i-1]),b=profile(ks[i]),change=a.length!==b.length||a.some((v,j)=>b[j]&&(Math.abs(v.high-b[j].high)>.06*clip||[0,.25,.5,.75,1].some(t=>dist(v.at(v.low+t*(v.high-v.low)).point,b[j].at(b[j].low+t*(b[j].high-b[j].low)).point)>.12*scale)));if(change&&ks[i]-ks[i-1]>1e-5)extra.push((ks[i]+ks[i-1])/2);}if(!extra.length)break;ks=[...ks,...extra].sort((a,b)=>a-b);}
 let faces=[],lines=[],contours=[];
 const push=(nodes,branch)=>{if(nodes.some(n=>!n))return;let p=nodes.map(n=>n.point);let u=p[1].map((x,i)=>x-p[0][i]),v=p[2].map((x,i)=>x-p[0][i]),area=Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]);if(area<1e-12*scale*scale)return;faces.push({points:p,coordinates:nodes.map(n=>[n.k,n.h,n.rho]),k:nodes.reduce((s,n)=>s+n.k,0)/3,family,branch});};
 for(let i=1;i<ks.length;i++){let left=profile(ks[i-1]),right=profile(ks[i]);for(let b=0;b<Math.min(left.length,right.length);b++){let l=left[b],r=right[b];if(l.direction!==r.direction)continue;let a=l.nodes,c=r.nodes,x=0,y=0;while(x<a.length-1||y<c.length-1){if(y===c.length-1||(x<a.length-1&&(a[x+1].h-l.low)/(l.high-l.low)<=(c[y+1].h-r.low)/(r.high-r.low))){push([a[x],a[x+1],c[y]],b+1);x++;}else{push([a[x],c[y+1],c[y]],b+1);y++;}}}}
 for(let k of kValues){let bs=profile(k);for(let b of bs)lines.push({k,branch:b.branch,points:b.nodes.map(n=>n.point)});}
 for(let h of Array.from({length:9},(_,i)=>clip*i/8)){let runs=new Map();for(let k of ks){let bs=profile(k);for(let branch=1;branch<=Math.max(2,...bs.map(b=>b.branch));branch++){let b=bs.find(b=>b.branch===branch),n=b&&h>=b.low&&h<=b.high?b.at(h):null;let run=runs.get(branch)||[];if(n)run.push(n.point);else if(run.length){if(run.length>1)contours.push({h,branch,points:run});run=[];}runs.set(branch,run);}}for(let [branch,run]of runs)if(run.length>1)contours.push({h,branch,points:run});}
 return {faces,lines,contours,charts:Math.max(0,...ks.map(k=>profile(k).length)),kRows:ks.length};
}
