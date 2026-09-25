# Beauty of Triangle Centers

Static web atlas for the 120 highest-ranked symmetry-aware interestingness diagrams and the 120 most quadtree-compressible diagrams generated from the Extended Triangle Center search.

The application is dependency-free and is published by GitHub Pages as part of the `research-site` repository. It loads only the current pair of full-resolution PNGs, then preloads the adjacent pair.

Right-hand quadtree diagrams use lossless tight crops for display so compact attractors fill the same viewing area as the interestingness diagrams. The downloadable PNG remains the uncropped 6,667 × 5,779 source. Rebuild those display crops after rebuilding `data/atlas.json`:

```powershell
python .\tools\build-quadtree-tight-crops.py
```

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
- quadtree compressibility rank ordered by `q` ascending, with diagram identifier as the deterministic tie-breaker; lower `q` means stronger compression relative to an equal-density random raster.

The two downloadable PDFs are unmodified copies of the completed atlases.
