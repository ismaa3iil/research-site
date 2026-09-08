include("../julia/TriangleSky.jl")
using .TriangleSky
triangles=[[[0.,0,0],[21.,0,0],[16.,12,0]],[[0.,0,0],[13.,0,0],[107/13,sqrt(81-(107/13)^2),0]],[[3.,-8,2],[3.,49.33,2],[3.,35.68,34.76]]]
for (i,t) in enumerate(triangles)
 for row in catalogue
  r=evaluate(row.expression,t)
  println(join([i,"R$(row.rank)",r===nothing ? "unavailable" : join(r.point,",")],"\t"))
 end
 for id in ["IVS","EVS","CVS","DGS","ERS","NFIS"]
  r=optimize(id,t)
  println(join([i,"O-$id",r===nothing ? "unavailable" : join(r.point,",")],"\t"))
 end
end
