# Six nonredundant shape-dependent attractive centers

## Research continuation, 17 October 2026

### Results at a glance

The four-parameter family produces **six further certified attractive maps**.
For each, we have both:

1. an exact global attractivity certificate and a rigorous radial boundary
   bracket of width \(3\times10^{-8}\);
2. an exact triangle witness showing that the map cannot be removed from the
   enlarged comparison family, even when all five other new maps are retained.

The comparison family contains B46, the *entire* attractive constant-coefficient
family, and all four shape-dependent maps from the previous investigation.
This is therefore a further enlargement, not simply rediscovery of the previous
shape-dependent center.

Only three simple witness triangles are needed: sides \((6,5,3)\), \((9,8,7)\),
and \((9,6,5)\). Numerical inner-hull area gains on these triangles are
approximately 6.671%, 15.373%, and 5.471%, respectively.

**Scope:** the six maps are indispensable within this specified comparison
family. This does not prove that any is exposed on the unrestricted maximal
Heart, that all old generators remain necessary, or that a globally minimal
base has been found. The exact supremal radial endpoints are bracketed; the
evaluators use the certified lower endpoints, not rounded guesses at them.

## 1. Definitions and the six explicit rays

Let \(G\) be the centroid, \(X_6\) the symmedian point, and define

\[
K=X_6-G,\qquad S=\sum_i(p_i-G)(p_i-G)^T,
\qquad H=\frac{2S}{\operatorname{tr}S}-I.
\]

With opposite-side squared proportions \(s_i=a_i^2/(a^2+b^2+c^2)\), put

\[
q=\frac{3\sum_i s_i^2-1}{2}
=1-3(s_1s_2+s_2s_3+s_3s_1),\qquad 0\le q\le\frac14.
\]

For a rational seed \(c=(f_0,f_1,g_0,g_1)\), the associated ray is

\[
Z_{c,\lambda}=G+\lambda\bigl[(f_0+f_1q)K+(g_0+g_1q)HK\bigr].
\]

Denote the greatest nonnegative attractive parameter by \(\lambda_c^*\).
The proved bounds are \(L_c\le\lambda_c^*<U_c\):

| Label | Seed \((f_0,f_1,g_0,g_1)\) | \(L_c\) | \(U_c\) |
|---|---|---:|---:|
| R1 | \((-3/4,49/20,29/20,-53/20)\) | 0.99895956 | 0.99895959 |
| R2 | \((3/4,23/10,-1,6/5)\) | 0.98667546 | 0.98667549 |
| R3 | \((3/4,-21/4,3/4,-27/20)\) | 0.98083518 | 0.98083521 |
| R4 | \((-19/20,6/5,3/4,-33/20)\) | 1.00950335 | 1.00950338 |
| R5 | \((9/20,6/5,-8/5,13/5)\) | 0.97654994 | 0.97654997 |
| R6 | \((3/4,-17/4,-9/5,41/5)\) | 0.97871127 | 0.97871130 |

All decimals in this table specify exact terminating rationals. In the rest
of this report, **Rj means the globally certified map at its lower endpoint**.
The six rays are distinct and geometrically nonredundant; they are not claimed
to be six linearly independent vectors in a four-dimensional parameter space.

For example,

\[
R_1=G+\frac{99895956}{10^8}
\left[\left(-\frac34+\frac{49}{20}q\right)K+
\left(\frac{29}{20}-\frac{53}{20}q\right)HK\right].
\]

The normalized barycentric weights, with effective coefficients
\(f=\lambda(f_0+f_1q)\), \(g=\lambda(g_0+g_1q)\), are

\[
w_i=\frac13+(f+4g)(s_i-\tfrac13)
-6g\left(s_i^2-\tfrac13\sum_j s_j^2\right).
\]

They are analytic away from total collapse, normalized, homogeneous of degree
zero, and permutation-equivariant, including at equilateral and collinear
noncollapsed configurations.

## 2. How the candidates were found

The earlier bounded search had saved 168 support optimizations. We ranked
those candidates against the already enlarged hull, rounded twelve distinct
coefficient directions to simple rationals with denominator at most 20, and
examined their radial thresholds. A greedy support comparison selected six.

The numerical scalar searches included the full two-dimensional shape square
and all its edges; all were bounded and single-process. This stage took about
ten seconds. It was only discovery: a numerical minimum was never accepted
as proof of global attractivity.

