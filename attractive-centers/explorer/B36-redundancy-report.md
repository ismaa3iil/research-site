# B36 reduction and the endpoint-power containment conjecture

## Definitions and status

Let

    p_- = 4 - 2 sqrt(2),   p_+ = 4 + 2 sqrt(2),

and let M_p(P) be the unique minimizer of sum_i |x-P_i|^p. Paper III proves
that M_p is attractive throughout this interval (with the stated regularity
and limiting conventions). The new question studied here is the stronger
pointwise containment statement

    M_p(P) in conv(B41(P) union {M_{p_-}(P),M_{p_+}(P)})       (C)

for every nondegenerate triangle P and every p in [p_-,p_+]. This is a
representativity statement about the finite hull; it is distinct from the
already proved attractivity theorem.

Adjoining M_- and M_+ to B41 gives a rigorously valid 43-map constructive
heart family. The two endpoint maps are proved attractive. No containment
conjecture is needed for that conclusion.

## Redundancy investigation

The first ordinary floating-point hull calculation was internally
inconsistent near collinear center sets. It was discarded. The corrected
calculation whitens every two-dimensional center cloud before taking its hull
and treats numerical rank-one clouds as intervals on their principal axis.

The sampled family reduction used 1,288 shapes: a structured set covering
very thin, very tall and moderately shaped triangles, plus 1,200 deterministic
random shapes. Forty randomized removal orders all reached a 36-map family.
The seven removed B41 positions are:

| B41 position | map |
|---:|---|
| 17 | F(-1/2,X1476) |
| 26 | F(-1/2,X4321) |
| 29 | F(2/3,X4857) |
| 35 | F(3/7,X7748) |
| 38 | F(-3/2,X10000) |
| 40 | F(-1/2,X9445) |
| 41 | F(-1/2,X9446) |

These are exactly the seven B41 members whose necessity had remained
unproved. The resulting **provisional B36** consists of the 34 B41 members
with existing exact necessity witnesses, together with M_- and M_+.

On the 1,288-shape set, each of the 36 retained maps is outside the hull of
the other 42 maps somewhere. Thus 36 is the minimum cardinality on this
sample set, not merely the output of one greedy ordering. The smallest
normalized separating gap among the retained rational maps is about
8.10e-4; the endpoint gaps are about 0.655 and 0.180. Both endpoints are
strongly independent.

The simultaneous removal of all seven maps was then replayed over an
independent 30,156-shape ordered-side stress grid. Twenty-seven shapes were
omitted because an endpoint solve or exact-dyadic B41 evaluation did not
resolve. All apparent positive gaps were at most 2.22e-8 and occurred in
extreme needle limits. At 100-digit precision, the worst reported case

    a=263729558.4399159081212332,
    b=263729557.85170534,
    c=1

places F(-1/2,X9446) inside the B36 hull by signed distance approximately
-1.63e-18. Critical flat and near-equilateral cases were checked similarly;
their apparent machine-precision violations also changed to negative gaps.

Therefore B36 is a strongly supported reduction, but universal redundancy
of the seven maps has not yet been proved. B43 remains the proved-safe family;
B36 is the current conjectured pointwise-equivalent base.

## A theorem for isosceles triangles

The power-path part of (C) can be proved completely for every isosceles
triangle. Put the vertices at (-s,0), (s,0), (0,h), with s,h>0. Reflection
symmetry forces M_p=(0,y_p), where 0<y_p<h. Put

    r = sqrt(s^2+y^2),   t = h-y.

Stationarity of the strictly convex power objective gives

    F(y,p) = 2 y r^(p-2) - t^(p-1) = 0.                 (1)

The derivative F_y is the second derivative of the objective along the
symmetry axis, hence F_y>0. At a solution of (1), the two positive terms are
equal, so

    F_p = 2 y r^(p-2) log(r/t).

Implicit differentiation yields

    sign(dy_p/dp) = -sign(log(r/t)).                     (2)

