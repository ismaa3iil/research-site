# Shape-dependent attractive centers: a proved enlargement

## First four-parameter investigation — 16 October 2026

### Main outcome

The first shape-dependent extension succeeds. The simple map

\[
\boxed{Z=G+\left(\frac25+\frac65q\right)K
             +\left(-\frac32+\frac52q\right)HK,\qquad q=1-3e_2,}
\]

is **globally attractive**, with an exact, independently replayed proof.
Here \(K=X_6-G\), where \(X_6\) is the symmedian point,
\(S=\sum_{i=1}^3(p_i-G)(p_i-G)^T\),
\(H=2S/\operatorname{tr}S-I\), and
\(e_2=s_1s_2+s_2s_3+s_3s_1\), where
\(s_i=a_i^2/(a^2+b^2+c^2)\).

On the triangle with sides \((30,21,11)\), this map lies strictly outside
the convex hull of B46, the centroid, and the **entire** previously classified
constant-coefficient region. The separation is exact, not visual evidence.

Along the ray \(Z_\lambda=G+\lambda(Z-G)\), the maximal attractive
parameter \(\lambda_*\) satisfies the rigorously proved bracket

\[
\boxed{1.0478284289\le\lambda_*<1.0478284290.}
\]

The lower endpoint is globally certified; the upper endpoint has an exact
negative-Jacobian witness at a nondegenerate **scalene** triangle. The bracket
has width \(10^{-10}\). It is not merely the output of a numerical optimizer.

These results are new inner-Heart information. They do not determine the
unrestricted maximal Heart, nor classify the whole four-parameter family.

## 1. The extended ansatz

We considered

\[
Z_{\boldsymbol c}=G+f(q)K+g(q)HK,\qquad
f(q)=f_0+f_1q,\quad g(q)=g_0+g_1q,
\quad \boldsymbol c=(f_0,f_1,g_0,g_1).
\]

For triangles, \(0\le q\le1/4\): the equilateral shape has \(q=0\),
and collinear shapes have \(q=1/4\). The corresponding normalized
barycentric weights are

\[
w_i=\frac13+(f(q)+4g(q))(s_i-\tfrac13)
     -6g(q)\left(s_i^2-\frac13\sum_j s_j^2\right).
\]

They sum to one and have the required permutation symmetry and degree-zero
homogeneity. Since they are rational functions of squared side lengths,
they extend analytically to noncollapsed degenerate configurations. There
is no choice of signs for inertia eigenvectors and no equilateral singularity.

The constant-coefficient family is the subspace \(f_1=g_1=0\).
Allowing the coefficients to depend on shape is not equivalent to choosing
different constant maps separately at different triangles: their derivatives
must also be included.

## 2. The extra derivative terms, explicitly

For vertex \(p_i\), the exact derivative is

\[
D_iZ=\tfrac13 I+fD_iK+gD_i(HK)
       +K(\nabla_i f)^T+HK(\nabla_i g)^T.
\]

Here \(\nabla_i f=f_1\nabla_i q\) and
\(\nabla_i g=g_1\nabla_i q\). Omitting the last two terms would test a
different map and could give a false attractivity conclusion.

There are two independent implementations in the bundle:

1. `derive_shape_dependent.py` differentiates the barycentric rational
   functions with the other two vertices held fixed, **before** normalizing
   the configuration.
2. `verify_shape_dependent.py` reconstructs the result by the product rule,
   using the independently verified constant-family derivatives and the
   area-based derivative of \(q\) below. It does not import the new
   fixed-vertex derivative generator.

### Root-free normalized coordinates

Set \(G=0,L=\sum|p_i|^2=1\), and choose

\[
p_1=(r,0),\quad p_2=(-r/2+X,Y),\quad
p_3=(-r/2-X,-Y),
\]

\[
z=r^2,\quad V=(2-3z)/4=X^2+Y^2,\quad v=Y^2,
\quad 0\le z\le2/3,\quad0\le v\le V.
\]

Then

\[
q=\frac14-3zv.
\]

To differentiate correctly, let \(\mathcal A\) be signed triangle area
and \(Q=a^2+b^2+c^2\). Before normalization,

\[
q=\frac14-\frac{12\mathcal A^2}{Q^2}.
\]

