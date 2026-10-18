# Four-point chest and heart theorems: independent review

18 October 2026. Review of the supplied `tetrahedron_3param_families (3).md`
and `verify_tetrahedron_3param_families (1).py`.

The new centroid-insertion and certificate-lifting arguments are sound and
useful. The exact coplanar dictionary and the three vanishing combinations
also check out symbolically. Several stronger statements in the attachment
need qualification; its numerical verifier does not establish its claimed
global spectral bounds, uniqueness theorem, or the new endpoint certificates.

This review adds local research artifacts. It does not change the published
explorer, repository, or papers. The existing ten exact SOS certificates from
17 October remain valid and are not superseded by the incoming decimals.

## 1. What was checked

The original verifier completed in 11.734 seconds, with all its assertions
passing. Its finite-difference and random-shape checks are numerical. It uses
NumPy double precision, not the 50-digit arithmetic claimed in the report.
It does not contain directed interval arithmetic, a global polynomial
positivity proof, or a proof of uniqueness of centroid insertion.

Independent checks in this folder:

* `audit_exact.py`: generic rational-function identities, exact chest
  intersections over Q(sqrt(3)), and a nonzero rational 3D determinant.
* `audit_counterexamples.py`: fresh 80-digit equilibrium solves and analytic
  implicit Jacobians, including a test of the first stated displacement.
* `certify_composition_failures.py`: rigorous interval enclosures based on
  strong convexity, proving negative derivative responses for both examples.
  See `COMPOSITION_INTERVAL_PROOF.md` for the complete enclosure argument.
* `audit_candidate_rays.py`: three numerical minimizations for each of the
  20 newly proposed modulated/mixed endpoints. No negative response was found;
  this is evidence, not a global certificate.
* `audit_explorer.mjs`: read-only checks against the existing explorer code.
* `search_analytic_pullback.py`: 1,800 sampled triangles with R5* insertion
  and the ten already certified polynomial maps; no negative response found.
  Its saved record is the best sample, not the total number of samples.

The original script's minimum over its 552 shapes and 30 proposed maps was
approximately 4.536e-4. Our targeted search found a response near 6.18e-8
for the proposed -7.4323 M3 map. Thus a reassuring random-sample margin can
miss a much tighter constraint. None of these new numerical passes is a proof.

## 2. Centroid insertion: the theorem to retain

Use H_(N,d) for the attainable values of the chosen class of N-input,
permutation-invariant, similarity-equivariant, attractive rules in R^d.
Assume the domain includes the configurations and intermediate states used
in the proof. If it only contains proper tetrahedra, an extension to flat
configurations must first be supplied.

For any N-input configuration P, put g(P)=sum(p_i)/N. If Z is an attractive
(N+1)-input rule, define

    Y(P) = Z(p_1,...,p_N,g(P)).

Then Y is an attractive N-input rule. To prove the finite law when p_i moves
by h, first move its own slot by h, then the last slot by h/N. The two
attractivity inequalities, after dividing the latter by 1/N, give

    h . (Y(P with p_i+h)-Y(P)) >= 0.

Symmetry and similarity equivariance are preserved. In a differentiable
class, the same fact reads

    D_i Y = D_i Z + (1/N) D_(N+1) Z,
    Sym D_i Y = Sym D_i Z + (1/N) Sym D_(N+1) Z >= 0.

Composition with this affine insertion preserves C^k and analytic
regularity on the corresponding domains. If analytic normalized barycentric
weights lambda_j are required, the new weights are explicitly

    lambda'_i(P) = lambda_i(P,g(P)) + lambda_(N+1)(P,g(P))/N.

They sum to one and inherit the relevant permutation covariance. Appropriate
noncollision domains must still be specified for side-length formulas.

Consequently, in particular,

    H_(4,d)(A,B,C,G_ABC) subseteq H_(3,d)(A,B,C).

This requires no absorption or stability axiom. It holds for the finite-law
class as well as the stated smooth classes, when their domains are compatible.

For planar P regarded in R^3, restricting a globally defined spatial rule to
the plane gives a planar attractive rule. Hence

    H_(4,3)(P) subseteq H_(4,2)(P).

Do not silently replace this inclusion by equality: an arbitrary planar rule
has not been shown to possess a globally attractive spatial extension.

### General fixed affine-anchor pullback

