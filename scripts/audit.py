#!/usr/bin/env python3
"""Run lightweight integrity and quality checks for the static website."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

sys.dont_write_bytecode = True

from project import RELEASE_VERSION

ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = [ROOT / "index.html", *sorted(ROOT.glob("*/*.html"))]
AUTHORED_JS = [ROOT / "js/app.js", ROOT / "js/content.js", ROOT / "js/icons.js"]

class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: list[str] = []
        self.h1_count = 0
        self.references: list[tuple[str, str]] = []
        self.images: list[dict[str, str | None]] = []
        self.links: list[dict[str, str | None]] = []
        self.main_count = 0
        self.valid_main_count = 0
        self.skip_links = 0
        self.heading_levels: list[int] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.ids.append(values["id"] or "")
        if tag == "h1":
            self.h1_count += 1
        if tag == "main":
            self.main_count += 1
            if values.get("id") == "main-content" and values.get("tabindex") == "-1":
                self.valid_main_count += 1
        if tag == "a" and values.get("class") and "skip-link" in (values.get("class") or "").split():
            if values.get("href") == "#main-content":
                self.skip_links += 1
        if re.fullmatch(r"h[1-6]", tag):
            self.heading_levels.append(int(tag[1]))
        if tag in {"script", "img", "link"}:
            url = values.get("src") or values.get("href")
            if url:
                self.references.append((tag, url))
        if tag == "img":
            self.images.append(values)
        if tag == "a":
            self.links.append(values)


def local_path(page: Path, url: str) -> Path | None:
    if url.startswith(("http:", "https:", "//", "mailto:", "tel:", "#", "data:")):
        return None
    return (page.parent / url.split("?", 1)[0]).resolve()


def audit_html(errors: list[str]) -> None:
    for page in HTML_FILES:
        parser = PageParser()
        parser.feed(page.read_text(encoding="utf-8"))
        duplicates = sorted({item for item in parser.ids if parser.ids.count(item) > 1})
        if duplicates:
            errors.append(f"{page.relative_to(ROOT)}: duplicate IDs: {', '.join(duplicates)}")
        if parser.h1_count != 1:
            errors.append(f"{page.relative_to(ROOT)}: expected one h1, found {parser.h1_count}")
        if parser.main_count != 1:
            errors.append(f"{page.relative_to(ROOT)}: expected one main landmark, found {parser.main_count}")
        if parser.valid_main_count != 1:
            errors.append(f"{page.relative_to(ROOT)}: main landmark must use id=main-content and tabindex=-1")
        if parser.skip_links != 1:
            errors.append(f"{page.relative_to(ROOT)}: expected one skip link to #main-content, found {parser.skip_links}")
        for previous, current in zip(parser.heading_levels, parser.heading_levels[1:]):
            if current > previous + 1:
                errors.append(
                    f"{page.relative_to(ROOT)}: heading level jumps from h{previous} to h{current}"
                )
                break
        for image in parser.images:
            if "alt" not in image:
                errors.append(f"{page.relative_to(ROOT)}: image missing alt: {image.get('src')}")
        for tag, url in parser.references:
            path = local_path(page, url)
            if path and not path.exists():
                errors.append(f"{page.relative_to(ROOT)}: missing {tag} asset: {url}")
        for link in parser.links:
            if link.get("target") == "_blank" and "noopener" not in (link.get("rel") or ""):
                errors.append(f"{page.relative_to(ROOT)}: target=_blank without noopener: {link.get('href')}")
        html = page.read_text(encoding="utf-8")
        if html.count("<!-- shared-nav:start -->") != 1 or html.count("<!-- shared-nav:end -->") != 1:
            errors.append(f"{page.relative_to(ROOT)}: invalid shared-nav markers")
        if html.count("<!-- shared-footer:start -->") != 1 or html.count("<!-- shared-footer:end -->") != 1:
            errors.append(f"{page.relative_to(ROOT)}: invalid shared-footer markers")
        if "data/site-data.js" in html or "../data/site-data.js" in html:
            errors.append(f"{page.relative_to(ROOT)}: offline bundle must not load during normal page startup")
        for asset in ("css/site.css", "js/icons.js", "js/app.js"):
            if asset in html and f"{asset}?v={RELEASE_VERSION}" not in html:
                errors.append(f"{page.relative_to(ROOT)}: inconsistent cache version for {asset}")
        if "js/content.js" in html and f"js/content.js?v={RELEASE_VERSION}" not in html:
            errors.append(f"{page.relative_to(ROOT)}: inconsistent cache version for content.js")
        if page == ROOT / "research/index.html" and "js/content.js" in html:
            errors.append("research/index.html: static Research page must not load content.js")


def audit_json(errors: list[str]) -> None:
    data = {}
    for path in sorted((ROOT / "data").glob("*.json")):
        try:
            data[path.stem] = json.loads(path.read_text(encoding="utf-8"))
        except Exception as error:  # pragma: no cover - diagnostic path
            errors.append(f"{path.relative_to(ROOT)}: invalid JSON: {error}")
    fallback = (ROOT / "data/site-data.js").read_text(encoding="utf-8")
    match = re.fullmatch(r"/\* Generated from data/\*\.json\. Do not edit manually\. \*/\nwindow\.LTS_DATA = (.*);\n", fallback, re.DOTALL)
    if not match:
        errors.append("data/site-data.js: unexpected generated format")
        return
    try:
        generated = json.loads(match.group(1))
    except Exception as error:
        errors.append(f"data/site-data.js: invalid generated payload: {error}")
        return
    if generated != data:
        errors.append("data/site-data.js: generated fallback differs from authoritative JSON files")


def audit_css(errors: list[str]) -> None:
    css = (ROOT / "css/site.css").read_text(encoding="utf-8")
    without_comments = re.sub(r"/\*.*?\*/", "", css, flags=re.DOTALL)
    if without_comments.count("{") != without_comments.count("}"):
        errors.append("css/site.css: unbalanced braces")
    definitions = set(re.findall(r"--([\w-]+)\s*:", css))
    references = set(re.findall(r"var\(--([\w-]+)", css))
    undefined = sorted(references - definitions)
    if undefined:
        errors.append("css/site.css: undefined variables: " + ", ".join(undefined))
    important = css.count("!important")
    if important > 4:
        errors.append(f"css/site.css: expected at most 4 !important declarations, found {important}")
    if ".research-overview-card h2" not in css:
        errors.append("css/site.css: Research overview h2 styling is missing")
    if ".research-overview-card h3" in css:
        errors.append("css/site.css: stale Research overview h3 selector remains")


def audit_javascript(errors: list[str]) -> None:
    for path in AUTHORED_JS:
        result = subprocess.run(["node", "--check", str(path)], capture_output=True, text=True)
        if result.returncode:
            errors.append(f"{path.relative_to(ROOT)}: JavaScript syntax error: {result.stderr.strip()}")
    tests = subprocess.run(["node", str(ROOT / "scripts/test-content.js")], capture_output=True, text=True)
    if tests.returncode:
        errors.append("scripts/test-content.js failed: " + (tests.stderr.strip() or tests.stdout.strip()))
    content = (ROOT / "js/content.js").read_text(encoding="utf-8")
    forbidden = ["escapeHtmlsanitizeTrustedHtml", "window.__newsDataCache", 'cache: "no-store"']
    for token in forbidden:
        if token in content:
            errors.append(f"js/content.js: forbidden legacy token remains: {token}")
    if 'if (newsTab || newsList)' not in content:
        errors.append("js/content.js: News loading is not conditional on a News container")
    if 'attrs ? attrs.href : "#"' in content or 'href="#"' in content:
        errors.append("js/content.js: invalid content links must not fall back to #")
    if "item.img" in content or "accordion-thumb" in content:
        errors.append("js/content.js: obsolete Research illustration rendering remains")
    if "function renderMembers" not in content:
        errors.append("js/content.js: member renderer is missing")
    expected_offline_version = f'dataUrl("site-data.js") + "?v={RELEASE_VERSION}"'
    if expected_offline_version not in content:
        errors.append("js/content.js: offline fallback cache version is inconsistent")
    if "raw.indexOf(\"\\\\\")" not in content:
        errors.append("js/content.js: relative URL validation must reject backslashes")



def audit_icons(errors: list[str]) -> None:
    icons_source = (ROOT / "js/icons.js").read_text(encoding="utf-8")
    mapped = set(re.findall(r'"(mdi-[\w-]+)"\s*:', icons_source))
    used: set[str] = set()
    paths = [*HTML_FILES, ROOT / "js/content.js", *sorted((ROOT / "data").glob("*.json"))]
    for path in paths:
        text = path.read_text(encoding="utf-8")
        used.update(re.findall(r"\bmdi-[a-z0-9-]+", text))
    missing = sorted(used - mapped)
    if missing:
        errors.append("js/icons.js: unmapped icon classes: " + ", ".join(missing))


def audit_package(errors: list[str]) -> None:
    caches = sorted(ROOT.rglob("__pycache__"))
    pyc = sorted(ROOT.rglob("*.py[co]"))
    if caches or pyc:
        names = [str(path.relative_to(ROOT)) for path in [*caches, *pyc]]
        errors.append("Generated Python cache files included: " + ", ".join(names))

def audit_python(errors: list[str]) -> None:
    for path in (
        ROOT / "scripts/project.py",
        ROOT / "scripts/build-site-data.py",
        ROOT / "scripts/build-shell.py",
        ROOT / "scripts/set-release-version.py",
        ROOT / "scripts/audit.py",
        ROOT / "scripts/package.py",
    ):
        try:
            compile(path.read_text(encoding="utf-8"), str(path), "exec")
        except SyntaxError as error:
            errors.append(f"{path.relative_to(ROOT)}: Python syntax error: {error}")



def audit_typography(errors: list[str]) -> None:
    css = (ROOT / "css" / "site.css").read_text(encoding="utf-8")
    required = [
        '--font-body: "forma-djr-micro"',
        '--font-display: "forma-djr-micro"',
        '--font-brand-args: "kobenhavn-cs"',
        '--font-brand-base: "forma-djr-micro"',
        '--bs-body-font-family: var(--font-body)',
    ]
    for token in required:
        if token not in css:
            errors.append(f"Missing canonical typography rule: {token}")
    if (ROOT / "data" / "research.json").exists():
        errors.append("data/research.json: Research content must have a single source in research/index.html")
    if "research-theme-figure" in css:
        errors.append("Obsolete Research illustration styles remain in site.css")



def audit_visual_system(errors: list[str]) -> None:
    css = (ROOT / "css" / "site.css").read_text(encoding="utf-8")
    required = [
        '--font-body: "forma-djr-micro"',
        '--font-display: "forma-djr-micro"',
        '--font-brand-args: "kobenhavn-cs"',
        '--font-brand-base: "forma-djr-micro"',
        '--shadow-low:',
        '--shadow-high:',
        '--color-accent: #0b6258;',
    ]
    for token in required:
        if token not in css:
            errors.append(f"Missing visual-system rule: {token}")

    forbidden = [
        '--color-accent-2',
        '--color-warm',
        '--shadow-soft',
        '--shadow-control',
        '#39799b',
        '#55745e',
    ]
    for token in forbidden:
        if token in css:
            errors.append(f"Obsolete visual-system token or colour remains: {token}")

    shadow_values = re.findall(r"box-shadow:\s*([^;]+);", css)
    allowed = {"none", "var(--shadow-low)", "var(--shadow-high)"}
    unexpected = sorted({value.strip() for value in shadow_values if value.strip() not in allowed})
    if unexpected:
        errors.append("Unexpected shadow definitions: " + ", ".join(unexpected))

    if ".tool-link::before {\n  content: none;" not in css:
        errors.append("Tool cards must not reintroduce multicolour accent strips")
    if ".open-position {" not in css or "background: transparent;" not in css or "max-width: 760px;" not in css:
        errors.append("Open-position presentation is not using the simplified transparent treatment")


def main() -> int:
    errors: list[str] = []
    audit_html(errors)
    audit_json(errors)
    audit_css(errors)
    audit_javascript(errors)
    audit_icons(errors)
    audit_package(errors)
    audit_python(errors)
    audit_typography(errors)
    audit_visual_system(errors)
    if errors:
        print(f"Audit failed with {len(errors)} issue(s):")
        for error in errors:
            print("-", error)
        return 1
    print(f"Audit passed: {len(HTML_FILES)} HTML pages, JSON/fallback parity, CSS, JavaScript, Python, assets, and shell markers.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
