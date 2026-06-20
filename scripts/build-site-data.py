#!/usr/bin/env python3
"""Generate the offline fallback bundle from the authoritative JSON files."""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.dont_write_bytecode = True

from project import DATA_KEYS

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
OUTPUT_PATH = DATA_DIR / "site-data.js"


def build_payload() -> dict[str, object]:
    """Load every authoritative JSON dataset."""
    return {
        key: json.loads((DATA_DIR / f"{key}.json").read_text(encoding="utf-8"))
        for key in DATA_KEYS
    }


def render_bundle(payload: dict[str, object]) -> str:
    """Serialize the fallback bundle in its stable generated format."""
    return (
        "/* Generated from data/*.json. Do not edit manually. */\n"
        "window.LTS_DATA = "
        + json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True)
        + ";\n"
    )


def main() -> int:
    OUTPUT_PATH.write_text(render_bundle(build_payload()), encoding="utf-8")
    print("Generated data/site-data.js from", ", ".join(DATA_KEYS))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
