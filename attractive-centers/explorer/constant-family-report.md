# The complete constant-coefficient symmedian–Steiner family

## Exact theorem, independent replay, and B46 comparison — 16 October 2026

### Executive result

The constant-coefficient family

\[
Z_{f,g}=G+fK+gHK,\qquad K=X_6-G,
\quad H=2S/L-I,\quad S=\sum_{i=1}^3(p_i-G)(p_i-G)^T,
\quad L=\operatorname{tr}S
\]

has now been completely classified. Its globally attractive coefficient
region is a compact convex set bounded by **three line segments and two
explicit curved arcs**. The two arcs meet at a corner, not tangentially.

Both directions of the theorem have been proved: every point of the proposed
region gives an attractive map, and every coefficient pair outside it fails
attractivity. The latter direction uses a complete covering of support-normal
directions; convexity alone would not prove it.

This establishes an infinite collection of explicitly parameterized,
globally attractive, radially sharp triangle-center maps. It does **not**
identify their image with the maximal Heart of a triangle.

The external reaction's numerical counts were independently reproduced:
Arc II improves the former B46-plus-Arc-I hull on 55 archived triangles;
the upper corner improves it on 251 others. The sets are disjoint. The
full family improves B46 on 1,035 of 6,125 usable archived shapes.

## 1. Definitions and exact boundary

Let \(\Omega\) consist of the real constant pairs \((f,g)\) for which
\(Z_{f,g}\) is attractive on every nondegenerate planar triangle. These maps
are analytic rational functions on all configurations except total collapse;
thus collinear and coincident configurations may also be used as limits.

The symmedian point has normalized barycentric weights
\(s_i=a_i^2/(a^2+b^2+c^2)\). The map above has weights

\[
w_i=\frac13+(f+4g)(s_i-\tfrac13)
       -6g\left(s_i^2-\frac13\sum_j s_j^2\right).
\]

This ensures permutation symmetry, similarity equivariance, and normalization.
There are no choices of oriented eigenvectors and no singularity at an
equilateral triangle.

Define the following coefficient points and curves:

\[
T=(-1/6,5/6),\qquad L_0=(-2/3,1/3),
\]

\[
I(t)=\left(\frac{8t}{t^2+8},-\frac8{t^2+8}\right),
\qquad t_-=4\sqrt{10}-12\le t\le t_+,
\]

where \(t_+\) is the unique root in \((1.040,1.041)\) of

\[
8t^5-101t^4+272t^3+440t^2-2432t+1856=0.
\]

The second arc is

\[
II(r)=\left(\frac{-2(9r^2-7r+1)}{D(r)},
                  \frac{2r-1}{D(r)}\right),
\quad D(r)=54r^4-108r^3+63r^2-12r+1,
\quad \alpha\le r\le\beta,
\]

where \(\alpha\) is the unique root in \((.27,.28)\) of

\[
Q(r)=216r^5-459r^4+342r^3-99r^2+6r+1=0,
\]

and

\[
\beta=\frac12-\frac{\sqrt{2\sqrt3-3}}6.
\]

Numerically,

\[
t_-=.6491106406735173\ldots,\quad
t_+=1.0401579232212706\ldots,
\quad\alpha=.2716860506209480\ldots,
\quad\beta=.3864583268944645\ldots.
\]

**Theorem.**

\[
\boxed{\Omega=\operatorname{conv}\bigl(\{T,L_0\}
        \cup I([t_-,t_+])\cup II([\alpha,\beta])\bigr).}
\]

In counterclockwise order its boundary is

1. the segment from \(T\) to \(L_0\), on \(g-f=1\);
2. the segment from \(L_0\) to \(I(t_-)\), on \(f+g=-1/3\);
3. Arc I from \(I(t_-)\) to \(I(t_+)\);
4. Arc II from \(II(\alpha)=I(t_+)\) to \(II(\beta)\);
5. the segment back to \(T\), on \(f+g=2/3\).

A particularly simple Arc II map is

\[
\boxed{II(1/3)=(1,-1/2),\qquad Z=G+K-\tfrac12HK.}
\]

Its weights are \(w_i=2/3-s_i+3s_i^2-\sum_j s_j^2\).

### Algebraic equations

Arc I lies on \(f^2+8g^2+8g=0\). Arc II lies on

\[
\begin{aligned}
\mathcal C(f,g)={}&5f^4+34f^3g-4f^3-15f^2g^2-24f^2g\\
 &+16fg^3+168fg^2+68g^4+76g^3-108g^2=0.
\end{aligned}
\]

