#!/usr/bin/env python3
"""Unify root HTML site JS/CSS cache keys to the current formal image release.

Only query strings on local `site*.js` / `site*.css` references are changed.
No page content, links, data, images, or functionality are rewritten.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260812-formal-image-fix-v3"
PATTERN = re.compile(r'(?P<prefix>(?:src|href)=["\'])(?P<file>site(?:-[^?"\']+)?\.(?:js|css))\?v=[^"\']+(?P<suffix>["\'])', re.I)

changed = []
for path in sorted(ROOT.glob("*.html")):
    text = path.read_text(encoding="utf-8")
    updated, count = PATTERN.subn(lambda m: f"{m.group('prefix')}{m.group('file')}?v={VERSION}{m.group('suffix')}", text)
    if count and updated != text:
        path.write_text(updated, encoding="utf-8")
        changed.append((path.name, count))

print(f"PASS cache version: {VERSION}")
for name, count in changed:
    print(f"UPDATED {name}: {count} site runtime/style refs")
print(f"PASS changed pages: {len(changed)}")