The final proof step no longer depends on the reliability of those searches.
Any missed negative region below a proposed lower endpoint would cause the
global polynomial certificate to fail.

## 3. Global attractivity proof

The full derivative includes the indispensable coefficient-gradient terms:

\[
D_iZ=\tfrac13I+fD_iK+gD_i(HK)
+K(\nabla_i f)^T+HK(\nabla_i g)^T.
\]

The new verifier reconstructs this matrix from the independent product-rule
derivation in the preceding report. It does not use the numerical optimizer
or assume that saved matrix signs are correct.

Normalize \(G=0\), \(\sum_i|p_i|^2=1\), and use

\[
p_1=(r,0),\quad p_2=(-r/2+X,Y),\quad p_3=(-r/2-X,-Y),
\]
\[
z=r^2,\quad V=(2-3z)/4=X^2+Y^2,\quad v=Y^2.
\]

Then \(q=1/4-3zv\), and the scaled symmetric response has the form

\[
M=3\operatorname{Sym}D_1Z=
\begin{pmatrix}a&XYb\\XYb&c\end{pmatrix}.
\]

For each lower-endpoint map we prove, with \(\delta=10^{-10}\),

\[
a-\delta>0,\qquad
(a-\delta)(c-\delta)-v(V-v)b^2\ge0.
\]

Under \(z=2Z/3\), \(v=(1-Z)H/2\), the domain becomes the unit square.
Exact rational tensor-product Bernstein coefficients on a finite subdivision
certify the inequalities everywhere. The replay reconstructs the polynomial
on each box, checks its coefficients, and verifies the full cover.

| Map | Diagonal boxes | Determinant boxes |
|---|---:|---:|
| R1 | 31 | 33 |
| R2 | 10 | 35 |
| R3 | 26 | 28 |
| R4 | 12 | 32 |
| R5 | 12 | 32 |
| R6 | 26 | 29 |

Consequently, for all six maps,

\[
\boxed{\operatorname{Sym}D_iR_j\succeq \frac{1}{3\cdot10^{10}}I.}
\]

Symmetry and similarity equivariance transfer the vertex-1 proof to every
vertex. Coordinate-frame boundary cases follow by continuity. Integration
along a one-vertex straight motion proves finite-displacement attractivity.
The displayed margin is conservative, not the actual minimum response.

## 4. Upper endpoints and radial sharpness

For each upper endpoint, the certificate provides rational \(z,h\), where
\(v=Vh\), at which a diagonal entry or the determinant is exactly negative.
All upper witnesses use nondegenerate triangles. R2 and R5 use
\(h=10^{-12}\), so their witnesses are nearly collinear but not collinear.
The other four upper witnesses are isosceles.

For explanatory coordinates, transform to \(A=(-1,0),B=(1,0)\) and

\[
C=\left(\frac32\sqrt{z(1-h)/V},\frac32\sqrt{zh/V}\right).
\]

| Map | Approximate upper-counterexample apex \(C\) |
|---|---|
| R1 | \((0,0.31378305598)\) |
| R2 | \((2.89652041428,2.89652041428\times10^{-6})\) |
| R3 | \((0,2.18329488540)\) |
| R4 | \((0,1.39581187913)\) |
| R5 | \((2.11551644654,2.11551644654\times10^{-6})\) |
| R6 | \((0,1.45088063320)\) |

Use the exact rational witness parameters in the certificates for verification,
not these rounded coordinates. If a diagonal is negative, its coordinate
direction is a violating displacement. If \(a>0\) and the determinant is
negative, \((-XYb,a)\) has quadratic response \(a\det(M)/3<0\).

The feasible nonnegative radial parameter set is an intersection of closed
convex PSD conditions, hence a closed interval containing zero. The negative
upper witness bounds it. Its supremum is therefore attained, and each bracket
contains a genuine radially sharp attractive map. This is a statement about
maps and their radial scaling, not unrestricted Heart exposure.

## 5. Exact nonredundancy against all competing maps

Let \(C_{\mathrm{old}}(P)\) be the convex hull of B46, the complete
constant-coefficient family, and the four previously certified shape-dependent
maps. For each \(j\), we construct a triangle and a rational linear functional
\(\ell=n_Bw_B+n_Cw_C\) such that

\[
\ell(R_j(P))>
\sup\ell\left(\operatorname{conv}
\bigl(C_{\mathrm{old}}(P),\{R_k(P):k\ne j\}\bigr)\right).
\]

