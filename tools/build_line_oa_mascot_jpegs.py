#!/usr/bin/env python3
"""Build LINE Messaging API compatible JPEGs from approved website mascot scenes.

Source artwork is never redrawn or cropped. Each 1448x1086 approved WebP is
resized proportionally to 1024x768 and encoded as a compact progressive JPEG.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "images" / "brand" / "approved-v405"
OUTPUT_DIR = ROOT / "images" / "brand" / "line-oa"
MANIFEST_PATH = OUTPUT_DIR / "manifest.json"

MAPPING = {
    "welcome.jpg": "home-brand.webp",
    "products.jpg": "products-all.webp",
    "recommend.jpg": "choose.webp",
    "combo.jpg": "combo.webp",
    "usage.jpg": "guide-how-to-use.webp",
    "faq.jpg": "faq.webp",
    "service.jpg": "contact-line.webp",
    "brand.jpg": "brand-story.webp",
}

TARGET_SIZE = (1024, 768)
JPEG_QUALITY = 82
MAX_BYTES = 1_000_000


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    records = []

    for output_name, source_name in MAPPING.items():
        source = SOURCE_DIR / source_name
        if not source.is_file():
            raise SystemExit(f"缺少核准官網母圖：{source}")

        with Image.open(source) as original:
            image = original.convert("RGB")
            if image.size != (1448, 1086):
                raise SystemExit(f"{source_name} 尺寸錯誤：{image.size}")
            image.thumbnail(TARGET_SIZE, Image.Resampling.LANCZOS)
            if image.size != TARGET_SIZE:
                raise SystemExit(
                    f"{source_name} 等比例縮放後尺寸錯誤：{image.size}，預期 {TARGET_SIZE}"
                )
            output = OUTPUT_DIR / output_name
            image.save(
                output,
                "JPEG",
                quality=JPEG_QUALITY,
                optimize=True,
                progressive=True,
                subsampling="4:2:0",
            )

        data = output.read_bytes()
        if len(data) > MAX_BYTES:
            raise SystemExit(f"{output_name} 超過 LINE 建議 1 MB：{len(data)} bytes")
        if data[:2] != b"\xff\xd8" or data[-2:] != b"\xff\xd9":
            raise SystemExit(f"{output_name} 不是完整 JPEG")

        records.append(
            {
                "file": output_name,
                "source": source_name,
                "width": TARGET_SIZE[0],
                "height": TARGET_SIZE[1],
                "bytes": len(data),
                "sha256": hashlib.sha256(data).hexdigest(),
                "policy": "approved_complete_scene_no_crop_no_redraw",
            }
        )
        print(f"PASS {output_name}: {len(data)} bytes")

    manifest = {
        "version": "2026-08-01-v1",
        "format": "JPEG",
        "purpose": "LINE Messaging API Flex Message hero images",
        "source": "images/brand/approved-v405",
        "rules": {
            "complete_scene": True,
            "aspect_ratio_preserved": True,
            "cropping": False,
            "product_redraw": False,
            "manual_source_approval_required": True,
        },
        "files": records,
    }
    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"PASS LINE OA 正式 JPEG：{len(records)} 張")


if __name__ == "__main__":
    main()
