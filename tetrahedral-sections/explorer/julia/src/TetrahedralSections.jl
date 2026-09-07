"""Numerical tetrahedral sections and inverse-apex geometry.

Angles are radians. The regular height is √2. The browser adapter uses
Float64; this module also accepts BigFloat for polynomial root isolation.
Numerical roots do not replace the original exact Wolfram certificates.
"""
module TetrahedralSections
using LinearAlgebra
include("coefficients.jl")
export section, physical, squared_sides, side_weights, triangle_angles,
       invariants, section_centers, center_point, inverse_sections,
       inverse_at_mu, apex_solutions, conic_type, real_roots,
       plane_coordinates, circumconic, inconic, fermat_point, strand_data

physical(mu,phi) = isfinite(mu) && mu >= 0 && all(1-mu*cos(phi+2oftype(float(phi),pi)*k/3)>0 for k in 0:2)
function section(h,mu,phi)
    [begin
        th=phi+2oftype(float(phi),pi)*k/3; t=(1+mu)/(1-mu*cos(th))
        [t*cos(th),t*sin(th),h*(1-t)]
    end for k in 0:2]
end
squared_sides(tri) = [sum(abs2,tri[mod1(i+1,3)]-tri[mod1(i+2,3)]) for i in 1:3]
side_weights(tri) = (s=squared_sides(tri); s/sum(s))
triangle_angles(q) = [acos(clamp((q[mod1(i+1,3)]+q[mod1(i+2,3)]-q[i])/(2sqrt(q[mod1(i+1,3)]*q[mod1(i+2,3)])),-1,1)) for i in 1:3]
function invariants(q)
    v=q.-one(q[1])/3
    (p=q[1]*q[2]+q[2]*q[3]+q[3]*q[1],r=prod(q),d=sum(abs2,v)/2,e=prod(v))
end
conic_type(mu; atol=2e-6) = abs(mu-1)<atol ? :Parabolic : mu<1 ? :Elliptic : :Hyperbolic
function section_centers(h,mu)
    d=sqrt(1+h*h*mu*mu)
    (C1=(1-h*h*mu)/d,C2=d,C3=d/(1-mu),C4=d*(4+mu)/(4-mu*mu))
end
center_point(h,mu,u) = (d=sqrt(1+h*h*mu*mu); [-1+u/d,zero(u),-h*mu*u/d])
plane_coordinates(h,mu,p) = [sqrt(1+h*h*mu*mu)*(p[1]+1),p[2]]
circumconic(h,mu,u,v) = (1-mu^2)*u^2/(1+h*h*mu*mu)+v^2-2*(1+mu)*u/sqrt(1+h*h*mu*mu)
inconic(h,mu,u,v) = (4-mu^2)*u^2/(1+h*h*mu*mu)+4v^2-2*(4+mu)*u/sqrt(1+h*h*mu*mu)+3

polyval(c,x) = evalpoly(x,c)
function deduplicate(a,tol)
    b=sort(a); out=eltype(a)[]
    for v in b
        (isempty(out)||abs(v-last(out))>tol*max(1,abs(v)))&&push!(out,v)
    end
    out
end
"""Real-root candidates in a bounded interval, including stationary roots.
Use BigFloat inputs and tighter tolerances near coalescing roots.
"""
function real_roots(c0,lo,hi; rtol=2e-13,xtol=2e-8)
    T=promote_type(eltype(c0),typeof(float(lo)),typeof(float(hi)))
    c=T.(c0)
    while length(c)>1 && iszero(last(c)); pop!(c); end
    scale=maximum(abs,c)
    (iszero(scale)||length(c)<2)&&return T[]
    c/=scale
    if length(c)==2
        x=-c[1]/c[2]; return lo<=x<=hi ? [x] : T[]
    end
    cuts=vcat(T(lo),real_roots(c[2:end].*(1:length(c)-1),lo,hi;rtol,xtol),T(hi))
    out=T[]
    small(x)=abs(polyval(c,x))<rtol*max(T(1e-30),polyval(abs.(c),abs(x)))
    for x in cuts
        small(x)&&push!(out,x)
    end
    for i in 2:length(cuts)
        a,b=cuts[i-1],cuts[i]; fa,fb=polyval(c,a),polyval(c,b)
        (fa*fb>=0||small(a)||small(b))&&continue
        for _ in 1:max(80,precision(T))
            m=(a+b)/2; fm=polyval(c,m)
            if fa*fm<=0; b=m; else; a=m; fa=fm; end
        end
        push!(out,(a+b)/2)
    end
    deduplicate(out,xtol)
end
function polynomial(terms,values,index)
    T=eltype(values); out=zeros(T,maximum(terms[:,index+1])+1); correction=copy(out)
    for t in eachrow(terms)
        v=T(t[1])
        for j in eachindex(values); j!=index&&(v*=values[j]^t[j+1]); end
        k=t[index+1]+1; y=v-correction[k]; s=out[k]+y; correction[k]=(s-out[k])-y; out[k]=s
    end
    out
