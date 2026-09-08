module TriangleSky
# Copyright (c) 2026 Ismail Hammoudeh. MIT license.
using LinearAlgebra
export evaluate, optimize, geometry, catalogue
bilin(a,b)=sum(a.*b)
csqrt(z)=sqrt(ComplexF64(real(z),imag(z)==0 ? 0.0 : imag(z)))
csqrt(z::Real)=z>=0 ? sqrt(z) : sqrt(ComplexF64(z))
lengthb(a)=csqrt(bilin(a,a))
area(t)=lengthb(cross(t[2]-t[1],t[3]-t[1]))/2
normal(t)=normalize(real.(cross(t[2]-t[1],t[3]-t[1])))
function circum(t)
 a,b,c=t;u=b-a;v=c-a;n=cross(u,v)
 vcat(transpose(2u),transpose(2v),transpose(n))\[bilin(b,b)-bilin(a,a),bilin(c,c)-bilin(a,a),bilin(n,a)]
end
function center(i,t)
 i==2 && return sum(t)/3
 i==3 && return circum(t)
 i==4 && return sum(t)-2circum(t)
 w=[lengthb(t[2]-t[3]),lengthb(t[3]-t[1]),lengthb(t[1]-t[2])]
 i==1 && return sum(w.*t)/sum(w)
 error("Unknown triangle center")
end
function tetra(i,t)
 i==2 && return sum(t)/4
 if i==1
  w=[area(t[setdiff(1:4,j)]) for j in 1:4]
  return sum(w.*t)/sum(w)
 end
 if i==3
  p=t[1];return reduce(vcat,[transpose(2(q-p)) for q in t[2:4]])\[bilin(q,q)-bilin(p,p) for q in t[2:4]]
 end
 error("Unknown tetrahedral center")
end
function simple(i,t)
 a,b,c=t;n=normal(t)
 i==3 && return (sum(t)+simple(1,t))/4
 if i==2
  h=center(4,t);return h+csqrt(-bilin(a-h,b-h))*n
 end
 if i==1
  u=b-a;v=c-a;aa=bilin(b-c,b-c);bb=bilin(v,v);cc=bilin(u,u)
  q=[cc bilin(u,v);bilin(u,v) bb]\[(cc-bb+aa)/2,(bb-cc+aa)/2]
  foot=a+q[1]*u+q[2]*v
  return foot+csqrt(aa-norm(foot-a)^2)*n
 end
 error("Unknown simple star")
end
function parse_expression(source)
 tokens=[m.match for m in eachmatch(r"TS[A-Za-z]+|\d+|[\[\],]",source)]
 join(tokens)==replace(source,r"\s"=>"") || error("Invalid expression")
 pos=Ref(1)
 function next()
  h=tokens[pos[]];pos[]+=1
  occursin(r"^\d+$",h) && return parse(Int,h)
  startswith(h,"TS") || error("Invalid head")
  args=Any[]
  if pos[]<=length(tokens) && tokens[pos[]]=="["
   pos[]+=1;push!(args,next())
   while pos[]<=length(tokens) && tokens[pos[]]==",";pos[]+=1;push!(args,next());end
   tokens[pos[]]=="]" || error("Missing bracket");pos[]+=1
  end
  (h,args)
 end
 ast=next();pos[]==length(tokens)+1 || error("Trailing expression");ast
end
function evalast(ast,t)
 h,a=ast
 h=="TSA" && return t[1]
 h=="TSB" && return t[2]
 h=="TSC" && return t[3]
 h=="TSX" && return center(a[1],t)
 h=="TSZ" && return simple(a[1],t)
 h=="TSY" && return tetra(a[1],[evalast(e,t) for e in a[2:end]])
 h=="TSConjugate" && return evalast(a[1],t[[1,3,2]])
 error("Unsupported expression $h")
end
function geometry(t)
 sides=[norm(t[2]-t[3]),norm(t[3]-t[1]),norm(t[1]-t[2])];scale=maximum(sides)
 ar=real(area(t));scale>0 && 2ar/scale^2>=1e-8 || error("Degenerate base")
 p=sum(sides);q=[(v-t[1])/scale for v in t]
 (;sides,scale,n=normal(t),area=ar,p,r=2ar/p,R=prod(sides)/(4ar),o=t[1]+scale*circum(q),inc=sum(sides.*t)/p)
