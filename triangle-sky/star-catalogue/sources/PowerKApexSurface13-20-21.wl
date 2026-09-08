(* ::Package:: *)

BeginPackage["PowerKApexSurface`"];

PowerKApexSurface::usage =
  "PowerKApexSurface[] gives a high-resolution Graphics3D rendering of the apex locus for the 13-20-21 base, colored by Hue[(k+3)/7].";
PowerKPlaneTracePlot::usage =
  "PowerKPlaneTracePlot[] gives the h=0 trace in the base plane, with the same k-coloring.";

Begin["`Private`"];

ClearAll[
  pkRaw, pkRhoMinimum, pkSurfacePoint, pkValidPointQ, pkSegments,
  pkBisect, pkRootsAtHeight, pkRootRows, pkBranchPairs, pkColoredLine,
  pkBaryPoint, pkCenterGraphics, pkTraceGraphics, PowerKApexSurface,
  PowerKPlaneTracePlot
];

pkA = {0., 0.};
pkB = {21., 0.};
pkC = {16., 12.};
pkBase2 = {pkA, pkB, pkC};
pkBase3 = Append[#, 0.] & /@ pkBase2;
{pkSideA, pkSideB, pkSideC} = {13., 20., 21.};
pkMatrix = 2. {pkB - pkA, pkC - pkA};
pkCentroid = Mean[pkBase2];
pkCriticalK = 3.7363897124077985;

pkRhoMinimum[k_?NumericQ] := If[k <= 10^-9, 0.,
  Max[0., pkSideB^k - pkSideA^k, pkSideC^k - pkSideA^k]^(1./k)
];

pkRaw[k_?NumericQ, rho_?NumericQ] := Module[
  {dB, dC, vB, vC, p, h2},
  If[!TrueQ[rho > 0.], Return[Missing["Domain"]]];
  If[Abs[k] < 10^-8,
    dB = rho pkSideA/pkSideB;
    dC = rho pkSideA/pkSideC,
    vB = Exp[k Log[rho]] + Exp[k Log[pkSideA]] - Exp[k Log[pkSideB]];
    vC = Exp[k Log[rho]] + Exp[k Log[pkSideA]] - Exp[k Log[pkSideC]];
    If[!TrueQ[vB > 0.] || !TrueQ[vC > 0.], Return[Missing["Domain"]]];
    dB = Exp[Log[vB]/k];
    dC = Exp[Log[vC]/k]
  ];
  p = Quiet@Check[
    LinearSolve[pkMatrix, {
      pkB.pkB - pkA.pkA + rho^2 - dB^2,
      pkC.pkC - pkA.pkA + rho^2 - dC^2
    }], Missing["Solve"]];
  If[!VectorQ[p, NumericQ], Return[Missing["Solve"]]];
  h2 = rho^2 - (p - pkA).(p - pkA);
  If[!NumericQ[h2], Missing["Numeric"], {p[[1]], p[[2]], h2}]
];

pkSurfacePoint[k_?NumericQ, s_?NumericQ, hMax_, xyClip_] := Module[
  {rho, raw, h},
  rho = pkRhoMinimum[k] + Exp[s];
  raw = pkRaw[k, rho];
  If[Head[raw] === Missing, Return[Missing["Domain"]]];
  If[raw[[3]] < -10^-7, Return[Missing["BelowPlane"]]];
  h = Sqrt[Max[0., raw[[3]]]];
  If[h > hMax || Norm[raw[[1 ;; 2]] - pkCentroid] > xyClip,
    Missing["Clipped"], {raw[[1]], raw[[2]], h}]
];

pkValidPointQ[p_] := VectorQ[p, NumericQ] && Length[p] == 3;

pkSegments[list_List] := Select[
  Split[list, pkValidPointQ[#1] === pkValidPointQ[#2] &],
  Length[#] > 1 && pkValidPointQ[First[#]] &
];

pkBisect[f_, {loIn_, hiIn_}, iterations_: 60] := Module[
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

pkRootsAtHeight[k_?NumericQ, h_?NumericQ, sValues_List, xyClip_] := Module[
  {values, brackets, rootS, makePoint, roots},
  values = Table[
    With[{raw = pkRaw[k, pkRhoMinimum[k] + Exp[s]]},
      If[Head[raw] === Missing, Indeterminate, raw[[3]] - h^2]],
    {s, sValues}
  ];
  brackets = Select[Partition[Range[Length[sValues]], 2, 1],
    NumericQ[values[[#[[1]]]]] && NumericQ[values[[#[[2]]]]] &&
      values[[#[[1]]]] values[[#[[2]]]] < 0. &
  ];
  rootS = DeleteCases[
    pkBisect[
      Function[s, With[{raw = pkRaw[k, pkRhoMinimum[k] + Exp[s]]},
        If[Head[raw] === Missing, Indeterminate, raw[[3]] - h^2]]],
      {sValues[[#[[1]]]], sValues[[#[[2]]]]}
    ] & /@ brackets,
    $Failed
  ];
  makePoint[s_] := Module[{raw = pkRaw[k, pkRhoMinimum[k] + Exp[s]]},
    If[Head[raw] === Missing, Missing["Root"], {raw[[1]], raw[[2]], h}]
  ];
  roots = DeleteDuplicates[makePoint /@ rootS, Norm[#1 - #2] < 10^-6 &];
  SortBy[Select[roots, pkValidPointQ[#] &&
      Norm[#[[1 ;; 2]] - pkCentroid] <= xyClip &],
    Norm[#[[1 ;; 2]] - pkA] &]
];

pkRootRows[h_, kValues_, sValues_, xyClip_] :=
  pkRootsAtHeight[#, h, sValues, xyClip] & /@ kValues;

pkBranchPairs[rootRows_List, kValues_List, branch_Integer] := MapThread[
  If[Length[#1] >= branch, {#1[[branch]], #2}, Missing["Branch"]] &,
  {rootRows, kValues}
];

pkColoredLine[pairs_List, thickness_: 1.3, opacity_: 1.] := Module[
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

pkBaryPoint[w_List] := Module[{v = N[w/Total[w]]},
  Append[v[[1]] pkA + v[[2]] pkB + v[[3]] pkC, 0.]
];

pkCenterGraphics[] := Module[{centers},
  centers = {
    {"X(15),  k=0", pkBaryPoint[{0.2970273828779557,
      0.3657419556324901, 0.3372306614895542}]},
    {"X(16),  k=0", pkBaryPoint[{-1.614699789989698,
      0.8123151801385935, 1.8023846098511045}]},
    {"X(176),  k=1", pkBaryPoint[{11., 19., 21.}]},
    {"X(4),  k=2", pkBaryPoint[{0.1058201058201058,
      0.3386243386243386, 0.5555555555555556}]}
  };
  {
    Black, PointSize[0.011], Point[centers[[All, 2]]],
    Map[Text[Style[#[[1]], 13, Bold, Background -> White],
      #[[2]], {-1.15, -1.15}] &, centers]
  }
];

Options[PowerKApexSurface] = {
  "KRange" -> {-3., 4.},
  "HRange" -> {0., 20.},
  "KSubdivisions" -> 140,
  "RhoSubdivisions" -> 320,
  "RootSamples" -> 1100,
  "RhoClip" -> 95.,
  "XYClip" -> 70.,
  "KGridStep" -> 0.25,
  "HGridStep" -> 2.,
  ImageSize -> 1200
};

PowerKApexSurface[OptionsPattern[]] := Module[
  {kRange = N@OptionValue["KRange"], hRange = N@OptionValue["HRange"],
   kSub = OptionValue["KSubdivisions"], rhoSub = OptionValue["RhoSubdivisions"],
   rootSamples = OptionValue["RootSamples"], rhoClip = N@OptionValue["RhoClip"],
   xyClip = N@OptionValue["XYClip"], kGridStep = N@OptionValue["KGridStep"],
   hGridStep = N@OptionValue["HGridStep"], imageSize = OptionValue[ImageSize],
   kValues, sValues, sRootValues, pointGrid, polygons, cell, k0, k1,
   kGridValues, kGridGraphics, hGridValues, hGridKValues, hGridGraphics,
   roots, maxBranches, traceRows, traceGraphics, plane, baseGraphics,
   surfaceGraphics, plotRange, legend},

  kValues = Subdivide[kRange[[1]], kRange[[2]], kSub];
  sValues = Subdivide[Log[10^-5], Log[rhoClip], rhoSub];
  sRootValues = Subdivide[Log[10^-7], Log[rhoClip], rootSamples];
  pointGrid = Table[
    pkSurfacePoint[k, s, hRange[[2]], xyClip],
    {k, kValues}, {s, sValues}
  ];

  polygons = Reap[
    Do[
      cell = {pointGrid[[ik, is]], pointGrid[[ik + 1, is]],
        pointGrid[[ik + 1, is + 1]], pointGrid[[ik, is + 1]]};
      If[AllTrue[cell, pkValidPointQ] &&
          Max[Norm /@ Differences[Append[cell, First[cell]]]] < 12.,
        k0 = kValues[[ik]]; k1 = kValues[[ik + 1]];
        Sow[Polygon[cell, VertexColors -> {
          Hue[(k0 + 3.)/7.], Hue[(k1 + 3.)/7.],
          Hue[(k1 + 3.)/7.], Hue[(k0 + 3.)/7.] }]]],
      {ik, Length[kValues] - 1}, {is, Length[sValues] - 1}
    ]
  ][[2]];
  polygons = If[polygons === {}, {}, First[polygons]];

  kGridValues = Range[kRange[[1]], kRange[[2]] + kGridStep/10., kGridStep];
  kGridGraphics = Flatten@Table[
    Map[
      {Hue[(k + 3.)/7.], Opacity[0.88],
        AbsoluteThickness[If[Abs[k - Round[k]] < 10^-8, 2.2, 1.05]], Line[#]} &,
      pkSegments[pkSurfacePoint[k, #, hRange[[2]], xyClip] & /@ sValues]
    ],
    {k, kGridValues}
  ];

  hGridValues = Range[hRange[[1]], hRange[[2]] + hGridStep/10., hGridStep];
  hGridKValues = Subdivide[kRange[[1]], kRange[[2]], kSub];
  hGridGraphics = Flatten@Table[
    roots = pkRootRows[h, hGridKValues, sRootValues, xyClip];
    maxBranches = Max[1, Max[Length /@ roots]];
    Table[
      pkColoredLine[pkBranchPairs[roots, hGridKValues, branch],
        If[Mod[Round[h], 5] == 0, 1.7, 1.0], If[h == 0., 1., 0.55]],
      {branch, maxBranches}
    ],
    {h, Select[hGridValues, # > 0. &]}
  ];

  traceRows = pkRootRows[0., hGridKValues, sRootValues, xyClip];
  maxBranches = Max[1, Max[Length /@ traceRows]];
  traceGraphics = Flatten@Table[
    pkColoredLine[pkBranchPairs[traceRows, hGridKValues, branch], 4.6, 1.],
    {branch, maxBranches}
  ];

  plane = {Opacity[0.055], LightBlue,
    Polygon[{{-xyClip, -xyClip, 0.}, {xyClip, -xyClip, 0.},
      {xyClip, xyClip, 0.}, {-xyClip, xyClip, 0.}}]};
  baseGraphics = {
    Opacity[0.16], LightBlue, Polygon[pkBase3],
    Opacity[1.], Black, Thick, Line[Append[pkBase3, First[pkBase3]]],
    MapThread[Text[Style[#1, 14, Bold], #2, {1.2, 1.2}] &,
      {{"A", "B", "C"}, pkBase3}],
    {Darker[Green], PointSize[0.010], Point[Append[pkC, 0.]],
      Text[Style["trace endpoint: C,  k = 3.73639", 12, Bold,
        Background -> White], Append[pkC, 0.], {-1.15, 1.3}]}
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
      pkCenterGraphics[]
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
      "Power-k apex surface over the 13-20-21 base\nsolid mesh: k = const; colored mesh: h = const; thick curve: h = 0",
      15, Bold]
  ];
  legend = BarLegend[
    {Hue, kRange},
    LegendLabel -> Style["power k", 13, Bold],
    LegendMarkerSize -> 360
  ];
  Legended[surfaceGraphics, Placed[legend, Right]]
];

Options[PowerKPlaneTracePlot] = {
  "KRange" -> {-3., 4.},
  "RootSamples" -> 1500,
  "RhoClip" -> 180.,
  "XYClip" -> 120.,
  "KSubdivisions" -> 350,
  ImageSize -> 1000
};

PowerKPlaneTracePlot[OptionsPattern[]] := Module[
  {kRange = N@OptionValue["KRange"], rootSamples = OptionValue["RootSamples"],
   rhoClip = N@OptionValue["RhoClip"], xyClip = N@OptionValue["XYClip"],
   kSub = OptionValue["KSubdivisions"], imageSize = OptionValue[ImageSize],
   kValues, sValues, roots, maxBranches, colored, baseGraphic, centers2},
  kValues = Subdivide[kRange[[1]], kRange[[2]], kSub];
  sValues = Subdivide[Log[10^-8], Log[rhoClip], rootSamples];
  roots = pkRootRows[0., kValues, sValues, xyClip];
  maxBranches = Max[1, Max[Length /@ roots]];
  colored = Flatten@Table[
    pkColoredLine[pkBranchPairs[roots, kValues, branch], 4.2, 1.],
    {branch, maxBranches}
  ];
  centers2 = pkCenterGraphics[] /. {x_, y_, z_?NumericQ} :> {x, y, 0.};
  Graphics[
    {
      colored /. Line[p_, opts___] :> Line[p[[All, 1 ;; 2]], opts],
      {Opacity[0.14], LightBlue, Polygon[pkBase2]},
      {Black, Thick, Line[Append[pkBase2, First[pkBase2]]]},
      MapThread[Text[Style[#1, 13, Bold], #2, {1.2, 1.2}] &,
        {{"A", "B", "C"}, pkBase2}],
      {Black, PointSize[0.011],
        Point[(#[[1 ;; 2]] & /@ {
          pkBaryPoint[{0.2970273828779557, 0.3657419556324901, 0.3372306614895542}],
          pkBaryPoint[{-1.614699789989698, 0.8123151801385935, 1.8023846098511045}],
          pkBaryPoint[{11., 19., 21.}],
          pkBaryPoint[{0.1058201058201058, 0.3386243386243386, 0.5555555555555556}]
        })]}
    },
    Axes -> True,
    AxesLabel -> (Style[#, 13, Bold] & /@ {"x", "y"}),
    PlotRange -> {{-0.4 xyClip, xyClip}, {-0.35 xyClip, 0.8 xyClip}},
    AspectRatio -> Automatic,
    ImageSize -> imageSize,
    PlotLabel -> Style[
      "Plane trace h=0; color is Hue[(k+3)/7]", 15, Bold]
  ]
];

End[];
EndPackage[];
