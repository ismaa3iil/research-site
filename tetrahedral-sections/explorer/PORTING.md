# Porting and verification notes

## Provenance

The uploaded files match the existing public source files byte-for-byte:

| File | SHA-256 |
| --- | --- |
| RegularTetrahedralSections.wl | 7893a134c59ed5fcbc6c2db5c36eb625cb86c0f5b11794a7c633b857d1a059d5 |
| RegularTetrahedralSectionsApp.wl | 8ecbdfd62f69d57937fca033e84ce30bbcc5f5046278a890becc6b78c191ea83 |

Original archive: <https://github.com/ismaa3iil/tetrahedral-sections>

The geometry formulas were translated from those files. The first twenty
Kimberling center formulas were checked against Clark Kimberling's primary
Encyclopedia of Triangle Centers, Part 1:
<https://faculty.evansville.edu/ck6/encyclopedia/part1.html>.

The original application dynamically obtains KimberlingCenter from the
Wolfram Function Repository. The browser replaces that runtime dependency
with locally evaluated formulas. Centers that are undefined or at infinity
are omitted, and off-screen centers are clipped.

## Shared exact eliminant

`scripts/derive.py` substitutes x=mu^2, z=mu^3*cos(3phi), H=h^2 in the
published invariant map, computes its resultant with respect to z, and removes
universal factors. The retained factor has degree 4 in x and degree 8 in H.
The fixed-mu problem uses the latter polynomial with physical recovery checks.

To reduce floating-point cancellation near an equilateral triangle, the
coefficient tables use d=1/3-p and e=r-p/3+2/27. These are evaluated directly as
half the sum of squared centered side weights and their centered product.
Both implementations use compensated coefficient summation and derivative
root isolation with bisection. Candidate roots must recover c in [-1,1], meet
all three forward rays, and reproduce the normalized squared sides.

## Corrected equilateral special case

The original `strandEquilateralData` draws only the axial family, and
`strandApexForInverse` forces equilateral-target apex projections to the
centroid. That discards valid off-axis solutions. This port does not apply
that replacement.

An explicit counterexample is the equilateral triangle
A=(-1,0,0), B=(1,0,0), C=(0,sqrt(3),0), with apex
S=(5/4,-sqrt(3)/12,1/2). Its squared distances to A,B,C are
16/3, 1/3, 16/3, while all base sides squared are 4. Thus every pair of apex
rays has cosine 5/8. This is the height-H=3 cone since
(H-1/2)/(H+1)=5/8. The reciprocal-distance conic discriminant is zero,
so it is parabolic. Rotating S around the triangle's symmetry axis gives
three distinct off-axis apices. The usual axial apex is (0,sqrt(3)/3,2).

Tests retain all four at H=3. In the unordered fixed-height inverse there
are two shapes, one axial and one nonaxial; labeling yields four apices.
This is a correction to the visualization special case, not a revision of
the research paper or a claim that all of its theorems have been reverified.

## Scope and deliberate differences

| Original feature | Port behavior |
| --- | --- |
| Two Manipulate applications | Rebuilt as browser working surfaces |
| Four section views and geometric overlays | Included; native SVG and a rotatable orthographic 3D projection |
| Apex strands, center loci and twelve transition slices | Included; sampled finite range, draggable planar vertices |
| Atlas generators | Interactive sampled classifications and representative 13-phase atlas |
| Fixed publication notebook layouts | Replaced by downloadable individual SVG views; not layout-identical |
| Exact Reduce/Solve certificates | Remain in original Wolfram archive; not replaced by Float64 calculations |
| Native Julia interactive plotting window | Not included; Julia supplies the mathematical API and can serve the browser UI |
| Equilateral axial-only exception | Corrected to retain off-axis realizations |

Structural-phase labels describe open generic regions; boundary and symmetric
cases need their explicit geometry. Parabolic-height counts denote distinct
heights, whereas the strand view counts labeled spatial parabolic stars.
These are different quantities, especially for symmetric triangles.

The browser's default shape recovery tolerance is 2e-6. Candidates near
coalescing roots may be merged by numerical isolation; counts are not
certified on folds, degree drops, symmetry seams or at degenerate limits.
For a fixed mu, the displayed default height search is capped at h=120.
The finite strand sample stops at mu=0.008 and starts at mu=1.999; exact
vertex endpoints, selected transition slices and Fermat data are added.
Curves at infinity are split, not joined through the viewport. Increasing
sampling improves a picture but does not turn it into a proof.

## Validation

- Node tests cover plane and circumconic identities, independent side-length
  formulas, angle sums, inverse recovery across heights 0.03–8, permutations,
  rejected degenerate cases, repeated roots, atlas outputs, and equal-angle
  apex reconstruction.
- Julia tests exercise the same identities independently, including a
  256-bit BigFloat recovery case and the equilateral counterexample.
- The two implementations use the same symbolic coefficients; agreement
  alone is not treated as independent proof of those coefficients. Forward
  recovery and direct apex dot products supply separate geometric checks.
- JavaScript syntax, HTML local references and DOM control flows are checked.
  Browser screenshot/visual testing is not part of this validation.