end
function result(point,t,g=geometry(t))
 h=dot(point-t[1],g.n);foot=point-h*g.n
 b=hcat(t[2]-t[1],t[3]-t[1])\(foot-t[1])
 (;point,foot,height=abs(h),bary=[1-sum(b),b...])
end
function evaluate(expression,t)
 try
  g=geometry(t);q=[ComplexF64.((v-t[1])/g.scale) for v in t]
  point=evalast(parse_expression(expression),q)
  all(isfinite,point) && maximum(abs.(imag.(point)))<=1e-7 || return nothing
  result(t[1]+g.scale*real.(point),t,g)
 catch
  nothing
 end
end
function objective(id,t,p)
 try
  pts=[t;[p]]
  ns=map(1:4) do i
   a,b,c=pts[setdiff(1:4,i)];n=cross(b-a,c-a)
   dot(n,pts[i]-a)>0 && (n=-n);normalize(n)
  end
  cs=[-dot(ns[i],ns[j]) for i in 1:4 for j in i+1:4]
  id=="DGS" && return sum((cs.-1/3).^2)
  id=="NFIS" && return sum(cs.^2)
  vol=abs(dot(t[2]-t[1],cross(t[3]-t[1],p-t[1])))/6
  surface=sum(area(pts[setdiff(1:4,i)]) for i in 1:4)
  norm(tetra(3,pts)-t[1])/(3vol/surface)
 catch
  1e12
 end
end
function nelder_mead(f,start;maxiter=650)
 simplex=[copy(start),[start+[i==j ? .09 : 0. for j in 1:3] for i in 1:3]...]
 values=f.(simplex);converged=false
 for iter in 1:maxiter
  order=sortperm(values);simplex=simplex[order];values=values[order]
  if maximum(norm(x-simplex[1]) for x in simplex)<1e-7;converged=true;break;end
  cen=sum(simplex[1:3])/3;trial(k)=cen+k*(cen-simplex[4]);r=trial(1);yr=f(r)
  if yr<values[1]
   e=trial(2);ye=f(e);simplex[4],values[4]=ye<yr ? (e,ye) : (r,yr)
  elseif yr<values[3]
   simplex[4],values[4]=r,yr
  else
   c=trial(yr<values[4] ? .5 : -.5);yc=f(c)
   if yc<min(yr,values[4]);simplex[4],values[4]=c,yc
   else
    for i in 2:4;simplex[i]=(simplex[i]+simplex[1])/2;values[i]=f(simplex[i]);end
   end
  end
 end
 i=argmin(values);(;x=simplex[i],value=values[i],converged)
end
function optimize(id,t)
 g=geometry(t)
 if id=="IVS";return result(g.inc+2sqrt(2)*g.r*g.n,t,g);end
 if id=="CVS";return result(g.o+sqrt(2)*g.R*g.n,t,g);end
 if id=="EVS"
  h2=(g.p/3)^2-g.R^2;h2>0 || return nothing
  return result(g.o+sqrt(h2)*g.n,t,g)
 end
 id in ["ERS","DGS","NFIS"] || error("Unknown optimizer")
 tri=[(v-t[1])/g.scale for v in t]
 point(x)=x[1]*tri[1]+x[2]*tri[2]+(1-x[1]-x[2])*tri[3]+exp(x[3])*g.n
 function f(x)
  b=[x[1],x[2],1-x[1]-x[2]]
  pen=1e5*(sum(max(0,-2-v,v-3)^2 for v in b)+max(0,-4-x[3],x[3]-1.6)^2)
  objective(id,tri,point(x))+pen
 end
 a,b=g.sides[1:2]/g.p
 starts=id=="ERS" ? [[.38,.33,log(.70)],[a,b,log(.55)],[1/3,1/3,log(.65)]] : id=="DGS" ? [[.13,.41,log(.57)],[a,b,log(.52)],[1/3,1/3,log(.60)]] : [[.12,.40,log(.54)],[a,b,log(.50)],[1/3,1/3,log(.58)]]
 fits=[nelder_mead(f,s) for s in starts];best=fits[argmin([r.value for r in fits])]
 (;result(t[1]+g.scale*point(best.x),t,g)...,objective=objective(id,tri,point(best.x)),converged=best.converged)
end
include("catalogue.jl")
end
