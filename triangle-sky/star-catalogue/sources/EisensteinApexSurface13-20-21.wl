(* ::Package:: *)

BeginPackage["EisensteinApexSurface`"];

EisensteinApexSurface::usage =
  "EisensteinApexSurface[] gives a high-resolution Graphics3D rendering of the Eisenstein-power apex locus over the 13-20-21 base.";
EisensteinPlaneTracePlot::usage =
  "EisensteinPlaneTracePlot[] gives the h=0 trace in the base plane.";

Begin["`Private`"];

ClearAll[
  esParameters, esRaw, esSurfacePoint, esValidPointQ, esSegments,
  esBisect, esRootsAtHeight, esRootRows, esBranchPairs, esColoredLine,
  esBaryPoint, esCenterGraphics, EisensteinApexSurface,
  EisensteinPlaneTracePlot
];

esA = {0., 0.};
esB = {21., 0.};
esC = {16., 12.};
esBase2 = {esA, esB, esC};
esBase3 = Append[#, 0.] & /@ esBase2;
{esSideA, esSideB, esSideC} = {13., 20., 21.};
esMatrix = 2. {esB - esA, esC - esA};
esCentroid = Mean[esBase2];
esKMinimum = -1.2080658561524769;
esKMaximum = 3.0318280667357770;

esParameters[k_?NumericQ] := Module[
  {aa, bb, cc, disc2, delta, sigma, u},
  If[Abs[k] < 10^-9 || k <= esKMinimum || k >= esKMaximum,
    Return[Missing["ParameterDomain"]]];
  {aa, bb, cc} = {esSideA^k, esSideB^k, esSideC^k};
  disc2 = 2. (aa^2 bb^2 + bb^2 cc^2 + cc^2 aa^2) -
    aa^4 - bb^4 - cc^4;
  If[!TrueQ[disc2 > 0.], Return[Missing["AuxiliaryTriangle"]]];
  delta = Sqrt[disc2]/4.;
  sigma = (aa^2 + bb^2 + cc^2 + 4. Sqrt[3.] delta)/2.;
  u = {
    (sigma + bb^2 + cc^2 - 2. aa^2)/(3. Sqrt[sigma]),
    (sigma + cc^2 + aa^2 - 2. bb^2)/(3. Sqrt[sigma]),
    (sigma + aa^2 + bb^2 - 2. cc^2)/(3. Sqrt[sigma])
  };
  If[Min[u] <= 0. || !VectorQ[u, NumericQ],
    Missing["PositiveBranch"], u]
];

esRaw[k_?NumericQ, rho_?NumericQ] := Module[
  {u, radicand, v, qB, qC, dB, dC, p, h2},
  If[!TrueQ[rho > 0.], Return[Missing["DistanceDomain"]]];
  If[Abs[k] < 10^-8,
    dB = rho esSideA/esSideB;
    dC = rho esSideA/esSideC,
    u = esParameters[k];
    If[Head[u] === Missing, Return[u]];
    radicand = 4. Exp[2. k Log[rho]] - 3. u[[1]]^2;
    If[!TrueQ[radicand > 0.], Return[Missing["DistanceDomain"]]];
    v = (-u[[1]] + Sqrt[radicand])/2.;
    If[!TrueQ[v > 0.], Return[Missing["PositiveApexParameter"]]];
    qB = v^2 + u[[2]] v + u[[2]]^2;
    qC = v^2 + u[[3]] v + u[[3]]^2;
    dB = Exp[Log[qB]/(2. k)];
    dC = Exp[Log[qC]/(2. k)]
  ];
  p = Quiet@Check[
    LinearSolve[esMatrix, {
      esB.esB - esA.esA + rho^2 - dB^2,
      esC.esC - esA.esA + rho^2 - dC^2
    }], Missing["Solve"]];
  If[!VectorQ[p, NumericQ], Return[Missing["Solve"]]];
  h2 = rho^2 - (p - esA).(p - esA);
  If[!NumericQ[h2], Missing["Numeric"], {p[[1]], p[[2]], h2}]
];

esSurfacePoint[k_?NumericQ, s_?NumericQ, hMax_, xyClip_] := Module[
  {raw, h},
  raw = esRaw[k, Exp[s]];
  If[Head[raw] === Missing, Return[raw]];
  If[raw[[3]] < -10^-7, Return[Missing["BelowPlane"]]];
  h = Sqrt[Max[0., raw[[3]]]];
  If[h > hMax || Norm[raw[[1 ;; 2]] - esCentroid] > xyClip,
    Missing["Clipped"], {raw[[1]], raw[[2]], h}]
];

esValidPointQ[p_] := VectorQ[p, NumericQ] && Length[p] == 3;

esSegments[list_List] := Select[
  Split[list, esValidPointQ[#1] === esValidPointQ[#2] &],
  Length[#] > 1 && esValidPointQ[First[#]] &
];

esBisect[f_, {loIn_, hiIn_}, iterations_: 60] := Module[
  {lo = N[loIn], hi = N[hiIn], flo, fhi, mid, fmid},
  flo = Quiet@Check[N[f[lo]], Indeterminate];
  fhi = Quiet@Check[N[f[hi]], Indeterminate];
  If[!NumericQ[flo] || !NumericQ[fhi] || flo fhi > 0., Return[$Failed]];
  Do[
    mid = (lo + hi)/2.;
    fmid = Quiet@Check[N[f[mid]], Indeterminate];
    If[!NumericQ[fmid], Return[$Failed]];
    If[flo fmid <= 0., hi = mid; fhi = fmid,
      lo = mid; flo = fmid],
    {iterations}
  ];
  (lo + hi)/2.
];

esRootsAtHeight[k_?NumericQ, h_?NumericQ, sValues_List, xyClip_] := Module[
  {values, brackets, rootS, makePoint, roots},
  values = Table[
    With[{raw = esRaw[k, Exp[s]]},
      If[Head[raw] === Missing, Indeterminate, raw[[3]] - h^2]],
    {s, sValues}
  ];
  brackets = Select[Partition[Range[Length[sValues]], 2, 1],
    NumericQ[values[[#[[1]]]]] && NumericQ[values[[#[[2]]]]] &&
      values[[#[[1]]]] values[[#[[2]]]] < 0. &
  ];
  rootS = DeleteCases[
    esBisect[
      Function[s, With[{raw = esRaw[k, Exp[s]]},
        If[Head[raw] === Missing, Indeterminate, raw[[3]] - h^2]]],
      {sValues[[#[[1]]]], sValues[[#[[2]]]]}
    ] & /@ brackets,
    $Failed
  ];
  makePoint[s_] := Module[{raw = esRaw[k, Exp[s]]},
    If[Head[raw] === Missing, Missing["Root"], {raw[[1]], raw[[2]], h}]
  ];
  roots = DeleteDuplicates[makePoint /@ rootS, Norm[#1 - #2] < 10^-6 &];
  SortBy[Select[roots, esValidPointQ[#] &&
      Norm[#[[1 ;; 2]] - esCentroid] <= xyClip &],
    Norm[#[[1 ;; 2]] - esA] &]
];

esRootRows[h_, kValues_, sValues_, xyClip_] :=
  esRootsAtHeight[#, h, sValues, xyClip] & /@ kValues;

esBranchPairs[rootRows_List, kValues_List, branch_Integer] := MapThread[
  If[Length[#1] >= branch, {#1[[branch]], #2}, Missing["Branch"]] &,
  {rootRows, kValues}
];

esColoredLine[pairs_List, thickness_: 1.3, opacity_: 1.] := Module[
  {segments},
  segments = Select[
    Split[pairs, (Head[#1] === Missing) === (Head[#2] === Missing) &],
    Length[#] > 1 && Head[First[#]] =!= Missing &
  ];
  Map[
    {Opacity[opacity], AbsoluteThickness[thickness],
      Line[#[[All, 1]], VertexColors -> (Hue[(#[[2]] + 3.)/7.] & /@ #)]} &,
    segments
  ]
];

esBaryPoint[w_List] := Module[{v = N[w/Total[w]]},
  Append[v[[1]] esA + v[[2]] esB + v[[3]] esC, 0.]
];

esCenterGraphics[] := Module[{centers},
  centers = {
    {"X(15),  k=0", esBaryPoint[{0.2970273828779557,
      0.3657419556324901, 0.3372306614895542}]},
    {"X(16),  k=0", esBaryPoint[{-1.614699789989698,
      0.8123151801385935, 1.8023846098511045}]},
    {"X(13),  k=1", esBaryPoint[{
      13. Csc[ArcCos[(20.^2 + 21.^2 - 13.^2)/(2. 20. 21.)] + Pi/3.],
      20. Csc[ArcCos[(21.^2 + 13.^2 - 20.^2)/(2. 21. 13.)] + Pi/3.],
      21. Csc[ArcCos[(13.^2 + 20.^2 - 21.^2)/(2. 13. 20.)] + Pi/3.]
    }]},
    {"C,  k=3.031828", Append[esC, 0.]}
  };
  {
    Black, PointSize[0.011], Point[centers[[All, 2]]],
    Map[Text[Style[#[[1]], 13, Bold, Background -> White],
      #[[2]], {-1.15, -1.15}] &, centers]
  }
];

Options[EisensteinApexSurface] = {
  "HRange" -> {0., 20.},
  "KSubdivisions" -> 170,
  "RhoSubdivisions" -> 360,
  "RootSamples" -> 1200,
  "RhoClip" -> 110.,
  "XYClip" -> 75.,
  "KGridStep" -> 0.2,
  "HGridStep" -> 2.,
  ImageSize -> 1200
};

EisensteinApexSurface[OptionsPattern[]] := Module[
  {hRange = N@OptionValue["HRange"], kSub = OptionValue["KSubdivisions"],
   rhoSub = OptionValue["RhoSubdivisions"], rootSamples = OptionValue["RootSamples"],
   rhoClip = N@OptionValue["RhoClip"], xyClip = N@OptionValue["XYClip"],
   kGridStep = N@OptionValue["KGridStep"], hGridStep = N@OptionValue["HGridStep"],
   imageSize = OptionValue[ImageSize], kValues, sValues, sRootValues,
   pointGrid, polygons, cell, k0, k1, kGridValues, kGridGraphics,
   hGridValues, hGridKValues, hGridGraphics, roots, maxBranches,
   traceRows, traceGraphics, plane, baseGraphics, surfaceGraphics,
   plotRange, legend, eps = 2. 10^-5},

  kValues = Sort@DeleteDuplicates@Join[
    Subdivide[esKMinimum + eps, esKMaximum - eps, kSub], {0., 1.}];
  sValues = Subdivide[Log[10^-5], Log[rhoClip], rhoSub];
  sRootValues = Subdivide[Log[10^-7], Log[rhoClip], rootSamples];
  pointGrid = Table[
    esSurfacePoint[k, s, hRange[[2]], xyClip],
    {k, kValues}, {s, sValues}
  ];

  polygons = Reap[
    Do[
      cell = {pointGrid[[ik, is]], pointGrid[[ik + 1, is]],
        pointGrid[[ik + 1, is + 1]], pointGrid[[ik, is + 1]]};
      If[AllTrue[cell, esValidPointQ] &&
          Max[Norm /@ Differences[Append[cell, First[cell]]]] < 12.,
        k0 = kValues[[ik]]; k1 = kValues[[ik + 1]];
        Sow[Polygon[cell, VertexColors -> {
          Hue[(k0 + 3.)/7.], Hue[(k1 + 3.)/7.],
          Hue[(k1 + 3.)/7.], Hue[(k0 + 3.)/7.] }]]],
      {ik, Length[kValues] - 1}, {is, Length[sValues] - 1}
    ]
  ][[2]];
  polygons = If[polygons === {}, {}, First[polygons]];

  kGridValues = Select[
    Range[Ceiling[esKMinimum/kGridStep] kGridStep,
      Floor[esKMaximum/kGridStep] kGridStep, kGridStep],
    esKMinimum < # < esKMaximum &];
  kGridGraphics = Flatten@Table[
    Map[
      {Hue[(k + 3.)/7.], Opacity[0.9],
        AbsoluteThickness[If[Abs[k - Round[k]] < 10^-8, 2.3, 1.05]], Line[#]} &,
      esSegments[esSurfacePoint[k, #, hRange[[2]], xyClip] & /@ sValues]
    ],
    {k, kGridValues}
  ];

  hGridValues = Range[hRange[[1]], hRange[[2]] + hGridStep/10., hGridStep];
  hGridKValues = Sort@DeleteDuplicates@Join[
    Subdivide[esKMinimum + eps, esKMaximum - eps, kSub], {0., 1.}];
  hGridGraphics = Flatten@Table[
    roots = esRootRows[h, hGridKValues, sRootValues, xyClip];
    maxBranches = Max[1, Max[Length /@ roots]];
    Table[
      esColoredLine[esBranchPairs[roots, hGridKValues, branch],
        If[Mod[Round[h], 5] == 0, 1.7, 1.0], 0.58],
      {branch, maxBranches}
    ],
    {h, Select[hGridValues, # > 0. &]}
  ];

  traceRows = esRootRows[0., hGridKValues, sRootValues, xyClip];
  maxBranches = Max[1, Max[Length /@ traceRows]];
  traceGraphics = Flatten@Table[
    esColoredLine[esBranchPairs[traceRows, hGridKValues, branch], 4.7, 1.],
    {branch, maxBranches}
  ];

  plane = {Opacity[0.055], LightBlue,
    Polygon[{{-xyClip, -xyClip, 0.}, {xyClip, -xyClip, 0.},
      {xyClip, xyClip, 0.}, {-xyClip, xyClip, 0.}}]};
  baseGraphics = {
    Opacity[0.16], LightBlue, Polygon[esBase3],
    Opacity[1.], Black, Thick, Line[Append[esBase3, First[esBase3]]],
    MapThread[Text[Style[#1, 14, Bold], #2, {1.2, 1.2}] &,
      {{"A", "B", "C"}, esBase3}]
  };
  plotRange = {{-0.55 xyClip, 1.05 xyClip},
    {-0.55 xyClip, 0.92 xyClip}, hRange};
  surfaceGraphics = Graphics3D[
    {
      plane,
      {Opacity[0.68], EdgeForm[None], polygons},
      hGridGraphics,
      kGridGraphics,
      traceGraphics,
      baseGraphics,
      esCenterGraphics[]
    },
    Axes -> True,
    AxesLabel -> (Style[#, 14, Bold] & /@ {"x", "y", "h"}),
    PlotRange -> plotRange,
    BoxRatios -> Automatic,
    SphericalRegion -> True,
    Lighting -> "Neutral",
    ViewPoint -> {1.55, -2.15, 1.35},
    ImageSize -> imageSize,
    PlotLabel -> Style[
      "Eisenstein-power apex surface over the 13-20-21 base\nsolid mesh: k = const; colored mesh: h = const; thick curve: h = 0",
      15, Bold]
  ];
  legend = BarLegend[
    {Hue, {-3., 4.}},
    LegendLabel -> Style["power k (global -3 to 4 scale)", 13, Bold],
    LegendMarkerSize -> 360
  ];
  Legended[surfaceGraphics, Placed[legend, Right]]
];

Options[EisensteinPlaneTracePlot] = {
  "RootSamples" -> 1600,
  "RhoClip" -> 220.,
  "XYClip" -> 145.,
  "KSubdivisions" -> 400,
  ImageSize -> 1000
};

EisensteinPlaneTracePlot[OptionsPattern[]] := Module[
  {rootSamples = OptionValue["RootSamples"], rhoClip = N@OptionValue["RhoClip"],
   xyClip = N@OptionValue["XYClip"], kSub = OptionValue["KSubdivisions"],
   imageSize = OptionValue[ImageSize], kValues, sValues, roots,
   maxBranches, colored, markers, eps = 2. 10^-5},
  kValues = Sort@DeleteDuplicates@Join[
    Subdivide[esKMinimum + eps, Min[1. - eps, esKMaximum - eps], kSub], {0.}];
  sValues = Subdivide[Log[10^-8], Log[rhoClip], rootSamples];
  roots = esRootRows[0., kValues, sValues, xyClip];
  maxBranches = Max[1, Max[Length /@ roots]];
  colored = Flatten@Table[
    esColoredLine[esBranchPairs[roots, kValues, branch], 4.3, 1.],
    {branch, maxBranches}
  ];
  markers = {
    {"X(15), k=0", esBaryPoint[{0.2970273828779557,
      0.3657419556324901, 0.3372306614895542}][[1 ;; 2]]},
    {"X(16), k=0", esBaryPoint[{-1.614699789989698,
      0.8123151801385935, 1.8023846098511045}][[1 ;; 2]]},
    {"X(13), k=1", esBaryPoint[{
      13. Csc[ArcCos[(20.^2 + 21.^2 - 13.^2)/(2. 20. 21.)] + Pi/3.],
      20. Csc[ArcCos[(21.^2 + 13.^2 - 20.^2)/(2. 21. 13.)] + Pi/3.],
      21. Csc[ArcCos[(13.^2 + 20.^2 - 21.^2)/(2. 13. 20.)] + Pi/3.]
    }][[1 ;; 2]]},
    {"C, k=3.031828", esC}
  };
  Graphics[
    {
      colored /. Line[p_, opts___] :> Line[p[[All, 1 ;; 2]], opts],
      {Opacity[0.14], LightBlue, Polygon[esBase2]},
      {Black, Thick, Line[Append[esBase2, First[esBase2]]]},
      MapThread[Text[Style[#1, 13, Bold], #2, {1.2, 1.2}] &,
        {{"A", "B", "C"}, esBase2}],
      {Black, PointSize[0.011], Point[markers[[All, 2]]]},
      Map[Text[Style[#[[1]], 12, Bold, Background -> White],
        #[[2]], {-1.15, -1.15}] &, markers]
    },
    Axes -> True,
    AxesLabel -> (Style[#, 13, Bold] & /@ {"x", "y"}),
    PlotRange -> {{-0.4 xyClip, xyClip}, {-0.35 xyClip, 0.8 xyClip}},
    AspectRatio -> Automatic,
    ImageSize -> imageSize,
    PlotLabel -> Style[
      "Eisenstein h=0 trace; color is Hue[(k+3)/7]", 15, Bold]
  ]
];

End[];
EndPackage[];