| Map | Triangle sides | Certified positive support gap, rounded |
|---|---|---:|
| R1 | \((6,5,3)\) | 0.0345954424 |
| R2 | \((6,5,3)\) | 0.0059071845 |
| R3 | \((9,8,7)\) | 0.0112331974 |
| R4 | \((9,6,5)\) | 0.0059188529 |
| R5 | \((6,5,3)\) | 0.0005841610 |
| R6 | \((9,8,7)\) | 0.0073805785 |

The exact rational normals, bounds and gaps are stored in
`INDEPENDENT_RAYS_SEPARATIONS.json`. These are support-functional values,
not Euclidean distances. Their proof has three parts:

### 5.1 Rational generators

The 44 rational B46 maps are evaluated exactly from the archived polynomial
models. All old and new shape-dependent maps use the exact barycentric formula.
The source-model hash and the full selected polynomial models are included.
The replay verifies all 44 evaluations and every competing new map.

### 5.2 The entire constant family, not a sampled arc

Necessary conditions for an attractive constant pair \((f,g)\) include

\[
1+3(f+g)\ge0,\quad 1-\tfrac32(f+g)\ge0,
\]
\[
c_0(z)=1+(1-3z)f+(-18z^2+12z-1)g\ge0,
\]
\[
a_1(z)=1+(9z^2-9z+1)f+(54z^3-63z^2+18z-1)g\ge0,
\quad 0\le z\le2/3.
\]

Their identities are independently checked against the full response matrix.
At selected rational values of \(z\), these give rational half-planes
\(A_r\cdot(f,g)\le b_r\). Each support certificate contains two such
inequalities and nonnegative rational multipliers satisfying

\[
n_{fg}=\mu_1A_1+\mu_2A_2,\quad \mu_1,\mu_2\ge0.
\]

Thus \(n_{fg}\cdot(f,g)\le\mu_1b_1+\mu_2b_2\) for the **entire**
constant family. This dual bound may slightly overestimate its exact support,
which is harmless because the new center still exceeds it strictly. No
sampling of the constant-family arcs enters these separation proofs.

### 5.3 The two power centers

Approximate minimizer coordinates are only starting data. A fresh interval
calculation bounds their gradient residuals. For
\(F_p(x)=\sum_i|x-p_i|^p/p\), suitable strong-convexity lower bounds are

\[
\mu_-=3(p-1)D^{p-2}\quad(1<p<2,\ x\text{ in the triangle}),
\qquad
\mu_+=(D/2)^{p-2}\quad(p>2),
\]

where \(D\) is the diameter. For the first bound, every vertex distance is
at most \(D\); for the second, at least one distance is at least \(D/2\).
The two power minimizers use \(p=4\pm2\sqrt2\).

The candidate points are checked to be inside the triangle. Since the true
minimizer is also there, the error is at most \(\|\nabla F_p\|/\mu\).
Multiplying by the Cartesian functional's norm bounds the support error.
All resulting error radii are less than \(10^{-55}\); interval endpoints
are retained as exact binary rationals. The verifier recomputes these bounds
rather than trusting numerical solver success.

Together these three steps prove that **none of R1,...,R6 can be discarded**
while keeping the other members of the stated family.

The replay additionally checks the whole narrow radial brackets. Every
functional is affine in the radial parameter, so its minimum or maximum on
\([L_c,U_c]\) is attained at an endpoint. Replacing the target value by its
interval minimum and every competing new map by its interval maximum still
leaves a strictly positive exact gap in all six cases. Thus the same
nonredundancy statement holds for the **true radial boundary maps**, not only
the displayed lower-endpoint approximations. The robust gaps are recorded
in `INDEPENDENT_RAYS_SEPARATION_REPLAY.json`.

## 6. Numerical size and coverage

The archived audit contained 6,193 configurations; 6,125 had usable
full-dimensional hulls and 68 were skipped. The new audit uses the true
continuous constant-family support in every tested direction. It found:

| Map | Enlargements beyond the previous hull | Leave-one-out detections after adding all six |
|---|---:|---:|
| R1 | 290 | 290 |
| R2 | 300 | 300 |
| R3 | 88 | 82 |
| R4 | 116 | 108 |
| R5 | 760 | 730 |
| R6 | 32 | 32 |

