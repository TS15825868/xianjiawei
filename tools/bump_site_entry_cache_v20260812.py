#!/usr/bin/env python3
"""Unify root HTML site JS/CSS cache keys to the current public image hotfix.

Also retires old approved-v405 composite images from social preview metadata and
from the active site core where those images contain generated/redrawn products.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260812-public-image-hotfix-v4"
PATTERN = re.compile(r'(?P<prefix>(?:src|href)=["\'])(?P<file>site(?:-[^?"\']+)?\.(?:js|css))\?v=[^"\']+(?P<suffix>["\'])', re.I)

RETIRED_META_IMAGES = {
    "https://ts15825868.github.io/xianjiawei/images/brand/approved-v405/home-brand.webp",
    "https://ts15825868.github.io/xianjiawei/images/brand/approved-v405/products-all.webp",
    "https://ts15825868.github.io/xianjiawei/images/brand/approved-v405/contact-line.webp",
    "https://ts15825868.github.io/xianjiawei/images/brand/approved-v405/combo.webp",
    "https://ts15825868.github.io/xianjiawei/images/brand/approved-v405/guide-how-to-use.webp",
}
SAFE_META_IMAGE = "https://ts15825868.github.io/xianjiawei/images/logo.png"

changed = []
for path in sorted(ROOT.glob("*.html")):
    text = path.read_text(encoding="utf-8")
    updated, count = PATTERN.subn(lambda m: f"{m.group('prefix')}{m.group('file')}?v={VERSION}{m.group('suffix')}", text)
    meta_count = 0
    for retired in RETIRED_META_IMAGES:
        occurrences = updated.count(retired)
        if occurrences:
            updated = updated.replace(retired, SAFE_META_IMAGE)
            meta_count += occurrences
    if updated != text:
        path.write_text(updated, encoding="utf-8")
        changed.append((path.name, count, meta_count))

core = ROOT / "site-core-v410.js"
if core.exists():
    text = core.read_text(encoding="utf-8")
    old = "images/brand/approved-v405/home-brand.webp?v=${UX_VERSION}"
    new = "images/brand/approved-v405/brand-story.webp?v=${UX_VERSION}"
    if old in text:
        core.write_text(text.replace(old, new), encoding="utf-8")
        print("UPDATED site-core-v410.js: retired dormant home-brand composite")

print(f"PASS cache version: {VERSION}")
for name, count, meta_count in changed:
    print(f"UPDATED {name}: {count} site runtime/style refs; {meta_count} retired social preview refs")
print(f"PASS changed pages: {len(changed)}")
