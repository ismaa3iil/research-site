# Audit of all 1,142 proved-attractive native ETC entries against B46

1 October 2026. This report concerns the entire **current proved-native
inventory**, not a classification of every ETC center.

## Outcome

**Every one of the 1,142 audited native ETC maps is contained in the B46
hull for every proper triangle.** The conclusion is supported by exact
identities, complete piecewise polynomial certificates, and independent
raw-source/fraction-field replay. It is not an inference from plotted points.

More precisely, let I be the index list in `CATALOGUE.json`, and let

\[
R=B46\setminus\{M_-,M_+\}.
\]

R consists of the **44 rational members of B46**. The containment proofs
use only members of R, so for every proper triangle P,

\[
\operatorname{conv}\{X_i(P):i\in I\}
\subseteq\operatorname{conv}\{r(P):r\in R\}
\subseteq\operatorname{conv}\{b(P):b\in B46\}.
\]

The powers M_- and M_+ are not needed for this containment theorem.
**R is not the proposed B44 reduction.** The proposed B44 retains the two
power centers and deletes F(-1/3,X2255) and X3794; its universal sufficiency
remains unproved. R instead retains those two rational maps and removes
the powers. This distinction matters when comparing hulls in the explorer.

## What was audited

The input is the cumulative list
`REMAINING_ENLARGEMENTS/UPDATED_PROVED_NATIVE_INDICES.json`:

- 1,126 earlier audited native indices;
- nine certified additions from the first enlarged-base study;
- seven certified additions from the latest enlargement investigation.

All 1,142 indices are distinct. The exact normalized rational models in
this audit also have 1,142 distinct keys. No repetitions were eliminated.

Each entry was traced to a formula, original database-source formula,
certificate path, certificate hash, and inherited proof status. Every
certificate file was present. The native map is always lambda=1; a proof
about another point on the same centroidal ray was not substituted for it.

This is a **containment audit of an inherited proved-attractive inventory**,
not a fresh independent replay of all 1,142 attractivity certificates.
The source/normalization checks are new; the classification as attractive
continues to rely on the recorded earlier proofs and stated regularity
conventions. No unproved numerical candidate was promoted to that inventory.

## Provenance and normalization checks

Exact source models were built for all 1,142 native maps and all 44
rational B46 maps. Normalized weights were checked for homogeneity and
agreement with the database-source formula. Two formula strings differed
textually from their source expressions; their normalized maps agreed
exactly.

Fifty inherited hashes differed from newly computed hashes. These were
**common scalar normalization differences**, not different center maps.
For each such case, the saved denominator D_old and current denominator
D_new satisfy D_new=t D_old with a nonzero rational constant t. The three
saved Jacobian numerators satisfy

\[
P_{11,new}=t^2P_{11,old},\quad
P_{22,new}=t^2P_{22,old},\quad K_{new}=t^2K_{old}.
\]

Thus the normalized map/Jacobian is unchanged. All fifty checks passed.
Initial discrepancy records are retained in the append-only model journal;
the **latest** record for each kind/label is authoritative. Do not count
the initial warnings as fifty unresolved maps.

A fresh, direct ordered-side substitution also checks every denominator
of the 1,142 native maps and the 44 rational base maps. All 1,186 have
nonnegative coefficients and a strictly positive pure-x monomial. Hence
their assigned denominators are strictly positive for x>0, y,z>=0,
including isosceles and equilateral proper triangles. This denominator
conclusion is independently checked, not merely inherited from status labels.

## Numerical screen: preliminary evidence only

Both previous discovery and independent-validation grids were used:
6,364 input shapes. Canonicalizing vertex labels and removing repeated
scale-equivalent triangles left **6,193 distinct ordered shapes**.
All 1,142 maps were evaluated on every one of these shapes, and all
evaluations passed the arithmetic-reliability checks.

No map produced a numerical enlargement of B46. The screen used a
whitened barycentric-plane hull comparison, with a gap threshold of
2e-5. These numerical checks proposed containing triples but proved
no universal containment by themselves.

## Exact proof construction

Write a=|BC|, b=|CA|, c=|AB|. By permutation equivariance, it is enough
to work on the ordered-side chamber a>=b>=c. Parameterize it by

\[
a=2x+2y+z,\quad b=2x+y+z,\quad c=2x+y,
\]

with x>0, y,z>=0. Generic chamber points have x,y,z>0; equal-side
boundaries are obtained by continuity of the normalized center maps.

For a normalized barycentric vector W=N/D, its known nonvanishing
denominator is assigned its positive sign on the proper-triangle domain.
For a target T and three rational B46 members A,B,C, the proof checks
the four determinants

\[
\det(A,B,C),\quad\det(A,B,T),\quad
\det(B,C,T),\quad\det(C,A,T).
\]

Clearing positive denominator products gives polynomials. The orientation
polynomial is required to be nonzero; the other determinants must have
the same weak sign. Exact nonnegative-coefficient, positive-multiplier,
or complete ordering-cone certificates prove those signs. This places
T inside the triangle of the three center values.

The first pass established:

