#!/usr/bin/env python3
"""Repair current formal media without redrawing products or mascot artwork.

This one-shot repair keeps product/DM/trial roles separate, rebuilds invalid image
aliases from approved sources, and makes every retired trial alias resolve to the
current trial-small-boss master so stale browser/LINE caches cannot restore old art.
"""
from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path
from PIL import Image, UnidentifiedImageError

ROOT = Path(__file__).resolve().parents[1]
DM = ROOT / "images" / "dm-approved-v20260810"
DM_FINAL = ROOT / "images" / "dm-final"
CUSTOMER = ROOT / "images" / "customer-display-v20260812"
VERSION = "20260812-formal-image-fix-v3"

PNG_MAP = {
    # This WebP was proven invalid by Pillow; keep the approved JPEG as source.
    "guilu-gao-100g.png": DM_FINAL / "01_guilu-gao-100g-dm.jpg",
    "guilu-drink-30cc.png": DM / "guilu-drink-30cc.webp",
    "guilu-drink-180cc.png": DM / "guilu-drink-180cc.webp",
    "guilu-tangkuai-75g.png": DM / "guilu-tangkuai-75g.webp",
    "guilu-jiao-600g.png": DM / "guilu-jiao-600g.webp",
    "lurong-fen-75g.png": DM / "lurong-fen-75g.webp",
    # Retired alias deliberately receives current trial artwork.
    "guilu-drink-trial.png": CUSTOMER / "trial-small-boss.webp",
}

TRIAL_SOURCE = CUSTOMER / "trial-small-boss.webp"
TRIAL_JPEG = CUSTOMER / "trial-small-boss.jpg"
MANIFEST = CUSTOMER / "formal-image-repair-v20260812.json"
TRIAL_WEBP_ALIASES = [DM / "guilu-drink-trial.webp", CUSTOMER / "trial.webp"]
GAO_WEBP = DM / "guilu-gao-100g.webp"
TRIAL_HTML = ROOT / "trial.html"
GUARDIAN = ROOT / "publishing-center-guardian.js"


def open_checked(source: Path) -> Image.Image:
    if not source.is_file():
        raise SystemExit(f"缺少正式來源：{source}")
    try:
        image = Image.open(source)
        image.load()
        return image
    except UnidentifiedImageError as exc:
        raise SystemExit(f"正式來源不可解碼：{source}") from exc


def record(path: Path, source: Path, width: int, height: int, role: str = "repaired-compatible-alias") -> dict:
    data = path.read_bytes()
    return {
        "file": str(path.relative_to(ROOT)),
        "source": str(source.relative_to(ROOT)),
        "width": width,
        "height": height,
        "bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "role": role,
    }


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
    return record(output, source, width, height)


def save_gao_webp() -> dict:
    source = DM_FINAL / "01_guilu-gao-100g-dm.jpg"
    original = open_checked(source)
    try:
        image = original.convert("RGB")
        width, height = image.size
        image.save(GAO_WEBP, "WEBP", quality=92, method=6)
    finally:
        original.close()
    check = open_checked(GAO_WEBP)
    check.close()
    return record(GAO_WEBP, source, width, height, "repaired-current-dm-webp")


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
    return record(TRIAL_JPEG, TRIAL_SOURCE, width, height, "line-compatible-exact-trial-master")


def replace_trial_aliases() -> list[dict]:
    source = TRIAL_SOURCE.read_bytes()
    original = open_checked(TRIAL_SOURCE)
    try:
        width, height = original.size
    finally:
        original.close()
    out = []
    for alias in TRIAL_WEBP_ALIASES:
        alias.parent.mkdir(parents=True, exist_ok=True)
        alias.write_bytes(source)
        check = open_checked(alias)
        check.close()
        out.append(record(alias, TRIAL_SOURCE, width, height, "retired-trial-alias-points-to-current-master"))
    return out


def replace_exact(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    if old not in text:
        if new in text:
            return
        raise SystemExit(f"找不到預期舊內容，停止避免誤改：{path.name}: {old}")
    path.write_text(text.replace(old, new), encoding="utf-8")


def patch_runtime_sources() -> None:
    # Remove the last direct clean.svg product fallback from trial page source.
    replace_exact(
        TRIAL_HTML,
        "images/customer-display-v20260812/guilu-drink-30cc-clean.svg?v=20260812-small-boss-trial-v1",
        "images/customer-display-v20260812/guilu-drink-30cc.webp?v=20260812-formal-image-fix-v3",
    )
    replace_exact(
        GUARDIAN,
        "const TRIAL='trial.webp';",
        "const TRIAL='trial-small-boss.webp';",
    )
    replace_exact(
        GUARDIAN,
        "if(isTrial&&urls.length&&!urls.some(url=>url.includes(`${CURRENT}${TRIAL}`)||/dm-approved-v20260810\\/guilu-drink-trial\\.webp/i.test(url)))errors.push('試喝圖片：必須使用目前核准「龜鹿飲試喝組｜先試喝，再決定」正式主圖');",
        "if(isTrial&&urls.length&&!urls.some(url=>url.includes(`${CURRENT}${TRIAL}`)))errors.push('試喝圖片：必須使用目前核准 trial-small-boss 小老闆正式主圖');",
    )
    replace_exact(
        GUARDIAN,
        "if(t.includes('30cc'))notes.push('30cc顧客端以目前正式DM／試喝主視覺為主；產品本體仍必須是小玻璃裸罐、無貼紙、金色蓋、比例不變。products-v3僅作實物校正。');",
        "if(t.includes('30cc'))notes.push('30cc產品型貼文使用六張正式產品圖；詳細DM只在DM用途使用；試喝文只用trial-small-boss。產品本體必須是小玻璃裸罐、無貼紙、比例不變。');",
    )
    replace_exact(
        GUARDIAN,
        "if(t.includes('180cc'))notes.push('180cc顧客端以目前正式DM／試喝圖右下180cc鋁袋視覺為來源；產品本體必須維持狹長鋁袋，不改袋型與比例。');",
        "if(t.includes('180cc'))notes.push('180cc產品型貼文使用六張正式產品圖；詳細DM只在DM用途使用；試喝圖獨立。產品本體必須維持鋁袋，不改袋型與比例。');",
    )


def main() -> None:
    records = [save_png(source, DM / output_name) for output_name, source in PNG_MAP.items()]
    records.append(save_gao_webp())
    records.append(save_trial_jpeg())
    records.extend(replace_trial_aliases())
    patch_runtime_sources()
    payload = {
        "version": VERSION,
        "policy": "six-products-six-dms-trial-separated-no-redraw-no-crop-no-proportion-change",
        "trialPolicy": "trial-small-boss-only-all-retired-aliases-resolve-current-master",
        "files": records,
    }
    MANIFEST.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"PASS formal media repaired: {len(records)} files")
    for item in records:
        print(f"PASS {item['file']}: {item['width']}x{item['height']} {item['bytes']} bytes")
    print("PASS runtime source refs patched")


if __name__ == "__main__":
    main()
