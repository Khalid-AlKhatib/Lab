#!/usr/bin/env python3
"""Create a clean distribution ZIP without generated or local-only files."""
from __future__ import annotations

from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT.parent / "argsbase-clean-release.zip"
EXCLUDED_PARTS = {".git", "__pycache__"}
EXCLUDED_NAMES = {".DS_Store", "DOMAIN_FIX_INSTRUCTIONS.md"}


def include(path: Path) -> bool:
    relative = path.relative_to(ROOT)
    if any(part in EXCLUDED_PARTS for part in relative.parts):
        return False
    if path.name in EXCLUDED_NAMES or path.suffix in {".pyc", ".pyo"}:
        return False
    return path.is_file()


with ZipFile(OUTPUT, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
    for path in sorted(ROOT.rglob("*")):
        if include(path):
            archive.write(path, path.relative_to(ROOT))

print(OUTPUT)
