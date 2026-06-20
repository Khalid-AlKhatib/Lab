#!/usr/bin/env python3
"""Validate the project and create a reproducible clean distribution ZIP."""
from __future__ import annotations

import stat
import subprocess
import sys
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT.parent / "argsbase-clean-release.zip"
EXCLUDED_PARTS = {".git", "__pycache__"}
EXCLUDED_NAMES = {".DS_Store", "DOMAIN_FIX_INSTRUCTIONS.md"}
FIXED_TIMESTAMP = (2026, 6, 20, 0, 0, 0)


def include(path: Path) -> bool:
    relative = path.relative_to(ROOT)
    if any(part in EXCLUDED_PARTS for part in relative.parts):
        return False
    if path.name in EXCLUDED_NAMES or path.suffix in {".pyc", ".pyo"}:
        return False
    return path.is_file()


def run_checked(*command: str) -> None:
    subprocess.run(command, cwd=ROOT, check=True)


def write_reproducible(archive: ZipFile, path: Path) -> None:
    relative = path.relative_to(ROOT).as_posix()
    info = ZipInfo(relative, FIXED_TIMESTAMP)
    info.compress_type = ZIP_DEFLATED
    mode = path.stat().st_mode
    permissions = 0o755 if mode & stat.S_IXUSR else 0o644
    info.external_attr = (permissions & 0xFFFF) << 16
    archive.writestr(info, path.read_bytes(), compress_type=ZIP_DEFLATED, compresslevel=9)


def main() -> int:
    run_checked(sys.executable, "scripts/set-release-version.py")
    run_checked(sys.executable, "scripts/build-site-data.py")
    run_checked(sys.executable, "scripts/build-shell.py")
    run_checked(sys.executable, "scripts/audit.py")
    run_checked("node", "scripts/test-content.js")

    with ZipFile(OUTPUT, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
        for path in sorted(ROOT.rglob("*")):
            if include(path):
                write_reproducible(archive, path)

    print(OUTPUT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
