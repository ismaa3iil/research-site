# Power Centers Explorer

**Research and authorship: Ismail Hammoudeh. Developed with extensive use of ChatGPT.**

A free, open-source, browser-based mathematical explorer for power centers and hull-power centers. The browser computes everything locally using JavaScript, Gaussian quadrature, Newton's method, Canvas, and Web Workers. No paid mathematics software, external CDN, account, backend, or runtime package installation is required.

The published version belongs to [Ismail Hammoudeh's research website](https://ismaa3iil.fyi/power-centers-explorer/). This directory is also a complete, independently hostable static app.

## Explore

- Drag the vertices of a triangle or a tetrahedron. Drag empty space to rotate the tetrahedron; choose view, XY, XZ, or YZ planes for vertex motion.
- Change the exponent with a slider, a precise numerical input, quick selections, or animation.
- Triangles cover **1.01 â‰¤ p â‰¤ 24.99**, with 33 ETC comparison powers. Tetrahedra cover **4 âˆ’ 2âˆš2 â‰¤ p â‰¤ 19.95**.
- See both centers, their curves over the full power range, their coordinates, and their separation.
- Magnify the center curves or focus the main view on them. Inspect any coordinate against p in the lower chart.
- Edit exact vertex coordinates. Select a vertex and use arrow keys; hold Shift for larger motions.
- Inspect the last vertex motion through h Â· (center after âˆ’ center before), recomputed at the currently selected power.
- Share a link retaining the geometry, exponent, and 3D view. Export curve data as CSV or the geometry view as PNG.
- Start from regular, asymmetric, thin, or near-upper-branch configurations.
- Overlay the three ETC neighbors of either center, or both shortlists. Compare training, validation, and current-triangle distances.
- Read independent attractivity labels and load, apply, and reset exact finite failure witnesses.

## Mathematics and numerical limits

For vertices vâ‚€,â€¦,v_d, the atomic power center minimizes Î£áµ¢â€–xâˆ’váµ¢â€–áµ–. The hull-power center minimizes Eâ€–xâˆ’Î£áµ¢Î»áµ¢váµ¢â€–áµ–, with Î» uniform on the reference barycentric simplex (Dirichlet parameters all one). For proper shapes this is uniform area in a triangle or uniform volume in a tetrahedron. At degenerate shapes the same barycentric law is retained; it is not replaced with uniform length or area on a collapsed hull. At p=2 both centers are exactly the vertex centroid.

Coordinates are normalized by the longest edge. For proper simplices the volume gradient and stiffness are evaluated through edge/face boundary integrals. This avoids sampling the singular interior kernel when 1<p<2. Triangle edges use graded panels for noneven powers below 8. Atomic solves below 2 start with generalized Weiszfeld majorization before Newton iteration. Near collapse, fixed-barycentric volume quadrature is used. The selected hull center is recomputed at a higher quadrature order and the difference is reported in the mathematics panel. A warning appears for unresolved Newton solves or substantial order sensitivity.

Floating-point calculations, agreement between quadrature orders, and the finite-motion probe **are not rigorous certificates**. Extremely thin or collapsed shapes can require higher precision or specialized quadrature beyond this browser tool. Full curves use the selected base quadrature order; the current selected hull center uses the higher check order. A tiny offset between a curve and its selected marker can therefore occur. A negative motion probe is numerical evidence about that particular motion; a positive value does not establish all-direction or all-shape attractivity.

Research status incorporated from Hammoudeh's *Power Centers and Hull-Power Centers*, revised through 6 October 2026:

- The universal atomic interval is exactly [4âˆ’2âˆš2,4+2âˆš2].
- The common all-dimensional hull interval reaches 4+2âˆš2+1/2,000,000.
- Triangle hull-power attractivity has a continuous all-shape proof through p=16 and separate all-shape proofs at p=20 and p=21. Continuity throughout (16,21) remains open.
- Numerical upper failure branches occur near 21.63336 for triangles and 19.95468 for a proper tetrahedral family. The displayed upper limits are exploration limits, not proved sharp all-shape thresholds.

## ETC fingerprints and attractivity

No target barycentric function is required. PITCâ€™s 100-triangle angle grid supplies diameter-normalized Cartesian RMS fingerprints; 40 independent shapes validate the shortlist without determining its order. The 33 powers are compared against the **70,853 complete finite entries** of the supplied **72,807-entry ETC snapshot**, with unsupported or singular entries excluded. This is a sampled comparison within that snapshot. Rankings are not interpolated at arbitrary powers. At p=2 both targets equal X(2) exactly.

The 82 distinct shortlisted ETC rules are tested independently of their matching powers. Forward automatic differentiation checks all three symmetric vertex responses on 983 proper triangles. Exact rational intervals certify 33 negative finite witnesses. X(2), X(18236), and X(56203) are proved attractive; the latter two have positive polynomial coefficient certificates for finite motions with proper triangle endpoints. The 46 remaining rules have no sampled failure and remain unproved.

X(7934), the leading hull neighbor at p=12, fails on the isosceles triangle (0,0),(1,0),(1/2,5/8). Moving the apex by (1/1000,0) gives an exact negative dot product. Conversely, the leading atomic neighbor at p=7, X(18236), is proved attractive although the atomic target is outside its universal positive interval. Numerical proximity does not transfer either attractivity or failure.

Downloads in `data/` include all rankings, response statuses, exact negative interval records, and positive coefficient lists. The research scripts in the companion research workspace regenerate and replay these records with free Python and JavaScript; exact replays use only the Python standard library. ETC formulas retain attribution to Clark Kimberling and contributors; the selected Triangle Center Tools snapshot is supplied under the Unlicense. See [external notices](THIRD_PARTY_NOTICES.md).

The revised [38-page article](research/Power_Centers_and_Hull_Power_Centers.pdf), its [standalone LaTeX source](research/Power_Centers_and_Hull_Power_Centers.tex), and exact Python replay scripts are included. From this explorer directory, with free Python 3:

```sh
python -S research/etc_matching/certify_neighbors.py --replay
python -S research/etc_matching/prove_positive.py --replay 18236 56203
```

These replays use the exported ETC formulas and certificates, need no PITC database or installed packages, and assert exact agreement with the accepted records. Proper triangle endpoints are the stated domain of the two noncentroid positive proofs. The research article itself is not covered by the explorerâ€™s software license.

## Run locally

With free [Node.js](https://nodejs.org/) version 20 or newer:

```sh
npm start
```

Open `http://127.0.0.1:4173/`. Serve over HTTP rather than double-clicking `index.html`, because the application uses module workers. Set `PORT` to choose another port.

```sh
npm test
npm run build
node scripts/serve.mjs --dist
```

The build emits a small static `dist/` directory. All asset paths are relative, supporting repository subpaths. There are no application dependencies to install.

## Validation

The 17 Node tests check Gaussian moments, exact centroids, symmetric shapes, translation/rotation/scale/permutation invariance, independent Python reference values, and an analytic collapsed barycentric example. They also compare the ETC evaluator with 255 independent PITC positions, automatic derivatives with centered differences, positive polynomial expansions with differentiated responses, and every negative witness with independent finite evaluation. The ten fixtures in `tests/reference.json` originate from the existing research's NumPy solvers: graded triangle boundary integration and an independent tetrahedron volume implementation. `tests/reference.py` documents regeneration within that research workspace; it is not needed to run the app.

Optional real-browser regression checks use free Playwright:

```sh
npm install --no-save playwright
npx playwright install chromium
# In another terminal, keep npm start running.
node tests/browser.mjs
```

The checks exercise dragging, keyboard motion, tetrahedral z editing, orbiting, centroid values, CSV download, shared-state restoration, and mobile layout. Set `EXPLORER_URL` to test a deployed instance. `CHROME_PATH` can select an existing Chrome executable; `PLAYWRIGHT_PACKAGE` can select the package.json path of an existing Playwright installation. Browser-test dependencies are optional and do not affect the published app.

## Publish through GitHub

On an existing GitHub Pages website, place this directory in a new site subdirectory, excluding `dist/` and `test-results/`. The website's publishing process serves it directly; an independent workflow is unnecessary there.

For a new standalone public repository, upload the files at the repository root. In repository Settings â†’ Pages, choose GitHub Actions as the publishing source. The supplied `.github/workflows/pages.yml` runs the numerical tests, builds the static files, and deploys the Pages artifact. Update the source link in `index.html` to the new repository. See [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## License and attribution

MIT license, copyright 2026 Ismail Hammoudeh. Retain the author and license notices when distributing the software. Extensive use of ChatGPT is acknowledged throughout the explorer and source. The software license does not imply a separate license for other research articles on the website.
