using Test, LinearAlgebra, TetrahedralSections

@testset "TetrahedralSections" begin
    @testset "Forward geometry and inverse recovery" begin
        for h in [.03,.2,.7,1.,sqrt(2.),sqrt(3.),2.,4.,8.], phi in [.25,.6,.95], f in [.2,.5,.8]
            mu=f/maximum(cos(phi+2pi*k/3) for k in 0:2)
            tri=section(h,mu,phi);q=side_weights(tri)
            @test physical(mu,phi)
            for p in tri
                @test p[3] ≈ -h*mu*(p[1]+1) atol=1e-9
                u,v=plane_coordinates(h,mu,p)
                @test abs(circumconic(h,mu,u,v))<1e-8
            end
            @test sum(triangle_angles(q)) ≈ pi
            rows=inverse_sections(q,h)
            @test any(r->abs(r.mu-mu)<2e-4&&abs(r.c-cos(3phi))<2e-4,rows)
        end
    end
    @testset "Fixed-mu inverse and apex cosine equations" begin
        for h in [.2,.7,sqrt(2.),2.,8.], (mu,phi) in [(.65,.4),(1.,.9),(1.25,.9)]
            q=side_weights(section(h,mu,phi))
            @test any(r->abs(r.h-h)<2e-4,inverse_at_mu(q,mu))
        end
        tri=[[-1.,0.],[1.,0.],[.25,1.35]]
        for h in [.8,sqrt(2.),sqrt(3.),2.4]
            for r in apex_solutions(tri,inverse_sections(side_weights(tri),h))
                rays=[vcat(p,0.)-r.point for p in tri]
                for i in 1:3
                    j=mod1(i+1,3)
                    @test dot(rays[i],rays[j])/(norm(rays[i])*norm(rays[j])) ≈ (h*h-.5)/(h*h+1) atol=2e-5
                end
            end
        end
    end
    @testset "Equilateral source-app regression" begin
        tri=[[-1.,0.],[1.,0.],[0.,sqrt(3.)]]
        rows=apex_solutions(tri,inverse_sections(side_weights(tri),sqrt(3.)))
        @test length(rows)==4
        @test count(r->r.type==:Parabolic,rows)==3
        @test all(r->r.type!=:Parabolic||abs(r.point[3]-.5)<1e-8,rows)
    end
    @testset "Repeated roots and arbitrary precision" begin
        roots=real_roots([1.,-4.,6.,-4.,1.],0.,2.)
        @test length(roots)==1
        @test only(roots)≈1
        setprecision(256) do
            h=sqrt(big(2));mu=big"0.65";phi=big"0.4"
            q=side_weights(section(h,mu,phi))
            rows=inverse_sections(q,h;rtol=big"1e-50",xtol=big"1e-30",shape_tol=big"1e-30")
            @test any(r->abs(r.mu-mu)<big"1e-25",rows)
        end
    end
end