Thus the boundary satisfies

\[
(f+g-2/3)(g-f-1)(f+g+1/3)
(f^2+8g^2+8g)\mathcal C(f,g)=0.
\]

**The parameter intervals and segment endpoints are essential:** this
polynomial's full zero set contains many branches that are not the boundary.

## 2. Why a vertex Jacobian proves attractivity

For a continuously differentiable center map, moving vertex \(p_i\) by a
vector \(u\) has first-order scalar response
\(u^TD_iZ\,u=u^T\operatorname{Sym}(D_iZ)u\). Hence infinitesimal
attractivity is equivalent to

\[
\operatorname{Sym}(D_iZ)\succeq0.
\]

When this holds throughout the path, integration proves the finite-displacement
inequality. Our rational maps extend to degenerate configurations, so the
limiting shapes used below do not create an extension assumption.

By permutation and similarity equivariance we may test vertex 1 after setting
\(G=0,L=1\), and choosing the radius to vertex 1 as the first coordinate axis:

\[
r_1=(\sqrt z,0),\quad r_2=(-\sqrt z/2+X,Y),
\quad r_3=(-\sqrt z/2-X,-Y).
\]

Then \(0\le z\le2/3\), \(V=(2-3z)/4=X^2+Y^2\),
\(v=Y^2\in[0,V]\), and \(h=v/V\in[0,1]\) when \(V>0\).
The case \(V=0\), and the frame at \(r_1=0\), follow by continuity.

For \(M=3\operatorname{Sym}(D_1Z)\), its diagonal entries interpolate
linearly between

\[
\begin{aligned}
a_0&=1+3(f+g)(1-6z+6z^2),\\
c_0&=1+(1-3z)f-(1-12z+18z^2)g,\\
a_1&=1+(1-9z+9z^2)f-(1-18z+63z^2-54z^3)g,\\
c_1&=1+3(1-2z)f+3(1-4z+3z^2)g.
\end{aligned}
\]

The off-diagonal entry is \(XYb\), where

\[
b=(4-6z)f+(8-48z+72z^2)g.
\]

Writing \(W=a_0c_1+a_1c_0-V^2b^2\) gives

\[
\det M=(1-h)^2a_0c_0+h^2a_1c_1+h(1-h)W.
\]

Consequently nonnegativity of the four endpoint diagonal entries and of
\(W\) suffices for the whole matrix to be PSD. This is a sufficient
certificate method, not an assertion that \(W\ge0\) is necessary in general.

## 3. Sufficiency: every proposed generator is attractive

### 3.1 Arc I — the earlier theorem, replayed

On multiplying the matrix by \(t^2+8\), its collinear transverse entry is
\((12z-t-4)^2\). The lower endpoint is selected by
\(t^2+24t-16\ge0\). The upper endpoint is selected by a double root of
the isosceles entry \(a_1\).

The included `verify_extended_arc.py` reconstructs the Cartesian Jacobian,
checks the algebraic endpoint factorization and replays all seven exact
rational Bernstein boxes. `MAXIMAL_ARC_AND_HULL_REPORT.md` contains the
earlier derivation. This step is executed again by the complete-domain verifier.

### 3.2 Arc II — new global certificate

Put \(F=-2(9r^2-7r+1)\), \(J=2r-1\), so \((f,g)=(F/D,J/D)\).
Tildes below mean multiplication by \(D\), or by \(D^2\) for \(W\).
On \(r\in[.27,.39]\), \(D>0\) and \(F+J>0\).

The key factorization is

\[
\widetilde a_1(z;r)=9(z-r)^2
 [5-12r+6r^2-6(1-2r)z].
\]

The bracket decreases with \(z\), and at \(z=2/3\) is
\(1/3+6(r-1/3)^2>0\). Thus \(a_1\ge0\) globally.

Also

\[
\widetilde a_0(z;r)=\widetilde a_0(1/2;r)
                       +18(F+J)(z-1/2)^2,
\]

\[
2\widetilde a_0(1/2;r)
 =108(r-1/2)^4+18(r-1/2)^2-1/4.
\]

The last expression decreases for \(r<1/2\) and vanishes at \(\beta\).
It is therefore nonnegative on \([\alpha,\beta]\).

For \(c_0\), complete the square:

\[
\widetilde c_0(z;r)
 =-18J\left(z-\left(\frac13-\frac F{12J}\right)\right)^2
      +\frac{Q(r)}{2J}.
\]

