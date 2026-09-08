(* ::Package:: *)

BeginPackage["PowerEisensteinApexApp`"];

PowerEisensteinApexApp::usage =
  "PowerEisensteinApexApp[] opens a Manipulate app comparing the power-k and Eisenstein-power apex surfaces over a variable scalene triangle.";

Begin["`Private`"];

ClearAll[
  peaFiniteQ, peaTriangle, peaPowerLogDifference, peaPowerRaw, peaEisensteinParameters,
  peaEisensteinRaw, peaSurfacePoint, peaValidPointQ, peaSegments,
  peaTriangles, peaBisect, peaRootsAtHeight, peaRootRows, peaBranchPairs,
  peaColoredLine, peaIntegerLines, peaFamilyGraphics, PowerEisensteinApexApp
];

peaFiniteQ[x_] := TrueQ[NumberQ[N[x]] && Abs[N[x]] < Infinity];

peaTriangle[a_?NumericQ, b_?NumericQ, c_?NumericQ] := Module[{x, y2},
  If[Min[a, b, c] <= 0. || a + b <= c || b + c <= a || c + a <= b,
    Return[Missing["TriangleInequality"]]];
  x = (b^2 + c^2 - a^2)/(2. c);
  y2 = b^2 - x^2;
  If[y2 <= 10^-12, Missing["DegenerateTriangle"],
    <|"A" -> {0., 0.}, "B" -> {c, 0.}, "C" -> {x, Sqrt[y2]},
      "Sides" -> {a, b, c}|>]
];

peaPowerLogDifference[k_?NumericQ, rho_?NumericQ,
    plus_?NumericQ, minus_?NumericQ] := Module[{logs, m, value},
  logs = k Log[{rho, plus, minus}];
  m = Max[logs];
  value = Exp[logs[[1]] - m] + Exp[logs[[2]] - m] -
    Exp[logs[[3]] - m];
  If[!TrueQ[value > 0.], Missing["DistanceDomain"], m + Log[value]]
];

peaPowerRaw[tri_Association, k_?NumericQ, rho_?NumericQ] := Module[
  {A = tri["A"], B = tri["B"], C = tri["C"], a, b, c,
   logB, logC, dB, dC, matrix, p, h2},
  {a, b, c} = tri["Sides"];
  If[!TrueQ[rho > 0.], Return[Missing["DistanceDomain"]]];
  If[Abs[k] < 10^-8,
    dB = rho a/b;
    dC = rho a/c,
    logB = peaPowerLogDifference[k, rho, a, b];
    logC = peaPowerLogDifference[k, rho, a, c];
    If[Head[logB] === Missing || Head[logC] === Missing,
      Return[Missing["DistanceDomain"]]];
    dB = Exp[logB/k];
    dC = Exp[logC/k]
  ];
  If[!And @@ (NumericQ /@ {dB, dC}) || !And @@ (peaFiniteQ /@ {dB, dC}),
    Return[Missing["Overflow"]]];
  matrix = 2. {B - A, C - A};
  p = Quiet@Check[LinearSolve[matrix, {
      B.B - A.A + rho^2 - dB^2,
      C.C - A.A + rho^2 - dC^2}], Missing["Solve"]];
  If[!VectorQ[p, NumericQ] || !And @@ (peaFiniteQ /@ p),
    Return[Missing["Solve"]]];
  h2 = rho^2 - (p - A).(p - A);
  If[!NumericQ[h2] || !peaFiniteQ[h2], Missing["Numeric"],
    {p[[1]], p[[2]], h2}]
];

peaEisensteinParameters[{a_?NumericQ, b_?NumericQ, c_?NumericQ},
    k_?NumericQ] := Module[
  {logs, m, aux, aa, bb, cc, disc2, delta, sigma, u},
  If[Abs[k] < 10^-8, Return[Missing["LimitHandledSeparately"]]];
  logs = k Log[{a, b, c}];
  m = Max[logs];
  aux = Exp[logs - m];
  {aa, bb, cc} = aux;
  disc2 = 2. (aa^2 bb^2 + bb^2 cc^2 + cc^2 aa^2) -
    aa^4 - bb^4 - cc^4;
  If[!TrueQ[disc2 > 10^-14], Return[Missing["AuxiliaryTriangle"]]];
  delta = Sqrt[disc2]/4.;
  sigma = (aa^2 + bb^2 + cc^2 + 4. Sqrt[3.] delta)/2.;
  u = {
    (sigma + bb^2 + cc^2 - 2. aa^2)/(3. Sqrt[sigma]),
    (sigma + cc^2 + aa^2 - 2. bb^2)/(3. Sqrt[sigma]),
    (sigma + aa^2 + bb^2 - 2. cc^2)/(3. Sqrt[sigma])
  };
  If[!VectorQ[u, NumericQ] || Min[u] <= 10^-12,
    Missing["PositiveBranch"], <|"u" -> u, "LogScale" -> m|>]
];

