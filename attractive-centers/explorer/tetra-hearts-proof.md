# Tetrahedron hearts: review and independently proved extensions

**Publication note, 17 October 2026:** The fixed-anchor family and ten
conservative analytic maps reviewed below are now implemented in the explorer.
The review's statements about an unchanged website describe the earlier audit
stage. The larger proposed spectral endpoints remain uncertified and unused.

17 October 2026. Review of `tetrahedron_3param_families.md` supplied by the user.
The incoming document is a research proposal, not an instruction to publish.
No paper, explorer, website, or repository has been changed by this audit.

## 1. Main assessment

The proposal is valuable. Its fixed-weight barycentric-anchor power family
does have a global finite-attractivity proof, using the weighted power theorem
already established in Paper III. Its polynomial covariants give genuinely
three-dimensional families on generic tetrahedra. The determinant formulas
and the displayed U1 vertex Jacobian check out independently.

However, the larger polynomial ray intervals are not yet globally certified
by the supplied material. The cited `verify_tetrahedron_3param_families.py`
was not attached. In particular, the claimed global spectral extrema require
a proof of the reduction to collinear configurations; an affine dependence on
some squared coordinates does not establish that reduction.

Below I give a complete proof for the anchor family and new, conservative,
explicitly proved domains for all three polynomial families. These domains
can be used now without assuming the proposed sharp spectral theorem.

## 2. A useful theorem: fixed barycentric-anchor power centers

Write N=4 for the number of points, to avoid confusing it with simplex
dimension 3. Let C_alpha be fixed vectors in the barycentric probability
simplex: C_alpha,i >= 0 and sum_i C_alpha,i = 1. Let omega_alpha >= 0 be
fixed masses summing to 1. Set

    a_alpha(P) = sum_i C_alpha,i p_i,
    Z(P) = argmin_x sum_alpha omega_alpha |x-a_alpha(P)|^p/p.

If the anchor measure is invariant under permutations of its four
barycentric coordinates, Z is a permutation-invariant similarity-equivariant
center. The exponent range

    4 - 2 sqrt(2) <= p <= 4 + 2 sqrt(2)

guarantees the global finite attractivity law for every input vertex, in any
ambient dimension. The assertion concerns the continuous finite-law class;
global real analyticity needs a separate qualification below.

### Proof at regular configurations

The objective is strictly convex and coercive for p>1, so it has exactly one
minimizer. Positive scalar masses do not change a stiffness tensor's condition
number. At a noncollision, its stiffness is

    K_alpha = omega_alpha r_alpha^(p-2)
              [I + (p-2) u_alpha u_alpha^T].

Its condition number is at most

    q = max(p-1, 1/(p-1)) <= 3 + 2 sqrt(2).

The total stiffness K=sum_alpha K_alpha has the same condition-number bound:
if m_alpha is the smallest eigenvalue, summing
m_alpha I <= K_alpha <= q m_alpha I gives the assertion for K.
For a positive definite matrix of condition number q, its maximal turning
angle is at most arccos(2 sqrt(q)/(q+1)). At the stated threshold this is
pi/4. Thus K^(-1)h and K_alpha h have mutual angle at most pi/2, giving

    h^T K^(-1) K_alpha h >= 0.

This is precisely the weighted version of Paper III's stiffness argument.
The chain rule, including all anchor motions induced by p_i, gives

    D_i Z = K^(-1) sum_alpha C_alpha,i K_alpha,
    Sym D_i Z = sum_alpha C_alpha,i Sym(K^(-1)K_alpha) >= 0.

Nonnegative, geometry-independent C_alpha,i is essential here.

### Finite motions, including collisions

There is an especially clean argument that avoids differentiating singular
power kernels. Move p_i by h. This moves anchor alpha by C_alpha,i h. Regard
the anchors temporarily as independently movable inputs of the weighted
power rule, and move them one after another. All nonzero displacements are
positive multiples of the same h. The already proved finite weighted-power
law says

    (C_alpha,i h) . (Z_after - Z_before) >= 0.

For C_alpha,i>0 divide by it; zero coefficients give zero displacement. Sum
the resulting h-projections over the steps. The endpoint configuration is
exactly the anchor configuration for P with p_i replaced by p_i+h. Therefore

    h . [Z(P with p_i+h) - Z(P)] >= 0.

Intermediate independently moved anchor sets need not arise from an actual
tetrahedron: the underlying power theorem applies to arbitrary anchor sets.
This is why the argument is valid. It does not assume that arbitrary
nonparallel simultaneous motions preserve one projection inequality.

