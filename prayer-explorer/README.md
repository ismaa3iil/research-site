# Prayer Time Model Explorer

Open `prayer-explorer.html` in a modern browser. It is a self-contained offline version. The editable files are in `dist/`. The included launcher can serve that folder at `http://127.0.0.1:8766/`.

Use **Save as favorite** beside the location controls, or **Manage favorites** to select a city directly from the directory. Select **Save scenario…** to name the current settings. In **Compare**, overlay selected scenarios or choose **Subtract two scenarios** and set A and B in that order. Select a prayer, a value and an inclusive calendar date range. The graph CSV provides the plotted values in minutes or days. Time overlays use each scenario’s saved clock, and daily subtraction pairs identical calendar dates.

The browser application contains the solar data for every date in 2026–2030. Its calculations work without an external astronomy service. Fonts have a system fallback. Favorites and saved comparison scenarios remain in the current browser.

## Calculations

- Sunrise and sunset have independent 34-arcminute refraction and 16-arcminute solar-radius switches. Noon is their symmetric midpoint.
- The ephemeris is sampled at 12:00 UTC and frozen within each date. Clock times include the equation of time and either the selected city’s time zone, a fixed UTC offset, or local apparent solar time.
- The Makka reference date is selected each year from the closest May and July dates by the smaller residual noon shadow. “Exact” fractions are unrounded values on that sampled reference date. Help displays both candidates and the remaining shadow. This choice makes the 2026 reference 15 July in the supplied daily data.
- Fajr uses one of five night fractions and a corresponding Makka-calibrated depression. Afternoon fractions are 0.5/0.7 or the calibrated values at 45° and arctan(1/2).
- ʿIshāʾ uses the same depression as Fajr and the same fraction after sunset that Fajr uses before sunrise. It reflects the following dawn about the model’s solar midnight. Ḍuḥā reflects each first ʿAṣr model about solar noon. This is a symmetric midmorning construction.
- The shadow comparator offers (k₁,k₂) = (0,0), (1,1), (1,2), or independent annual count fits. A separate fitting tolerance allows rescoring one fitted coefficient at another cutoff.
- Compatibility uses a strict absolute discrepancy cutoff. All dates remain in the count denominator, including missing events. Conditional RMS and maximum use the defined pairs.
- Latitude sweeps include spherical area weights, sampled all-year bands, and six tolerance counts. The app’s Guide documents the formulas and numerical conventions.

## Verification

Run `node --test tests/engine.test.cjs` from this folder. The checks reproduce archived city counts, verify exact calibration matches, horizon symmetry, polar coverage, fixed-versus-fitted performance, a dense independent coefficient search, time-zone changes, and the earlier winter sunset intervals.

`scripts/prepare_data.py` regenerates `dist/ephemeris.js` from the project’s retained pvlib SPA implementation. It requires NumPy and access to the sibling `paper_v8/` source. The app itself requires only a browser. `dist/third-party.txt` retains the pvlib license.

The entry points are `dist/engine.js` for pure calculations, `dist/app.js` for controls and exports, `dist/charts.js` for graphs, and `dist/help.js` for the in-app methods guide.
