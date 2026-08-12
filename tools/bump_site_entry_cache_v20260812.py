#!/usr/bin/env python3
"""Unify root HTML site JS/CSS cache keys to the current mobile visual fix.

Also keeps retired product composites out of social previews, upgrades safe mascot
previews to their original high-resolution sources, and repairs the brand hero
without changing product identity or product/DM/trial role separation.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "20260812-mobile-visual-fix-v5"
PATTERN = re.compile(r'(?P<prefix>(?:src|href)=["\'])(?P<file>site(?:-[^?"\']+)?\.(?:js|css))\?v=[^"\']+(?P<suffix>["\'])', re.I)

RETIRED_META_IMAGES = {
    "https://ts15825868.github.io/xianjiawei/images/brand/approved-v405/home-brand.webp",
    "https://ts15825868.github.io/xianjiawei/images/brand/approved-v405/products-all.webp",
    "https://ts15825868.github.io/xianjiawei/images/brand/approved-v405/contact-line.webp",
    "https://ts15825868.github.io/xianjiawei/images/brand/approved-v405/combo.webp",
    "https://ts15825868.github.io/xianjiawei/images/brand/approved-v405/guide-how-to-use.webp",
}
SAFE_META_IMAGE = "https://ts15825868.github.io/xianjiawei/images/logo.png"
HD_BRAND = "https://ts15825868.github.io/xianjiawei/images/brand/hd-v20260812/brand-story.png"
HD_CHOOSE = "https://ts15825868.github.io/xianjiawei/images/brand/hd-v20260812/choose.jpg"
HD_FAQ = "https://ts15825868.github.io/xianjiawei/images/brand/hd-v20260812/faq.png"

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

    if path.name == "choose.html":
        updated = updated.replace(
            "https://ts15825868.github.io/xianjiawei/images/brand/approved-v405/choose.webp",
            HD_CHOOSE,
        )
    if path.name == "faq.html":
        updated = updated.replace(
            "https://ts15825868.github.io/xianjiawei/images/brand/approved-v405/faq.webp",
            HD_FAQ,
        )
    if path.name == "brand.html":
        updated = updated.replace(
            '<meta property="og:image" content="https://ts15825868.github.io/xianjiawei/images/logo.png"/>',
            f'<meta property="og:image" content="{HD_BRAND}"/>',
        )
        updated = updated.replace(
            '<meta name="twitter:image" content="https://ts15825868.github.io/xianjiawei/images/logo.png"/>',
            f'<meta name="twitter:image" content="{HD_BRAND}"/>',
        )
        updated = updated.replace(
            '"primaryImageOfPage":{"@type":"ImageObject","url":"https://ts15825868.github.io/xianjiawei/images/logo.png"}',
            f'"primaryImageOfPage":{{"@type":"ImageObject","url":"{HD_BRAND}"}}',
        )
        updated = re.sub(
            r'<div class="brand-hero-v410__media" aria-label="仙加味品牌識別">\s*<img src="images/logo\.png\?v=[^"]+" alt="仙加味 Logo"[^>]*/>\s*</div>',
            '<div class="brand-hero-v410__media" aria-label="仙加味品牌故事情境">\n        <img src="images/brand/hd-v20260812/brand-story.png?v=20260812-mobile-visual-fix-v5" alt="仙加味品牌故事｜萬華四代與小老闆情境" width="1448" height="1086" fetchpriority="high" decoding="async"/>\n      </div>',
            updated,
            count=1,
            flags=re.S,
        )

    if updated != text:
        path.write_text(updated, encoding="utf-8")
        changed.append((path.name, count, meta_count))

core = ROOT / "site-core-v410.js"
if core.exists():
    text = core.read_text(encoding="utf-8")
    updated = text.replace(
        "images/brand/approved-v405/home-brand.webp?v=${UX_VERSION}",
        "images/brand/hd-v20260812/brand-story.png?v=${UX_VERSION}",
    ).replace(
        "images/brand/approved-v405/brand-story.webp?v=${UX_VERSION}",
        "images/brand/hd-v20260812/brand-story.png?v=${UX_VERSION}",
    )
    if updated != text:
        core.write_text(updated, encoding="utf-8")
        print("UPDATED site-core-v410.js: high-resolution brand story fallback")

print(f"PASS cache version: {VERSION}")
for name, count, meta_count in changed:
    print(f"UPDATED {name}: {count} site runtime/style refs; {meta_count} retired social preview refs")
print(f"PASS changed pages: {len(changed)}")
