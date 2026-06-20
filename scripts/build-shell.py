#!/usr/bin/env python3
"""Render the shared navigation and footer into every HTML page.

Uses explicit comment markers, so unrelated page markup and formatting remain untouched.
No third-party Python packages are required.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = [ROOT / "index.html", *sorted(ROOT.glob("*/*.html"))]
NAV_ITEMS = [
    ("home", "Home", "index.html"),
    ("research", "Research", "research/research.html"),
    ("members", "Members", "members/members.html"),
    ("publications", "Publications", "publications/publications.html"),
    ("teaching", "Teaching", "teaching/teaching.html"),
]
NAV_RE = re.compile(r"<!-- shared-nav:start -->.*?<!-- shared-nav:end -->", re.DOTALL)
FOOTER_RE = re.compile(r"<!-- shared-footer:start -->.*?<!-- shared-footer:end -->", re.DOTALL)
BODY_RE = re.compile(r"<body\b([^>]*)>", re.IGNORECASE)


def prefix_for(page: Path) -> str:
    return "" if page.parent == ROOT else "../"


def body_attribute(html: str, name: str) -> str:
    match = BODY_RE.search(html)
    if not match:
        return ""
    attr = re.search(rf'\b{name}="([^"]*)"', match.group(1))
    return attr.group(1) if attr else ""


def active_for(html: str) -> str:
    explicit = body_attribute(html, "data-active-nav")
    if explicit:
        return explicit
    classes = set(body_attribute(html, "class").split())
    if "site-home" in classes:
        return "home"
    if "research-page-body" in classes:
        return "research"
    if classes & {"members-page-body", "member-profile-body"}:
        return "members"
    if "publications-page-body" in classes:
        return "publications"
    if "teaching-page-body" in classes:
        return "teaching"
    return ""


def nav_html(prefix: str, active: str) -> str:
    links = "\n".join(
        f'          <li class="nav-item"><a class="nav-link{" active" if key == active else ""}" href="{prefix}{path}">{label}</a></li>'
        for key, label, path in NAV_ITEMS
    )
    return f'''<!-- shared-nav:start -->
<nav class="navbar navbar-expand-lg fixed-top sticky" id="navbar">
  <div class="container-fluid custom-container">
    <a aria-label="ArgsBase Lab homepage" class="navbar-brand logo brand-lockup" href="{prefix}index.html">
      <img alt="" class="brand-mark-img" height="44" src="{prefix}images/optimized/logo.png" width="44"/>
      <span aria-label="ArgsBase" class="brand-name-text"><span class="brand-name-part brand-name-part--args"><span class="brand-name-initial">A</span><span class="brand-name-rest">rgs</span></span><span class="brand-name-part brand-name-part--base"><span class="brand-name-initial">B</span><span class="brand-name-rest">ase</span></span></span>
    </a>
    <button aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation" class="navbar-toggler" data-bs-target="#navbarCollapse" data-bs-toggle="collapse" type="button">
      <span aria-hidden="true" class="navbar-toggle-bars"><span></span><span></span><span></span></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarCollapse">
      <ul class="navbar-nav ms-auto navbar-center">
{links}
      </ul>
    </div>
  </div>
</nav>
<!-- shared-nav:end -->'''


def footer_html(prefix: str) -> str:
    links = "\n".join(
        f'          <li><a href="{prefix}{path}">{label}</a></li>'
        for _, label, path in NAV_ITEMS
    )
    return f'''<!-- shared-footer:start -->
<footer class="site-footer" id="contact">
  <div class="container">
    <div class="site-footer-grid">
      <div class="site-footer-brand">
        <a aria-label="ArgsBase Lab homepage" class="logo-line footer-brand-lockup" href="{prefix}index.html">
          <img alt="" class="brand-mark-img" height="36" src="{prefix}images/optimized/logo.png" width="36"/>
          <span aria-label="ArgsBase" class="brand-name-text"><span class="brand-name-part brand-name-part--args"><span class="brand-name-initial">A</span><span class="brand-name-rest">rgs</span></span><span class="brand-name-part brand-name-part--base"><span class="brand-name-initial">B</span><span class="brand-name-rest">ase</span></span></span>
        </a>
        <p>AI for reasoning, critical thinking, and society.</p>
      </div>
      <div>
        <h2>Navigate</h2>
        <ul>
{links}
        </ul>
      </div>
      <div>
        <h2>Affiliations</h2>
        <ul>
          <li><a href="https://www.rug.nl/" rel="noopener noreferrer" target="_blank">University of Groningen</a></li>
          <li><a href="https://www.rug.nl/research/clcg/research/cl/?lang=en" rel="noopener noreferrer" target="_blank">Computational Linguistics</a></li>
          <li><a href="https://www.webis.de" rel="noopener noreferrer" target="_blank">Webis</a></li>
        </ul>
      </div>
      <div>
        <h2>Contact</h2>
        <ul>
          <li>Oude Kijk in 't Jatstraat 26<br/>9712 EK Groningen</li>
          <li><a href="mailto:team@argsbase.net">team@argsbase.net</a></li>
          <li><a href="https://x.com/GroNlp" rel="noopener noreferrer" target="_blank">GroNLP on X</a></li>
        </ul>
      </div>
    </div>
    <div class="site-footer-bottom">
      <span>ArgsBase Lab · University of Groningen</span>
      <span>Updated June 2026</span>
    </div>
  </div>
</footer>
<!-- shared-footer:end -->'''


def update_body_base_path(html: str, prefix: str) -> str:
    match = BODY_RE.search(html)
    if not match:
        return html
    attrs = match.group(1)
    if re.search(r'\bdata-base-path="[^"]*"', attrs):
        attrs = re.sub(r'\bdata-base-path="[^"]*"', f'data-base-path="{prefix}"', attrs)
    else:
        attrs += f' data-base-path="{prefix}"'
    return html[: match.start()] + "<body" + attrs + ">" + html[match.end() :]


def render_page(page: Path) -> bool:
    """Render shared shell blocks and return whether the file changed."""
    original = page.read_text(encoding="utf-8")
    prefix = prefix_for(page)
    html = update_body_base_path(original, prefix)
    if not NAV_RE.search(html) or not FOOTER_RE.search(html):
        raise RuntimeError(f"Missing shared shell markers in {page.relative_to(ROOT)}")
    html = NAV_RE.sub(nav_html(prefix, active_for(html)), html, count=1)
    html = FOOTER_RE.sub(footer_html(prefix), html, count=1)
    if html == original:
        return False
    page.write_text(html, encoding="utf-8")
    return True


def main() -> int:
    for page in PAGES:
        status = "Updated" if render_page(page) else "Unchanged"
        print(status, page.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
