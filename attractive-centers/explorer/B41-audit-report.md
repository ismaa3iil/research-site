# Attractive Centers: exact audit of the boundary-map range X5001--X10000

Date: 2026-09-21

## Result in one paragraph

The historical endpoint shortlist in this ETC range contains 672 records: 573
rational records and 99 records that genuinely depend on the area radical.  The
573 rational records collapse to 469 distinct center maps.  Exact symbolic
Jacobian certificates prove 449 of those maps attractive; exact rational
counterexamples prove 16 non-attractive; four remain unresolved.  Of the 449
proved-attractive rational maps, 447 have independently replayed universal
containment certificates in the previously constructed family B39.  The two
remaining maps are `F(-1/2,X9445)` and `F(-1/2,X9446)`.  Adjoining them gives a
41-map family B41 that is proved sufficient for every one of the 449 maps.
Exact rational-triangle exposure witnesses prove 34 B41 members necessary.
Consequently, for this rational catalogue,

\[
  34 \leq m_{\min} \leq 41.
\]

B41 is therefore the **smallest proved-sufficient family currently found**.
This wording is important: the calculation does not yet prove that 41 is the
minimum.

## Scope and provenance

The source database was

```text
C:\Work\Math\TCs Beauty\FullETC_GPU_Kit\vendor\Kimberling\db\ETC_X1_X72807.wxf
```

with SHA-256

```text
ACE501D40DD83785F89B4DE8E4DDCC0C5081D82DE82E1BAF37816D10E547CBFA
```

The Wolfram symbol `S` was interpreted as twice the area.  This audit concerns
the supplied/historical **boundary endpoint shortlist**, not every imaginable
centroidal-ray endpoint and not a proof that the ETC is exhaustive.

## Exact attractivity test

For a cyclic barycentric center map, each vertex Jacobian is computed exactly.
Attractivity is equivalent to positive semidefiniteness of the symmetric part
of every vertex Jacobian.  For a symmetric 2 by 2 matrix this reduces to
nonnegativity of its two diagonal entries and determinant.

The triangle domain is certified using the ordered substitution

\[
 a=2z+2x+y,\qquad b=2z+x+y,\qquad c=2z+x,
 \qquad x,y,z\ge0,
\]

and its six permutations.  This parametrizes one ordered triangle cone and the
six cones cover all positive nondegenerate triangles.  Positivity certificates
use one of three exact mechanisms:

1. all polynomial coefficients are nonnegative;
2. multiplication by a positive power of `x+y+z` yields nonnegative
   coefficients; or
3. all six ordering-cone transforms have nonnegative coefficients.

The same mechanism certifies nonvanishing/constant sign of denominators.
Certificates are stored under `proofs/`.

The 469 distinct rational maps split as follows:

| status | count |
|---|---:|
| proved attractive | 449 |
| proved non-attractive by an exact witness | 16 |
| unresolved | 4 |

The four unresolved maps are:

- `F(-1/8,X5941)`;
- `F(-8/7,X7886)`;
- `F(1/4,X7947)`;
- `F(-2/7,X9319)`.

The 16 proved non-attractive maps are:

```text
F(-1/3,X5170), F(1/3,X5347), F(-1/2,X5738), F(1,X5782),
F(-1/2,X5807), F(-1/2,X5808), F(1/6,X7080), F(-1/3,X7603),
F(1/2,X7737), F(-2,X7831), F(-2,X7853), F(-1,X7934),
F(-3,X7937), F(-1/3,X8573), F(-1/3,X8589), F(1/2,X9669).
```

Every negative result has an exact rational triangle and an exact negative
principal minor in `exact_negative_witnesses.json`.

## Universal convex-hull containment

Each center map was converted to an exact two-invariant projective
representation `(V,W,D)`.  For a proposed fixed triangle of three base maps,
determinants give the three barycentric coefficients of a target map.  After a
common factor is removed, the same triangle-cone positivity machinery proves
the orientation and all three coefficients nonnegative for every triangle.
Thus a successful certificate is a universal containment theorem, not a grid
observation.

The first strict numerical proposal pass found 403 certificates.  A deeper
40-triple pass raised this to 439.  Relaxing only the ill-conditioned numerical
proposal tolerance, while retaining exact symbolic acceptance, proved eight
more.  Two maps had no fixed-triple certificate:

