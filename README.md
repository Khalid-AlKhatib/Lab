# ArgsBase Lab website

A static, responsive website with a generated shared shell and JSON-backed content. The deployed HTML, visual design, and interaction behavior are intentionally kept independent from the maintenance scripts.

## Requirements

- Python 3.9 or newer for build, audit, and packaging tools
- Node.js for the JavaScript utility tests
- No third-party Python packages
- A modern browser for preview and deployment

## Project structure

- `index.html` and the section folders contain deployable static pages.
- `css/site.css` is the single authored stylesheet.
- `js/app.js` contains shared interaction behavior and the accessible tab controller.
- `js/content.js` renders JSON-backed sections, validates URLs, and loads the offline fallback only for `file://` previews.
- `data/*.json` are the authoritative sources for data-driven content.
- `data/site-data.js` is generated and must not be edited manually.
- Research content is maintained directly in `research/index.html` because it uses a richer page-specific structure.
- `scripts/project.py` contains shared build constants, including the release version.

## Content updates

1. Edit the relevant file in `data/`.
2. Run `python3 scripts/build-site-data.py`.
3. Run `python3 scripts/build-shell.py` only after changing the shared navigation or footer templates.

## Preview

Run a local static server from the project root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`. Direct `file://` previews remain supported through the generated offline bundle, but HTTP preview is preferred.

## Quality checks

Run the complete checks with:

```bash
python3 scripts/audit.py
node scripts/test-content.js
```

The audit covers HTML landmarks and headings, local assets, cache-version consistency, JSON/fallback parity, CSS variables, JavaScript and Python syntax, icon coverage, typography rules, and release-package hygiene.

## Release workflow

Update `RELEASE_VERSION` in `scripts/project.py`, then synchronize references with:

```bash
python3 scripts/set-release-version.py
```

Create a validated, reproducible archive with:

```bash
python3 scripts/package.py
```

Packaging regenerates derived files, rebuilds the shared shell, runs all checks, excludes local/generated cache files, and writes `argsbase-clean-release.zip` next to the project directory.

## Design and accessibility conventions

- The existing visual design is controlled centrally in `css/site.css`.
- Adobe Fonts kit `xdp1cxp` supplies Forma DJR Micro and the brand typeface.
- The interface uses one green accent, neutral surfaces, and two elevation levels.
- Every page includes a skip link and one `<main id="main-content">` landmark.
- Custom tab controls synchronize ARIA, focus, keyboard navigation, and hidden panel state.
- Dynamic text is escaped and dynamic URLs are restricted to approved schemes or safe relative paths.
- Navigation and footer are statically rendered into every page.