Translation and orthogonal equivariance follow from the affine anchor
formulas, and scaling the data by s scales the objective by |s|^p. Permutation
invariance follows from invariance of the fixed anchor measure. QED.

### Continuous anchor distributions

The same result holds for a fixed, permutation-invariant probability measure
nu on the barycentric simplex, with energy integral over c in that simplex.
Approximate nu by finite orbit measures. Anchors and minimizers stay in the
input convex hull; uniform convergence of energies on this compact hull and
strict convexity give convergence of minimizers. Pass the finite inequality
to the limit.

In particular, uniform VOLUME on a nondegenerate tetrahedron is the affine
pushforward of the uniform barycentric-simplex measure, so the hull-power
center is another member of this larger theorem. This does not prove the
same statement for Euclidean-length-weighted wire or area-weighted surface
measures: their normalized masses vary with the moving geometry.

### Analyticity qualification

Arbitrary real p in the interval gives a continuous attractive invariant
rule, but is not automatically globally real analytic across minimizer-anchor
collisions. This is already explicitly noted for powers in Paper III.
The polynomial covariant centers below are rational analytic on L>0.
For a strictly analytic power-based subfamily, use the even powers p=2,4,6:
their objectives are polynomial, and for these symmetric anchor orbits the
Hessian at the minimizer is positive definite on every noncollapsed input,
so the analytic implicit-function theorem applies. Here p=2 is simply G.
Fixed convex mixtures of the p=4 and p=6 maps preserve analyticity and
attractivity. Do not silently identify the continuous and analytic Hearts.

## 3. Two exact simplifications of Family I

Let M_p be the original equal-vertex power center and write r_i=p_i-G.
The four face centroids are

    f_i = G - r_i/3.

Consequently their equal-weight power center is EXACTLY

    Z_face,p = G - (M_p-G)/3.

Thus a first enlargement is obtained essentially for free:

    conv(K_power(P) union [G-(K_power(P)-G)/3]).

The six edge midpoints occur in three opposite pairs about G. Their power
center is G for every p>1. They nevertheless change the equilibrium when
mixed with vertices or face centroids, and so are not automatically redundant
as components of mixed objectives.

At p=2 all three orbit measures have mean G. The whole weight triangle
therefore collapses to G. The incoming parameter prism is not everywhere
an immersed solid. Numerical full rank at another interior parameter point
is evidence, not an exact global rank theorem for this variational family.

Also, a three-parameter family is NOT necessary for a volumetric convex
heart: a one-parameter space curve can have a three-dimensional convex hull.
Local rank one does not imply planarity. Convex combinations of four
noncoplanar attractive maps already provide a three-parameter tetrahedral
inner region.

## 4. Corrections and verified polynomial identities

Use the incoming definitions r_i, L, rho_i, delta_i, U_m, S-hat, H, K_j and
V_j. The following identity in Section 3.1 of the incoming document is wrong:

    delta_i = 1/4 - F_i/(12L).

The correct identities are

    F_i = 3L - 4|r_i|^2,
    delta_i = rho_i - 1/4 = 1/2 - F_i/(4L).

The erroneous expression equals rho_i/3, not delta_i; using it to compute
U1 would even destroy its stated zero-sum-weight property.

Independent symbolic differentiation confirms

    D_i U1 = delta_i I + 2 r_i r_i^T/L - S-hat/2
             - 2 U1 r_i^T/L.

Both determinant identities in the incoming report are correct: the KS
principal-frame Vandermonde formula and

    det[V1,V2,V3] = (3/2) signedVol(P) product_(i<j)(rho_j-rho_i).

For A=(0,0,0), B=(1,0,0), C=(0,1,0), D=(3,-2,1/2), independently checked
exact values are:

| Basis | Exact determinant | Decimal |
|---|---|---|
| K0,K1,K2 | -213507072/5744580078125 | -3.7166697843e-5 |
| V1,V2,V3 | -6478848/117236328125 | -5.5263143290e-5 |
| K0,K1,V2 | 3496896/32826171875 | 1.0652768204e-4 |

Each nonzero rational determinant proves generic full rank for that rational
covariant family. The KS rank condition additionally needs all three
components of U1 in its principal frame to be nonzero. Distinct inertia
eigenvalues by themselves do not suffice. The hybrid can help on particular
rank-drop strata; it is not a proof that every exceptional stratum is repaired.

The radius module is a module for polynomials IN THE RADII. A generic
tetrahedron has five similarity shape parameters, whereas four normalized
radii have only three independent values. Thus that module is not an
exhaustive parametrization of all invariant tetrahedron centers.

The octahedron volume formula is correct for the stated asymmetric axis
intervals. None of these algebraic identities certifies the intervals.

