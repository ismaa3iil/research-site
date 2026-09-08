(* ::Package:: *)

(*
  Power-k apex locus over a movable triangular base.

  Edge convention:
      |V_i V_j|^k = q_i + q_j,                         k != 0
      |V_i V_j|   = p_i p_j, q_i = p_i^2,             k == 0

  The "extended" branch permits real q_i as long as every edge power is
  positive.  The positive-parameter branch additionally requires q_i>0 and
  q_D>0.  Evaluate PowerKApexLocusApp[] to open the Manipulate interface.
*)

ClearAll[
  pkCyclic, pkNormalize, pkBarycentric, pkKnownCenterLabel,
  pkBisect, pkBracketRoots, pkContiguousGroups, PKApexLocusData,
  PowerKApexLocusApp
];

pkCyclic[f_, {aa_, bb_, cc_}] := {
  f[aa, bb, cc], f[bb, cc, aa], f[cc, aa, bb]
};

pkNormalize[v_List] := Module[{s = Total[v]},
  If[!NumericQ[N[s]] || Abs[N[s]] < 10^-14, v, v/s]
];

pkBarycentric[p_, {A_, B_, C_}] := Module[{uv},
  uv = LinearSolve[Transpose[{B - A, C - A}], p - A];
  {1 - Total[uv], uv[[1]], uv[[2]]}
];

