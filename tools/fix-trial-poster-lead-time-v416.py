from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
IMAGE_PATH = ROOT / "images/posts/approved-v412/guilu-drink-trial-evergreen.jpg"
DIAGNOSTIC_PATH = ROOT / "diagnostics/trial-poster-v416.json"
FONT_PATH = Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc")
TEXT = "製作加工約需5～7個工作天，完成後出貨"
BASE_SIZE = 1254


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    if not IMAGE_PATH.exists():
        raise SystemExit(f"missing poster: {IMAGE_PATH}")
    if not FONT_PATH.exists():
        raise SystemExit(f"missing font: {FONT_PATH}")

    before_sha = sha256(IMAGE_PATH)
    image = Image.open(IMAGE_PATH).convert("RGB")
    width, height = image.size
    if width != height or width < 1000:
        raise SystemExit(f"unexpected poster size: {width}x{height}")

    scale_x = width / BASE_SIZE
    scale_y = height / BASE_SIZE
    x0 = round(112 * scale_x)
    y0 = round(516 * scale_y)
    x1 = round(650 * scale_x)
    y1 = round(566 * scale_y)
    text_x = round(128 * scale_x)
    text_y = round(522 * scale_y)

    pixels = np.asarray(image).copy()
    top_y0 = max(0, y0 - max(4, round(8 * scale_y)))
    bottom_y1 = min(height, y1 + max(4, round(8 * scale_y)))
    top = pixels[top_y0:y0, x0:x1].mean(axis=0)
    bottom = pixels[y1:bottom_y1, x0:x1].mean(axis=0)
    region_height = y1 - y0
    for index in range(region_height):
        ratio = index / max(1, region_height - 1)
        pixels[y0 + index, x0:x1] = ((1 - ratio) * top + ratio * bottom).astype("uint8")

    edited = Image.fromarray(pixels)
    draw = ImageDraw.Draw(edited)
    font_size = max(22, round(29 * min(scale_x, scale_y)))
    max_width = x1 - text_x
    font = ImageFont.truetype(str(FONT_PATH), font_size, index=0)
    bbox = draw.textbbox((0, 0), TEXT, font=font)
    while bbox[2] - bbox[0] > max_width and font_size > 18:
        font_size -= 1
        font = ImageFont.truetype(str(FONT_PATH), font_size, index=0)
        bbox = draw.textbbox((0, 0), TEXT, font=font)

    draw.text((text_x, text_y), TEXT, font=font, fill=(25, 25, 22))
    edited.save(IMAGE_PATH, quality=95, subsampling=0, optimize=True, progressive=True)

    after_sha = sha256(IMAGE_PATH)
    if before_sha == after_sha:
        raise SystemExit("poster bytes did not change")

    DIAGNOSTIC_PATH.parent.mkdir(parents=True, exist_ok=True)
    DIAGNOSTIC_PATH.write_text(
        json.dumps(
            {
                "status": "success",
                "image": str(IMAGE_PATH.relative_to(ROOT)),
                "width": width,
                "height": height,
                "replacement_text": TEXT,
                "meaning": "5～7個工作天是製作加工時間，製作完成後才安排出貨",
                "before_sha256": before_sha,
                "after_sha256": after_sha,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"PASS: repaired {IMAGE_PATH.relative_to(ROOT)} -> {after_sha}")


if __name__ == "__main__":
    main()
