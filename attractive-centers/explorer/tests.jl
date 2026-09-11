include("AttractiveCenters.jl")
using .AttractiveCenters, Test, LinearAlgebra
@testset "Attractive Centers geometry" begin
    eq=explore_triangle([[0.,0.],[2.,0.],[1.,sqrt(3)]])
    @test length(eq.chest.napoleon)==1
    @test norm(eq.center+eq.scale*eq.chest.napoleon[1]-[1,sqrt(3)/3])<1e-8
    p=[[0.,0.],[21.,0.],[5.,12.],[26/3,4.]]
    d=explore_four(p).chests
    a=polygon_area(d.hull)
    expected=[58.41049071935858,21.239748530428564,31.369614569850143,82.2609243285015,13.412708341951713]
    for (r,v) in zip((d.parallelogram,d.bisectors,d.network,d.stability,d.selected),expected)
        @test isapprox(100*polygon_area(r)/a,v;atol=1e-6)
    end
    t=explore_triangle(p[1:3])
    @test t.heart.failed==0
    @test polygon_area(t.heart.polygon)>0
    @test isapprox(100*polygon_area(t.chest.polygon)/polygon_area(t.points),5.930190602511855;atol=1e-6)
    tet=tetrahedron_chest([[0.,0.,0.],[1.,0.,0.],[0.,1.,0.],[0.,0.,1.]];para=false,bisectors=false)
    @test isapprox(tet.volume,1/6;atol=1e-8)
    regular=tetrahedron_chest([[1.,1.,1.],[1.,-1.,-1.],[-1.,1.,-1.],[-1.,-1.,1.]])
    @test length(regular.vertices)==1
    @test norm(regular.vertices[1])<1e-8
end
