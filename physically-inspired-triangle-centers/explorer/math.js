/* Pure numerical geometry. No eval(), framework, server or paid API. */
'use strict';
(function(global){
 const cross=(a,b)=>a[0]*b[1]-a[1]*b[0],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],add=(a,b)=>[a[0]+b[0],a[1]+b[1]],mul=(a,t)=>a.map(x=>x*t),norm=a=>Math.hypot(...a);
 function sides(v){return v.map((_,i)=>norm(sub(v[(i+1)%3],v[(i+2)%3])));}
 function geometry(v){let a=sides(v),D=Math.max(...a),ar=Math.abs(cross(sub(v[1],v[0]),sub(v[2],v[0])))/2,angles=a.map((q,i)=>Math.acos(Math.max(-1,Math.min(1,(a[(i+1)%3]**2+a[(i+2)%3]**2-q*q)/(2*a[(i+1)%3]*a[(i+2)%3])))));return {a,D,area:ar,s:a.reduce((p,q)=>p+q)/2,angles,valid:Number.isFinite(ar)&&D>1e-10&&ar>D*D*1e-9};}
 function weighted(w,v){let max=Math.max(...w.map(Math.abs));if(!Number.isFinite(max)||!max)return null;w=w.map(x=>x/max);let sum=w.reduce((p,q)=>p+q);if(Math.abs(sum)<1e-11)return null;let p=[0,1].map(k=>w.reduce((z,x,i)=>z+x*v[i][k],0)/sum);return p.every(Number.isFinite)?p:null;}
 function bary(p,v){let z=sub(p,v[0]),a=sub(v[1],v[0]),b=sub(v[2],v[0]),den=cross(a,b),u=cross(z,b)/den,t=cross(a,z)/den;return [1-u-t,u,t];}
 const funcs={Cos:Math.cos,Sin:Math.sin,Tan:Math.tan,ArcCos:x=>Math.acos(Math.max(-1,Math.min(1,x))),ArcSin:Math.asin,ArcTan:Math.atan,Sqrt:Math.sqrt,Abs:Math.abs,Exp:Math.exp,Log:Math.log};
 function ast(node,env){switch(node[0]){case'num':return node[1];case'var':return env[node[1]];case'neg':return -ast(node[1],env);case'add':return ast(node[1],env)+ast(node[2],env);case'sub':return ast(node[1],env)-ast(node[2],env);case'mul':return ast(node[1],env)*ast(node[2],env);case'div':return ast(node[1],env)/ast(node[2],env);case'pow':return Math.pow(ast(node[1],env),ast(node[2],env));case'call':return funcs[node[1]]?funcs[node[1]](...node.slice(2).map(n=>ast(n,env))):NaN;default:return NaN;}}
 function env(g,i){let a=g.a[i],b=g.a[(i+1)%3],c=g.a[(i+2)%3],A=g.angles[i],B=g.angles[(i+1)%3],C=g.angles[(i+2)%3],s=g.s,ar=g.area;return {a,b,c,A,B,C,angleA:A,angleB:B,angleC:C,s,sp:s,sa:s-a,sb:s-b,sc:s-c,S:2*ar,Delta:ar,R:a*b*c/(4*ar),r:ar/s,SA:(b*b+c*c-a*a)/2,SB:(a*a+c*c-b*b)/2,SC:(a*a+b*b-c*c)/2,SW:(a*a+b*b+c*c)/2,Pi:Math.PI,nan:NaN};}
 function classical(id,v,data){let g=geometry(v);if(!g.valid)return null;let n=+id.slice(1);if(n===1)return weighted(g.a,v);if(n===2)return weighted([1,1,1],v);if(n===360)return weighted(g.angles,v);if(n===3||n===4||n===5||n===20){let p=v[0],u=sub(v[1],p),w=sub(v[2],p),d=2*cross(u,w),o=add(p,[(norm(u)**2*w[1]-norm(w)**2*u[1])/d,(u[0]*norm(w)**2-w[0]*norm(u)**2)/d]),h=sub(mul(weighted([1,1,1],v),3),mul(o,2));if(n===3)return o;if(n===4)return h;if(n===5)return mul(add(o,h),.5);return sub(mul(o,2),h);}
 if(!data.etc[String(n)])return null;
 // Some ETC formulas have genuine exceptional configurations; do not assign a centroid.
 return weighted([0,1,2].map(i=>ast(data.etc[String(n)].tree,env(g,i))),v);
 }
 function interpolate(id,v,data){let m=data.meshes[id],g=geometry(v);if(!m||!g.valid)return {point:null,method:'No atlas coverage'};if(['Q1','Q2','Q4'].includes(id)&&Math.max(...g.angles)-Math.min(...g.angles)<1e-6)return {point:null,method:'Degenerate equilateral eigenspace: no unique individual state center'};
 let order=[0,1,2].sort((a,b)=>g.angles[a]-g.angles[b]),p=order.slice(0,2).map(i=>g.angles[i]),rows=m.points;
 let direct=-1;for(let i=0;i<rows.length;i++)if(norm(sub(p,rows[i][0]))<2e-9){direct=i;break;}
 let b,err=null,diam=0,method;
 if(direct>=0){b=rows[direct][1].slice();err=rows[direct][2];method='Atlas sample (symmetrized barycentrics)';}
 else {for(let ids of m.triangles){let q=ids.map(i=>rows[i][0]),w=bary(p,q);if(w.every(t=>t>=-1e-8&&t<=1+1e-8)){b=[0,1,2].map(j=>w.reduce((z,t,i)=>z+t*rows[ids[i]][1][j],0));let es=ids.map(i=>rows[i][2]);if(es.every(x=>x!==null))err=w.reduce((z,t,i)=>z+t*es[i],0);diam=Math.max(norm(sub(q[0],q[1])),norm(sub(q[0],q[2])),norm(sub(q[1],q[2])));break;}}
 method='Atlas interpolation in ordered-angle space';}
 if(!b)return {point:null,method:'Outside sampled shape coverage; extrapolation disabled'};
 for(let i=0;i<3;i++){let tied=order.map((j,k)=>Math.abs(g.angles[j]-g.angles[order[i]])<1e-8?k:-1).filter(k=>k>=0);if(tied.length>1){let a=tied.reduce((z,k)=>z+b[k],0)/tied.length;tied.forEach(k=>b[k]=a);}}
 let w=[0,0,0];order.forEach((i,j)=>w[i]=b[j]);return {point:weighted(w,v),method,refinement:err,cellSize:diam};
 }
 function magneticField(p,v){let total=0;for(let i=0;i<3;i++){let edge=sub(v[(i+1)%3],v[i]),L=norm(edge),e=mul(edge,1/L),q=sub(p,v[i]),s=q[0]*e[0]+q[1]*e[1],h=cross(e,q);total+=(s/Math.hypot(s,h)+(L-s)/Math.hypot(L-s,h))/h;}return Math.abs(total);}
 // Deterministic interior coordinate search, normalized by longest side.
 function minimumInterior(fun,v){let g=geometry(v),vv=v.map(p=>mul(sub(p,v[0]),1/g.D)),p=weighted([1,1,1],vv),val=fun(p,vv),step=.12;let dirs=Array.from({length:16},(_,i)=>[Math.cos(i*Math.PI/8),Math.sin(i*Math.PI/8)]);for(let count=0;count<1200&&step>2e-8;count++){let best=p,bv=val;for(let d of dirs){let q=add(p,mul(d,step));if(bary(q,vv).some(t=>t<=1e-9))continue;let f=fun(q,vv);if(Number.isFinite(f)&&f<bv){bv=f;best=q;}}if(best===p)step*=.55;else {p=best;val=bv;}}
 return add(v[0],mul(p,g.D));}
 function liveM1(v){return minimumInterior(magneticField,v);}
 function illuminatingObjective(p,v){let z=v.map(q=>sub(q,p)),rho=[];for(let i=0;i<3;i++){let a=z[i],b=z[(i+1)%3],cr=cross(a,b),an=Math.atan2(cr,a[0]*b[0]+a[1]*b[1]);rho.push(2*an/cr);}let d=[rho[0]-rho[1],rho[0]-rho[2]];return d;}
 function liveIllum(v){let g=geometry(v),vv=v.map(p=>mul(sub(p,v[0]),1/g.D)),p=weighted([1,1,1],vv);for(let i=0;i<60;i++){let f=illuminatingObjective(p,vv),h=1e-5,J=[0,1].map(k=>{let a=p.slice(),b=p.slice();a[k]+=h;b[k]-=h;let aa=illuminatingObjective(a,vv),bb=illuminatingObjective(b,vv);return aa.map((x,j)=>(x-bb[j])/(2*h));}),den=J[0][0]*J[1][1]-J[1][0]*J[0][1];if(!Number.isFinite(den)||Math.abs(den)<1e-14)return null;let d=[(f[0]*J[1][1]-f[1]*J[1][0])/den,(J[0][0]*f[1]-J[0][1]*f[0])/den],s=1,q;do{q=sub(p,mul(d,s));s*=.5;}while(bary(q,vv).some(x=>x<=1e-9)&&s>1e-10);p=q;if(norm(mul(d,s*2))<1e-11)break;}return add(v[0],mul(p,g.D));}
 function covariance(v,skeleton=false){let G=weighted([1,1,1],v),mu=G,S=[[0,0],[0,0]];if(skeleton){let a=sides(v),length=a.reduce((p,q)=>p+q),raw=[[0,0],[0,0]];mu=weighted(a.map(q=>length-q),v);for(let i=0;i<3;i++){let p=v[i],q=v[(i+1)%3],w=norm(sub(q,p))/length;for(let j=0;j<2;j++)for(let k=0;k<2;k++)raw[j][k]+=w*((p[j]*p[k]+q[j]*q[k])/3+(p[j]*q[k]+q[j]*p[k])/6);}for(let j=0;j<2;j++)for(let k=0;k<2;k++)S[j][k]=raw[j][k]-mu[j]*mu[k];}
 else for(let p of v)for(let j=0;j<2;j++)for(let k=0;k<2;k++)S[j][k]+=(p[j]-G[j])*(p[k]-G[k])/12;
 return {center:mu,matrix:S};}
 function eig2(S){let angle=.5*Math.atan2(2*S[0][1],S[0][0]-S[1][1]),d=Math.hypot(S[0][0]-S[1][1],2*S[0][1]);return {angle,values:[(S[0][0]+S[1][1]+d)/2,(S[0][0]+S[1][1]-d)/2]};}
 global.TCMath={cross,sub,add,mul,norm,sides,geometry,weighted,bary,classical,interpolate,liveM1,liveIllum,covariance,eig2};
})(typeof module==='object'?module.exports:window);