## 5. New conservative GLOBAL analytic domains, with proof

These avoid the unproved sharp spectral assertions entirely. Operator norms
below are Euclidean induced norms, uniform over every noncollapsed four-point
configuration in R^3 and every input vertex i.

    ||D_i U1|| <= 4,   ||D_i K1|| <= 7,   ||D_i K2|| <= 8,
    ||D_i V2|| <= 6,   ||D_i V3|| <= 4.

Therefore the FIVE-parameter family

    Z = G + c0 U1 + c1 K1 + c2 K2 + d2 V2 + d3 V3

is globally attractive whenever

    4|c0| + 7|c1| + 8|c2| + 6|d2| + 4|d3| <= 1/4.       (A)

Indeed Sym D_i G=I/4, and the smallest eigenvalue of Sym D_i Z is at least
the slack in (A). All coefficients are fixed parameters, not functions of
the target shape. The inequalities are sufficient, not claimed sharp.

### Proof of the bounds

Centering gives |r_i|^2 <= 3L/4. Consequently

    0 <= rho_i <= 3/4,   -1/4 <= delta_i <= 1/2,
    sum delta_i^2 = sum rho_i^2 - 1/4 <= 1/2,
    |U1| <= sqrt(L/2),   ||S-hat|| <= 1.

The verified U1 derivative formula gives

    ||D_i U1|| <= 1/2 + 3/2 + 1/2 + sqrt(3/2) < 4.

For an arbitrary displacement h,

    D_i S-hat[h] = (r_i h^T+h r_i^T)/L
                    - 2(r_i.h) S-hat/L,
    ||D_i S-hat[h]|| <= 2 sqrt(3)|h|/sqrt(L).

Since ||S-hat-I|| <= 1 and K1=(S-hat-I)U1, the product rule gives

    ||D_i K1|| <= sqrt(6)+4 < 7.

Put A=H^2-tr(H^2)I/3-2I/9, so K2=A U1. We have
||H||<=2/3, tr(H^2)<=2/3, nuclearNorm(H)<=4/3 and ||A||<=4/9.
Also

    DA[h] = H DS[h] + DS[h] H - (2/3) tr(H DS[h]) I,
    ||DA[h]|| <= (20/9)||DS[h]||.

Hence

    ||D_i K2|| <= (20 sqrt(6)+16)/9 < 8.

For U_m=sum_j delta_j^m r_j and b=1/2, direct differentiation gives

    D_i U_m = (delta_i^m - mean(delta^m)) I
      + (2m/L)[delta_i^(m-1) r_i r_i^T
              - (1/4)sum_j delta_j^(m-1) r_j r_j^T
              - (sum_j delta_j^(m-1) rho_j r_j) r_i^T].

The first term has norm <=2b^m. The first two terms inside brackets have
combined norm <= b^(m-1)L. For the last term, Cauchy-Schwarz with masses
rho_j gives

    |sum_j delta_j^(m-1) rho_j r_j| |r_i|
      <= b^(m-1) (3L/4).

Thus ||D_i U_m|| <= 2b^m + (7m/2)b^(m-1), giving
||D_i U2||<=4 and ||D_i U3||<=23/8. It follows that

    ||D_i V2|| <= 4+4/3 < 6,
    ||D_i V3|| <= 23/8+7/9 < 4.

This proves all five bounds. Integrating the PSD responses proves the finite
law along every noncollapsed vertex-motion segment. At total collapse the
rational covariants extend continuously by zero relative to G, since they
are O(sqrt(L)); a segment can be split there and continuity gives the same
finite law. QED.

### Explicit three-parameter bodies ready for use

Restrict (A) to the desired three generators:

| Family | A proved sufficient domain |
|---|---|
| KS | 16|c0| + 28|c1| + 32|c2| <= 1 |
| VM | 16|a1| + 24|a2| + 16|a3| <= 1 |
| Hybrid | 16|b1| + 28|b2| + 24|b3| <= 1 |

Each maps a coefficient octahedron onto a positive-volume inner octahedron
on the benchmark. The entire five-parameter body (A) maps onto the convex
hull of just TEN globally attractive rational analytic maps:

    G +/- U1/16, G +/- K1/28, G +/- K2/32,
    G +/- V2/24, G +/- V3/16.

This is a valid starting family, not a claim that these ten are radial
boundary maps. Their domains are deliberately conservative. Sharp global
certification can replace them later without changing the interface.

## 6. What the numerical audit actually establishes

