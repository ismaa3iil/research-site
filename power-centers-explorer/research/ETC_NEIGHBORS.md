# ETC neighbors of power centers and hull-power centers

**Research and authorship: Ismail Hammoudeh. Developed with extensive use of ChatGPT.** Revised 6 October 2026. ETC definitions retain Clark Kimberlingâ€™s and contributorsâ€™ authorship.

Numerical neighbors do **not** inherit attractivity or failure from the target. Two exact results settle both directions:

- The nearest sampled hull neighbor at p=12 is X(7934), which fails, although U12 is universally attractive.
- The nearest sampled atomic neighbor at p=7 is X(18236), which is attractive for every single-vertex motion with proper triangle endpoints, although M7 is outside its universal positive interval.

## Positional protocol

The PITC snapshot contains 72,807 ETC records. Rankings use its 70,853 complete finite fingerprints on the same fixed 100-triangle angle grid. The metric is RMS Cartesian distance divided by each triangleâ€™s longest side. A separate 40-triangle holdout evaluates RMS and maximum error but does not determine the rank. Unsupported and nonfinite entries are excluded; unused zero-filled packed-cache rows are not candidates. The database SHA256 is `ace501d40dd83785f89b4de8e4ddcc0c5081d82de82e1baf37816d10e547cbfa`.

There are 33 powers in 1<p<25, including 65/64, 4âˆ’2âˆš2, all integers 2 through 24, 21.63, and 24.99. All 4,620 target center pairs on the training/validation shapes resolve. Hull orders 40 and 64 differ by at most 3.799571eâˆ’12 diameters on this data set; this floating consistency check is not a rigorous error bound. Only p=2 is asserted to be an ETC identity: both targets equal X(2) exactly.

At p=4, atomic X(15810) has grid/check RMS 0.1257%/0.1322%, and hull X(52788) has 0.2038%/0.2080%. At p=7, atomic X(18236) has 1.0175%/1.1433%. At p=12, hull X(7934) has 1.2287%/1.1196%. Scores define proximity across these particular shapes, not pointwise or derivative proximity.

## Independent attractivity

Forward automatic differentiation checks all three symmetric vertex response matrices on 983 proper triangles: 100 training, 40 holdout, 700 seeded random, and 143 explicit family members. All 85 exported formulas are defined on every screened shape. The set includes 82 distinct shortlisted neighbors and baseline X(1), X(6), X(10).

For the **82 neighbors**, accepted statuses are:

- **33 certified failures**, each supported by an exact rational interval finite witness.
- **3 proved attractive:** X(2), X(18236), and X(56203). The latter two are proved for finite motions with proper triangle endpoints, including motions crossing a flat or coincident configuration by continuity/endpoint approximation. No value at an exactly coincident input is asserted for these two rational ETC formulas.
- **46 no sampled failure**, with no all-shape proof in this investigation.

The full formula set has 34 certified failures because baseline X(6) also fails. Neither nonnegative samples nor a small numerical minimum establish universal positivity. An ETC rule here has no p parameter; its status belongs to its formula, regardless of the power at which it is shortlisted.

### Exact negative example: X(7934)

The official ETC entry gives cyclic barycentrics `2b^4âˆ’b^2c^2+2c^4`. For A=(0,0), B=(1,0), C=(1/2,t), q=1/4+tÂ², differentiation with respect to the horizontal apex coordinate gives

`âˆ‚Xx/âˆ‚Cx = (3qâˆ’1)(qâˆ’1)/(7qÂ²âˆ’2q+4)`.

This is negative for 1/12<tÂ²<3/4. At t=5/8 it is exactly âˆ’1357/22903. With the finite apex motion h=(1/1000,0), the dot product is exactly

`âˆ’82823496093/1397892175783000000 < 0`.

All three hull neighbors at p=14,16,20,21,21.63 have certified failures. In particular U16,U20,U21 are independently proved attractive, so positional neighbor failure is no contradiction to their theorems. This does not prove every hull p<21.63 attractive: the interval between 16 and 21 remains uncertified.

### Exact positive examples: X(18236), X(56203)

The standalone article contains the full algebraic response reduction. Clear positive denominators in a chosen vertex response, substitute a=v+w,b=w+u,c=u+v, and expand over u,v,w>0. For X(18236), the vertical diagonal numerator, determinant numerator, and squared weight sum have 95,363,61 nonzero terms, all with strictly positive coefficients. For X(56203) the counts are 60,266,36. Thus one diagonal and the determinant are positive, which proves the symmetric response positive definite. Cyclic symmetry treats all vertices.

The squared weight sums are nonzero on every boundary face with two positive triangle variables, covering distinct collinear triangles. Continuity extends local PSD to those shapes. Integrating gives finite attractivity for paths avoiding coincidences; proper endpoint approximation covers paths through a coincidence.

The X(18236) expansion of the *other* diagonal has mixed coefficients. This is inconclusive by itself and does not invalidate the proof: its positive sign follows from the positive diagonal and determinant. Requiring both diagonals to have positive coefficient expansions would miss this certificate.

## Reproducibility and distribution

From the workspace root:

```sh
python research/etc_matching/build_inputs.py
node research/etc_matching/compute_centers.mjs
python research/etc_matching/rank.py
node research/etc_matching/screen_attractivity.mjs
python -S research/etc_matching/prove_positive.py 18236 56203
python -S research/etc_matching/certify_neighbors.py
```

Rank regeneration needs the existing PITC snapshot, NumPy, and the supplied packed cache; paths can be overridden using `--pitc`. Exact negative and positive verification uses only Pythonâ€™s standard library. The sparse polynomial expansions are independently checked against forward automatic derivatives in the 17-test explorer suite; the derivatives are also checked against centered finite differences. All negative finite witnesses are independently evaluated there. The completed desktop/mobile browser checks cover the ETC selector, overlays, proof labels, failure replay and reset, both extended triangle range endpoints, dragging, tetrahedral controls, and responsive layout.

- `explorer/data/etc-matches.json`: 33 selected powers, three neighbors per family, scores, selected formulas, statuses.
- `explorer/data/etc-matches.csv`: 198 ranked candidate rows and errors.
- `explorer/data/etc-attractivity.csv`: response screening and certificate status.
- `explorer/data/etc-attractivity-certificates.json`: exact negative rational endpoint records.
- `explorer/data/etc-positive-certificates.json`: exact positive coefficient lists and scope.
- `output/etc_matching/attractivity-screen.json`: full numerical screen, including shapes.
- `articles/Power_Centers_and_Hull_Power_Centers_2026-10-03.tex`: integrated standalone article and proofs.

The explorer covers triangle p=1.01â€¦24.99 and tetrahedron p=4âˆ’2âˆš2â€¦19.95; ETC rankings concern triangles only. The overlay selects one or both three-rule shortlists. Rankings at unsampled powers are not interpolated. Browser coordinates and local response displays are numerical; proof badges refer to the separate exact records. Everything runs with free mathematical tools, without Wolfram or paid software. Only selected ETC formulas are distributed.

Official source: [Kimberlingâ€™s ETC X(7934)](https://faculty.evansville.edu/ck6/encyclopedia/ETCPart5.html#X7934). The formula was checked directly against the official entry. New research is attributed to Ismail Hammoudeh; extensive ChatGPT use is acknowledged in the article, records, and explorer.
