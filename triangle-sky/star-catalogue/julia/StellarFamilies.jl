module StellarFamilies
# MIT. Generalized power-k and positive Eisenstein branches from the supplied WL sources.
using LinearAlgebra
include("TriangleSky.jl")
export frame, raw, apex, strand, sheet, eisenstein_parameters, eisenstein_range, prekites
function frame(t)
 g=TriangleSky.geometry(t);u=normalize(t[2]-t[1]);v=cross(g.n,u)
 localpoints=[[dot(p-t[1],u),dot(p-t[1],v)]/g.scale for p in t]
 (;t,g,u,v,localpoints,sides=g.sides/g.scale)
end
world(f,p)=f.t[1]+f.g.scale*(p[1]*f.u+p[2]*f.v+p[3]*f.g.n)
function trilaterate(f,r)
 all(isfinite,r) && minimum(r)>0 || return nothing
 c=f.localpoints[2][1];cx,cy=f.localpoints[3]
 x=(c^2+r[1]^2-r[2]^2)/(2c)
 y=(cx^2+cy^2+r[1]^2-r[3]^2-2cx*x)/(2cy)
 h2=r[1]^2-x^2-y^2
 isfinite(h2) ? (;x,y,h2,r) : nothing
end
function eisenstein_parameters(sides,k)
 abs(k)<1e-9 && return nothing
 logs=k*log.(sides);m=maximum(logs);a,b,c=exp.(logs.-m)
 disc=(a+b+c)*(-a+b+c)*(a-b+c)*(a+b-c)
 disc>1e-14 || return nothing
 sigma=(a^2+b^2+c^2+sqrt(3disc))/2
 u=[sigma+b^2+c^2-2a^2,sigma+c^2+a^2-2b^2,sigma+a^2+b^2-2c^2]/(3sqrt(sigma))
 minimum(u)>1e-12 ? (;u,m) : nothing
end
function raw(f,family,k,rho;positive=false)
 rho>0 || return nothing
 a,b,c=f.sides;r=[Float64(rho)]
 if abs(k)<1e-8
  append!(r,[rho*a/b,rho*a/c])
 elseif family==:power
  powers=f.sides.^k;q=[(sum(powers)-2x)/2 for x in powers]
  positive && (minimum(q)<=0 || rho^k-q[1]<=0) && return nothing
  for side in [b,c]
   value=expm1(k*log(a/rho))-expm1(k*log(side/rho))
   value> -1 || return nothing
   push!(r,rho*exp(log1p(value)/k))
  end
 elseif family==:eisenstein
  pars=eisenstein_parameters(f.sides,k);pars===nothing && return nothing
  u,m=pars.u,pars.m;rr=exp(2k*log(rho)-2m);disc=4rr-3u[1]^2
  disc>0 || return nothing
  v=(-u[1]+sqrt(disc))/2;v>0 || return nothing
  for j in [2,3];push!(r,exp((m+log(v^2+u[j]*v+u[j]^2)/2)/k));end
 else
  error("Family must be :power or :eisenstein")
 end
 trilaterate(f,r)
end
function apex(f,r;clip=2.5)
 r===nothing && return nothing
 r.h2>= -1e-10 || return nothing
 h=sqrt(max(0,r.h2));cent=sum(f.localpoints)/3
 h<=clip && norm([r.x,r.y]-cent)<=clip || return nothing
 world(f,[r.x,r.y,h])
end
function rhogrid(f,family,k,n,clip)
 lower=0.
 if family==:power && k>1e-8
  a,b,c=f.sides;lower=max(0,b^k-a^k,c^k-a^k)^(1/k)
 end
 maximumrho=2clip+3;lower<maximumrho || return Float64[]
 lower .+ exp.(range(log(1e-7),log(maximumrho-lower),length=n+1))
end
function strand(t,family,k;samples=400,clip=2.5,positive=false)
 f=frame(t);segments=Vector{Vector{Vector{Float64}}}();segment=Vector{Vector{Float64}}()
 for rho in rhogrid(f,family,k,samples,clip)
  p=apex(f,raw(f,family,k,rho;positive);clip)
  if p!==nothing && (isempty(segment)||norm(p-last(segment))<.55f.g.scale)
   push!(segment,p)
  else
   length(segment)>1 && push!(segments,segment)
   segment=p===nothing ? Vector{Vector{Float64}}() : [p]
  end
 end
 length(segment)>1 && push!(segments,segment)
 segments
end
function eisenstein_range(f;lo=-3.,hi=5.)
 good(k)=abs(k)<1e-8 || eisenstein_parameters(f.sides,k)!==nothing
 function boundary(a,b)
  for i in 1:55;m=(a+b)/2;if good(m);a=m;else;b=m;end;end
  a
 end
 (good(lo) ? lo : boundary(0.,lo),good(hi) ? hi : boundary(0.,hi))
end
function sheet(t,family;ksamples=56,rsamples=144,clip=2.5,positive=false)
 f=frame(t);limits=family==:power ? (-3.,5.) : eisenstein_range(f)
 kvals=collect(range(limits...,length=ksamples+1))
 rows=[[apex(f,raw(f,family,k,r;positive);clip) for r in rhogrid(f,family,k,rsamples,clip)] for k in kvals]
 faces=NamedTuple[]
 for i in 2:length(rows),j in 2:rsamples+1
  min(length(rows[i]),length(rows[i-1]))>=j || continue
  for pts in [[rows[i-1][j-1],rows[i][j-1],rows[i][j]],[rows[i-1][j-1],rows[i][j],rows[i-1][j]]]
   any(isnothing,pts) && continue
   edges=[norm(pts[j]-pts[mod1(j+1,3)]) for j in 1:3]
   norm(cross(pts[2]-pts[1],pts[3]-pts[1]))>1e-12*f.g.scale^2 || continue
   maximum(edges)<.6f.g.scale && minimum(edges)>1e-10*f.g.scale && maximum(edges)/minimum(edges)<25 || continue
   push!(faces,(points=pts,k=(kvals[i]+kvals[i-1])/2))
  end
 end
 (;faces,kvalues=kvals,range=limits)
end
function prekites(t;samples=180)
 f=frame(t)
 [[begin
   j=mod1(i+1,3);mid=(t[i]+t[j])/2;edge=t[j]-t[i];u=cross(f.g.n,normalize(edge));r=sqrt(3)*norm(edge)/2
   mid+r*(cos(a)*u+sin(a)*f.g.n)
  end for a in range(0,pi,length=samples+1)] for i in 1:3]
end
end