More generally, let a_alpha(P)=sum_i C_alpha,i p_i with fixed nonnegative
coefficients summing to one in each row. Composing an attractive rule of the
a_alpha with this map preserves attractivity in every original input. Move
the anchors successively by C_alpha,i h, divide the nonzero inequalities by
C_alpha,i, and telescope. To obtain a symmetric center one also needs the
anchor list/measure to transform appropriately under input permutations.
This unifies centroid insertion and the fixed barycentric-anchor power family.

## 3. What this proves for chests, in 2D and 3D

Every triangle chest contains H_(3,2), and therefore contains the four-point
heart at (A,B,C,G_ABC). In particular the standard chest transfers without an
extra axiom. The attachment also supplies a valid direct symmetry proof:

* Bisector predecessor: project C and G onto the perpendicular bisector of AB.
  The two restoring displacements are h and h/3.
* Altitude predecessor: reflect B in the altitude through C to obtain A',
  and project G onto that altitude. Again the restoring displacements are
  h and h/3.
* Internal equilateral predecessor: start from (A,B,C0,N), where ABC0 is
  equilateral and N its centroid. Restore C0 to C and N to G by h and h/3.

The convex-hull half-planes follow from the existing convex-hull theorem.
Zero-width strips and the equilateral case need their symmetry equalities;
the sign formula with sign(0)=0 by itself supplies no bound.

Each displacement edge in a finite triangle certificate can similarly be
replaced by this two-edge chain, and its intermediate center variable can be
eliminated. This proves certificate lifting in the specified finite calculus.
If additional constraints are imposed at every new intermediate node, the
result may be stronger; equality with the original certificate means retaining
only the lifted constraints needed for the construction.

### A useful bound when D is not the centroid

Let C be any proved chest of triangle ABC, viewed in its affine plane inside
R^d, d=2 or 3. Set g=G_ABC and h=D-g. Starting from (A,B,C,g), restore the
fourth point to D. Then

    h . Z(A,B,C,D) >= min_{q in C} h . q.                    (1)

When h=0 the full triangle chest transfers. For h!=0, (1) is a valid
half-space, computable from the vertices of C. Repeating for the four choices
of omitted vertex gives four useful face-centroid transfer constraints for
planar sets and tetrahedra. This is already implemented in `centroidTransfer`
in the explorer; it is not a new unexplained stability assumption.

### The 13-20-21 calculation

For A=(0,0), B=(21,0), C=(5,12), D=(26/3,4), the triangle area is 126.
Independent exact arithmetic gives

    area(C_std) = 71649181/5386656 - 1510727 sqrt(3)/448888
                = 7.472040159164927...,
    area(C_std)/126 = 5.930190602511847... percent.

The older parallelogram+bisector+48-scenario network intersection has area
16.900012510859174, or 13.4127083419517 percent. Adding either the current
edge-projection slabs or the full centroid transfer reduces it to C_std.
All currently implemented unconditional methods together give the same area
on this example. The bimedian intersection does not reduce C_std further here.
The coordinates in the attachment's verifier are actually C=(16,12), the
reflected/relabelled 13-20-21 example; that is why the same area is obtained,
but that script does not calculate the stated area or polygon at all.

Thus the new write-up explains the old gap correctly, but the improved bounds
are already available through the explorer's Edge-projection slabs and
Face-centroid transfer options. No website repair is needed for this point.

## 4. Strictness: correct examples, incorrect universal formulation

For A=(0,h), B=(-1,0), C=(1,0), D=(0,h/3), reflection forces Z=(0,y).
Complete C,D,A to a parallelogram by replacing B by

    B'=C+D-A=(1,-2h/3).

Its forced center is (C+D)/2=(1/2,h/6). Restoring B'-to-B gives

    (-2,2h/3) . ((0,y)-(1/2,h/6)) >= 0,
    y >= h/6 - 3/(2h).                                     (2)

The incenter is an already proved attractive triangle center and has

    y_I = h/(1+sqrt(1+h^2)).

Solving y_I < h/6-3/(2h) gives exactly

    h > sqrt(21+6 sqrt(13)).

For h=7, y_I=(5 sqrt(2)-1)/7 < 20/21. Therefore the heart inclusion is
strict on these triangles, and by the positive separation gap also on nearby
scalene triangles. It is NOT strict on every triangle: at an equilateral
triangle both hearts are the centroid singleton.

