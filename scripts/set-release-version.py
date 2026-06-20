#!/usr/bin/env python3
"""Synchronize authored asset cache versions across source files."""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True

from project import RELEASE_VERSION

ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = [ROOT / "index.html", *sorted(ROOT.glob("*/*.html"))]
ASSET_PATTERN = re.compile(r"((?:css/site\.css|js/(?:icons|app|content)\.js)\?v=)[^\"']+")
OFFLINE_PATTERN = re.compile(r'(dataUrl\("site-data\.js"\) \+ "\?v=)[^\"]+(\")')


def update(path: Path, pattern: re.Pattern[str], replacement) -> bool:
    original = path.read_text(encoding="utf-8")
    updated = pattern.sub(replacement, original)
    if updated == original:
        return False
    path.write_text(updated, encoding="utf-8")
    return True


def main() -> int:
    changed = []
    for path in HTML_FILES:
        if update(path, ASSET_PATTERN, lambda match: match.group(1) + RELEASE_VERSION):
            changed.append(path.relative_to(ROOT))
    content_path = ROOT / "js/content.js"
    if update(content_path, OFFLINE_PATTERN, lambda match: match.group(1) + RELEASE_VERSION + match.group(2)):
        changed.append(content_path.relative_to(ROOT))
    print("Release version", RELEASE_VERSION, "synchronized; changed", len(changed), "file(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