- `F(-1/2,X9445)`;
- `F(-1/2,X9446)`.

An independent replay recomputed every determinant, common factor,
transformation and positivity check.  It verified all 447 certificates and
left exactly those two positions unresolved.  See
`all_containment_replay.json`.

Adding the two unresolved maps to B39 gives B41.  Sufficiency is immediate and
rigorous: 447 maps lie universally in B39 and the remaining two are vertices
of B41.

## The proved-sufficient B41 family

The exact formulas and provenance are in
`../all-ranges-base-study/combined_through_X10000_B41/CURRENT_BASE_41_X10000.json`
and `BASE_41.csv`.  The labels are:

```text
F(1,X598), F(1,X4193), F(1,X10523), F(1,X12877), F(1,X15518),
F(1,X19678), F(1,X27277), F(1,X27328), F(1,X37828), F(1,X39141),
F(1,X59544), F(1,X59572), F(1,X59639), F(1,X66632), F(1/7,X345),
F(2/3,X58), F(-1/2,X1476), F(-2/7,X2093), F(-1/3,X2255),
F(1,X3501), F(1,X3794), F(8/5,X3825), F(-1/2,X3951),
F(1/4,X4012), F(-1/2,X4308), F(-1/2,X4321), F(1,X4342),
F(-2,X4438), F(2/3,X4857), F(2/5,X4911), F(1,X5255),
F(-1/4,X5310), F(-1/2,X5741), F(-1/2,X6205), F(3/7,X7748),
F(-4/3,X7872), F(5/11,X9597), F(-3/2,X10000), F(7/6,X10000),
F(-1/2,X9445), F(-1/2,X9446).
```

## Lower bound and the seven undecided base members

For 34 members, deleting that member produces a strictly smaller hull on a
specific exact rational triangle.  The signed edge gap is an exact negative
rational number, so these are proofs of necessity within any sufficient
subfamily drawn from the audited maps.

The remaining seven B41 members are neither proved necessary nor proved
redundant:

```text
F(-1/2,X1476), F(-1/2,X4321), F(2/3,X4857), F(3/7,X7748),
F(-3/2,X10000), F(-1/2,X9445), F(-1/2,X9446).
```

This gives the exact current cardinality interval 34--41.  The numerical
appearance that all 41 become exposed extremely close to degeneracy was not
accepted: exact arithmetic showed that several such apparent exposures were
floating-point artifacts.

## Area/radical sector

There are 99 genuine area-dependent records.  None becomes rational after
keeping the area symbol and normalizing the cyclic barycentrics.  A bounded
low-integer exact/numerical witness search completed for 94 records and found
no negative witness; five records timed out.  This is **not** an attractivity
proof.  These 99 records are excluded from the B41 theorem and are listed in
`AREA_RADICAL_RECORDS.csv`.

## What remains to prove

1. Resolve the four rational attractivity cases.
2. Develop exact positivity certificates in the semialgebraic extension
   containing the Heron-area radical, then audit the 99 radical records.
3. Prove redundancy or necessity for the seven undecided B41 members.  A
   piecewise hull certificate, rather than one fixed containing triangle, is
   likely necessary for X9445 and X9446.
4. Repeat the same certified pipeline for X10001 onward.

## Authoritative files

- `RESULTS_TABLE.csv`: all 469 rational equivalence classes and their status.
- `AREA_RADICAL_RECORDS.csv`: all 99 area/radical records.
- `all_containment_replay.json`: independent replay of 447 universal
  containment certificates.
- `all_containment_certificates/`: individual exact containment certificates.
- `proofs/`: exact Jacobian PSD certificates.
- `exact_negative_witnesses.json`: exact non-attractivity witnesses.
- `../all-ranges-base-study/combined_through_X10000_B41/BASE_41_SUMMARY.json`:
  the final base statement and 34--41 interval.
- `../all-ranges-base-study/combined_through_X10000_B41/exact_sample_exposure.json`:
  exact necessity witnesses for the 34 forced members.

The interrupted diagnostic file `current_base_screen.json` is not authoritative
and is intentionally excluded from the final archive.