The separate near-equilateral slope argument is conditional on alpha_4>0
for the particular four-point rule. No uniform positive lower bound over all
rules is supplied. It therefore does not independently prove a strict
inclusion of the entire attainable sets near equilateral shape.

The chest statement has an earlier strictness threshold. For h>sqrt(3),

    C_std(T_h) = {0} x [1/sqrt(3), (h^2-1)/(2h)].

Equation (2) cuts this interval strictly when h>3 sqrt(3). At h=6,

    C_std = {0} x [1/sqrt(3),35/12],
    C_std intersect C_bimed = {0} x [3/4,35/12].

Both interval endpoints were checked exactly. Distinguish the strict chest
comparison at h=6 from the heart separation by the incenter at h=7.

## 5. Coplanar algebra: confirmed, with a rank qualification

Writing q_tilde=1-tr(S^2), the coplanar Cayley-Hamilton identity simplifies to

    K2 = K1/3 - (q_tilde/6) U1.                             (3)

This is equivalent to the attachment's formula with H=S-I3/3. The verifier
here checks (3) as a rational-function identity for four arbitrary planar
points (0,0), (1,0), (u,v), (a,b), not just one triangle.

For D=G_ABC, every displayed entry of the triangle reduction dictionary is
correct, as are all three syzygies. Generic symbolic checks were performed
with A=(0,0), B=(1,0), C=(u,v). The three syzygy vectors have determinant

    -13587660864/175927764892578125 != 0

at the rational spatial benchmark (0,0,0),(1,0,0),(0,1,0),(3,-2,1/2).
They therefore give three generically independent spatial directions whose
values vanish on centroid-augmented triangles.

The phrase 'remain full rank 2 across the plane' must be 'generically full
rank 2'. At a parallelogram, all rho_i occur in opposite equal pairs and
every U_m vanishes. At an equilateral triangle with its centroid added, the
symmetry again forces these covariants to vanish. The hybrid likewise cannot
repair every rank-drop stratum.

For planar implementation, use the restriction of the existing 3D formulas
(append a zero coordinate), or use (3). Do not replace I3/3 by I2/2 while
keeping the same K2 coefficients and certificates: that changes the family.
The ten certified spatial polynomial maps and the anchor construction can
already be restricted to the plane to enlarge the planar four-point heart.
The current planar four-point heart layer still uses the vertex-power family.

## 6. What is proved about the new modulated family

The collinear vanishing statement is correct on L>0:

    q_tilde = 1-tr(S^2)
            = 2 sum_(i<j) |r_i cross r_j|^2/L^2 >= 0,
    grad_(p_i) q_tilde = -4(S-tr(S^2)I)r_i/L.

On a collinear configuration S is the rank-one projector onto the line, so
both q_tilde and its gradient vanish. Therefore q_tilde W and its entire
vertex derivative vanish there for every smooth base covariant W.

This removes collinear obstructions. It does not bound the derivative away
from that stratum, so the printed larger coefficient intervals and T1-T8
remain candidates until a global positivity certificate is supplied.
Increasing a ray coefficient while shrinking the vector field by q_tilde
also does not automatically increase its evaluated geometric reach.

### A proved conservative modulation rule

There is a simple rigorous starting domain. Suppose a homogeneous covariant
W satisfies |W|<=A sqrt(L) and ||D_i W||<=B globally. Since 0<=q_tilde<=2/3,
rho_i<=3/4, and ||S-tr(S^2)I||<=1,

    |grad_(p_i) q_tilde| <= 2 sqrt(3)/sqrt(L),
    ||D_i(q_tilde W)|| <= 2B/3+2 sqrt(3)A =: C_W.

Hence G+c q_tilde W is attractive for |c|<=1/(4 C_W). More generally,

    sum_j C_(W_j) |c_j| <= 1/4

certifies G+sum_j c_j q_tilde W_j. Combine this budget with the old derivative
budgets to get a joint sufficient family. The product rule proves the claim;
continuity handles total collapse as in the prior polynomial proof.

For example, the established |U1|<=sqrt(L/2) and ||D_i U1||<=4 give
C_U1<=8/3+sqrt(6)<6, so

    G + c q_tilde U1 is proved attractive for |c| <= 1/24.

This modest interval is not claimed to improve the existing hull. The much
larger proposed endpoints need SOS or another exact global certificate.

