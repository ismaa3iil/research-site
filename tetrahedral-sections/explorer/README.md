# Tetrahedral sections: browser explorers and Julia package

Interactive numerical software accompanying Ismail Hammoudeh's *Plane
Sections of Symmetric Tetrahedral Cones*. Port version **0.1.0**.

**Open the app:** <https://ismaa3iil.fyi/tetrahedral-sections/explorer/>

**Paper:** <https://ismaa3iil.fyi/tetrahedral-sections/>

This directory contains free software under the [MIT license](LICENSE.txt).
The existing research paper and archived Wolfram files retain their own status.

## Browser application

- Four linked views: angle-barycentric triangle space, complex triangle space,
  the produced triangle and its conics, and a rotatable 3D cone.
- Height, plane angle and rotation controls; elliptic, parabolic and hyperbolic
  presets; phi-orbit triangles; Euler line, Kiepert hyperbola, Steiner ellipses,
  and Kimberling X(1)–X(20) overlays.
- Inverse-apex explorer with 24 triangle presets, draggable A/B/C coordinates,
  C1–C4 center loci, parabolic stars, all twelve transition slices, and a
  coordinate/barycentric table. Drag and release to recompute or rotate.
- Sampled E/P/H, parabolic-height, planar-limit, structural-phase and T9
  atlases, plus a 13-phase representative-height atlas.
- Individual SVG downloads and JSON geometry downloads.

The browser calculates directly in JavaScript. It does **not** execute Julia
or Wolfram on GitHub Pages, and needs no commercial runtime or remote compute
service. Source equations and the exact generated eliminant are shared with
the Julia package; independent numeric implementations are tested below.

## Run locally

Serve this directory over HTTP (ES modules and workers cannot reliably be
loaded by double-clicking `index.html`):

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open <http://127.0.0.1:8000/>. No Python packages are required. Alternatively:

```sh
julia julia/serve.jl
```

## Julia mathematical API

Julia 1.10 or later; only Julia standard libraries are required.

```julia
# From this explorer directory:
using Pkg
Pkg.activate("julia")
using TetrahedralSections

h, mu, phi = sqrt(2.0), 0.65, 0.4
vertices = section(h, mu, phi)
q = side_weights(vertices)
inverse_sections(q, h)       # unordered inverse shapes at a fixed height
inverse_at_mu(q, mu)         # tetrahedral heights at a fixed mu

triangle = [[-1.0, 0.0], [1.0, 0.0], [0.25, 1.35]]
rows = inverse_sections(side_weights(triangle), h)
apex_solutions(triangle, rows)  # labeled spatial apices and centers
strand_data(triangle; samples=180, max_h=120)
```

Angles are radians. `q` means squared sides normalized to sum to one, in the
order opposite vertices A, B, C. See `julia/src/TetrahedralSections.jl` for the
complete API. `strand_data` returns sampled slices without imposing branch
connections. The browser additionally connects slices for drawing.

Higher precision for sensitive numerical cases:

```julia
setprecision(256) do
    h, mu, phi = sqrt(big(2)), big"0.65", big"0.4"
    q = side_weights(section(h, mu, phi))
    inverse_sections(q, h;
        rtol=big"1e-50", xtol=big"1e-30", shape_tol=big"1e-30")
end
```

Root bounds and physical-filter cutoffs remain finite. These routines are
numerical, including with BigFloat; use the original exact certificates for
proofs or certified counts at exceptional configurations.

## Verification and regeneration

```sh
node --test tests/geometry.test.mjs
julia --project=julia julia/test/runtests.jl
python3 -m pip install sympy==1.14.0
python3 scripts/derive.py
```

`derive.py` derives the eliminant by exact symbolic elimination from the
original invariant formulas. It produces both JavaScript and Julia integer
coefficient tables. No Wolfram session is required for the derivation.

See [PORTING.md](PORTING.md) for mathematical changes, limitations and provenance.
