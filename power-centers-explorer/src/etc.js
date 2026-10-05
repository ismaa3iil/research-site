/** Selected ETC formulas; no dynamic code evaluation or Wolfram kernel.
 * ETC attribution: Clark Kimberling. Snapshot tools: Unlicense.
 * Numerical comparison research: Ismail Hammoudeh, with extensive ChatGPT use.
 */
import {centroid,norm,sub} from './math.js';
const funcs={Cos:Math.cos,Sin:Math.sin,Tan:Math.tan,ArcCos:Math.acos,ArcSin:Math.asin,ArcTan:Math.atan,Sqrt:Math.sqrt,Abs:Math.abs,Exp:Math.exp,Log:Math.log};
export function astValue(node,env){
  switch(node[0]){
    case 'num':return node[1];case 'var':return env[node[1]]??NaN;case 'neg':return -astValue(node[1],env);
    case 'add':return astValue(node[1],env)+astValue(node[2],env);case 'sub':return astValue(node[1],env)-astValue(node[2],env);
    case 'mul':return astValue(node[1],env)*astValue(node[2],env);case 'div':return astValue(node[1],env)/astValue(node[2],env);
    case 'pow':return Math.pow(astValue(node[1],env),astValue(node[2],env));
    case 'call':return funcs[node[1]]?funcs[node[1]](...node.slice(2).map(n=>astValue(n,env))):NaN;
    default:return NaN;
  }
}
export function etcCenter(id,vertices,formulas){
  if(vertices.length!==3||vertices.some(v=>v.length!==2||v.some(x=>!Number.isFinite(x))))return null;
  if(Number(id)===2)return centroid(vertices);
  const formula=formulas[String(id)];if(!formula)return null;
  const origin=centroid(vertices),D=Math.max(...vertices.map((v,i)=>norm(sub(v,vertices[(i+1)%3]))));if(!D)return null;
  const v=vertices.map(q=>q.map((x,i)=>(x-origin[i])/D));
  const e=sub(v[1],v[0]),f=sub(v[2],v[0]),area=Math.abs(e[0]*f[1]-e[1]*f[0])/2;if(area<1e-12)return null;
  const sides=v.map((_,i)=>norm(sub(v[(i+1)%3],v[(i+2)%3]))),angles=sides.map((a,i)=>{const b=sides[(i+1)%3],c=sides[(i+2)%3];return Math.acos(Math.max(-1,Math.min(1,(b*b+c*c-a*a)/(2*b*c))));});
  const s=sides.reduce((a,b)=>a+b,0)/2;
  let weights=sides.map((a,i)=>{
    const b=sides[(i+1)%3],c=sides[(i+2)%3],A=angles[i],B=angles[(i+1)%3],C=angles[(i+2)%3];
    return astValue(formula.tree,{a,b,c,A,B,C,angleA:A,angleB:B,angleC:C,s,sp:s,sa:s-a,sb:s-b,sc:s-c,S:2*area,Delta:area,R:a*b*c/(4*area),r:area/s,SA:(b*b+c*c-a*a)/2,SB:(c*c+a*a-b*b)/2,SC:(a*a+b*b-c*c)/2,SW:(a*a+b*b+c*c)/2,Pi:Math.PI,nan:NaN});
  });
  const scale=Math.max(...weights.map(Math.abs));if(!Number.isFinite(scale)||scale===0)return null;weights=weights.map(q=>q/scale);
  const total=weights.reduce((a,b)=>a+b,0);if(!Number.isFinite(total)||Math.abs(total)<1e-10)return null;
  const point=[0,1].map(k=>origin[k]+D*weights.reduce((sum,q,i)=>sum+q*v[i][k],0)/total);
  return point.every(Number.isFinite)?point:null;
}
export function sampledRanking(data,p){return data.powers.find(q=>Math.abs(q.p-p)<1e-9)||null;}
export function closestSample(data,p){return data.powers.reduce((best,q)=>Math.abs(q.p-p)<Math.abs(best.p-p)?q:best,data.powers[0]);}
export function etcURL(id){
  const part=id<=1000?1:id<=3000?2:id<=5000?3:id<=7000?4:id<=10000?5:Math.ceil(id/2000);
  const filename=part===1?'etc.html':`ETCPart${part}.html`;
  return `https://faculty.evansville.edu/ck6/encyclopedia/${filename}#X${id}`;
}
