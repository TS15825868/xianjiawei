#!/usr/bin/env python3
"""Repair formal media binaries without redrawing or changing product proportions.

- Rebuild broken legacy PNG aliases from already-approved decodable assets.
- The retired trial PNG alias is rebuilt from the current small-boss trial master,
  so stale caches cannot display the retired trial artwork.
- Produce a JPEG of the exact same approved trial master for LINE Flex Message.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from PIL import Image, UnidentifiedImageError

ROOT = Path(__file__).resolve().parents[1]
DM = ROOT / "images" / "dm-approved-v20260810"
DM_FINAL = ROOT / "images" / "dm-final"
CUSTOMER = ROOT / "images" / "customer-display-v20260812"
VERSION = "20260812-formal-image-fix-v3"

PNG_MAP = {
    # guilu-gao-100g.webp is a retired invalid binary; use the approved JPEG fallback.
    "guilu-gao-100g.png": DM_FINAL / "01_guilu-gao-100g-dm.jpg",
    "guilu-drink-30cc.png": DM / "guilu-drink-30cc.webp",
    "guilu-drink-180cc.png": DM / "guilu-drink-180cc.webp",
    "guilu-tangkuai-75g.png": DM / "guilu-tangkuai-75g.webp",
    "guilu-jiao-600g.png": DM / "guilu-jiao-600g.webp",
    "lurong-fen-75g.png": DM / "lurong-fen-75g.webp",
    # Never restore the retired trial art: stale legacy URL resolves to current trial master.
    "guilu-drink-trial.png": CUSTOMER / "trial-small-boss.webp",
}

TRIAL_SOURCE = CUSTOMER / "trial-small-boss.webp"
TRIAL_JPEG = CUSTOMER / "trial-small-boss.jpg"
MANIFEST = CUSTOMER / "formal-image-repair-v20260812.json"


def open_checked(source: Path) -> Image.Image:
    if not source.is_file():
        raise SystemExit(f"缺少正式來源：{source}")
    try:
        image = Image.open(source)
        image.load()
        return image
    except UnidentifiedImageError as exc:
        raise SystemExit(f"正式來源不可解碼：{source}") from exc


def save_png(source: Path, output: Path) -> dict:
    original = open_checked(source)
    try:
        image = original.convert("RGBA") if "A" in original.getbands() else original.convert("RGB")
        output.parent.mkdir(parents=True, exist_ok=True)
        image.save(output, "PNG", optimize=True)
        width, height = image.size
    finally:
        original.close()
    data = output.read_bytes()
    if len(data) < 1024 or data[:8] != b"\x89PNG\r\n\x1a\n":
        raise SystemExit(f"PNG 修復失敗：{output} ({len(data)} bytes)")
    return {"file": str(output.relative_to(ROOT)), "source": str(source.relative_to(ROOT)), "width": width, "height": height, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}


def save_trial_jpeg() -> dict:
    original = open_checked(TRIAL_SOURCE)
    try:
        image = original.convert("RGB")
        width, height = image.size
        image.save(TRIAL_JPEG, "JPEG", quality=90, optimize=True, progressive=True, subsampling="4:2:0")
    finally:
        original.close()
    data = TRIAL_JPEG.read_bytes()
    if len(data) < 1024 or data[:2] != b"\xff\xd8" or data[-2:] != b"\xff\xd9":
        raise SystemExit(f"LINE JPEG 產生失敗：{len(data)} bytes")
    return {"file": str(TRIAL_JPEG.relative_to(ROOT)), "source": str(TRIAL_SOURCE.relative_to(ROOT)), "width": width, "height": height, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(), "role": "line-compatible-exact-trial-master"}


def main() -> None:
    records = [save_png(source, DM / output_name) for output_name, source in PNG_MAP.items()]
    records.append(save_trial_jpeg())
    payload = {
        "version": VERSION,
        "policy": "no-redraw-no-crop-no-proportion-change",
        "trialPolicy": "trial-small-boss-only-retired-trial-never-restored",
        "files": records,
    }
    MANIFEST.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"PASS formal media repaired: {len(records)} files")
    for item in records:
        print(f"PASS {item['file']}: {item['width']}x{item['height']} {item['bytes']} bytes")


if __name__ == "__main__":
    main()