If r=t at a stationary point, (1) gives 2y=r. Consequently
s^2+y^2=4y^2, so y=s/sqrt(3); also h-y=t=r=2s/sqrt(3),
and therefore h=sqrt(3)s. This is precisely the equilateral case. In that
case y_p=h/3 for every p. In every non-equilateral isosceles triangle,
r/t cannot cross 1 along the continuous solution path, so (2) has constant
sign. Thus p -> y_p is monotone and

    M_p(P) in [M_-(P),M_+(P)]

for all p in [p_-,p_+]. This proves (C), in a stronger two-center form, on
the complete isosceles locus.

## General scalene case

For a scalene triangle write d_i=x-P_i and r_i=|d_i|. Differentiating the
stationarity equation gives the exact path equation

    H_p x'_p = - sum_i r_i^(p-2) log(r_i) d_i,

where

    H_p = sum_i [r_i^(p-2) I + (p-2) r_i^(p-4) d_i d_i^T]

is positive definite for p>1 away from the standard removable singular
cases. This proves smooth dependence on p and provides rigorous interval
bounds for x'_p, but it does not by itself imply convex-hull containment.
Indeed, numerical tests disprove the tempting stronger claim that the power
path always lies in conv{M_-,G,M_+}.

A search over ordered shapes uses

    a=1+d+q,  b=1+q,  c=1,
    0<=d<=1,  0<=q<infinity.

This covers all side orderings up to scale and permutation. Random and
structured tests found no high-precision counterexample to (C). Ordinary
double-precision hull tests produced false positives near the equilateral,
isosceles and degenerate boundaries. Two strongest candidates were rerun at
100 digits and lay inside by about 2.51e-18 and 1.81e-19 respectively.
Consequently the numerical evidence favors (C), but small boundary margins
make a floating-point exhaustive claim inappropriate.

No general facility-location theorem found in the targeted literature search
implies (C). The proof must use the specific B36/B43 maps, rather than only
generic strict convexity of the power objective.

## A feasible proof program

Compactify q by z=q/(1+q), so the ordered shape-p domain is the cube

    (d,z,p) in [0,1] x [0,1] x [p_-,p_+].

For each parameter box:

1. use interval Newton/Krawczyk iteration on the two stationarity equations
   to enclose the unique M_p;
2. select three B36 vertices from the box midpoint (Caratheodory's theorem);
3. interval-evaluate the three oriented-area determinants proving that M_p
   lies in their triangle;
4. subdivide whenever a determinant interval meets zero;
5. handle d=0 and q=0 by the isosceles theorem above, the equilateral corner
   by symmetry, and the d=1 or z=1 limiting faces by scaled asymptotics.

This would give a reproducible computer-assisted proof of (C). It can also
prove the seven universal redundancy claims by replacing M_p with each
explicit rational map and using the same B36 triangles. The existing exact
polynomial containment method cannot directly absorb M_+- and M_-, because
these centers are implicit transcendental maps for noninteger p.

## Files

- `B43_SAMPLED_REDUCTION.json`: complete sampled B36 reduction and witnesses.
- `reduce-b43-sampled.mjs`: affine-conditioned randomized-order reduction.
- `recheck-original-grid-b43.mjs`: 30,156-shape stress replay.
- `verify-b43-critical-highprecision.py`: 90-digit redundancy checks.
- `check-power-extension.mjs`: the two user-specified triangles and 2,001 p values.
- `scan-power-extension.mjs`: initial 500-triangle power-path scan.
- `search-power-containment-ordered.mjs`: ordered-domain adversarial search.
- `verify-power-hypothesis-critical.py`: 100-digit candidate checks.

The website and its advertised B41 family were not changed in this research
step. A public change should wait until B36 is either universally certified or
clearly labelled as a numerical reduction, while B43 may be displayed now as
a proved enlarged constructive family.
