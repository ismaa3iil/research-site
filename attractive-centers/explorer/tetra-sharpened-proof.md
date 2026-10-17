# Globally certified inward endpoints for tetrahedron polynomial rays

17 October 2026. This supplements, rather than replaces, the conservative
operator-norm proof in `REVIEW_AND_PROVED_EXTENSIONS.md`.

## Meaning of the certificates

For a generator W in {U1,K1,K2,V2,V3}, the center rule is Z_c=G+cW.
A coefficient is admitted only when the independent exact verifier passes.
These are sufficient inward endpoints, NOT asserted exact maximal ray limits.
Numerical solver statuses, including `optimal` and `optimal_inaccurate`, are
not used as proofs. A certificate can survive a numerical warning, or fail
despite a favorable numerical status; the exact replay decides.

## Global reduction, with proof

Let a,b,c be three arbitrary vectors in R^3 and parametrize centered inputs by

    r0=a+b+c, r1=a-b-c, r2=-a+b-c, r3=-a-b+c.

This covers every centered four-point configuration: a=(r0+r1)/2,
b=(r0+r2)/2, c=(r0+r3)/2. Set L=sum_i |r_i|^2=4(|a|^2+|b|^2+|c|^2).
By rotation equivariance, it suffices to test response in the unit x direction.
By permutation equivariance it suffices to move input p0.

Such a material motion changes each of a,b,c by h/4 and G by h/4. Write
W_x=N/L^k. Its tested response is

    e_x^T D_0 Z_c e_x
      = 1/4 + c (L D N - k N D L)/L^(k+1),

where D=(partial_ax+partial_bx+partial_cx)/4. Thus global nonnegative response
is equivalent to nonnegativity of the homogeneous polynomial

    P_c = L^(k+1)/4 + c(L D N - k N D L).

The degree is 4 for U1, 6 for K1,V2, and 8 for K2,V3. The nine unrestricted
coordinates of a,b,c cover planar, collinear, colliding and proper spatial
configurations; this is not a finite grid of shape samples.

## Exact SOS Gram proof

Let z contain all monomials of degree k+1 in the nine coordinates. Because
P_c is unchanged by reflecting all y coordinates or all z coordinates,
split z into four blocks according to those two degree parities. The block
sizes are (18,9,9,9), (46,46,46,27), or (153,114,114,114).

The discovery program searches for P_c, after an explicitly positive scalar
normalization, as sum_b z_b^T Q_b z_b. The numerical matrices are rounded to
rational matrices and corrected to obtain an EXACT polynomial coefficient
identity. No tolerance is used when replaying that identity.

Positive definiteness of each rational Q_b is checked without floating-point
eigenvalues. The certificate supplies a rational square matrix T_b for which
T_b^T Q_b T_b is symmetric, has positive diagonal, and is strictly diagonally
dominant. All diagonal-dominance comparisons are integer comparisons after
clearing positive denominators. Gershgorin's theorem proves this congruence
positive definite; consequently T_b is nonsingular and Q_b is positive
definite. This proves P_c>=0 for all nine real coordinates.

The verifier independently rederives the derivative polynomial by material
vertex motion: D r0=3h/4 and D rj=-h/4 for j=1,2,3. It differentiates the
radius moments and inertia tensor by their product and quotient rules,
rather than using the discovery program's coordinate derivative operator.
It then verifies the exact polynomial identity and integer congruences.

Rotation and relabeling give Sym D_i Z_c>=0 for every displacement and vertex.
The rational center is analytic on L>0. Its displacement from G is O(sqrt L),
so it extends continuously at total collapse. Integrating along a single
vertex segment (splitting at a collapse if necessary) proves the global
finite attractivity law.

## From separate rays to multidimensional hearts

For two certified coefficients c_j^-<0<c_j^+ on each generator W_j, the whole
asymmetric cross-polytope

    sum_j max(c_j/c_j^+, c_j/c_j^-) <= 1

is attractive by convex mixing. At a fixed tetrahedron its image is the hull
of the ten endpoint maps. It can be combined with the barycentric-anchor
family and with all older proved maps. No assertion is made that this
cross-polytope is the full admissible coefficient body, a minimal base, or
the maximal Heart.

## Reproduction

With NumPy and SymPy installed, run:

```text
python verify_polynomial_ray_sos.py
```

No optimization package is needed for replay. `SHARPENED_RAYS_REPLAY.json`
records coefficients, proof hashes and results. To rediscover a certificate,
CVXPY and SCS are additionally required, for example:

```text
python certify_polynomial_rays.py U1 0.3194 --seconds 35
```

The discovery time is bounded per solve; it does not launch parallel workers.
Failed or approximate attempts do not become proofs. Earlier failed-attempt
records are archived separately rather than silently promoted or deleted.


## Independently replayed sufficient intervals

| Generator W | Negative endpoint | Positive endpoint |
|---|---:|---:|
| U1 | -0.3333 | 0.3194 |
| K1 | -0.8676 | 0.9029 |
| K2 | -1.9754 | 1.9803 |
| V2 | -1.4522 | 2.1167 |
| V3 | -2.8732 | 2.8669 |

All decimal entries here denote exact rational numbers. Convexity proves the entire interval between each pair.