At the displayed configuration,
\(\mathcal A=3rY/2\), \(Q=3\),
\(\nabla_1\mathcal A=(Y,-X)\), and \(\nabla_1Q=(6r,0)\).
Therefore

\[
\boxed{\nabla_1q=(4rv(3z-1),\ 4rXY).}
\]

Writing

\[
k_x=3/2-3z-2v,\qquad h_x=3/2-3z+(6z-4)v,
\]

gives

\[
K=(rk_x,2rXY),\qquad HK=(rh_x,4rXY(1-3z)).
\]

These formulas make every extra product-rule contribution polynomial in
\(z,v\), apart from the common off-diagonal factor \(XY\).

## 3. Numerical discovery, then exact certification

The bounded discovery stage used 1,275 normalized shapes and 168 support
objectives selected from 30 archived triangle configurations (discarding
lower-dimensional cases). Initially it tested 16 displacement directions
per shape, then added eigenvector cuts where a sampled matrix was indefinite.
There were four real coefficient variables and explicit coefficient bounds.

This was a single-process, finite numerical search, taking about 24 seconds
on the current machine. Its outputs in `SHAPE_DEPENDENT_SEARCH.json` are
explicitly labelled **numerical candidates**, not proofs.

Three simple rational coefficient vectors near useful candidates were then
chosen and certified independently:

| Map | \(f_0\) | \(f_1\) | \(g_0\) | \(g_1\) |
|---|---:|---:|---:|---:|
| Simple map \(Z\) | \(2/5\) | \(6/5\) | \(-3/2\) | \(5/2\) |
| Auxiliary map 2 | \(2/5\) | \(1\) | \(-3/2\) | \(14/5\) |
| Auxiliary map 3 | \(3/8\) | \(1\) | \(-7/5\) | \(5/2\) |

These three maps are strictly attractive: for every triangle and every vertex,

\[
\operatorname{Sym}D_iZ\succeq\frac1{3000}I.
\]

The lower bound is a convenient certified bound, not the best one.

### How the global certificates work

Write the scaled symmetric response as

\[
M=3\operatorname{Sym}D_1Z=
\begin{pmatrix}a(z,v)&XYb(z,v)\\XYb(z,v)&c(z,v)\end{pmatrix}.
\]

The diagonal entries are quadratic in \(v\), and the off-diagonal coefficient
is affine in \(v\). This differs from the constant family: testing only the
collinear and isosceles endpoints is no longer enough.

For a chosen rational \(\delta>0\), the certificate proves

\[
a-\delta>0,\qquad
(a-\delta)(c-\delta)-v(V-v)b^2\ge0
\]

throughout the whole shape domain. It follows that \(M\succeq\delta I\).

The substitution

\[
z=\frac23Z,\qquad v=\frac12(1-Z)H,
\quad (Z,H)\in[0,1]^2
\]

turns the domain into a square. On a finite subdivision of that square,
all tensor-product Bernstein coefficients are checked with exact rational
arithmetic. Nonnegative coefficients imply a nonnegative polynomial on
the entire box. The independent replay recomputes those coefficients from
the polynomial on each box; it does not trust stored sign labels.

| Map | \(\delta\) for \(M\) | Diagonal boxes | Determinant boxes |
|---|---:|---:|---:|
| Simple map | \(10^{-3}\) | 8 | 6 |
| Auxiliary map 2 | \(10^{-3}\) | 7 | 4 |
| Auxiliary map 3 | \(10^{-3}\) | 5 | 4 |
| Certified radial lower endpoint | \(10^{-13}\) | 10 | 70 |

Permutation and similarity equivariance transfer the proof for vertex 1 to
every vertex of every triangle. Collinear boundary cases and coordinate-frame
degeneracies follow by continuity. Integrating the PSD derivative along a
one-vertex path gives finite-displacement attractivity.

## 4. Exact enlargement beyond the previous hull

Use the triangle

\[
A=(0,0),\quad B=(11,0),\quad
C=(-169/11,20\sqrt{62}/11),
\]

with sides \((a,b,c)=(30,21,11)\). Its invariant is

\[
q=\frac{459961}{2137444}.
\]

For this scalene triangle, the map from coefficient pairs \((f,g)\) to
center positions \(G+fK+gHK\) is invertible. We may therefore express a
supporting affine functional in coefficient coordinates.

