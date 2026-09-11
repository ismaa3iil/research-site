# SPDX-License-Identifier: MIT
# Scientific companion to geometry.mjs. Only Julia standard libraries required.
module AttractiveCenters
using LinearAlgebra
export triangle_chest, four_chests, tetrahedron_chest, attractive_inner_hull,
       polygon_area, normalize_points, explore_triangle, explore_four, explore_tetra
const TOL = 1e-9
avg(p) = reduce(+, p) / length(p)
cross2(a,b) = a[1]*b[2]-a[2]*b[1]
distinct(p; tol=TOL) = [v for (i,v) in enumerate(p) if !any(norm(v-p[j])<tol for j in 1:i-1)]
function hull(p)
    p=sort(distinct(p); by=v->(v[1],v[2]))
    length(p)<3 && return p
    function half(ps)
        h=Vector{Float64}[]
        for x in ps
            while length(h)>1 && cross2(h[end]-h[end-1],x-h[end])<=1e-12
                pop!(h)
            end
            push!(h,Float64.(x))
        end
        h
    end
    a,b=half(p),half(reverse(p))
    vcat(a[1:end-1],b[1:end-1])
end
polygon_area(p) = length(p)<3 ? 0.0 : abs(sum(cross2(p[i],p[mod1(i+1,length(p))]) for i in eachindex(p)))/2
hp(n,b) = norm(n)>1e-12 ? (n=n/norm(n),b=b/norm(n)) : nothing
inside(x,hs; tol=TOL) = all(dot(h.n,x)>=h.b-tol for h in hs)
function polygon_planes(p)
    p=hull(p)
    isempty(p) && return []
    if length(p)==1
        return [hp(n,dot(n,p[1])) for n in ([1.,0.],[-1.,0.],[0.,1.],[0.,-1.])]
    elseif length(p)==2
        d=p[2]-p[1];n=[-d[2],d[1]]
        return [hp(n,dot(n,p[1])),hp(-n,-dot(n,p[1])),hp(d,dot(d,p[1])),hp(-d,-dot(d,p[2]))]
    end
    [begin d=p[mod1(i+1,length(p))]-p[i];n=[-d[2],d[1]];hp(n,dot(n,p[i])) end for i in eachindex(p)]
end
function clip(p,h)
    (h===nothing || isempty(p)) && return p
    out=Vector{Float64}[]
    for i in eachindex(p)
        a,b=p[i],p[mod1(i+1,length(p))];u,v=dot(h.n,a)-h.b,dot(h.n,b)-h.b
        u>=-TOL && push!(out,a)
        if (u>TOL && v< -TOL)||(u< -TOL && v>TOL)
            push!(out,a+(b-a)*u/(u-v))
        end
    end
    distinct(out)
end
clipall(p,hs) = foldl(clip,hs;init=p)
function intersect_lines(h,k)
    d=cross2(h.n,k.n)
    abs(d)<1e-11 && return nothing
    [(h.b*k.n[2]-k.b*h.n[2])/d,(h.n[1]*k.b-k.n[1]*h.b)/d]
end
function normalize_points(p)
    p=[Float64.(v) for v in p];g=avg(p);s=maximum(norm(v-g) for v in p)
    s>1e-13 || throw(ArgumentError("Configuration collapsed"))
    (points=[(v-g)/s for v in p],center=g,scale=s)
end
const PARTITIONS=(((1,2),(3,4)),((1,3),(2,4)),((1,4),(2,3)))
function pair_planes(p)
    hs=[];central=nothing
    for (a,b) in PARTITIONS
        m=avg([p[i] for i in a]);q=avg([p[i] for i in b]);d=m-q
        if norm(d)<1e-11
            central=m;continue
        end
        push!(hs,hp(d,min(dot(d,m),dot(d,q))),hp(-d,-max(dot(d,m),dot(d,q))))
    end
    (planes=hs,central=central)
end
function parallelogram(p)
    pair=pair_planes(p)
    pair.central===nothing ? clipall(hull(p),pair.planes) : [pair.central]
