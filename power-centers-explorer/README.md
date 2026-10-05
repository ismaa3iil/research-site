# Power Centers Explorer

**Research and authorship: Ismail Hammoudeh. Developed with extensive use of ChatGPT.**

A free, open-source, browser-based mathematical explorer for power centers and hull-power centers. The browser computes everything locally using JavaScript, Gaussian quadrature, Newton's method, Canvas, and Web Workers. No paid mathematics software, external CDN, account, backend, or runtime package installation is required.

The published version belongs to [Ismail Hammoudeh's research website](https://ismaa3iil.fyi/power-centers-explorer/). This directory is also a complete, independently hostable static app.

## Explore

- Drag the vertices of a triangle or a tetrahedron. Drag empty space to rotate the tetrahedron; choose view, XY, XZ, or YZ planes for vertex motion.
- Change the exponent with a slider, a precise numerical input, quick selections, or animation.
- Triangles cover **4 − 2√2 ≤ p ≤ 21.63**. Tetrahedra cover **4 − 2√2 ≤ p ≤ 19.95**.
- See both centers, their curves over the full power range, their coordinates, and their separation.
- Magnify the center curves or focus the main view on them. Inspect any coordinate against p in the lower chart.
- Edit exact vertex coordinates. Select a vertex and use arrow keys; hold Shift for larger motions.
- Inspect the last vertex motion through h · (center after − center before), recomputed at the currently selected power.
- Share a link retaining the geometry, exponent, and 3D view. Export curve data as CSV or the geometry view as PNG.
- Start from regular, asymmetric, thin, or near-upper-branch configurations.

## Mathematics and numerical limits

For vertices v₀,…,v_d, the atomic power center minimizes Σᵢ‖x−vᵢ‖ᵖ. The hull-power center minimizes E‖x−Σᵢλᵢvᵢ‖ᵖ, with λ uniform on the reference barycentric simplex (Dirichlet parameters all one). For proper shapes this is uniform area in a triangle or uniform volume in a tetrahedron. At degenerate shapes the same barycentric law is retained; it is not replaced with uniform length or area on a collapsed hull. At p=2 both centers are exactly the vertex centroid.

Coordinates are normalized by the longest edge. For proper simplices the volume gradient and stiffness are evaluated through edge/face boundary integrals. This avoids sampling the singular interior kernel when 1<p<2. Triangle edges use graded panels below p=4. Near collapse, fixed-barycentric volume quadrature is used. The selected hull center is recomputed at a higher quadrature order and the difference is reported in the mathematics panel. A warning appears for unresolved Newton solves or substantial order sensitivity.

Floating-point calculations, agreement between quadrature orders, and the finite-motion probe **are not rigorous certificates**. Extremely thin or collapsed shapes can require higher precision or specialized quadrature beyond this browser tool. Full curves use the selected base quadrature order; the current selected hull center uses the higher check order. A tiny offset between a curve and its selected marker can therefore occur. A negative motion probe is numerical evidence about that particular motion; a positive value does not establish all-direction or all-shape attractivity.

Research status incorporated from Hammoudeh's *Power Centers and Hull-Power Centers*, revised through 5 October 2026:

- The universal atomic interval is exactly [4−2√2,4+2√2].
- The common all-dimensional hull interval reaches 4+2√2+1/2,000,000.
- Triangle hull-power attractivity has a continuous all-shape proof through p=16 and separate all-shape proofs at p=20 and p=21. Continuity throughout (16,21) remains open.
- Numerical upper failure branches occur near 21.63336 for triangles and 19.95468 for a proper tetrahedral family. The displayed upper limits are exploration limits, not proved sharp all-shape thresholds.

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

The Node tests check Gaussian moments, exact centroids, symmetric shapes, translation/rotation/scale/permutation invariance, independent Python reference values, and an analytic collapsed barycentric example. The ten fixtures in `tests/reference.json` originate from the existing research's NumPy solvers: graded triangle boundary integration and an independent tetrahedron volume implementation. `tests/reference.py` documents regeneration within that research workspace; it is not needed to run the app.

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

For a new standalone public repository, upload the files at the repository root. In repository Settings → Pages, choose GitHub Actions as the publishing source. The supplied `.github/workflows/pages.yml` runs the numerical tests, builds the static files, and deploys the Pages artifact. Update the source link in `index.html` to the new repository. See [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## License and attribution

MIT license, copyright 2026 Ismail Hammoudeh. Retain the author and license notices when distributing the software. Extensive use of ChatGPT is acknowledged throughout the explorer and source. The software license does not imply a separate license for other research articles on the website.
