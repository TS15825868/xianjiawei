#!/usr/bin/env python3
"""Validate the 15 approved website mascot scenes before deployment."""

from __future__ import annotations

import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "images" / "brand" / "approved-v405"
MANIFEST_PATH = ROOT / "images" / "brand" / "approved-v405-manifest.json"
SITE_JS = ROOT / "site.js"

CORE_PAGES = {
    "home": ("index.html", "home-brand.webp"),
    "products": ("products.html", "products-all.webp"),
    "choose": ("choose.html", "choose.webp"),
    "combo": ("combo.html", "combo.webp"),
    "guide": ("guide.html", "guide-how-to-use.webp"),
    "recipes": ("recipes.html", "recipes.webp"),
    "brand": ("brand.html", "brand-story.webp"),
    "faq": ("faq.html", "faq.webp"),
    "contact": ("contact.html", "contact-line.webp"),
}

PRODUCT_PAGES = {
    "product-guilu-gao.html": "product-guilu-gao-100g.webp",
    "product-guilu-drink-30cc.html": "product-guilu-drink-30cc.webp",
    "product-guilu-drink-180cc.html": "product-guilu-drink-180cc.webp",
    "product-guilu-tangkuai.html": "product-guilu-tangkuai-75g.webp",
    "product-guilu-jiao.html": "product-guilu-jiao-600g.webp",
    "product-luerong-fen.html": "product-luerong-fen-75g.webp",
}


def webp_size(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    if len(data) < 30 or data[:4] != b"RIFF" or data[8:12] != b"WEBP":
        raise AssertionError(f"{path}: not a valid WEBP container")

    offset = 12
    while offset + 8 <= len(data):
        chunk_type = data[offset : offset + 4]
        chunk_size = struct.unpack_from("<I", data, offset + 4)[0]
        start = offset + 8
        end = start + chunk_size
        chunk = data[start:end]

        if chunk_type == b"VP8X" and len(chunk) >= 10:
            width = int.from_bytes(chunk[4:7], "little") + 1
            height = int.from_bytes(chunk[7:10], "little") + 1
            return width, height

        if chunk_type == b"VP8L" and len(chunk) >= 5 and chunk[0] == 0x2F:
            bits = int.from_bytes(chunk[1:5], "little")
            width = (bits & 0x3FFF) + 1
            height = ((bits >> 14) & 0x3FFF) + 1
            return width, height

        if chunk_type == b"VP8 " and len(chunk) >= 10 and chunk[3:6] == b"\x9d\x01\x2a":
            width = int.from_bytes(chunk[6:8], "little") & 0x3FFF
            height = int.from_bytes(chunk[8:10], "little") & 0x3FFF
            return width, height

        offset = end + (chunk_size % 2)

    raise AssertionError(f"{path}: WEBP dimensions could not be read")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    site_js = SITE_JS.read_text(encoding="utf-8")

    expected_files = {
        *(filename for _, filename in CORE_PAGES.values()),
        *PRODUCT_PAGES.values(),
    }
    actual_files = {path.name for path in ASSET_DIR.glob("*.webp")}

    require(len(expected_files) == 15, "approved mascot definition must contain exactly 15 scenes")
    require(actual_files == expected_files, f"approved mascot files mismatch: expected {sorted(expected_files)}, got {sorted(actual_files)}")
    require(manifest.get("version") == "408.7", "approved mascot manifest version must be 408.7")

    for filename in sorted(expected_files):
        path = ASSET_DIR / filename
        require(path.stat().st_size >= 100_000, f"{path}: file is unexpectedly small")
        width, height = webp_size(path)
        require(width >= 1400 and height >= 1000, f"{path}: expected at least 1400x1000, got {width}x{height}")
        require(filename in site_js, f"site.js does not route {filename}")
        print(f"OK {filename}: {width}x{height}, {path.stat().st_size} bytes")

    for page_key, (page_name, filename) in CORE_PAGES.items():
        page = ROOT / page_name
        require(page.exists(), f"missing core page: {page_name}")
        html = page.read_text(encoding="utf-8")
        require(f'data-page="{page_key}"' in html, f"{page_name}: expected data-page={page_key}")
        require(filename in site_js, f"{page_name}: missing mascot route for {filename}")

    for page_name, filename in PRODUCT_PAGES.items():
        page = ROOT / page_name
        require(page.exists(), f"missing product page: {page_name}")
        html = page.read_text(encoding="utf-8")
        require("product-mascot-anchor" in html, f"{page_name}: missing product mascot anchor")
        require(filename in site_js, f"{page_name}: missing mascot route for {filename}")

    require('width="1448" height="1086"' in site_js, "website mascot scenes must preserve the approved 1448x1086 ratio")
    require("loading=\"lazy\"" in site_js, "website mascot scenes must use lazy loading")
    require("decoding=\"async\"" in site_js, "website mascot scenes must use async decoding")

    print("PASS: all 15 approved website mascot scenes are present, high-resolution, and correctly routed")


if __name__ == "__main__":
    main()