The audit used one serial Python process, fixed seeds, one BLAS thread, and
no background workers. It checked 12,000 random normalized configurations
and performed bounded differential-evolution searches. For U1 it found
extrema -0.78266898984 and 0.74999999996, consistent with the proposed exact
values. It also searched all eight quoted rounded endpoints for K1,K2,V2,V3;
no negative response was found. These are numerical support only, not global
certificates. The jump from an affine expression in residual squares to a
global collinear extremum remains unproved in the incoming document.

I independently solved the benchmark variational problems and refined the
sample grid. All entries below are floating-point sampled hull volumes,
NOT exact volumes of entire continuous-family hulls. The reference tetrahedron
has volume 1/12.

The refined run uses 601 evenly spaced vertex exponents plus p=2, and 121
evenly spaced constellation exponents plus p=2, with weight subdivisions 16.
Solver residuals and rejected samples are recorded in the JSON output. The
largest normalized stationarity residual is around 4.5e-9; points failing
the constellation acceptance threshold 2e-9 are omitted. These are not
directed interval root certificates.

| Sampled construction | Volume (approximately) | Fraction of tetrahedron | Ratio to vertex baseline |
|---|---:|---:|---:|
| Vertex-power curve hull | 0.00024067 | 0.2888% | 1.000 |
| Vertex and reflected face-only curves | 0.00038809 | 0.4657% | 1.613 |
| Mixed vertex/edge/face constellations | 0.00065360 | 0.7843% | 2.716 |
| Constellations plus ten conservative analytic maps | 0.00067356 | 0.8083% | 2.799 |

These computations support a substantial improvement, including a modest
further improvement from the rigorously safe polynomial maps. The mixed
family had a positive support gap about 0.01025 beyond the sampled hull of
the vertex and face-only curves. This does not certify separation from the
ENTIRE continuous baseline; that requires exponent-uniform bounds.

The incoming 2.78x constellation figure and 9.71x combined figure are not
certified benchmarks. Their values depend on sampling. I reproduced the
three quoted polynomial-octahedron volumes from their claimed endpoints,
but those larger octahedra must not enter a proved heart until the global
endpoint claims are established. A dense sampled combined hull using those
unverified endpoints has volume about 0.002355, not an exact family volume.

## 7. Recommended next steps

1. Add the fixed-weight anchor family and the ten conservative analytic maps
   to a LOCAL explorer branch, retaining the existing vertex-power layer.
   Display solver status, sample resolution, and the continuous/analytic
   distinction. No clipping into the chest or silent centroid replacement.
2. Certify at least one strict enlargement witness with interval root bounds
   and exponent-uniform support bounds. This turns the sampled gain into a
   theorem comparing the entire continuous reference family.
3. Obtain the missing incoming verification script and exact endpoint
   certificates; or construct new polynomial positivity certificates.
   Prove the global U1 spectral reduction before using its alleged sharp
   interval, and separately certify K1,K2,V2,V3. Four-decimal endpoints alone
   are not certificates and must be rounded inward after certification.
4. Search the JOINT coefficient domain, not only separate axis rays. The
   octahedra follow from convex mixing but generally omit attractive maps
   with beneficial cancellation between generator responses.
5. Broaden the variational family to other fixed S4-orbits of barycentric
   anchors, then general orbit mixtures. This stays inside the proved theorem.
6. Only after checks, publish the improved tetrahedron heart and revise the
   papers, retaining reproducible numerical tables and separate proof status.

### A stronger search principle for arbitrary orbit mixtures

For a fixed target P and exponent p, let c range over barycentric coordinates
up to permutation. Let

    b_c(x) = mean_(pi in S4) |x-a_(pi c)(P)|^(p-2)
                              (x-a_(pi c)(P)).

A point x is realized by some invariant barycentric-anchor measure if and
only if 0 is in conv{b_c(x)}. Necessity is the equilibrium equation.
Sufficiency follows by using a finite convex representation of zero as orbit
masses; strict convexity then makes x the unique minimizer. Since these force
vectors lie in R^3 and form a compact set, Caratheodory's theorem gives a
representation using AT MOST FOUR ORBITS. Every such fixed orbit mixture
defines a globally attractive rule by Section 2. This is a practical broader
search space, not a characterization of the unrestricted maximal Heart.

## 8. Reproduction and files

Use a Python environment with NumPy, SciPy and SymPy:

```text
python audit_tetrahedron_families.py
python audit_tetrahedron_families.py --refine
python audit_tetrahedron_families.py --rays
```

The three commands are bounded and serial. Outputs are `audit_results.json`,
`refined_constellation_results.json`, and `rounded_endpoint_audit.json`.
The analytic proof above does not depend on any of the random tests.
The attached original is preserved separately; this review does not overwrite it.
