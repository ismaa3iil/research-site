# Beauty of Triangle Centers

Static web atlas for the 120 highest-ranked symmetry-aware interestingness diagrams and the 120 highest-ranked quadtree Wundt-gate diagrams generated from the Extended Triangle Center search.

The application is dependency-free and is published by GitHub Pages as part of the `research-site` repository. It loads only the current pair of full-resolution PNGs, then preloads the adjacent pair.

## Rebuild the atlas data

From PowerShell:

```powershell
./tools/build-atlas-data.ps1 `
  -CsvPath /path/to/FullETC_interestingness_ranking.csv `
  -OutputPath ./data/atlas.json
```

The script applies the same ranking rules used by the PDF atlas:

- completed orbit and interestingness results only;
- neural interestingness ordered by its stored global rank;
- quadtree rank ordered by `4 q (1-q)`, with diagram identifier as the deterministic tie-breaker.

The two downloadable PDFs are unmodified copies of the completed atlases.
