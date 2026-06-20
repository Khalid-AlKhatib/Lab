# ArgsBase Lab website

A static, responsive website with shared shell generation and JSON-backed content.

## Requirements

- Python 3.9 or newer for the optional build scripts
- No third-party Python packages are required
- A modern browser for local preview and deployment

## Structure

- `index.html` and section folders contain deployable static pages.
- `css/site.css` is the single authored stylesheet.
- `js/app.js` contains shared interaction behavior, including the reusable accessible tab controller.
- `js/content.js` renders JSON-backed content, validates dynamic URLs, and loads offline fallback data only for `file://` previews.
- `data/*.json` are the authoritative sources for data-driven sections. Research content is maintained directly in `research/research.html` because it uses a richer, page-specific structure.
- `data/site-data.js` is generated for offline previews and must not be edited manually.
- `scripts/build-site-data.py` regenerates the offline data bundle.
- `scripts/build-shell.py` updates the shared navigation and footer between explicit HTML markers without reformatting unrelated markup.

## Updating content

1. Edit the relevant JSON file in `data/`.
2. Run `python3 scripts/build-site-data.py`.
3. Run `python3 scripts/build-shell.py` only after changing the shared navigation or footer templates in that script.

## Local preview

For normal HTTP behavior, run a local static server from the project root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

Opening pages directly with `file://` is supported through the generated `data/site-data.js` fallback, but HTTP preview is preferred.

## Quality conventions

- One shared CSS file and one canonical definition per component.
- No runtime-generated navigation or footer.
- Buttons, not anchors, are used for in-page tab controls.
- Custom tab controls support Arrow keys, Home, End, focus management, and synchronized ARIA/hidden states.
- Dynamic text is escaped.
- Dynamic URLs are restricted to HTTP(S), `mailto:`, `tel:`, fragments, and relative paths.
- JSON files are the sole content source; the offline bundle is generated from them.

## Accessibility and quality checks

- Every page includes a skip link and one `<main id="main-content">` landmark.
- Heading levels are audited to prevent semantic jumps.
- The custom icon audit verifies that every used `mdi-*` class has an SVG mapping.
- Invalid content URLs render as non-interactive cards instead of `href="#"` links.

Run the complete project audit with:

```bash
python3 scripts/audit.py
node scripts/test-content.js
```

Create a clean distribution archive with:

```bash
python3 scripts/package.py
```

## Typography

The site uses Adobe Fonts through the project kit `xdp1cxp`. The canonical interface family is **Forma DJR Micro**, using only the licensed 400 and 700 weights (plus their italics). Typography sizes, line heights, and tracking are controlled centrally in `css/site.css`; page-specific font-family overrides should not be added.


## Visual system

- Forma DJR Micro is used for body copy, headings, and interface text for consistent readability.
- The ArgsBase wordmark uses Kobenhavn CS throughout, with light letterforms and subtly stronger A and B initials.
- The interface uses one green accent, a neutral surface scale, and exactly two elevation levels.
- Coloured surfaces are separated by spacing and tone rather than redundant borders or nested panels.
- Profile pages use a compact hero, a labelled support grid, and simplified content cards for easier scanning.


## Final minor refinements

- Refined the ArgsBase wordmark with lighter, slightly extended lettering and stronger A and B initials.
- Removed visible borders from Research theme accordions while preserving focus and interaction states.
- Added explicit layout rules for Khalid profile accordion summaries to prevent text and icon overlap.
