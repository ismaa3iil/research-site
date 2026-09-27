# Beauty of Triangle Centers

Static web atlas and optional anonymous preference study for three Top-120 rankings generated from the Extended Triangle Center search:

- symmetry-aware neural interestingness, descending;
- raw quadtree code length, ascending;
- modified compressibility, the former Wundt gate `4 q (1-q)`, descending.

The application is dependency-free and is published by GitHub Pages as part of the `research-site` repository. It loads only the current three full-resolution PNGs, then preloads the adjacent comparison.

The browser uses crop coordinates rather than derivative files, so compact attractors fill their cards without resampling or duplicating the source PNGs. The middle diagram is visually inverted when needed to match the three-triangle atlas. Rebuild the display metadata after rebuilding `data/atlas.json`:

```powershell
python .\tools\build-display-metadata.py `
  --source-dir /path/to/display_cache_50k
```

## Rebuild the atlas data

From PowerShell:

```powershell
./tools/build-atlas-data.ps1 `
  -CsvPath /path/to/FullETC_interestingness_ranking.csv `
  -OutputPath ./data/atlas.json
```

The script applies the same ranking rules used by the revised three-triangle atlas:

- completed orbit and interestingness results only;
- neural interestingness ordered by its stored global rank;
- raw quadtree code length ordered ascending, with diagram identifier as the deterministic tie-breaker;
- the former Wundt gate `4 q (1-q)` ordered descending, again with a deterministic identifier tie-breaker.

## Preference study

Visitors can assign a complete 1–2–3 ordering at any comparison position. Their browser stores the choices, displays first-place counts and mean ranks, and can export or erase them. Central contribution is opt-in. Configure the privacy-preserving receiver in `preference-config.js` only after deploying and testing the code in `collector/`.

The collector stores a salted hash of a random browser-local identifier, not a person’s identity. It upserts revisions and supports single-answer and complete retraction. See `collector/README.md` before enabling collection.

The two downloadable PDFs are unmodified copies of the completed atlases.