The proposed M0, M1, M2, M3 numerator responses have degrees 8,10,10,12,
respectively, in the Hadamard-frame variables, before any syzygy reduction.
Direct Gram searches therefore cost more than the old degree-4/6/8 rays.
Exploit the exact vanishing combinations and symmetry before scaling up.

## 7. Non-centroid insertion: certified failures, but no uniqueness theorem

The composition derivative is correctly

    D_A[Z(A,B,C,M(A,B,C))] = D_1 Z + D_4 Z D_A M.

Products of matrices with PSD symmetric parts need not have PSD symmetric
part. This explains a possible failure; it is not a proof that EVERY
non-centroid M fails for SOME globally admissible, symmetric Z.
The latter requires a realization theorem or a separate construction for
every M, neither of which is given.

The narrower rigidity assertion is valid: among C^2, S3-invariant,
similarity-equivariant maps in dimension d>=2, the centroid is the unique
one with all input derivative blocks scalar multiples of I everywhere.
Mixed partials force the scalar coefficients to be constants; symmetry and
translation equivariance then make each 1/3. This proves uniqueness of the
isotropic mechanism, not uniqueness among all possible mechanisms.

Likewise, failure of a particular composed map does NOT disprove the
pointwise inclusion H4(P,M(P)) subseteq H3(P). Different triangle rules may
realize its values at different P. A genuine pointwise separation would need
a four-point value outside a proved triangle chest, or another valid
attainability obstruction.

### Independently reproduced composition examples

At A=(5/16,7/20), B=(-1,0), C=(1,0), take M=M_(4-2sqrt(2))^(3) and
Z=M_(4+2sqrt(2))^(4). Independent 80-digit roots reproduce the two reported
positions, the negative determinant, and the minimum eigenvalue

    lambda_min = -0.00024487465420313991776980859...

However the correct symmetric derivative matrix in the stated Cartesian
coordinates is

    [0.0099490458869321894   0.0228565153019154581]
    [0.0228565153019154581   0.0510033462475179440].

The attachment's displayed matrix is incorrect. A unit negative direction is

    (-0.9132847897668143780, 0.4073216085362838488).

A positive step of 0.001 along it gives dot product
-2.43017906662568814e-10. Reversing the direction gives the other sign-choice
of the finite example. Using instead the attachment's stated positive
direction (0.5877787026,0.8090217530) gives +5.87851573551377e-8, not a failure.
The supplied script recomputes its own eigenvector, so it never checks this
incorrect prose direction or the displayed matrix.

The R5* example also reproduces the stated negative eigenvalue

    -0.00040251055328154531430321775...

using independently differentiated rational R5*. But its normalized invariant
at A=(1/2,1), B=(-1,0), C=(1,0) is q=97/1156, not 189/2312.
The positions in the attachment use the correct invariant despite that typo.

The 80-digit evaluations alone are numerical corroboration. We have now
additionally certified both failures with outward interval bounds. Strong
convexity converts interval residuals into rigorous equilibrium root boxes;
interval implicit derivatives then give, for rational directions,

    Example 1, v=(-9,4): v^T D_A(composition) v in [-0.023743,-0.023742],
    Example 2, v=(7,12): v^T D_A(composition) v in [-0.077681,-0.077679].

Both intervals are strictly negative. The companion proof and executable
certificate establish failure for sufficiently small finite steps as well.
This certifies these two failures, not the claimed universal uniqueness.
For arbitrary non-even power exponents, global analyticity at minimizer-anchor
collisions also cannot be assumed. At these two regular triangles the implicit
maps are locally analytic; the cited 4-point rules are globally in the
continuous finite-law class. The assertion that they belong globally to
A4^omega needs separate justification.

## 8. Other corrections to carry forward

1. The face-edge formula for delta_i is still wrong. The correct identity is
   delta_i=rho_i-1/4=1/2-F_i/(4L), with F_i=3L-4|r_i|^2.
2. The claimed exact global U1 spectral extrema are attained by the displayed
   collinear examples. That establishes necessary bounds, not global
   sufficiency. Affine dependence on the transverse squared lengths does not
   prove that all extrema occur at their simultaneous zero values: these
   variables obey centering, Gram-realizability and normalization constraints.
   The reduction remains unproved in the supplied material. The old inward
   exact SOS certificate is still the sufficient result to use.
3. The determinant formula involving Vol needs oriented volume, or absolute
   values on both sides. The script correctly uses the signed homogeneous
   coordinate determinant.
