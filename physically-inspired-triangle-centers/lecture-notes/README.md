# Triangle Centers Inspired by Physics — Lecture Notes

First teaching edition, 1 October 2026. Evidence snapshot: 30 September 2026.

The 93-page book has six main chapters, three appendices, 32 vector figures
and 83 questions/exercises with answers. It collects all 102 records of the
six-lecture course, with additional mathematical derivations and proofs.
It can be read without the presentation or project atlas.

## Files

- PITC_Lecture_Notes.pdf: actual LaTeX-generated book, with searchable text,
  hyperlinks, bookmarks, embedded fonts and vector figures.
- PITC_Lecture_Notes.tex: a complete single-file source. All diagrams and
  plotting coordinates are embedded. No external images, bibliography file,
  vendor database or project-specific style file is required to compile it.
- Interactive_Demonstrations.html in the companion ZIP: optional offline
  geometry, heat, billiard and diffraction demonstrations.
- lecture_coverage.json: correspondence with all 102 presentation records.
- validation.json: compilation, coverage and visual review record.
- evidence/: selected project certificates and dated analytical addendum.

## Compile

Use an up-to-date TeX distribution with the standard packages named in the
preamble, including TikZ/PGFplots, AMS mathematics, geometry, enumitem,
hyperref and Latin Modern. Run pdfLaTeX three times on
PITC_Lecture_Notes.tex to resolve the contents and references.
No shell escape, image generation, external data or package installation
is invoked by the source.

This edition was compiled using the installed MiKTeX pdfLaTeX with automatic
package installation disabled. The native editor compiler currently reports
"Unable to find standard directories for platform". The delivered PDF
was successfully exported by MiKTeX and every page rendered and reviewed.
The source remains open in the editor.

## Scientific conventions

The reference triangle is A=(0,0), B=(4,0), C=(0,3). Physical parameters
are dimensionless and are held fixed when triangle shape changes.
Archived color fields use a coarse display mesh, not the solver refinement
mesh; heat panels are each normalized to their own peak.
ETC location rankings are numerical comparisons on declared training and
holdout shapes, not identities.

General attractivity proofs, interval-certified failures, refined numerical
witnesses, positive screens and open conjectures have separate labels.
Four distinct course centers have general proofs: X1, X2, X10 and X360.
The E0/E1/E2/M1 failures are certified. M6 is a strong conjecture.
The large-removal Abs family and small-height Solid family have eventual
failure results, without an explicit certified parameter threshold.

The PDF export has no unresolved references, missing-glyph diagnostics or
overfull boxes. This is a typesetting and coverage check, not a new
certification of every archived physical calculation.
