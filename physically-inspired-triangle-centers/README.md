# Triangle Centers Inspired by Physics

Research monograph, atlas, teaching materials, and interactive visualization published at:

<https://ismaa3iil.fyi/physically-inspired-triangle-centers/>

## Published resources

- `monograph/PITC_Monograph.pdf`: 274-page consolidated research edition, dated 3 October 2026. Six physical studies, a common introductory chapter, and six thematic appendices.
- `monograph/PITC_Monograph_Source_and_Evidence.zip`: supplied complete monograph source-and-evidence archive, including the same book PDF, editable LaTeX source, figures, selected computational evidence, audits, and its integrity manifest.
- `lectures/Triangle_Centers_Physics_Miniseries_Improved.pptx`: improved 102-slide PowerPoint, dated 3 October 2026. Editable typeset equations, true subscripts/superscripts, revised graph legends and annotations; original notes, chart workbooks, and animation sequences preserved.
- `Triangle_Centers_Inspired_by_Physics.pdf`: Version 2 atlas, dated 30 September 2026, 187 pages. Replaces the first draft at its existing URL.
- `explorer/`: the deployable contents of the supplied Triangle Physics Explorer `dist/` folder. Relative assets work at this project subpath. No build, backend, paid API, or account is required to use the app.
- `lecture-notes/PITC_Lecture_Notes.pdf`: 93-page first teaching edition, dated 1 October 2026.
- `lecture-notes/PITC_Lecture_Notes_Companion.zip`: supplied complete teaching companion, including source, offline demonstrations, evidence, and validation records.
- `lecture-notes/PITC_Lecture_Notes.tex`, `lecture_coverage.json`, and `README.md`: individually accessible source and documentation.
- `Triangle_Physics_Explorer_GitHub_Handoff.zip`: supplied original complete explorer handoff, including the data exporter and verification scripts.

The original PDF and ZIP bytes are retained. The explorer's original software is MIT licensed (`explorer/LICENSE`); bundled KaTeX has its own MIT license, and external ETC material retains its attribution.

The monograph source-and-evidence archive is self-contained for typesetting and inspecting its saved evidence. Full regeneration of the underlying research requires the separate six-chapter software handoff and external dependencies described in its README. Its selected evidence is not a certificate for every plotted center.

## Deployment and verification

This project shares the Research Site's existing GitHub Pages deployment. The explorer assets are served directly from `explorer/`; do not replace the site-wide deployment with the standalone `dist` workflow inside the downloadable handoff.

Preview the repository root with any static HTTP server. For numerical checks, extract the original explorer handoff and run `node verify.cjs` and `node verify_fingerprints.cjs` from `Triangle_Physics_Explorer/`. The publication checks passed 1,973 geometry/atlas/solver checks and 22 angular fingerprint checks. These are software checks; the methods and theory cards preserve separate scientific evidence levels.