The union is **763 detected improvements** beyond the previous hull. These
are finite-direction numerical detections at a \(10^{-8}\) barycentric
support tolerance, not an exhaustive theorem over triangle space. The exact
nonredundancy claims in Section 5 do not rely on these counts.

| Sides | Previous inner-hull area | Enlarged area | Relative increase |
|---|---:|---:|---:|
| \((6,5,3)\) | 0.8290515547 | 0.8843573202 | 6.67097% |
| \((9,8,7)\) | 0.3217184553 | 0.3711777455 | 15.37347% |
| \((9,6,5)\) | 0.9912947423 | 1.0455265966 | 5.47081% |

Areas are numerical, not exact certificates. Increasing arc samples from
1,001 to 2,001 changes the middle example's previous area by about
\(10^{-9}\), and the other two agree to displayed precision. Percentages
refer to the **previous inner hull's area**, not the whole triangle's area.
The comparison figure uses equal Cartesian scales within each panel.

## 7. A failed shortcut toward a continuous boundary family

R2 and R5 are numerically limited by collinear configurations. This suggests
interpolating their seeds \(c(t)=(1-t)c_{R2}+tc_{R5}\) and applying the
collinear critical scaling

\[
\lambda_{\mathrm{flat}}(t)=
\frac{640(5t+14)}{1329t^2+2042t+9081},\qquad 0\le t\le1.
\]

**This proposed bridge is false.** At \(t=1/2\), the nondegenerate
isosceles shape \(z=9/40\), \(h=1\), \(v=53/160\) has

\[
\boxed{M_{11}=-\frac{58932991}{2086850000}<0.}
\]

The independent verifier checks this identity exactly. In canonical
coordinates its apex is \(C=(0,\sqrt{81/53})\), and vertical motion of
that apex gives negative response. The seed interpolation is not itself the
problem: convex combinations of the **certified maps** remain attractive.
The failure comes from rescaling those interpolated seeds using only the
collinear obstruction; another shape becomes limiting first.

This counterexample is useful guidance for a continuous new arc. Any boundary
continuation must track switching between collinear, isosceles, and scalene
active constraints. The previous shape-dependent ray already supplied a
scalene obstruction, so no one class of test triangles is sufficient.

## 8. Files, replay, and recommended continuation

Exact proof replay (Python, SymPy, mpmath; do not use `python -O`):

```text
python verify_independent_rays.py
python verify_ray_separations.py
```

The first rederives all six response matrices, verifies every lower cover and
upper witness, and disproves the naive bridge. The second verifies all exact
leave-one-out separations, including fresh interval power-center bounds.

Optional numerical reproduction (also NumPy, SciPy):

```text
python search_independent_rays.py
python certify_independent_rays.py
python test_independent_rays.py
python audit_independent_rays.py
python certify_ray_separations.py
python plot_independent_rays.py
```

The last plot needs Matplotlib. `certify_ray_separations.py` needs the included
archived B46 models/reference as well as the audit data. No command launches
extra workers. Numerical derivative regression passed 48 cases with maximum
matrix discrepancy about \(2.75\times10^{-10}\).

`independent_ray_centers.py` evaluates the six maps directly. For Mathematica:

```wl
Get[".../IndependentRays.wl"];
ACIndependentCenters[{{0, 0}, {3, 0}, {-1/3, 4 Sqrt[14]/3}}]
```

`ACIndependentCoefficients` contains the exact rational lower-endpoint
coefficients. Exact coefficient agreement, normalization, all permutations,
and equilateral behavior passed in the connected Wolfram 15.0 kernel.

Recommended next steps:

1. Keep all six certified lower maps for the expanded inner approximation;
   they each have an exact necessity witness within the current comparison.
2. Continue boundary rays between them with full shape-space minimization,
   recording active-shape transitions; use the failed bridge as a regression test.
3. Seek an exact parameter-uniform certificate on intervals where the active
   shape varies smoothly. This is the promising route to a genuinely new
   continuous shape-dependent boundary family.
4. Re-audit redundancy of the older generators against the enlarged family.
   None of the present results determines which old B46 maps can now be removed.
5. Do not label the result a minimal base or the maximal Heart. No higher-degree
   shape invariants have yet been investigated here.

The bundle preserves the earlier proof handoff as a reference. All new work
is local; papers, explorer, website, repository publication, and earlier
archives remain unchanged.