The normal

\[
n=(4/3,-68/9)
\]

satisfies

\[
n\cdot(f,g)\le8
\]

for the **entire** constant-coefficient region, touching Arc I at
\(t=2/3\), namely \((f,g)=(12/19,-18/19)\).

The earlier exact B46 witness certificate also proves this functional is
strictly less than 8 on all 44 rational B46 generators and on the rigorous
enclosures of the two power centers. The new separation verifier replays
these comparisons, including the old complete-domain proof.

For the simple shape-dependent map, its effective coefficient pair on this
triangle is

\[
(f(q),g(q))=
\left(\frac{3517327}{5343610},-\frac{4112527}{4274888}\right).
\]

Its support exceeds the old hull's support by

\[
\boxed{n\cdot(f(q),g(q))-8=
\frac{7032799}{48092490}>0.}
\]

Thus this is a **proved strict enlargement**, not an interpretation of a
plot. For the certified near-boundary radial map, the exact excess is larger:

\[
\frac{257706726356511791}{480924900000000000}
\approx0.5358564848>0.
\]

These numbers are values of the specified affine support functional, not
Euclidean distances. The simple and near-boundary center positions are
approximately \((-3.449647,3.647519)\) and
\((-3.545069,3.593731)\), respectively.

Notice what this means: a valid shape-dependent map can have effective
coefficients outside the admissible **constant** region. The extra derivative
terms change the attractivity test. Requiring pointwise membership in the
constant region would unnecessarily exclude this new result.

## 5. A rigorously localized new radial boundary center

For the simple map \(Z\), define

\[
Z_\lambda=G+\lambda(Z-G),\qquad
\lambda_* = \sup\{\lambda\ge0:Z_\lambda\text{ is globally attractive}\}.
\]

The scaled Jacobian is
\(M_\lambda=I+\lambda(M_Z-I)\). Its feasible nonnegative parameter set
is a closed interval, since it is an intersection of closed convex PSD
conditions. It contains 0 and is bounded above by the counterexample below.
Therefore \(\lambda_*\) itself is feasible and defines an attractive,
radially sharp map. This does not imply exposure on the full maximal Heart.

### Lower bound: global exact proof

At

\[
\lambda_-=\frac{10478284289}{10000000000}=1.0478284289,
\]

the coefficient vector is

\[
\left(\frac{10478284289}{25000000000},
\frac{31434852867}{25000000000},
-\frac{31434852867}{20000000000},
\frac{10478284289}{4000000000}\right).
\]

The exact certificate proves
\(\operatorname{Sym}D_iZ_{\lambda_-}\succeq I/(3\cdot10^{13})\)
for all triangles. This is a globally certified approximation just inside
the new radial boundary, not an unverified endpoint from numerical optimization.

### Upper bound: exact negative witness

At \(\lambda_+=1.0478284290\), take the exact normalized shape

\[
z=\frac{15342128}{100000000},\qquad
h=\frac{85548502}{100000000},\qquad
V=\frac{2-3z}{4},\quad v=Vh.
\]

The rational determinant of \(M_{\lambda_+}(z,v)\) is strictly negative;
its decimal value is approximately \(-3.7391044060\times10^{-11}\).
The exact rational value is stored in the certificate and independently
recomputed. Also \(a>0\).

In the moving-radius frame, the exact displacement

\[
u=(-\sqrt{v(V-v)}\,b,\ a)
\]

has response
\(u^T\operatorname{Sym}(D_1Z_{\lambda_+})u=a\det M/3<0\).
This is an explicit analytic non-attractivity witness.

After a similarity and reflection, the same triangle can be written

\[
A=(-1,0),\quad B=(1,0),\quad
C=\left(\frac32\sqrt{\frac{z(1-h)}V},
         \frac32\sqrt{\frac{zh}V}\right)
\approx(0.359995717640003,0.875885033836283).
\]

Moving \(C\) in direction
\(\theta\approx0.755026684127232\) radians has a negative response.
Use the exact shape and displacement formulas for verification; the rounded
coordinates and angle are explanatory values.

Both \(z\) and \(h\) lie strictly inside their allowed intervals. The
triangle is scalene. This confirms that the new obstruction is not confined
to the collinear or isosceles boundary shapes used in the constant-family proof.

