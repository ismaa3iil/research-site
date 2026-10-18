# All three explorer views: verified update, 18 October 2026

The triangle view previously included the continuous constant families,
shape-dependent maps, repaired conic bridge, R1-R10 and P1-P3. The tetrahedron
view already included the ten exact SOS endpoints and fixed anchor mixtures.
The planar four-point view still used only vertex-power centers.

This update adds the proved anchor and polynomial constructions to planar
four-point hearts, adds the conservative shape-modulated pair to both
four-point views, and adds twelve centroid-insertion polynomial rules to
the triangle view. Earlier displayed hulls remain available for comparison.
An added family can be redundant at particular inputs; no universal area or
volume gain is promised. Current percentages are calculated from the inputs.

## Mathematical status

- The ten polynomial ray endpoints have independently checked exact rational
  SOS certificates in `tetra-sharpened-proofs.zip`.
- Fixed vertex/edge/face orbit masses and exponents in
  [4-2 sqrt(2),4+2 sqrt(2)] define globally attractive anchor power rules.
  Parameters are fixed within each rule, never chosen as functions of shape.
- Restricting these spatial rules to a plane preserves finite attractivity;
  reflection confines the output to that plane. This does not claim that
  every planar attractive rule extends to space.
- G +/- (1-tr(S^2)) U1/24 has a conservative global derivative-norm proof.
  Its coefficient is not asserted to be maximal. The exact proof is in the
  guide and the accompanying reviewed theorem archive.
- Inserting G into any of the globally defined four-point polynomial rules
  gives an attractive triangle rule, with derivative D_iZ+D_4Z/3.
- Centroid transfer already existed in both chest engines. The new guide
  records its proof and the different h=6 and h=7 consequences.
- Arbitrary attractive insertion can fail, as the two interval-certified
  counterexamples in `four-point-theorems-review.zip` show. Universal centroid
  uniqueness and general pointwise Heart inclusion remain open.
- More aggressive modulated endpoints and proposed T1-T8 maps remain
  unproved here and are not part of the displayed proved hulls.

The underlying map theorems are global. Browser coordinates, equilibrium
solutions, areas and volumes are numerical. Continuous families are sampled,
and these sampled hulls do not assert the maximal Heart. The solver reports
failed samples rather than replacing them by the centroid or clipping them.

## Comparisons and examples

Planar inputs offer the old vertex-power hull, fixed-anchor hull, ten SOS
maps, modulation pair, and even-power analytic subheart. The tetrahedron
also retains its previous SOS-plus-anchor hull and conservative construction.
The triangle retains the preceding bridge-plus-rays hull and adds a separate
centroid-insertion layer. Each view uses the same scale in all plotted axes.

The planar presets h=6 and h=7 insert the triangle centroid as D. Vertices
remain independently movable after loading a preset. The first exhibits
strict chest reduction; the second excludes the triangle incenter and thus
proves strict attainable-Heart inclusion. Equilateral-plus-centroid shows
the equality case. A second scalene tetrahedron preset exposes different
polynomial directions. Focus hearts is available in both four-point views.

The diameter-ball option bounds the original coherent vertex-power family,
and absorption requires an additional axiom. Such conditional constructions
may cut the new larger heart; they are not universal outer bounds for the
enlarged family. Both options remain off by default.

## Reproduction

Run with Node.js:

```text
node tests-all-views.mjs
node tests-analytic-hearts.mjs
node tests-tetra-hearts.mjs
node tests.mjs
node tests-revision.mjs
node tests-generic.mjs
node tests-state.mjs
node tests-b41.mjs
node tests-b46.mjs
```

The new suite tests the independent side-length/covariant dictionary,
centroid-insertion identities, all relabelings, similarity equivariance,
symmetry collapse, unconditional chest containment, numerical directional
responses, old-hull retention and the exact benchmark chest percentages.
These are implementation regressions; global proofs are in the linked
certificate archives. No numerical test alone certifies attractivity.
