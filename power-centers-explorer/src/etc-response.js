/** Forward-mode derivatives of the selected algebraic ETC formulas.
 * Research: Ismail Hammoudeh; extensive ChatGPT use. MIT.
 */
const N=6,constant=v=>[v,...Array(N).fill(0)];
const add=(a,b)=>a.map((x,i)=>x+b[i]);
const neg=a=>a.map(x=>-x);
const subtract=(a,b)=>add(a,neg(b));
const multiply=(a,b)=>[a[0]*b[0],...a.slice(1).map((x,i)=>x*b[0]+a[0]*b[i+1])];
const divide=(a,b)=>[a[0]/b[0],...a.slice(1).map((x,i)=>(x*b[0]-a[0]*b[i+1])/(b[0]*b[0]))];
function power(a,b){
  const v=Math.pow(a[0],b[0]),c=b[0]===0?0:b[0]*Math.pow(a[0],b[0]-1);
  return [v,...a.slice(1).map((x,i)=>c*x+(b[i+1]===0?0:v*Math.log(a[0])*b[i+1]))];
}
const sqrt=a=>power(a,constant(.5));
const abs=a=>a[0]<0?neg(a):a;
function expression(t,env){
  switch(t[0]){
    case 'num':return constant(t[1]);case 'var':return env[t[1]]||constant(NaN);case 'neg':return neg(expression(t[1],env));
    case 'add':return add(expression(t[1],env),expression(t[2],env));case 'sub':return subtract(expression(t[1],env),expression(t[2],env));
    case 'mul':return multiply(expression(t[1],env),expression(t[2],env));case 'div':return divide(expression(t[1],env),expression(t[2],env));
    case 'pow':return power(expression(t[1],env),expression(t[2],env));default:return constant(NaN);
  }
}
export function etcResponse(id,vertices,formulas){
  const formula=formulas[String(id)];if(!formula||vertices.length!==3||vertices.some(v=>v.length!==2))return null;
  const v=vertices.map((q,i)=>q.map((x,k)=>{const dual=constant(x);dual[1+2*i+k]=1;return dual;}));
  const sides=v.map((_,i)=>{const d=v[(i+1)%3].map((q,k)=>subtract(q,v[(i+2)%3][k]));return sqrt(add(multiply(d[0],d[0]),multiply(d[1],d[1])));});
  const e=v[1].map((q,k)=>subtract(q,v[0][k])),f=v[2].map((q,k)=>subtract(q,v[0][k])),area=divide(abs(subtract(multiply(e[0],f[1]),multiply(e[1],f[0]))),constant(2));
  if(!(area[0]>1e-14))return null;
  const s=divide(sides.reduce(add),constant(2));
  let weights=sides.map((a,i)=>{
    const b=sides[(i+1)%3],c=sides[(i+2)%3],a2=multiply(a,a),b2=multiply(b,b),c2=multiply(c,c);
    return expression(formula.tree,{a,b,c,s,sp:s,sa:subtract(s,a),sb:subtract(s,b),sc:subtract(s,c),S:multiply(area,constant(2)),Delta:area,R:divide(multiply(multiply(a,b),c),multiply(area,constant(4))),r:divide(area,s),SA:divide(subtract(add(b2,c2),a2),constant(2)),SB:divide(subtract(add(c2,a2),b2),constant(2)),SC:divide(subtract(add(a2,b2),c2),constant(2)),SW:divide(add(add(a2,b2),c2),constant(2))});
  });
  const scale=Math.max(...weights.map(q=>Math.abs(q[0])));if(!Number.isFinite(scale)||scale===0)return null;
  weights=weights.map(q=>divide(q,constant(scale)));const total=weights.reduce(add);if(Math.abs(total[0])<1e-10)return null;
  const center=[0,1].map(k=>divide(weights.map((w,i)=>multiply(w,v[i][k])).reduce(add),total));
  if(center.some(q=>q.some(x=>!Number.isFinite(x))))return null;
  const jacobians=vertices.map((_,i)=>center.map(q=>q.slice(1+2*i,3+2*i))),minimumEigenvalues=jacobians.map(J=>{
    const a=J[0][0],d=J[1][1],b=(J[0][1]+J[1][0])/2;return (a+d)/2-Math.hypot((a-d)/2,b);
  });
  return {center:center.map(q=>q[0]),jacobians,minimumEigenvalues};
}