end
function bisector_planes(p)
    hs=[]
    for i in 1:length(p)-1,j in i+1:length(p)
        u=p[j]-p[i];m=(p[i]+p[j])/2
        norm(u)<1e-12 && continue
        vals=[dot(u,p[k]-m) for k in eachindex(p) if k!=i && k!=j]
        signs=all(abs(v)<1e-12 for v in vals) ? [-1,1] : all(v>=-1e-12 for v in vals) ? [1] : all(v<=1e-12 for v in vals) ? [-1] : Int[]
        for s in signs
            n=s*u;push!(hs,hp(n,dot(n,m)))
        end
    end
    hs
end
function triangle_chest(p)
    polygon_area(p)<1e-11 && return (polygon=hull(p),strips=hull(p),napoleon=hull(p),degenerate=true)
    orientation=sign(cross2(p[2]-p[1],p[3]-p[1]));hs=[];ns=Vector{Float64}[]
    for i in 1:3
        a,b,c=p[i],p[mod1(i+1,3)],p[mod1(i+2,3)];d=b-a;m=(a+b)/2
        lo,hi=minmax(dot(d,m),dot(d,c));push!(hs,hp(d,lo),hp(-d,-hi))
        e=m+orientation*sqrt(3)/2*[-d[2],d[1]];push!(ns,(a+b+e)/3)
    end
    total=reduce(+,ns);cnt=hull([total-2*n for n in ns]);cp=clipall(hull(p),hs)
    (polygon=clipall(cp,polygon_planes(cnt)),strips=cp,napoleon=cnt,degenerate=false)
end
perms(a)=length(a)==1 ? [a] : [[v;r] for (i,v) in enumerate(a) for r in perms([a[j] for j in eachindex(a) if j!=i])]
function network_planes(p)
    hs=[]
    for perm in perms([1,2,3,4]),s in (-1,1)
        a,b,c,d=[p[i] for i in perm];edge=b-a
        norm(edge)<1e-10 && continue
        c0=(a+b)/2+s*sqrt(3)/2*[-edge[2],edge[1]];d0=(a+b+c0)/3;u,v=c-c0,d-d0
        for (target,first,second) in (([a,b,c,d0],u,v),([a,b,c0,d],v,u))
            q=clip(parallelogram(target),hp(first,dot(first,d0)))
            isempty(q) && continue
            h=hp(second,minimum(dot(second,x) for x in q))
            h===nothing || push!(hs,h)
        end
    end
    [h for (i,h) in enumerate(hs) if !any(norm(h.n-hs[j].n)<1e-8 && abs(h.b-hs[j].b)<1e-8 for j in 1:i-1)]
end
function stability_chest(p)
    base=hull(p)
    clauses=[[hp(p[i]-q,dot(p[i]-q,q)) for q in triangle_chest([p[j] for j in eachindex(p) if i!=j]).polygon] for i in eachindex(p)]
    clauses=filter(c->!any(isnothing,c),clauses);bh=polygon_planes(base)
    lines=vcat(bh,reduce(vcat,clauses;init=[]));points=copy(base)
    for i in 1:length(lines)-1,j in i+1:length(lines)
        x=intersect_lines(lines[i],lines[j]);x===nothing || push!(points,x)
    end
    hull([x for x in points if inside(x,bh) && all(any(dot(h.n,x)>=h.b-TOL for h in c) for c in clauses)])
end
function four_chests(p; para=true,bisectors=true,network=true,stability=false)
    base=hull(p);pa=parallelogram(p);bh=bisector_planes(p);nh=network_planes(p);st=stability_chest(p)
    selected=para ? pa : base
    bisectors && (selected=clipall(selected,bh))
    network && (selected=clipall(selected,nh))
    stability && (selected=isempty(st) ? st : clipall(selected,polygon_planes(st)))
    (hull=base,parallelogram=pa,bisectors=clipall(base,bh),network=clipall(base,nh),stability=st,selected=selected)
