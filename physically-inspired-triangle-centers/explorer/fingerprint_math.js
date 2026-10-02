/* Angular reparameterization and gap-preserving curve readout. */
'use strict';
(function(global){
 const DEG=Math.PI/180;
 const toAngle=h=>Math.atan(h)/DEG;
 const toHeight=angle=>Math.tan(angle*DEG);
 const perDegree=(dh,angle)=>dh*DEG/(Math.cos(angle*DEG)**2);
 function transform(rows,index,derivative='height'){
  if(index===6)return rows.map(r=>r.slice());
  return rows.map(([h,value])=>{
   let angle=toAngle(h);
   return [angle,value===null?null:([1,4,5].includes(index)&&derivative==='angle'?perDegree(value,angle):value)];
  });
 }
 function valueAt(rows,x){
  // No extrapolation and no interpolation across a missing sample.
  for(let i=0;i<rows.length;i++){
   let [xx,y]=rows[i];
   if(Math.abs(xx-x)<1e-10)return Number.isFinite(y)?y:null;
   if(i&&x>rows[i-1][0]&&x<xx){
    let [left,a]=rows[i-1];
    if(a===null||y===null||!Number.isFinite(a)||!Number.isFinite(y))return null;
    return a+(y-a)*(x-left)/(xx-left);
   }
  }
  return null;
 }
 const palette=['#0075E8','#E62978','#00A26B','#E67500','#8A42E4','#D63B25','#009CAD','#A08B00','#B53CC0','#437DCE','#7B9E00','#D14B9A','#008277','#C76516','#5B55CB','#BC403E'];
 function paletteFor(ids){
  let result=new Map();
  ids.forEach((id,i)=>result.set(id,i<palette.length?palette[i]:'hsl('+((i-palette.length)*137.508+29)%360+' 78% '+(i%2?42:49)+'%)'));
  return result;
 }
 global.FPMath={toAngle,toHeight,perDegree,transform,valueAt,paletteFor};
})(typeof module==='object'?module.exports:window);