pkKnownCenterLabel[bary_, sides : {aa_, bb_, cc_}, area_] := Module[
  {S2 = 2 area, functions, triples, target, residuals, hits},
  functions = <|
    "X(4) orthocenter" -> Function[{x, y, z},
      (x^2 + y^2 - z^2) (x^2 - y^2 + z^2)],
    "X(15) 1st isodynamic" -> Function[{x, y, z},
      x^2 (Sqrt[3] (x^2 - y^2 - z^2) - 2 S2)],
    "X(16) 2nd isodynamic" -> Function[{x, y, z},
      x^2 (Sqrt[3] (x^2 - y^2 - z^2) + 2 S2)],
    "X(175) isoperimetric" -> Function[{x, y, z},
      (x + y - z) (x - y + z) (x (x - y - z) + S2)],
    "X(176) equal detour" -> Function[{x, y, z},
      (x + y - z) (x - y + z) (x (x - y - z) - S2)]
  |>;
  triples = Map[Function[fun, pkNormalize@N[pkCyclic[fun, sides], 30]],
    functions];
  target = pkNormalize@N[bary, 30];
  residuals = AssociationMap[Norm[target - triples[#]] &, Keys[triples]];
  hits = Keys@Select[residuals, # < 10^-7 &];
  If[hits === {}, "", StringRiffle[hits, ", "]]
];

pkBisect[f_, {x0_, x1_}, iterations_: 70] := Module[
  {lo = N[x0], hi = N[x1], flo, fhi, mid, fmid},
  flo = Quiet@Check[N[f[lo]], Indeterminate];
  fhi = Quiet@Check[N[f[hi]], Indeterminate];
  If[!NumericQ[flo] || !NumericQ[fhi] || flo fhi > 0, Return[$Failed]];
  Do[
    mid = (lo + hi)/2;
    fmid = Quiet@Check[N[f[mid]], Indeterminate];
    If[!NumericQ[fmid], Return[$Failed]];
    If[flo fmid <= 0, hi = mid; fhi = fmid,
      lo = mid; flo = fmid],
    {iterations}];
  (lo + hi)/2
];

pkBracketRoots[f_, grid_List] := Module[
  {values, roots = {}, r},
  values = Quiet@Check[N[f /@ grid], ConstantArray[Indeterminate, Length[grid]]];
  Do[
    If[NumericQ[values[[i]]] && NumericQ[values[[i + 1]]] &&
        values[[i]] values[[i + 1]] < 0,
      r = pkBisect[f, {grid[[i]], grid[[i + 1]]}];
      If[r =!= $Failed, AppendTo[roots, r]]],
    {i, Length[grid] - 1}];
  DeleteDuplicates[Sort[roots], Abs[#1 - #2] < 10^-7 &]
];

pkContiguousGroups[indices_List] := If[indices === {}, {},
  Split[indices, #2 == #1 + 1 &]];

Options[PKApexLocusData] = {
  "ExtendedWeights" -> True,
  "LogSpan" -> 11.,
  "Samples" -> 700,
  "ClipRadius" -> 7.
};

PKApexLocusData[vertices : {A_, B_, C_}, kIn_, heightRatio_,
    OptionsPattern[]] := Module[
  {k = N[kIn], extended = TrueQ[OptionValue["ExtendedWeights"]],
   logSpan = N[OptionValue["LogSpan"]], samples = OptionValue["Samples"],
   clipRadius = N[OptionValue["ClipRadius"]], a, b, c, sides, area2,
   area, L, q, basePositive, lower, scale, matrix, tOfU, radius2,
   projection, height2, us, raw, goodQ, groups, spatialBranches,
   projectedBranches, h, zeroUs, fixedUs, makeRoot, zeroRoots, fixedRoots,
   centroid, allIndices, status = "OK"},

  area2 = Det[{B - A, C - A}];
  If[Abs[area2] < 10^-8,
    Return[<|"Status" -> "The three locators are nearly collinear."|>]];
  area = Abs[area2]/2;
  {a, b, c} = {Norm[B - C], Norm[C - A], Norm[A - B]};
  sides = {a, b, c};
  L = Max[sides];
  centroid = Mean[vertices];

  If[Abs[k] < 10^-10,
    q = {b c/a, c a/b, a b/c};
    lower = 0.;
    radius2[t_?NumericQ] := q t,
    q = {
      (b^k + c^k - a^k)/2,
      (c^k + a^k - b^k)/2,
      (a^k + b^k - c^k)/2
    };
    basePositive = Min[q] > 0;
    If[!extended && !basePositive,
      Return[<|"Status" ->
        "This base has no positive-parameter power-k representation. " <>
        "Select extended real weights."|>]];
    lower = If[extended, -Min[q], 0.];
    radius2[t_?NumericQ] := (q + t)^(2/k)
  ];
  basePositive = Min[q] > 0;
  scale = Max[Mean[Abs[q]], 10^-10];
  matrix = 2 {B - A, C - A};

  tOfU[u_?NumericQ] := lower + scale Exp[u];
  projection[t_?NumericQ] := Module[{r2 = radius2[t], rhs},
    rhs = {
      B.B - A.A + r2[[1]] - r2[[2]],
      C.C - A.A + r2[[1]] - r2[[3]]
    };
    LinearSolve[matrix, rhs]
  ];
  height2[t_?NumericQ] := Module[{p = projection[t], r2 = radius2[t]},
    r2[[1]] - (p - A).(p - A)
  ];

  us = Subdivide[-logSpan, logSpan, samples];
  raw = Table[Quiet@Check[
      With[{t = tOfU[u]}, {u, t, projection[t], height2[t]}], Nothing],
    {u, us}];
  raw = Select[raw, Length[#] == 4 && VectorQ[#[[3]], NumericQ] &&
      NumericQ[#[[4]]] &];
  goodQ[r_] := r[[4]] >= 0 &&
    Norm[r[[3]] - centroid] <= clipRadius L &&
    Sqrt[Max[0, r[[4]]]] <= clipRadius L;
  allIndices = Range[Length[raw]];
  groups = pkContiguousGroups[Select[allIndices, goodQ[raw[[#]]] &]];
  spatialBranches = Map[Function[group,
      Map[Function[r, {r[[3, 1]], r[[3, 2]], Sqrt[Max[0, r[[4]]]]}],
        raw[[group]]]], groups];
  projectedBranches = Map[Function[group,
      Map[Function[r, {r[[3, 1]], r[[3, 2]], 0.}], raw[[group]]]],
    groups];

  h = heightRatio L;
  zeroUs = pkBracketRoots[Function[u, height2[tOfU[u]]], us];
  fixedUs = pkBracketRoots[Function[u, height2[tOfU[u]] - h^2], us];

  makeRoot[u_, z_] := Module[{t = tOfU[u], p, bary, label},
    p = projection[t];
    bary = pkBarycentric[p, vertices];
    label = pkKnownCenterLabel[bary, sides, area];
    <|"u" -> u, "t" -> t, "Point2D" -> p,
      "Point3D" -> {p[[1]], p[[2]], z},
      "Barycentrics" -> pkNormalize[bary], "ETCLabel" -> label|>
  ];
  zeroRoots = Select[makeRoot[#, 0.] & /@ zeroUs,
    Norm[#["Point2D"] - centroid] <= clipRadius L &];
  fixedRoots = Select[makeRoot[#, h] & /@ fixedUs,
    Norm[#["Point2D"] - centroid] <= clipRadius L &];

  <|
    "Status" -> status, "Vertices" -> vertices, "Sides" -> sides,
    "Area" -> area, "k" -> kIn, "Weights" -> q,
    "WeightLowerBound" -> lower, "PositiveBaseWeights" -> basePositive,
    "ExtendedWeights" -> extended, "Height" -> h,
    "SpatialBranches" -> spatialBranches,
    "ProjectedBranches" -> projectedBranches,
    "ZeroHeightRoots" -> zeroRoots,
    "FixedHeightRoots" -> fixedRoots
  |>
];

PowerKApexLocusApp[] := DynamicModule[
  {verts = {{0., 0.}, {21., 0.}, {16., 12.}},
   defaultVerts = {{0., 0.}, {21., 0.}, {16., 12.}}},
  Manipulate[
    Module[{data, status, branches, projections, zeroRoots, fixedRoots,
      colors, base3, h, allPoints, xy, xr, yr, zr, pad, plane,
      branchGraphics, projectionGraphics, zeroGraphics, fixedGraphics,
      labelFor, rootRows, info, locatorGraphic, scene},

      data = PKApexLocusData[verts, k, heightRatio,
        "ExtendedWeights" -> extended,
        "LogSpan" -> logSpan,
        "Samples" -> samples,
        "ClipRadius" -> clipRadius];
      status = Lookup[data, "Status", "Unknown error"];

      locatorGraphic = LocatorPane[Dynamic[verts],
        Dynamic@Graphics[{
          {Directive[Opacity[.12], LightBlue], Polygon[verts]},
          {Thick, Darker[Blue], Line[Append[verts, First[verts]]]},
          MapThread[Text[Style[#1, 13, Bold], #2, {-1.2, -1.2}] &,
            {{"A", "B", "C"}, verts}]
        }, PlotRange -> {{-6, 28}, {-6, 20}}, Axes -> True,
          ImageSize -> 330, PlotLabel -> "Move A, B, C in the base plane"]];

      If[status =!= "OK",
        Return@Column[{
          Row[{Button["13-20-21", verts = defaultVerts], Spacer[8],
            Button["Equilateral control", verts = {{0., 0.}, {20., 0.},
              {10., 10. Sqrt[3]}}]}],
          Row[{locatorGraphic, Spacer[18],
            Panel[Style[status, 13, Darker[Red]], ImageSize -> 420]}]
        }]
      ];

      branches = data["SpatialBranches"];
      projections = data["ProjectedBranches"];
      zeroRoots = data["ZeroHeightRoots"];
      fixedRoots = data["FixedHeightRoots"];
      h = data["Height"];
      colors = {RGBColor[.12, .47, .71], RGBColor[.90, .39, .13],
        RGBColor[.20, .63, .17], RGBColor[.58, .40, .74],
        RGBColor[.55, .34, .29], RGBColor[.89, .47, .76]};
      base3 = Append[#, 0.] & /@ verts;

      allPoints = Join[base3, Flatten[branches, 1],
        Lookup[fixedRoots, "Point3D", {}], Lookup[zeroRoots, "Point3D", {}]];
      If[allPoints === {}, allPoints = base3];
      xy = allPoints[[All, {1, 2}]];
      pad = .08 Max[1., Max[xy[[All, 1]]] - Min[xy[[All, 1]]],
        Max[xy[[All, 2]]] - Min[xy[[All, 2]]]];
      xr = {Min[xy[[All, 1]]] - pad, Max[xy[[All, 1]]] + pad};
      yr = {Min[xy[[All, 2]]] - pad, Max[xy[[All, 2]]] + pad};
      zr = {0, Max[1., h, If[branches === {}, 0,
          Max[Flatten[branches, 1][[All, 3]]]]] + pad};
      plane = {Opacity[.10], Gray,
        Polygon[{{xr[[1]], yr[[1]], h}, {xr[[2]], yr[[1]], h},
          {xr[[2]], yr[[2]], h}, {xr[[1]], yr[[2]], h}}]};

      branchGraphics = MapIndexed[
        {Directive[colors[[1 + Mod[#2[[1]] - 1, Length[colors]]]], Thick],
          Line[#1]} &, branches];
      projectionGraphics = If[showProjection,
        MapIndexed[{Directive[
            colors[[1 + Mod[#2[[1]] - 1, Length[colors]]]], Dashed,
            Opacity[.65]], Line[#1]} &, projections], {}];
      labelFor[r_, fallback_] := If[r["ETCLabel"] === "", fallback,
        r["ETCLabel"]];
      zeroGraphics = If[showLimits, {
          {Black, PointSize[.018], Point[Lookup[zeroRoots, "Point3D", {}]]},
          MapIndexed[Text[Style[labelFor[#1, "L" <> ToString[#2[[1]]]],
              11, Bold], #1["Point3D"], {0, -1.4}] &, zeroRoots]}, {}];
      fixedGraphics = {
        {Darker[Red], PointSize[.020], Point[Lookup[fixedRoots, "Point3D", {}]]},
        If[showTetrahedra,
          ({Directive[Darker[Red], Thin, Opacity[.55]],
              Line[{#1["Point3D"], #2}]} & @@@
            Flatten[Table[{r, v}, {r, fixedRoots}, {v, base3}], 1]), {}],
        MapIndexed[Text[Style["D" <> ToString[#2[[1]]], 11, Bold,
            Darker[Red]], #1["Point3D"], {0, -1.4}] &, fixedRoots]
      };

      scene = Graphics3D[{
          {Opacity[.10], LightBlue, Polygon[base3]},
          {Black, Thick, Line[Append[base3, First[base3]]]},
          plane, projectionGraphics, branchGraphics, zeroGraphics, fixedGraphics,
          MapThread[Text[Style[#1, 12, Bold], #2, {1.2, 1.2}] &,
            {{"A", "B", "C"}, base3}]
        }, Axes -> True, AxesLabel -> {"x", "y", "z"}, BoxRatios -> Automatic,
        PlotRange -> {xr, yr, zr}, ImageSize -> 650,
        ViewPoint -> {1.55, -2.1, 1.35},
        PlotLabel -> Row[{"power-k apex locus;  h = ",
          NumberForm[h, {6, 3}]}]];

      rootRows = Join[
        MapIndexed[{"h->0 / L" <> ToString[#2[[1]]],
            labelFor[#1, "unmatched"], NumberForm[#1["t"], {8, 5}],
            NumberForm[#1["Barycentrics"], {7, 4}]} &, zeroRoots],
        MapIndexed[{"h / D" <> ToString[#2[[1]]], "fixed height",
            NumberForm[#1["t"], {8, 5}],
            NumberForm[#1["Barycentrics"], {7, 4}]} &, fixedRoots]
      ];
      info = Column[{
        Grid[{
          {"side lengths {a,b,c}", NumberForm[data["Sides"], {7, 3}]},
          {"base weights {qA,qB,qC}", NumberForm[data["Weights"], {8, 4}]},
          {"admissible qD lower bound", NumberForm[data["WeightLowerBound"], {8, 4}]},
          {"positive base weights?", data["PositiveBaseWeights"]},
          {"visible spatial branches", Length[branches]},
          {"solutions at chosen h", Length[fixedRoots]},
          {"limits as h->0", Length[zeroRoots]}
        }, Alignment -> Left, Dividers -> {None, {False, True}}],
        If[rootRows === {}, Style["No roots in the current logarithmic search window.",
            Italic, Gray],
          Grid[Prepend[rootRows, {"type", "ETC recognition", "qD", "barycentrics"}],
            Frame -> All, Alignment -> Left, Background -> {None, {LightGray}}]]
      }, Spacings -> 1.2];

      Column[{
        Row[{Button["13-20-21", verts = defaultVerts], Spacer[8],
          Button["Equilateral control", verts = {{0., 0.}, {20., 0.},
            {10., 10. Sqrt[3]}}]}],
        Row[{locatorGraphic, Spacer[16], scene}, Alignment -> Top],
        Panel[info, ImageSize -> 1000]
      }]
    ],
    {{k, 1., "power k"}, -3., 4., .05, Appearance -> "Labeled"},
    {{heightRatio, .18, "height / longest base side"}, 0., 1.5, .01,
      Appearance -> "Labeled"},
    {{extended, True, "parameter branch"},
      {True -> "extended real weights", False -> "positive parameters"}},
    {{logSpan, 11., "logarithmic qD search"}, 5., 16., 1.,
      Appearance -> "Labeled"},
    {{samples, 700, "sampling"}, {350, 500, 700, 900, 1200}},
    {{clipRadius, 7., "horizontal clip / base size"}, 2., 15., 1.,
      Appearance -> "Labeled"},
    {{showProjection, True, "show planar projection curves"}, {True, False}},
    {{showLimits, True, "show h->0 limits"}, {True, False}},
    {{showTetrahedra, True, "draw fixed-height tetrahedra"}, {True, False}},
    ControlPlacement -> Left, SaveDefinitions -> True,
    TrackedSymbols :> {k, heightRatio, extended, logSpan, samples,
      clipRadius, showProjection, showLimits, showTetrahedra, verts}
  ]
];