4. A three-parameter original family is not necessary for a solid convex
   heart: the convex hull of a nonplanar curve can have positive volume.
5. The stellar surface-measure doubling is valid as a sum of four abstract
   face measures. It is not the topological boundary measure of the planar
   convex hull, and is not the same as uniform barycentric volume measure
   pushed from a degenerate tetrahedron. It proves an identity on the stellar
   locus, not global attractivity of surface-area-weighted power centers.
6. Reflection across the input plane forces planar confinement; the
   convex-hull containment additionally uses attractivity. The convex
   quadrilateral/interior-point dichotomy needs degeneracies treated separately.
7. The one-step reflection discussion should not identify altitude reflection
   with orthogonal projection of the moved base vertex. The altitude proof
   must use the actual reflected base partner. The correct explicit proof in
   Section 7.6 does so.
8. The old axis-ray decimals in this attachment are slightly more aggressive
   than the independently certified endpoints. Do not replace the live exact
   catalogue by them merely because the sampled script passes.

## 9. Numerical volumes and reproducibility

The attachment's table is partly stale. Running its own script gives:

| Benchmark | 25-sample vertex-power baseline | Anchor hull | Proposed rational hull | Combined candidate hull |
|---|---:|---:|---:|---:|
| Paper III | 0.0002325678 | 0.0005956887 (2.56x) | 0.0002147447 (0.92x) | 0.002331399 (10.02x) |
| Scalene 2 | 0.00007049343 | 0.0001638789 (2.32x) | 0.001315142 (18.66x) | 0.001754027 (24.88x) |

For the first benchmark, the report instead prints anchor volume 0.00064725
and combined volume 0.0022724 (9.77x). These do not match the attached script.
The 24.88x result does reproduce, but remains a candidate hull because its
new polynomial maps have no global certificates here. Its baseline and
sampling grid differ from the current explorer's 42-map baseline and anchor
sampling. Compare methods with a shared baseline and identical root checks.
The incoming Newton routines also stop on small steps without a mandatory
residual/error-bound acceptance test; an unconditional 'PASS' must not mask
an inaccurate equilibrium on harder shapes.

## 10. Recommended next implementation and proof work

1. Incorporate the corrected centroid-insertion, certificate-lifting and
   strictness example into Paper I's four-point discussion. Describe the
   transfer already present in the explorer, rather than announcing it as a
   new option. Add h=6 and h=7 presets/explanations when updating the UI.
2. Extend the planar four-point heart layer using the ALREADY certified ten
   spatial polynomial maps restricted to z=0, plus the fixed anchor family.
   Keep the continuous versus analytic heart distinction visible.
3. Prioritize exact certificates for the new spatial directions exposed on
   the Scalene-2 benchmark. M3's numerical endpoint is especially close to
   singularity; use a rational inward endpoint or handle a singular Gram
   certificate. Add the new maps to a proved heart only after exact replay.
4. Replace Theorem 7.4 by the proved isotropic rigidity lemma and the two
   now interval-certified composition counterexamples. Leave universal
   insertion uniqueness, and non-centroid pointwise heart inclusion, open.
5. Resolve the U1 collinear-reduction gap separately if exact sharp ray
   endpoints are desired. The current inward SOS endpoints already suffice
   for a usable proved heart.

## Reproduction and provenance

Run `audit_exact.py`, `audit_counterexamples.py`,
`certify_composition_failures.py`, `audit_candidate_rays.py`,
and optionally `search_analytic_pullback.py` with Python, SymPy, NumPy, SciPy
and mpmath. The original script is retained unchanged as `incoming_verify.py`.
The JavaScript audit reads the existing local explorer checkout and records
its outputs in `explorer_audit.json`; its absolute checkout path can be edited
for another machine. No public state is changed by any of these audits.

Input SHA256:

* Markdown: BBDF1BFBE3D068089A8ECD9008CF3A7F4352EA29515E7985A680625DDCD8CCAD
* Python: 35D59B0FB59C1026A6610C4BE7B6141C7F1F425CB73CCD3B4CB8902E4F1FCB9D

The separate exact certificate collection from 17 October is in
`output/tetrahedron_families_review_2026-10-17`; its proof replay remains the
source of the ten certified polynomial endpoints. This review does not rerun
or modify those already verified global certificates.