Here \(J<0\). Exact root counting shows that \(Q\) has only one root
in \([.27,.39]\), namely \(\alpha\), and is negative after that root.
Hence both terms are nonnegative on the required parameter interval.

The remaining inequalities are certified on the slightly larger rational
rectangle \(z\in[0,2/3]\), \(r\in[27/100,39/100]\):

| Polynomial | Exact Bernstein leaves | Smallest leaf coefficient |
|---|---:|---:|
| \(D\) | 1 | \(25695707/50000000\) |
| \(\widetilde c_1\) | 1 | \(12145307/50000000\) |
| \(\widetilde W\) | 6 | \(11093331728119/7500000000000000\) |

Every entry is positive. Together with the analytic factorizations this
proves PSD at every triangle, for every parameter on Arc II.

### 3.3 The two corners

At \(T=(-1/6,5/6)\),

\[
(a_0,c_0,a_1,c_1)=\left(3(2z-1)^2,
\tfrac32z(7-10z),\tfrac32z(30z^2-36z+11),
\tfrac32(5z^2-6z+2)\right).
\]

The quadratic factors in the last two entries have respective positive
minimum bounds \(1/5\). The certificate proves \(W/z>0\) in three
Bernstein leaves, with smallest coefficient \(51/320\).

At \(L_0=(-2/3,1/3)\),

\[
(a_0,c_0,a_1,c_1)=
(6z(1-z),6z(1-z),3z(6z^2-9z+4),3z^2).
\]

The quadratic \(6z^2-9z+4=6(z-3/4)^2+5/8\) is positive;
\(W/z^2>0\) has a one-leaf certificate with smallest coefficient 8.
The cases \(z=0\) are included by the factorizations, without division there.

Finally, Jacobians depend affinely on \((f,g)\), and the PSD cone is convex.
All convex combinations of these certified generators are attractive.
This proves the proposed convex hull is **contained in** \(\Omega\).

## 4. Necessity: the missing reverse-inclusion proof

Every attractive coefficient pair must satisfy the following necessary
inequalities, extracted just from diagonal Jacobian entries:

\[
f+g\le2/3,\qquad g-f\le1,\qquad f+g\ge-1/3;
\]

\[
n_I(t)\cdot(f,g)\le8,\qquad n_I(t)=(2t,t^2-8),
\quad t\in[t_-,t_+];
\]

\[
n_{II}(r)\cdot(f,g)\le1,
\quad n_{II}(r)=(-A(r),B(r)),
\quad r\in[\alpha,\beta],
\]

where \(A(r)=1-9r+9r^2\),
\(B(r)=1-18r+63r^2-54r^3\).

Their origins are, respectively,
\(a_0(1/2)\), \(c_0(0)\), \(a_0(0)\),
\(8c_0((t+4)/12)\), and \(a_1(r)\).
These are legitimate necessary conditions even if only nondegenerate
triangles are initially admitted: a negative value at a degenerate limit
persists at sufficiently close nondegenerate triangles.

Let \(K_0\) denote the already certified convex hull. Each of these
necessary supports touches \(K_0\):

- the three fixed normals are \(U=(1,1)\), \(D_0=(-1,1)\),
  \(L=(-1,-1)\), with bounds \(2/3,1,1/3\);
- \(n_I(t)\) touches \(I(t)\);
- \(n_{II}(r)\) touches \(II(r)\).

The identities linking the endpoints are exact. In particular, if
\(T(r)=2(9r^2-7r+1)/(2r-1)\), reduction modulo \(Q(r)\) proves
\(II(\alpha)=I(T(\alpha))\) and that \(T(\alpha)\) solves the
quintic defining \(t_+\). An exact rational enclosure proves
\(1.040<T(\alpha)<1.041\); hence \(T(\alpha)=t_+\).

The normal directions run counterclockwise in the order

\[
U,\ D_0,\ L,\ n_I(t_-),\ n_I(t_+),\
n_{II}(\alpha),\ n_{II}(\beta),\ U.
\]

The two continuous sweeps turn strictly counterclockwise, because