peaEisensteinRaw[tri_Association, k_?NumericQ, rho_?NumericQ] := Module[
  {A = tri["A"], B = tri["B"], C = tri["C"], a, b, c,
   pars, u, m, logR, rScaled, radicand, v, qB, qC, dB, dC,
   matrix, p, h2},
  {a, b, c} = tri["Sides"];
  If[!TrueQ[rho > 0.], Return[Missing["DistanceDomain"]]];
  If[Abs[k] < 10^-8,
    dB = rho a/b;
    dC = rho a/c,
    pars = peaEisensteinParameters[{a, b, c}, k];
    If[Head[pars] === Missing, Return[pars]];
    u = pars["u"]; m = pars["LogScale"];
    logR = 2. k Log[rho] - 2. m;
    If[logR > 700., Return[Missing["Overflow"]]];
    rScaled = If[logR < -745., 0., Exp[logR]];
    radicand = 4. rScaled - 3. u[[1]]^2;
    If[!TrueQ[radicand > 0.], Return[Missing["DistanceDomain"]]];
    v = (-u[[1]] + Sqrt[radicand])/2.;
    If[!TrueQ[v > 0.], Return[Missing["PositiveApexParameter"]]];
    qB = v^2 + u[[2]] v + u[[2]]^2;
    qC = v^2 + u[[3]] v + u[[3]]^2;
    dB = Exp[m/k + Log[qB]/(2. k)];
    dC = Exp[m/k + Log[qC]/(2. k)]
  ];
  If[!And @@ (NumericQ /@ {dB, dC}) || !And @@ (peaFiniteQ /@ {dB, dC}),
    Return[Missing["Overflow"]]];
  matrix = 2. {B - A, C - A};
  p = Quiet@Check[LinearSolve[matrix, {
      B.B - A.A + rho^2 - dB^2,
      C.C - A.A + rho^2 - dC^2}], Missing["Solve"]];
  If[!VectorQ[p, NumericQ] || !And @@ (peaFiniteQ /@ p),
    Return[Missing["Solve"]]];
  h2 = rho^2 - (p - A).(p - A);
  If[!NumericQ[h2] || !peaFiniteQ[h2], Missing["Numeric"],
    {p[[1]], p[[2]], h2}]
];

peaSurfacePoint[raw_, tri_Association, k_?NumericQ, rho_?NumericQ,
    hMax_, xRange_, yRange_] := Module[{r, h, marginX, marginY},
  r = raw[tri, k, rho];
  If[Head[r] === Missing, Return[r]];
  If[r[[3]] < -10^-7, Return[Missing["BelowPlane"]]];
  h = Sqrt[Max[0., r[[3]]]];
  marginX = .03 (xRange[[2]] - xRange[[1]]);
  marginY = .03 (yRange[[2]] - yRange[[1]]);
  If[h > hMax || r[[1]] < xRange[[1]] - marginX ||
      r[[1]] > xRange[[2]] + marginX || r[[2]] < yRange[[1]] - marginY ||
      r[[2]] > yRange[[2]] + marginY,
    Missing["Clipped"], {r[[1]], r[[2]], h}]
];

peaValidPointQ[p_] := VectorQ[p, NumericQ] && Length[p] == 3 &&
  And @@ (peaFiniteQ /@ p);

