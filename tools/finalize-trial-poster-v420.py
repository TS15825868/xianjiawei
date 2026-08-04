from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFont

ROOT = Path(__file__).resolve().parents[1]
IMAGE_PATH = ROOT / "images/posts/approved-v412/guilu-drink-trial-evergreen.jpg"
DIAGNOSTIC_PATH = ROOT / "diagnostics/trial-poster-v420.json"
FONT_PATH = Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc")
LINE_1 = "接單後安排製作加工"
LINE_2 = "製作加工約需5～7個工作天，完成後才安排出貨"
VERSION = "v420-production-before-shipping"
BASE_SIZE = 1254


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def already_final() -> bool:
    if not IMAGE_PATH.exists() or not DIAGNOSTIC_PATH.exists():
        return False
    try:
        report = json.loads(DIAGNOSTIC_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return False
    return (
        report.get("version") == VERSION
        and report.get("line_1") == LINE_1
        and report.get("line_2") == LINE_2
        and report.get("after_sha256") == sha256(IMAGE_PATH)
    )


def main() -> None:
    if already_final():
        print("PASS: trial poster v420 is already final")
        return
    if not IMAGE_PATH.exists():
        raise SystemExit(f"missing poster: {IMAGE_PATH}")
    if not FONT_PATH.exists():
        raise SystemExit(f"missing font: {FONT_PATH}")

    before_sha = sha256(IMAGE_PATH)
    image = Image.open(IMAGE_PATH).convert("RGB")
    width, height = image.size
    if width != height or width < 1000:
        raise SystemExit(f"unexpected poster size: {width}x{height}")

    # Only a slight brightness lift; product packaging, character and layout remain unchanged.
    image = ImageEnhance.Brightness(image).enhance(1.025)
    image = ImageEnhance.Contrast(image).enhance(1.005)

    scale_x = width / BASE_SIZE
    scale_y = height / BASE_SIZE
    x0 = round(118 * scale_x)
    y0 = round(514 * scale_y)
    x1 = round(646 * scale_x)
    y1 = round(572 * scale_y)
    text_x = round(128 * scale_x)
    line1_y = round(518 * scale_y)
    line2_y = round(545 * scale_y)

    pixels = np.asarray(image).copy()
    region_height = y1 - y0
    left = np.array([255, 249, 226], dtype=float)
    right = np.array([255, 246, 218], dtype=float)
    for x in range(x0, x1):
        ratio = (x - x0) / max(1, x1 - x0 - 1)
        colour = ((1 - ratio) * left + ratio * right).astype("uint8")
        pixels[y0:y1, x] = colour

    edited = Image.fromarray(pixels)
    draw = ImageDraw.Draw(edited)
    scale = min(scale_x, scale_y)
    font1 = ImageFont.truetype(str(FONT_PATH), max(18, round(22 * scale)), index=0)
    font2 = ImageFont.truetype(str(FONT_PATH), max(16, round(19 * scale)), index=0)
    colour = (20, 20, 18)
    draw.text((text_x, line1_y), LINE_1, font=font1, fill=colour)
    draw.text((text_x, line2_y), LINE_2, font=font2, fill=colour)

    edited.save(IMAGE_PATH, quality=95, subsampling=0, optimize=True, progressive=True)
    after_sha = sha256(IMAGE_PATH)
    if before_sha == after_sha:
        raise SystemExit("poster bytes did not change")

    DIAGNOSTIC_PATH.parent.mkdir(parents=True, exist_ok=True)
    DIAGNOSTIC_PATH.write_text(
        json.dumps(
            {
                "status": "success",
                "version": VERSION,
                "image": str(IMAGE_PATH.relative_to(ROOT)),
                "width": width,
                "height": height,
                "line_1": LINE_1,
                "line_2": LINE_2,
                "meaning": "5～7個工作天只計製作加工；製作完成後才安排出貨，物流配送時間另計",
                "brightness_adjustment": "slightly_brighter_without_layout_or_product_changes",
                "before_sha256": before_sha,
                "after_sha256": after_sha,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"PASS: finalized {IMAGE_PATH.relative_to(ROOT)} -> {after_sha}")


if __name__ == "__main__":
    main()
