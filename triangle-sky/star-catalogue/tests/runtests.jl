using Test, LinearAlgebra
include("../julia/TriangleSky.jl")
using .TriangleSky
@testset "Triangle Sky" begin
 t=[[0.,0,0],[21.,0,0],[16.,12,0]]
 @test length(catalogue)==167
 @test count(r->r.index<=4,catalogue)==53
 es=evaluate("TSZ[1]",t).point
 @test [norm(es-p) for p in t]≈[13,20,21]
 os=evaluate("TSZ[2]",t).point
 @test all(abs(dot(t[i]-os,t[j]-os))<1e-9 for i in 1:3 for j in i+1:3)
 transform(p)=2.73p[[3,1,2]]+[3,-8,2]
 for row in catalogue
  a=evaluate(row.expression,t);b=evaluate(row.expression,transform.(t))
  @test a!==nothing && b!==nothing
  @test b.point≈transform(a.point) atol=1e-7
 end
 eq=[[0.,0,0],[1.,0,0],[.5,sqrt(3)/2,0]]
 for id in ["IVS","EVS","CVS","DGS","ERS","NFIS"]
  r=optimize(id,eq)
  @test r.point≈[.5,sqrt(3)/6,sqrt(2/3)] atol=3e-6
 end
 @test evaluate("TSZ[1]",[[0.,0,0],[1.,0,0],[2.,0,0]])===nothing
end
