using Test,LinearAlgebra
include("../julia/StellarFamilies.jl")
using .StellarFamilies
@testset "Stellar families" begin
 t=[[0.,0,0],[21.,0,0],[16.,12,0]];f=frame(t)
 @test eisenstein_range(f)[1]≈-1.2080658561524769 atol=1e-7
 @test eisenstein_range(f)[2]≈3.031828066735777 atol=1e-7
 for k in [-3.,-1.,0.,.001,.5,1.,2.,3.,5.],rho in [.4,.8,1.2,2.,4.]
  r=raw(f,:power,k,rho);r===nothing && continue
  r.h2>=0 || continue
  if k==0;@test r.r.*f.sides≈fill(r.r[1]*f.sides[1],3)
  else;@test r.r.^k+f.sides.^k≈fill(r.r[1]^k+f.sides[1]^k,3) rtol=1e-7;end
 end
 for family in [:power,:eisenstein]
  @test !isempty(strand(t,family,1.))
  @test !isempty(sheet(t,family).faces)
 end
 for (i,arc) in enumerate(prekites(t)),p in arc
  j=mod1(i+1,3)
  @test norm(p-t[i])≈norm(t[j]-t[i])
  @test norm(p-t[j])≈norm(t[j]-t[i])
 end
 eq=[[0.,0,0],[1.,0,0],[.5,sqrt(3)/2,0]]
 @test isempty(sheet(eq,:power).faces)
end