end
function recover(q,mu,h;rtol=2e-13,xtol=2e-8,shape_tol=2e-6)
    out=NamedTuple[]
    (0<mu<2&&h>=0)||return out
    inv=invariants(q); m3=mu^3
    co=polynomial(RECOVERY,[zero(mu),mu*mu,h*h,inv.d],1)
    for z in real_roots(co,-m3,m3;rtol,xtol)
        c=clamp(z/m3,-1,1); phi=acos(c)/3
        physical(mu,phi)||continue
        error=maximum(abs,sort(side_weights(section(h,mu,phi)))-sort(q))
        error<shape_tol&&push!(out,(mu=mu,h=h,c=c,phi=phi,type=conic_type(mu),error=error))
    end
    out
end
valid(q)=all(x->isfinite(x)&&x>0,q)&&4invariants(q).p-1>1e-12
function inverse_sections(q0,h0;rtol=2e-13,xtol=2e-8,shape_tol=2e-6)
    T=promote_type(eltype(q0),typeof(float(h0))); q=T.(q0); h=T(h0)
    out=NamedTuple[]; (valid(q)&&isfinite(h)&&h>=0)||return out
    inv=invariants(q)
    if inv.d<eps(T)^2*100
        push!(out,(mu=zero(T),h=h,c=one(T),phi=zero(T),type=:Elliptic,error=zero(T)))
        h*h>2+xtol&&append!(out,recover(q,2/(h*h-1),h;rtol,xtol,shape_tol))
        return out
    end
    co=polynomial(CORE,[zero(T),h*h,inv.d,inv.e],1)
    for x in real_roots(co,zero(T),T(4);rtol,xtol)
        1e-12<x<4-1e-10&&append!(out,recover(q,sqrt(x),h;rtol,xtol,shape_tol))
    end
    distinct=NamedTuple[]
    for v in out
        any(w->abs(v.mu-w.mu)<100xtol&&abs(v.c-w.c)<100xtol,distinct)||push!(distinct,v)
    end
    distinct
end
function inverse_at_mu(q0,mu0;max_h=120,rtol=2e-13,xtol=2e-8,shape_tol=2e-6)
    T=promote_type(eltype(q0),typeof(float(mu0))); q=T.(q0); mu=T(mu0)
    out=NamedTuple[]; (valid(q)&&0<mu<2)||return out
    inv=invariants(q); co=polynomial(CORE,[mu*mu,zero(T),inv.d,inv.e],2)
    for H in real_roots(co,zero(T),T(max_h)^2;rtol,xtol)
        H>1e-12&&append!(out,recover(q,mu,sqrt(H);rtol,xtol,shape_tol))
    end
    out
end
function map_point(model,target,p;upper=false)
    u=normalize(model[2]-model[1]); t=model[3]-model[1]; v=normalize(t-dot(t,u)*u); n=cross(u,v)
    U=normalize(target[2]-target[1]); t=target[3]-target[1]; V=normalize(t-dot(t,U)*U); N=cross(U,V)
    scale=norm(target[2]-target[1])/norm(model[2]-model[1]); d=p-model[1]
    answer=target[1]+scale*(dot(d,u)*U+dot(d,v)*V+dot(d,n)*N)
    upper&&(answer[3]=abs(answer[3])); answer
end
const PERMS=((1,2,3),(1,3,2),(2,1,3),(2,3,1),(3,1,2),(3,2,1))
"""Map every compatible labeled inverse onto a fixed planar triangle.
Symmetric triangles can have several spatial apices for one unordered root.
"""
function apex_solutions(tri,rows)
    target=[vcat(p,zero(p[1])) for p in tri]; q=side_weights(target); out=NamedTuple[]
    for row in rows
        model=section(row.h,row.mu,row.phi)
        for perm in PERMS
            m=model[collect(perm)]
            maximum(abs,side_weights(m)-q)>2e-6&&continue
            point=map_point(m,target,[zero(row.h),zero(row.h),row.h];upper=true)
            (all(isfinite,point)&&!any(r->norm(r.point-point)<2e-5,out))||continue
            centers=[isfinite(u) ? map_point(m,target,center_point(row.h,row.mu,u)) : nothing for u in section_centers(row.h,row.mu)]
            centers[1]=[point[1],point[2],zero(point[3])]
            push!(out,merge(row,(point=point,centers=centers)))
        end
    end
    out
end
function fermat_point(tri)
    a=triangle_angles(side_weights(tri)); maximum(a)>=2pi/3-1e-9&&return nothing
    w=sqrt.(squared_sides(tri))./sin.(a.+pi/3)
    sum(w[i]*tri[i] for i in 1:3)/sum(w)
end
"""Sample inverse-apex slices, retaining each mu and its complete apex set.
The caller may connect slices by continuation; no false chords are imposed.
"""
function strand_data(tri;samples=180,max_h=120)
    q=side_weights(tri);valid(q)||throw(ArgumentError("Nondegenerate triangle required"))
    mus=[1.999-(1.999-.008)*(1-cos(pi*j/samples))/2 for j in 0:samples]
    (triangle=tri,slices=[(mu=mu,rows=apex_solutions(tri,inverse_at_mu(q,mu;max_h))) for mu in mus],
     parabolic=apex_solutions(tri,inverse_at_mu(q,1.;max_h)),fermat=fermat_point(tri))
end
end
