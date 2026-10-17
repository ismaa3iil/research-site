# Triangle hearts update — 17 October 2026

The default heart now includes B46, samples of both proved constant-coefficient
boundary arcs, the four earlier shape-dependent maps, R1–R6, the exact endpoints
R2* and R5*, the repaired conic bridge, R7–R10, and P1–P3.

Comparison layers preserve B46, the constant-family stage, the first
shape-dependent stage, the six-ray stage, and the conic-bridge stage. Every
displayed generator is evaluated directly from its formula. The browser does
not clip a generator into the chest or substitute the centroid after an error.
Power-minimizer failures inherited from B46 remain counted explicitly.

## Verification completed locally

- Previous R1–R6 proofs, narrow radial brackets and exact separation witnesses
  were already replayed in the preceding independent-ray handoff.
- An independent direct Cartesian differentiation of the full six-parameter
  barycentric map agrees symbolically with the supplied product-rule matrix.
- Fresh rational polynomial covers certify the whole repaired bridge, both
  exact collinear endpoints, and the seven supplied additional lower maps.
  This proof uses a separate adaptive cover that chooses between positivity of
  the determinant and positivity of its remainder after subtracting the flat
  product. It rechecks every accepted polynomial on its exact sub-box.
- The supplied generator then reproduced the report's 78-leaf bridge proof,
  endpoint proofs, four additional q-linear ray proofs, and three cubic-phase
  ray proofs. The supplied independent verifier passed all those proofs, all
  seven exact upper counterexamples, and eight exact separation witnesses.
- All bridge maps have zero collinear response at the stated contact shape.
  Their response after further outward scaling is 1 minus that scaling in
  the scaled Jacobian, proving radial sharpness by continuity to proper shapes.
- Exact rational barycentric references are exported at ten triangle shapes
  for implementation testing, including five bridge parameter values.

The proof files and replay records are in `analytic-heart-proofs.zip`. The
original independent-ray proof archive remains preserved separately in the
research project; this cumulative download contains its files and provenance.

## Evidence boundaries

The full continuous constant family and bridge are mathematically certified.
Their browser hull uses 129 parameter samples on each of the two constant
arcs and 129 on the bridge. Thus the polygon is a finite inner rendering of
the continuous-family hull. The exact endpoints R2*, R5* and the bridge
midpoint are among those samples.

The thirteen bracketed rays R1–R10/P1–P3 use certified lower endpoints. Each
true radial boundary is bracketed within 3e-8. Earlier necessity statements
are relative to their stated families; adding more maps can make an older
generator redundant. No complete base reduction has been made for the newest
combined family, and equality with the maximal Heart remains open.

The incoming report's 1,389/6,125 enlargement count is a supplied numerical
audit result. That audit was not rerun for this website update. Global
attractivity and the exact separation witnesses were checked independently
of that count.

## Reproduce

From an extracted proof bundle, with Python, SymPy, NumPy, SciPy and mpmath:

```text
python verify_conic_bridge_and_extensions.py
```

This replays the supplied exact proofs and separation witnesses in about ten
seconds on the development machine. For the additional independent derivation
and freshly generated global certificates:

```text
python verify_incoming_enlargement.py
```

This takes about eighty seconds. Both are serial, bounded computations.
Assertions must be enabled; do not use `python -O`.

The JavaScript module is `analytic-hearts.mjs`; exact parameter strings are in
`analytic-hearts-data.mjs`. Run `node tests-analytic-hearts.mjs` together with
the existing geometry, B46 and interaction regression suites. The independent
reference catalogue is `analytic-hearts-catalogue.json`.
