# Triangle Sky — stars, strands and sheets

An interactive port of Ismail Hammoudeh’s supplied Mathematica catalogue, published with the Triangle Sky papers at <https://ismaa3iil.fyi/triangle-sky/star-catalogue/>.

## Use

Move A, B and C in the XY editor, or edit all three coordinates for each vertex. Drag the sky to orbit; scroll to zoom; Fit sky includes the currently filtered real stars. The 16 presets contain five isosceles shapes (equilateral, two other acute, right and obtuse) and eleven scalene shapes (six acute, two right and three obtuse). Presets are scaled to longest edge 21; displayed side-ratio labels identify their shape. Arbitrary finite 3D coordinates remain editable. Index cutoffs 2, 3, 4 and 5 include 9, 37, 53 and 167 constructive stars respectively, before realness/search filters. Six optimization stars are also available, subject to their index cutoff.

Hover to inspect a star; click to pin its apex-to-foot perpendicular and tetrahedral edges. The searchable catalogue list lets you select overlapping stars and entries unavailable for the current triangle. Expand the details for every supplied coinciding definition and symbolic foot/height formula. These formulae and ETC identifications are author-supplied research metadata, not independently certified by this port.

Markers use a bright blue–teal–gold scale on navy, with higher effective index toward gold. Constructive stars are circles; optimization stars are diamonds. The default nominal radius is 3 CSS pixels, slightly reduced at higher indices, with a 1.5–6 pixel control. Sizes remain independent of geometric zoom. The marker is a selection symbol, not a physical sphere. All numerical coordinates retain the supplied geometry.

## Free software and architecture

The browser app is plain JavaScript, CSS and SVG, without external libraries, CDNs, accounts, a Mathematica runtime or a paid backend. Static files work on GitHub Pages. The accompanying Julia implementation uses only the standard libraries `LinearAlgebra` and `Test`. The software port is MIT licensed; see `LICENSE`. The original supplied Mathematica archive is included unchanged for provenance.

To serve locally, run `python3 -m http.server 8000` from the research repository root and open `http://localhost:8000/triangle-sky/star-catalogue/`. The symmetrical-apex implementation imports the existing `tetrahedral-sections/explorer` modules, so serve the whole repository. Python only serves files; calculations run in the browser. Opening `index.html` directly as a file will not load modules, data or the worker.

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
node tests/families.test.mjs
julia tests/families.jl
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


## Stellar strands and sheets

The new family layer generalizes the five supplied programs in `sources/` to arbitrary nondegenerate 3D bases. The family computation runs in a cancellable worker. The existing star catalogue and all its metadata are retained.

- **Power-k:** with opposite base lengths a, b, c and apex distances dA, dB, dC, the equations are `dA^k + a^k = dB^k + b^k = dC^k + c^k`. The k=0 continuous limit is `a*dA = b*dB = c*dC`. k=2 is orthocentric, k=1 balloon, k=0 isodynamic. The default allows extended real additive weights; the positive-weight option requires all four vertex weights to be positive. The sheet covers −3 ≤ k ≤ 5.
- **Eisenstein:** compute positive weights uA, uB, uC from the auxiliary triangle with sides a^k, b^k, c^k, using the supplied positive-branch formula. For positive apex weight v, `d_i^(2k) = u_i² + u_i*v + v²`. The implementation scales the auxiliary powers before computation. k=1 is the isogonic family; k=0 uses the supplied isodynamic limit. The admissible positive-base interval is recomputed for each base within [−3,5], rather than copying the constants for 13–20–21. Some admitted base parameters have no positive real apex in the displayed window. Endpoint values can be limiting, excluded configurations.
- **Prekites:** three exact semicircles make DAB, DBC or DCA equilateral. For edge AB the circle has midpoint (A+B)/2, radius √3 |AB|/2 and plane perpendicular to AB. If ABC itself is equilateral, every apex is already a prekite; the arcs then identify an additional equilateral face. The interface states this dimensional exception.
- **Symmetrical apex:** reuse the verified inverse-section construction from the previous explorer, after mapping the current base into a local orthonormal frame. This includes the equilateral axial branch as well as off-axis branches. Special markers identify the orthostar, μ=1 parabolic stars, and h=√2 regular stars. “Regular star” here means the regular symmetric cone, with pairwise apex angles 60°; it does not assert that the resulting tetrahedron has six equal edges.