Combining both sides gives

\[
1.0478284289\le\lambda_*<1.0478284290.
\]

The exact algebraic equation for \(\lambda_*\), and a full characterization
of all boundary rays in the four-parameter family, remain open in this work.

## 6. Numerical audit and how to interpret it

All four explicitly certified maps were compared with
\(\operatorname{conv}(\mathrm{B46},G,\Omega(P))\) on the archived shapes.

| Map | Detected further enlargements |
|---|---:|
| Simple map | 344 |
| Auxiliary map 2 | 259 |
| Auxiliary map 3 | 233 |
| Certified near-boundary radial map | 474 |
| Union of all four detection sets | 474 |

There were 6,193 input configurations, of which 6,125 had usable
full-dimensional B46 hulls. The other 68 were skipped. The threshold was
\(10^{-8}\) in normalized barycentric \((w_B,w_C)\) support coordinates.

The audit chooses a finite set of directions using a polygonal rendering of
the old hull, then computes the **true continuous-arc support** in each
direction. Thus it never substitutes an undersampled polygon's support for
the old hull's support. Nevertheless, a finite direction set can miss tiny
improvements: the counts are numerical detections, not an exhaustive theorem.
No archived B46 status is newly certified by this numerical audit.

At the exact witness triangle, numerical area calculations give

\[
\text{old area}\approx18.9778042370,\qquad
\text{new area}\approx19.0961816753,
\]

an increase of approximately **0.6238% beyond B46 plus the complete constant
family**. These areas are numerical, using sampled curves; changing 2,001
to 4,001 samples per arc changes the old area by about \(2.1\times10^{-9}\).
The strict separation in Section 4 does not depend on these sampled areas.

The simple map need not be an additional base point once the certified radial
map is included: it is a convex combination of that map and the centroid.
The auxiliary maps have no additional detections in this particular audit,
but global redundancy of those maps has **not** been proved.

## 7. Reproduction and software

Exact verification requires Python and SymPy only, with assertions enabled:

```text
python verify_shape_dependent.py
python verify_shape_enlargement.py
```

The first independently verifies the full derivative, all four global PSD
certificates, and the two-sided radial bracket. The second proves strict
enlargement using the prior exact constant-domain and B46 witness results.
The prior certificate provenance is preserved in the included reference archive.

Generation and numerical routines additionally use NumPy/SciPy:

```text
python derive_shape_dependent.py
python search_shape_dependent.py
python certify_shape_dependent.py
python test_shape_dependent.py
python audit_shape_dependent.py
```

The numerical regression checks direct Cartesian finite differences against
the symbolic response matrices on 30 random configurations, and checks
permutation and similarity equivariance. Maximum finite-difference discrepancy
was about \(1.22\times10^{-10}\). These tests supplement, not replace,
the exact proof.

`shape_dependent_centers.py` exposes the numerical center and weights.
`ShapeDependentCenters.wl` provides exact Mathematica definitions with no
optimization calls. It passed exact rational-weight, invariant, symmetry,
and equilateral checks in the connected Wolfram 15.0 kernel. A separate
command-line WolframScript startup failed before evaluating the test; it
was not used as proof evidence. The connected-kernel result is preserved.

`plot_shape_dependent.py` creates light-theme figures. The bundle contains
a file manifest, earlier reference archive, and an isolated extracted-copy
replay record. No website, explorer, paper or previous bundle was overwritten.

## 8. Recommended continuation

1. Retain the explicit simple formula for exposition and the certified radial
   lower endpoint for an improved inner-hull generator.
2. Search additional independent rays of the four-parameter family. The present
   search is deliberately bounded and is not a full optimization of that family.
3. For promising rays, use the same lower-certificate/upper-counterexample
   construction to bracket the boundary; do not infer it from grids alone.
4. Study the coupled scalene equations for a zero determinant and stationary
   response. The interior obstruction found here shows why a proof based only
   on isosceles and collinear test triangles would be incomplete.
5. Only then expand to coefficients involving \(e_3\) or higher powers of
   \(q\), retaining all coefficient-derivative terms.

The conceptual conclusion is affirmative: **shape dependence yields a
genuine, rigorously certified enlargement**, not just a reparameterization
of the previously solved constant-coefficient region.
