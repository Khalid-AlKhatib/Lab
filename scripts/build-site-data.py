#!/usr/bin/env python3
"""Generate the offline fallback bundle from the authoritative JSON files."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
KEYS = ("members", "news", "positions", "publications", "teaching")

payload = {
    key: json.loads((DATA_DIR / f"{key}.json").read_text(encoding="utf-8"))
    for key in KEYS
}
output = (
    "/* Generated from data/*.json. Do not edit manually. */\n"
    "window.LTS_DATA = "
    + json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True)
    + ";\n"
)
(DATA_DIR / "site-data.js").write_text(output, encoding="utf-8")
print("Generated data/site-data.js from", ", ".join(KEYS))