\[
\det(n_I,n_I')=2t^2+16>0,
\qquad \det(n_{II},n_{II}')=9D(r)>0.
\]

The verifier checks all quadrant information and all gaps by exact rational
sign bounds: Arc I's normals lie in quadrant IV; Arc II's normals remain in
the right half-plane, beginning in quadrant IV and ending in quadrant I below
\(U\). Every successive missing angular gap is strictly less than \(\pi\).

Crucially, **the two normals bordering each missing gap share a contact point**:

| Gap | Shared contact |
|---|---|
| \(U\) to \(D_0\) | \(T\) |
| \(D_0\) to \(L\) | \(L_0\) |
| \(L\) to \(n_I(t_-)\) | \(I(t_-)\) |
| \(n_I(t_+)\) to \(n_{II}(\alpha)\) | the arc join |
| \(n_{II}(\beta)\) to \(U\) | \(II(\beta)\) |

Any normal in such a gap is a nonnegative linear combination of its two
bounding normals. Adding the corresponding necessary inequalities gives a
necessary support bound attained at the shared contact point. Thus it is
exactly the support value of \(K_0\).

We now have the correct support bound in **every direction**. The separating
hyperplane theorem therefore gives \(\Omega\subseteq K_0\). Combined
with Section 3 this proves the equality, completing the classification.

The nonzero normal gap at the arc join also proves it is a corner. The
one-sided slopes \(dg/df\) are approximately 0.30070748 and 2.41729044.

### A practical exact characterization without semidefinite optimization

An immediate corollary is that a constant pair is admissible if and only if

\[
-1/3\le f+g\le2/3,\qquad
\min_{0\le z\le2/3}c_0(z;f,g)\ge0,\qquad
\min_{0\le z\le2/3}a_1(z;f,g)\ge0.
\]

Necessity was already shown. Sufficiency follows because these conditions
include every supporting inequality in the reverse-inclusion proof. The
minima require only the interval endpoints, the stationary point of a
quadratic, and the real stationary roots of a cubic. Thus no grid over
triangle space and no nonlinear or semidefinite optimizer is required.
`omega_support.coefficient_membership` evaluates this criterion numerically
and explicitly labels near-zero cases as requiring an exact check.

## 5. Radial sharpness and the full real-parameter ellipse

Every boundary pair \((f,g)\) is radially sharp: replacing it by
\(\lambda(f,g)\) with \(\lambda>1\) violates one of its active
necessary inequalities, whose support bound is positive. Thus every
corresponding map is globally attractive, but
\(G+\lambda(Z-G)\) is not attractive for any \(\lambda>1\).

This is a global statement about maps, not a claim that their value at every
individual triangle lies on the boundary of the unrestricted maximal Heart.

The complete set of attractive real parameters in the old ellipse
\(I(t)\), including its distant branches, is

\[
\boxed{(-\infty,-12-4\sqrt{10}]\ \cup\ [4\sqrt{10}-12,t_+]
                         \ \cup\ [10,\infty).}
\]

Indeed, the two necessary conditions \(a_0(0)\ge0\) and
\(a_0(1/2)\ge0\) become

\[
t^2+24t-16\ge0,\qquad (t-2)(t-10)\ge0.
\]

They leave precisely the two tails and \([t_-,2]\). The earlier exact
Arc I proof excludes \((t_+,2]\).

For \(t\ge10\), the ray from the origin through \(I(t)\) meets
\(f+g=2/3\) at an \(f\)-coordinate
\((2/3)t/(t-1)\in[2/3,20/27]\), which is inside the upper straight
segment. The point \(I(t)\) lies between that segment and the origin,
so it is feasible. The negative tail is similar: its intersection with
\(f+g=-1/3\) has \(f=-t/[3(t-1)]\in[-1/3,0]\), inside the lower
straight segment. The original point again lies between the segment and
the origin. The origin is an interior point, as all the support bounds are
strict there and their normalized bounds have a positive minimum.

The two re-entry endpoints are boundary points, **not strictly interior**.
The remaining finite points on the open tails are interior.

## 6. Numerical comparison with B46

The included audit reads exactly the same archived input arrays as the
earlier audit, verifies their dimensions, records SHA-256 hashes, and runs
in one bounded foreground process. No ETC database or background worker is used.

| Quantity | Count |
|---|---:|
| Archived shapes | 6,193 |
| Usable full-dimensional B46 hulls | 6,125 |
| Skipped lower-dimensional or ill-conditioned hulls | 68 |
| Arc I enlarges B46 | 1,017 |
| Arc II enlarges B46 plus the continuous Arc I | 55 |
| Upper corner enlarges B46 plus the continuous Arc I | 251 |
| Lower corner enlarges that baseline | 0 |
| Overlap of the 55 and 251 sets | 0 |
| Union of further improvements | 306 |
| Full family enlarges B46 | 1,035 |

The last count is only 18 more than 1,017 because 288 of the 306 improvements
occur on triangles where Arc I had already improved B46.

All decisions use a support-gap threshold of \(10^{-8}\), with unit normals
in the \((w_B,w_C)\) barycentric coordinate plane. These gaps are not
physical Euclidean distances in an arbitrarily scaled reference triangle.

Arc I support maxima use a quadratic stationary equation. Arc II support
maxima use the cubic

\[
54u r^3-(63u+9v)r^2+(18u+9v)r-u-v=0,
\]

where \((u,v)=(n\cdot K,n\cdot HK)\). Both endpoints and all real
stationary roots in the allowed interval are tested. No discrete arc
sampling determines these counts.

For the curved baseline, facet directions of the hull of B46 and the Arc I
endpoints suffice after correcting their support values by the continuous
Arc I support. Any new baseline support touching the interior of Arc I has
an Arc I normal; it is already a valid support for all of \(\Omega\), so
the new generators cannot violate it. Facets in the other directions are
unchanged from the endpoint polygon. This explains why the comparison is
with the continuous hull rather than an undersampled approximation.

Largest recorded further gaps:

- Arc II: sides \((93400,88256,72202)\), gap
  \(0.001211582497805952\), at \(r=\beta\).
- Upper corner: sides \((37978,29449,16667)\), gap
  \(0.009719763717707108\).

The audit stores all shape-by-shape gap witnesses and index sets.
It proves neither global redundancy of the lower corner relative to B46
nor global attractiveness of every archived B46 entry anew.

## 7. Relation to the Steiner-axis ansatz and next research

Let \(P-G,Q-G\) be semi-axis vectors of the Steiner inellipse, with
lengths \(a_E,b_E\), and let
\(\rho=(a_E^2-b_E^2)/(a_E^2+b_E^2)\). Write
\(K=k_1(P-G)+k_2(Q-G)\). Then

\[
x=(f+\rho g)k_1,\qquad y=(f-\rho g)k_2.
\]

Thus the exact region obtained here maps linearly to the user's
\((x,y)\)-ansatz for each fixed triangle. When the map is invertible,
substitution of its inverse into Section 1's boundary equations gives the
exact boundary of this **certified subfamily's image**. In singular cases
the image can collapse to a segment or point. It is not the characterization
of all possible shape-dependent \(x,y\).

The logical next expansion is to permit shape-dependent coefficients, for
example

\[
f=f_0+f_1(1-3e_2),\quad g=g_0+g_1(1-3e_2),
\quad e_2=s_1s_2+s_2s_3+s_3s_1.
\]

The correct root-free identities are

\[
s_1=2/3-z,\quad s_2+s_3=1/3+z,
\quad s_2s_3=(1-6z)^2/36+zv,
\]

\[
e_2=1/4+zv,\quad 1-3e_2=(1-12zv)/4=\rho^2/4,
\quad e_3=(2/3-z)[(1-6z)^2/36+zv].
\]

For variable coefficients the Jacobian includes the indispensable terms

\[
K(\nabla_{p_i}f)^T+HK(\nabla_{p_i}g)^T.
\]

Consequently pointwise membership of \((f(P),g(P))\) in \(\Omega\)
does not establish attractivity of a shape-dependent map. Fresh global
certification is necessary. At the equilateral shape the scaled eigenvalues
for constant coefficients are \(1-f,1+f\), so the local condition is
\(|f|\le1\). The line \(f+g=2/3\) instead comes from a collinear shape.

Finally, the neutral configurations explain radial sharpness within these
maps, but do not prescribe where an arbitrary attractive center lies at a
predecessor shape. They therefore do not, by themselves, give supporting
lines for the unrestricted maximal Heart.

## 8. Files and reproduction

Run, with Python and SymPy installed and without `python -O`:

```text
python verify_complete_omega_domain.py
```

It checks the old Arc I theorem, independently reconstructs the Cartesian
Jacobian, replays the new positivity certificates, verifies the algebraic
join and all normal-coverage signs, and checks the ellipse and invariant
identities. Result: `COMPLETE_OMEGA_INDEPENDENT_REPLAY.json`.

To regenerate the new certificates, also install NumPy:

```text
python prove_complete_omega_domain.py
```

For the numerical audit and plots, also install SciPy and Matplotlib:

```text
python audit_complete_omega_domain.py
python plot_complete_omega.py
```

`omega_support.py` supplies reusable numerical support and center evaluators.
The exact theorem does not depend on the B46 arrays or on those numerical
evaluators. An extracted-copy replay and file-hash manifest accompany the
bundle. Older bundles, papers, explorer and website were not changed.
