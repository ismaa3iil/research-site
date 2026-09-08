# Triangle Sky — dynamic star catalogue

An interactive port of Ismail Hammoudeh’s supplied Mathematica catalogue, published with the Triangle Sky papers at <https://ismaa3iil.fyi/triangle-sky/star-catalogue/>.

## Use

Move A, B and C in the XY editor, or edit all three coordinates for each vertex. Drag the sky to orbit; scroll to zoom; Fit sky includes the currently filtered real stars. The three presets are 13–20–21, 6–9–13 and equilateral. Index cutoffs 2, 3, 4 and 5 include 9, 37, 53 and 167 constructive stars respectively, before realness/search filters. Six optimization stars are also available, subject to their index cutoff.

Hover to inspect a star; click to pin its apex-to-foot perpendicular and tetrahedral edges. The searchable catalogue list lets you select overlapping stars and entries unavailable for the current triangle. Expand the details for every supplied coinciding definition and symbolic foot/height formula. These formulae and ETC identifications are author-supplied research metadata, not independently certified by this port.

Markers use a bright blue–teal–gold scale on navy, with higher effective index toward gold. Constructive stars are circles; optimization stars are diamonds. The default nominal radius is 3 CSS pixels, slightly reduced at higher indices, with a 1.5–6 pixel control. Sizes remain independent of geometric zoom. The marker is a selection symbol, not a physical sphere. All numerical coordinates retain the supplied geometry.

## Free software and architecture

The browser app is plain JavaScript, CSS and SVG, without external libraries, CDNs, accounts, a Mathematica runtime or a paid backend. Static files work on GitHub Pages. The accompanying Julia implementation uses only the standard libraries `LinearAlgebra` and `Test`. The software port is MIT licensed; see `LICENSE`. The original supplied Mathematica archive is included unchanged for provenance.

To serve locally, run `python3 -m http.server 8000` from this directory and open `http://localhost:8000`. Python only serves files; calculations run in the browser. Opening `index.html` directly as a file will not load modules, data or the worker.

For Julia (tested with 1.10.10):

```julia
include("julia/TriangleSky.jl")
using .TriangleSky
triangle = [[0.,0,0], [21.,0,0], [16.,12,0]]
evaluate("TSZ[1]", triangle)  # point, foot, height, normalized barycentrics
evaluate(catalogue[1].expression, triangle)
optimize("ERS", triangle)     # also IVS, DGS, EVS, NFIS, CVS
```

`evaluate` returns `nothing` in Julia (an error record in JavaScript) when a construction is non-real, singular or unsupported. All expression heads occurring in the 167 canonical `StarExpression` entries are supported: vertices, `TSX[1..4]`, `TSZ[1..3]`, `TSY[1..3,...]`, and `TSConjugate`. This is not a general Wolfram Language interpreter; unused carrier operations from the foundations package are not part of the public evaluator. The parser accepts a restricted inert syntax and never executes catalogue strings.

## Mathematical conventions

Calculations normalize each triangle by its longest edge and translate its first vertex to the origin, then transform results back. The positive normal is `(B-A) × (C-A)`, normalized. The foot is the orthogonal projection onto the actual ABC plane, including tilted triangles. A base with normalized doubled area below `1e-8` is rejected.

Complex intermediate values use bilinear lengths, as in the supplied foundations. Square roots use the principal branch; signed zero on the branch cut is interpreted as positive zero. Final normalized imaginary coordinates above `1e-7` are unavailable. Real entries at zero height remain listed, matching the source application. `TSConjugate` swaps B and C before evaluating; it does not merely negate a coordinate. The three primitive stars and tetrahedral centers follow the supplied definitions.

IVS has foot at the incenter and height `2√2 r`. CVS has foot at the circumcenter and height `√2 R`. EVS has foot at the circumcenter and height `√((p/3)² − R²)`, requiring `p > 3R`. Here p, r and R belong to the base triangle. Circumcenter coordinates are solved geometrically; the browser does not use the simplified barycentric expression in the source optimization metadata.

ERS minimizes tetrahedral circumradius / inradius. DGS minimizes the sum of `(cos θ − 1/3)²` for six internal dihedral angles. NFIS minimizes the sum of `cos² θ`, equivalent up to a positive scale and additive constant to the source normal-frame defect. Face normals point outward, so internal dihedral cosines are minus pairwise normal dot products.

The numerical search uses three source-prescribed starts in `(α, β, log(h / longest_edge))` and the source quadratic penalty outside α, β, γ ∈ [−2, 3] and log-height ∈ [−4, 1.6]. Nelder–Mead replaces Mathematica’s PrincipalAxis routine, with a 650-iteration limit per start and `1e-7` simplex-size tolerance. Results are local numerical candidates, not global certificates; the information panel reports convergence and the unpenalized objective. These are algorithmic bounds with soft penalties, not rigorous geometric restrictions. Calculations run in a worker, cancel when the triangle changes, and pause while dragging. Disabling numerical calculation marks those entries paused and removes their old positions.

## Verification

```sh
node tests/math.test.mjs
julia tests/runtests.jl
JULIA=julia node tests/crosscheck.mjs
```

Tests cover catalogue counts, ES edge distances, OS perpendicular edges, CS1 centroid identity, all 167 entries under a proper rotation/scaling/translation, degenerate/non-real inputs, and all six optimization stars on an equilateral base. The cross-check compares JavaScript and Julia on scalene, obtuse and tilted triangles, including unavailable classifications. This checks the numerical port and identities; it does not constitute a new proof of catalogue equivalences or a live comparison against Mathematica.

## Files

- `math.mjs`: geometry, restricted evaluator and optimizers.
- `app.mjs`, `worker.mjs`, `index.html`, `style.css`: browser interface.
- `data/catalogue.json`: searchable metadata for all 167 stars.
- `data/details-*.json`: full unmodified record values, grouped for on-demand loading.
- `julia/`: standard-library Julia implementation and catalogue expressions.
- `tests/`: numerical and cross-language regression checks.
- `TriangleSky_Dynamic_Star_Catalogue.zip`: original upload, unchanged.