- **26 exact identities** with rational B46 members;
- **1,112 fixed-triple containment certificates** over the entire
  ordered-side domain;
- four exceptions needing piecewise proofs: X10107, X14019, X37828,
  and X59544.

For the four exceptions, the positive parameter domain was partitioned
into its six ordering cones. If q_i<=q_j<=q_k, substitute
q_i=U, q_j=U+V, q_k=U+V+W. A different containing triple may be used
in each cone. These six cones cover the whole domain; no sampled region
is silently omitted.

X14019, X37828, and X59544 each received six direct B46 certificates.
These do not depend on the historical B47/B69 deletion chains.

For X10107, five root cones were certified immediately. The uncovered
cone `012` was subdivided into all six children. Five children were
certified; `012_012` was subdivided again. Five grandchildren were
certified; the last region `012_012_102` was subdivided once more, and
**all six final children were certified**. Therefore the entire root
cone is covered, completing X10107's universal containment.

Shared boundaries and vanishing orientations on equal-side limiting
configurations are covered by continuity of the points and of the
finite convex hull. The theorem is for proper triangles, including
isosceles and equilateral triangles. This audit does not add a theorem
at arbitrary coincident-point or collapsed configurations.

## Independent replay

Replay starts from the raw source rational function, builds its three
cyclic weights in an exact fraction field, and normalizes them directly.
This is independent of the model builder's common-denominator/gcd/scalar
normalization procedure.

The saved integer denominator then reconstructs the numerator vector;
all numerator identities and their sum are checked exactly. The four
determinants are reconstructed, transformed to the relevant parameter
cone, compared with the saved polynomials, and their sign certificates
are replayed. Exact-identity cases are checked by cross multiplication.

No numerical discovery sample enters this replay. Complete six-child
coverage is separately audited for every failed parent cone.

The final successful replay comprises **1,177 certificate regions or
identities** covering all **1,142** entries. There are no unresolved
containments. Read `REPLAY_SUMMARY.json` and `FINAL_CLASSIFICATIONS.json`
for machine-readable counts and per-index certificate links.

## What this changes—and what it does not

We can now say, rigorously: **all native ETC entries currently recorded
as proved attractive in this project lie in B46 on every proper triangle.**
There is no need to enlarge B46 to represent any of those 1,142 maps.

We cannot yet say that every attractive ETC center lies there. The
remaining numerical candidates are not all globally classified. In
particular X33741 and X45491 still have numerical enlargement evidence
but unresolved attractivity. Centers outside the known inventory can
still enlarge the certified Heart approximation.

Nor does this containment theorem prove that B46 equals the maximal
Heart, or that its hull equals the hull of the native 1,142 centers.
B46 contains centroidal-ray maps that need not be native ETC maps, and
also two power minimizers. The inclusion proved here is one-way.

The previous **44–46 minimum-cardinality bounds concern subfamilies of
the fixed B76 reference**. This audit does not automatically extend
those lower bounds or uniqueness claims to a reference enlarged by
all 1,142 native entries or by arbitrary new attractive maps.

## Files and reproducibility

Authoritative audit files:

- `CATALOGUE.json`: all 1,142 formulas and proof-provenance records.
- `REFERENCE_B46.json`: all 46 base members.
- `MODELS.jsonl`, `MODEL_SUMMARY.json`: exact models and normalization checks.
- `NUMERICAL_SCREEN.jsonl`, `NUMERICAL_SUMMARY.json`: numerical comparisons.
- `GLOBAL_STATUS.jsonl`: 26 identities and 1,112 global triple proofs.
- `EXCEPTION_STATUS.jsonl`: six-cone exception proofs.
- `REFINEMENT_DEPTH1_STATUS.jsonl` through `REFINEMENT_DEPTH3_STATUS.jsonl`:
  X10107's complete refinement tree.
- `INDEPENDENT_REPLAY.jsonl`, `REPLAY_SUMMARY.json`:
  raw-source/determinant/sign replay.
- `STRICT_DENOMINATOR_REPLAY.json`: 1,186 strict-positivity checks.
- `FINAL_CLASSIFICATIONS.json`: final result for every index.

Using Python with SymPy 1.14.0, mpmath 1.3.0, and NumPy 2.3.5, the
independent verification command is

```text
python replay_proved_b46_audit.py
python verify_proved_b46_denominators.py
```

It is checkpointed. To force a full fresh replay, work in a copy of the
bundle and set aside that copy's `B46_NATIVE_AUDIT/INDEPENDENT_REPLAY.jsonl`
before running. Preserve the delivered original journal. The script
reconstructs all certificates without rerunning numerical discovery.

The computation used bounded single-worker discovery/proof runs with
per-map time limits, a 768 MiB resident ceiling in the main model/proof
queues, and worker recycling. Independent replay is a foreground
checkpointed verifier, not a second discovery queue. No website,
repository, or synced source was changed.

## Recommended next step

Concentrate on the **unproved numerical candidates**, starting with
X33741 and X45491. Prove their attractivity or find rigorous negative
Jacobian witnesses, then check genuine hull separation. The known
1,142-entry inventory no longer presents an enlargement gap.