end
function power_center(points,p)
    x=avg(points);p==2 && return (point=x,converged=true,residual=0.)
    value(q)=sum(norm(q-v)^p/p for v in points)
    residual=Inf;converged=false
    for iteration in 1:180
        g=zeros(2);H=zeros(2,2)
        for v in points
            d=x-v;r=max(norm(d),1e-15);w=r^(p-2)
            g+=w*d;H+=w*Matrix{Float64}(I,2,2)+(p-2)*w/(r*r)*(d*d')
        end
        residual=norm(g)
        if residual<1e-10
            converged=true;break
        end
        step=det(H)>1e-24 ? H\g : .01*g;f=value(x);t=1.
        while t>1e-12 && value(x-t*step)>f-1e-4*t*dot(g,step)
            t/=2
        end
        next=x-t*step
        if norm(next-x)<1e-13
            converged=residual<1e-7;break
        end
        x=next
    end
    (point=x,converged=converged,residual=residual)
end
function attractive_inner_hull(points; count=49)
    count>=2 || throw(ArgumentError("count must be at least 2"))
    sides=[norm(points[mod1(i+1,3)]-points[mod1(i+2,3)]) for i in 1:3];L=sum(sides)
    weighted(w)=sum(w[i]*points[i] for i in 1:3)
    centers=[(name="X(1)",point=weighted(sides/L)),(name="X(10)",point=weighted((L .- sides)/(2*L))),(name="X(2)",point=avg(points))];failed=0
    for p in range(4-2*sqrt(2),4+2*sqrt(2);length=count)
        r=power_center(points,p)
        if r.converged
            push!(centers,(name="M_$(p)",point=r.point))
        else
            failed+=1
        end
    end
    (polygon=hull([c.point for c in centers]),centers=centers,failed=failed)
end
function tetra_planes(p)
    hs=[]
    for i in 1:4
        f=[p[j] for j in 1:4 if i!=j];n=cross(f[2]-f[1],f[3]-f[1])
        dot(n,p[i]-f[1])<0 && (n=-n);h=hp(n,dot(n,f[1]));h===nothing || push!(hs,h)
    end
    hs
end
function polyhedron(hs)
    vertices=Vector{Float64}[]
    for i in 1:length(hs)-2,j in i+1:length(hs)-1,k in j+1:length(hs)
        h=[hs[i],hs[j],hs[k]];a,b,c=[v.n for v in h];determinant=dot(a,cross(b,c))
        abs(determinant)<1e-11 && continue
        x=(h[1].b*cross(b,c)+h[2].b*cross(c,a)+h[3].b*cross(a,b))/determinant
        inside(x,hs;tol=1e-8) && push!(vertices,x)
    end
    vertices=distinct(vertices;tol=1e-7);faces=[];volume=0.
    length(vertices)<4 && return (vertices=vertices,faces=faces,volume=volume)
    g=avg(vertices)
    for h in hs
        f=[x for x in vertices if abs(dot(h.n,x)-h.b)<1e-7]
        length(f)<3 && continue
        center=avg(f);e=normalize(f[1]-center);v=cross(h.n,e)
        sort!(f;by=x->atan(dot(x-center,v),dot(x-center,e)))
        any(length(old)==length(f) && all(a in f for a in old) for old in faces) && continue
        push!(faces,f)
        for j in 2:length(f)-1
            volume+=abs(dot(f[1]-g,cross(f[j]-g,f[j+1]-g)))/6
        end
    end
    (vertices=vertices,faces=faces,volume=volume)
end
function tetrahedron_chest(p;para=true,bisectors=true)
    hs=tetra_planes(p);length(hs)==4 || throw(ArgumentError("Degenerate tetrahedron"))
    base=polyhedron(hs);pair=pair_planes(p)
    if para && pair.central!==nothing
        return (vertices=[pair.central],faces=[],volume=0.,base=base)
    end
    para && append!(hs,pair.planes)
    bisectors && append!(hs,bisector_planes(p))
    merge(polyhedron(hs),(base=base,))
end
# High-level functions return normalized geometry with its inverse map.
# Original coordinate = result.center + result.scale * normalized_coordinate.
function explore_triangle(p;count=49)
    n=normalize_points(p)
    merge(n,(chest=triangle_chest(n.points),heart=attractive_inner_hull(n.points;count=count)))
end
function explore_four(p;kwargs...)
    n=normalize_points(p);merge(n,(chests=four_chests(n.points;kwargs...),))
end
function explore_tetra(p;kwargs...)
    n=normalize_points(p);merge(n,(chest=tetrahedron_chest(n.points;kwargs...),))
end
end # module