peaSegments[list_List] := Select[
  Split[list, peaValidPointQ[#1] === peaValidPointQ[#2] &],
  Length[#] > 1 && peaValidPointQ[First[#]] &
];

peaTriangles[grid_List, kValues_List, color_, maxEdge_] := Module[
  {sown, candidates, edges, ratio, kColor},
  sown = Reap[
    Do[
      candidates = {
        {grid[[ik, ir]], grid[[ik + 1, ir]], grid[[ik + 1, ir + 1]]},
        {grid[[ik, ir]], grid[[ik + 1, ir + 1]], grid[[ik, ir + 1]]}
      };
      kColor = Mean[kValues[[{ik, ik + 1}]]];
      Do[
        If[AllTrue[triangle, peaValidPointQ],
          edges = Norm /@ {
            triangle[[2]] - triangle[[1]], triangle[[3]] - triangle[[2]],
            triangle[[1]] - triangle[[3]]};
          ratio = Max[edges]/Max[10^-12, Min[edges]];
          If[Max[edges] <= maxEdge && ratio <= 14.,
            Sow[{
              FaceForm[Directive[color[kColor], Opacity[0.46]]],
              EdgeForm[None], Polygon[triangle]}]]],
        {triangle, candidates}],
      {ik, Length[kValues] - 1}, {ir, Length[First[grid]] - 1}
    ]
  ][[2]];
  If[sown === {}, {}, First[sown]]
];

peaBisect[f_, {loIn_, hiIn_}, iterations_: 55] := Module[
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

peaRootsAtHeight[raw_, tri_Association, k_?NumericQ, h_?NumericQ,
    rhoValues_List, xRange_, yRange_] := Module[
  {values, brackets, rootRho, makePoint, roots},
  values = Table[
    With[{r = raw[tri, k, rho]},
      If[Head[r] === Missing, Indeterminate, r[[3]] - h^2]],
    {rho, rhoValues}
  ];
  brackets = Select[Partition[Range[Length[rhoValues]], 2, 1],
    NumericQ[values[[#[[1]]]]] && NumericQ[values[[#[[2]]]]] &&
      values[[#[[1]]]] values[[#[[2]]]] < 0. &
  ];
  rootRho = DeleteCases[
    peaBisect[
      Function[rho, With[{r = raw[tri, k, rho]},
        If[Head[r] === Missing, Indeterminate, r[[3]] - h^2]]],
      {rhoValues[[#[[1]]]], rhoValues[[#[[2]]]]}
    ] & /@ brackets,
    $Failed
  ];
  makePoint[rho_] := Module[{r = raw[tri, k, rho]},
    If[Head[r] === Missing, Missing["Root"], {r[[1]], r[[2]], h}]
  ];
  roots = DeleteDuplicates[makePoint /@ rootRho, Norm[#1 - #2] < 10^-6 &];
  SortBy[Select[roots, peaValidPointQ[#] &&
      xRange[[1]] <= #[[1]] <= xRange[[2]] &&
      yRange[[1]] <= #[[2]] <= yRange[[2]] &],
    Norm[#[[1 ;; 2]] - tri["A"]] &]
];

peaRootRows[raw_, tri_, h_, kValues_, rhoValues_, xRange_, yRange_] :=
  peaRootsAtHeight[raw, tri, #, h, rhoValues, xRange, yRange] & /@ kValues;

peaBranchPairs[rootRows_List, kValues_List, branch_Integer] := MapThread[
  If[Length[#1] >= branch, {#1[[branch]], #2}, Missing["Branch"]] &,
  {rootRows, kValues}
];

peaColoredLine[pairs_List, color_, thickness_: 3., dashing_: None] := Module[
  {segments, style},
  segments = Select[
    Split[pairs, (Head[#1] === Missing) === (Head[#2] === Missing) &],
    Length[#] > 1 && Head[First[#]] =!= Missing &
  ];
  style = If[dashing === None, {}, Dashing[dashing]];
  Map[
    {style, AbsoluteThickness[thickness],
      Line[#[[All, 1]], VertexColors -> (color[#[[2]]] & /@ #)]} &,
    segments
  ]
];

peaIntegerLines[raw_, tri_, integers_, rhoValues_, hMax_, xRange_, yRange_,
    dashing_: None] := Flatten@Table[
  Map[
    {Black, AbsoluteThickness[0.85],
      If[dashing === None, {}, Dashing[dashing]], Line[#]} &,
    peaSegments[
      peaSurfacePoint[raw, tri, k, #, hMax, xRange, yRange] & /@ rhoValues]
  ],
  {k, integers}
];

peaFamilyGraphics[raw_, tri_, kValues_, rhoValues_, traceKValues_,
    rootRhoValues_, hMax_, xRange_, yRange_, color_, maxEdge_,
    traceDash_: None, integerDash_: None] := Module[
  {grid, triangles, integers, integerLines, traceRows, maxBranches, trace},
  grid = Table[
    peaSurfacePoint[raw, tri, k, rho, hMax, xRange, yRange],
    {k, kValues}, {rho, rhoValues}
  ];
  triangles = peaTriangles[grid, kValues, color, maxEdge];
  integers = Select[Range[Ceiling[Min[kValues]], Floor[Max[kValues]]],
    Min[kValues] <= # <= Max[kValues] &];
  integerLines = peaIntegerLines[raw, tri, integers, rhoValues, hMax,
    xRange, yRange, integerDash];
  traceRows = peaRootRows[raw, tri, 0., traceKValues, rootRhoValues,
    xRange, yRange];
  maxBranches = Max[1, Max[Length /@ traceRows]];
  trace = Flatten@Table[
    peaColoredLine[peaBranchPairs[traceRows, traceKValues, branch],
      color, 4.2, traceDash],
    {branch, maxBranches}
  ];
  <|"Surface" -> triangles, "IntegerLines" -> integerLines,
    "Trace" -> trace|>
];

PowerEisensteinApexApp[] := DynamicModule[
  {a = 13., b = 20., c = 21., kRange = {-3., 4.}, hMax = 20.,
   xRange = {-40., 90.}, yRange = {-35., 70.}, quality = "Fine",
   showPower = True, showEisenstein = True},
  Manipulate[
    Module[
      {tri, A, B, C, base3, kLo, kHi, counts, nK, nRho, nTraceK,
       nRootRho, plotDiagonal, maxEdge, rhoMax, rhoMin, rhoValues,
       rootRhoValues, kValues, traceKValues, color, power, eisenstein,
       graphics, legend, status},
      tri = peaTriangle[a, b, c];
      If[Head[tri] === Missing,
        Return[Panel[Style[
          "The selected side lengths do not form a nondegenerate triangle.",
          14, Darker[Red]], ImageSize -> 900]]];
      If[xRange[[1]] >= xRange[[2]] || yRange[[1]] >= yRange[[2]] ||
          hMax <= 0. || kRange[[1]] >= kRange[[2]],
        Return[Panel[Style["Choose increasing plot and k ranges.",
          14, Darker[Red]], ImageSize -> 900]]];
      {A, B, C} = Lookup[tri, {"A", "B", "C"}];
      base3 = Append[#, 0.] & /@ {A, B, C};
      {kLo, kHi} = N[kRange];
      counts = Switch[quality,
        "Preview", {42, 92, 80, 260},
        "High", {125, 280, 230, 850},
        _, {76, 170, 145, 500}];
      {nK, nRho, nTraceK, nRootRho} = counts;
      plotDiagonal = Norm[{xRange[[2]] - xRange[[1]],
        yRange[[2]] - yRange[[1]], hMax}];
      maxEdge = .105 plotDiagonal;
      rhoMax = 1.25 Sqrt[
        Max[Total[(# - A)^2] & /@ Tuples[{xRange, yRange}]] + hMax^2];
      rhoMax = Max[rhoMax, 3. Max[a, b, c]];
      rhoMin = Max[10^-7, 10^-6 Min[a, b, c]];
      rhoValues = Sort@DeleteDuplicates@Join[
        Exp@Subdivide[Log[rhoMin], Log[rhoMax], Floor[nRho/2]],
        Subdivide[rhoMin, rhoMax, Ceiling[nRho/2]],
        {a, b, c}
      ];
      rootRhoValues = Sort@DeleteDuplicates@Join[
        Exp@Subdivide[Log[rhoMin/10.], Log[rhoMax], Floor[nRootRho/2]],
        Subdivide[rhoMin/10., rhoMax, Ceiling[nRootRho/2]],
        {a, b, c}
      ];
      kValues = Sort@DeleteDuplicates@Join[
        Subdivide[kLo, kHi, nK],
        Select[Range[Ceiling[kLo], Floor[kHi]], kLo <= # <= kHi &],
        If[kLo <= 0. <= kHi, {0.}, {}]
      ];
      traceKValues = Sort@DeleteDuplicates@Join[
        Subdivide[kLo, kHi, nTraceK],
        Select[Range[Ceiling[kLo], Floor[kHi]], kLo <= # <= kHi &],
        If[kLo <= 0. <= kHi, {0.}, {}]
      ];
      color[k_?NumericQ] := Hue[Clip[(k - kLo)/(kHi - kLo), {0., 1.}]];
      power = If[showPower,
        peaFamilyGraphics[peaPowerRaw, tri, kValues, rhoValues,
          traceKValues, rootRhoValues, hMax, xRange, yRange, color,
          maxEdge, None, None],
        <|"Surface" -> {}, "IntegerLines" -> {}, "Trace" -> {}|>];
      eisenstein = If[showEisenstein,
        peaFamilyGraphics[peaEisensteinRaw, tri, kValues, rhoValues,
          traceKValues, rootRhoValues, hMax, xRange, yRange, color,
          maxEdge, {0.012, 0.008}, {0.010, 0.008}],
        <|"Surface" -> {}, "IntegerLines" -> {}, "Trace" -> {}|>];
      graphics = Graphics3D[
        {
          {Opacity[0.055], LightBlue,
            Polygon[{{xRange[[1]], yRange[[1]], 0.},
              {xRange[[2]], yRange[[1]], 0.},
              {xRange[[2]], yRange[[2]], 0.},
              {xRange[[1]], yRange[[2]], 0.}}]},
          power["Surface"], eisenstein["Surface"],
          power["IntegerLines"], eisenstein["IntegerLines"],
          power["Trace"], eisenstein["Trace"],
          {Opacity[0.16], LightBlue, Polygon[base3]},
          {Black, Thick, Line[Append[base3, First[base3]]]},
          MapThread[Text[Style[#1, 13, Bold], #2, {1.2, 1.2}] &,
            {{"A", "B", "C"}, base3}]
        },
        Axes -> True,
        AxesLabel -> (Style[#, 13, Bold] & /@ {"x", "y", "h"}),
        PlotRange -> {xRange, yRange, {0., hMax}},
        BoxRatios -> Automatic,
        SphericalRegion -> True,
        Lighting -> "Neutral",
        ViewPoint -> {1.55, -2.15, 1.35},
        ImageSize -> 1050,
        PlotLabel -> Style[
          "Power-k and Eisenstein-power apex surfaces\nsolid trace: power; dashed trace: Eisenstein; thin black: integer k",
          14, Bold]
      ];
      legend = BarLegend[{Hue, {kLo, kHi}},
        LegendLabel -> Style["k", 13, Bold], LegendMarkerSize -> 330];
      status = Row[{
        Style["surface triangles are explicitly colored and discontinuity-filtered", 11, Gray],
        Spacer[20], Style["Eisenstein uses only its positive admissible branch", 11, Gray]
      }];
      Column[{Legended[graphics, Placed[legend, Right]], status}]
    ],
    Delimiter,
    {{a, 13., "a = |BC|"}, 1., 60., .1, Appearance -> "Labeled"},
    {{b, 20., "b = |CA|"}, 1., 60., .1, Appearance -> "Labeled"},
    {{c, 21., "c = |AB|"}, 1., 60., .1, Appearance -> "Labeled"},
    Delimiter,
    {{kRange, {-3., 4.}, "k range"}, -10., 10., .1,
      Appearance -> "Labeled"},
    {{hMax, 20., "maximum height"}, 1., 60., .5,
      Appearance -> "Labeled"},
    {{xRange, {-40., 90.}, "x plot range"}, -200., 200., 1.,
      Appearance -> "Labeled"},
    {{yRange, {-35., 70.}, "y plot range"}, -200., 200., 1.,
      Appearance -> "Labeled"},
    Delimiter,
    {{quality, "Fine", "resolution"}, {"Preview", "Fine", "High"}},
    {{showPower, True, "show power-k"}, {True, False}},
    {{showEisenstein, True, "show Eisenstein"}, {True, False}},
    ControlPlacement -> Left,
    ContinuousAction -> False,
    SynchronousUpdating -> False,
    SaveDefinitions -> True,
    TrackedSymbols :> {a, b, c, kRange, hMax, xRange, yRange,
      quality, showPower, showEisenstein}
  ]
];

End[];
EndPackage[];