For a fixed base, these loci are one-dimensional strands and two-dimensional sheets. Adding the three freely varying base side lengths gives four- and five-dimensional families before quotienting by uniform scale. Exceptional bases can reduce constraint rank: both sheets collapse to a single vertical locus for an equilateral base.

### Visibility and inspection

Sheets have adjustable transparency, with integer-k strands and the currently selected k drawn on them automatically. Power strands are solid blue–violet; Eisenstein strands are dashed gold–coral. Symmetrical-apex strands are green; prekite arcs pale blue. The separate star-index palette is unchanged. Projected strands and finite planar endpoints can be shown, and catalogue stars can be dimmed to expose the families. These are translucent overlays; they do not hide star markers behind opaque geometry.

Choose a connected strand component and move the position slider to place an inspectable apex. It appears in the catalogue as the selected point and displays its tetrahedral edges, perpendicular foot, height and barycentrics. The slider advances through sampled points, not equal arc length. **Fit all layers**, **Focus triangle**, and **Plane view** provide complementary views; plane view follows the actual tilted base normal. Changes to the base or family parameters fit the newly computed geometry.

The optional center layer provides X(1), X(2), X(3), X(4), X(5), X(6), X(13), X(14), X(15), X(16), X(20), X(175) and X(176). X(13)/X(14) are algebraic isogonic centers; outside the relevant angle range they must not be confused with the constrained Fermat minimizer. Centers at infinity are omitted. Coincident centers can be selected individually in the list.

### Numerical limits

The display window is adjustable from one to six longest-edge lengths in both height and radial planar distance from the centroid. It is a finite window into potentially unbounded loci. Logarithmic radius sampling, gap detection and mesh-edge checks avoid connecting distant or invalid regions. The interface reports a missing *visible sampled* segment rather than asserting that an entire family is empty. Finer sampling improves small components and boundary shape but is not an exhaustive branch certificate.

Sheet facets linearly approximate valid sampled vertices and omit cells with invalid vertices, very long edges or extreme aspect ratios. Finite h=0 crossings on sampled strands are refined by bisection. Tangential contact and singular limiting branches may need finer sampling; no fabricated surface patches fill gaps. At equilateral collapse the zero-area facets are omitted. Symmetric inverse sections retain the previous numerical recovery tolerance and finite model-height bound (80).

### Julia family API

```julia
include("julia/StellarFamilies.jl")
using .StellarFamilies
tri = [[0.,0,0], [21.,0,0], [16.,12,0]]
f = frame(tri)
raw(f, :power, 2., 1.4)  # local x, y, squared height; rho / longest edge
strand(tri, :power, 1.)
sheet(tri, :power)       # k ∈ [−3,5]
sheet(tri, :eisenstein)
eisenstein_range(f)
prekites(tri)
```

This companion provides the power/Eisenstein numerical kernels, sampled sheets/strands and exact prekite arcs without external packages. The browser adds refined crossing endpoints, selected-k mesh rows and UI metadata; its triangulation need not match Julia facet-for-facet. The symmetrical-apex Julia implementation remains in `../../tetrahedral-sections/explorer/julia/`.

The additional regression checks validate the exact preset counts, family edge equations, all three prekite arcs, regular-star apex angles, planar center placement, 13–20–21 Eisenstein boundaries and covariance for tilted bases. These tests check the implemented formulas, not new global existence or uniqueness theorems.
