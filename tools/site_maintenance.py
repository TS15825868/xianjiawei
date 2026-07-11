from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
VERSION = "322.0"
UPDATED_DATE = "2026-07-11"

EXPECTED_PRODUCT_IDS = [
    "guilu-gao",
    "guilu-drink-30",
    "guilu-drink-180",
    "guilu-tangkuai",
    "guilu-jiao",
    "luerong-fen",
]

REQUIRED_PAGES = [
    "index.html",
    "products.html",
    "choose.html",
    "combo.html",
    "guide.html",
    "recipes.html",
    "video.html",
    "knowledge.html",
    "hanfang-baike.html",
    "sources.html",
    "dm.html",
    "brand.html",
    "faq.html",
    "contact.html",
    "product-guilu-gao.html",
    "product-guilu-drink-30cc.html",
    "product-guilu-drink-180cc.html",
    "product-guilu-tangkuai.html",
    "product-guilu-jiao.html",
    "product-luerong-fen.html",
]

REQUIRED_CORE_FUNCTIONS = [
    "function buildLineAutoLink",
    "function openProductModal",
    "function initDMLightboxV282",
    "IntersectionObserver",
]


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def local_references(html_text: str) -> list[str]:
    refs: list[str] = []
    for value in re.findall(r'''(?:href|src)=["']([^"']+)["']''', html_text, flags=re.I):
        if value.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
            continue
        parsed = urlsplit(value)
        if parsed.scheme or parsed.netloc:
            continue
        path = parsed.path.lstrip("/")
        if path:
            refs.append(path)
    return refs


def check_js(path: Path, errors: list[str]) -> None:
    if not path.exists():
        errors.append(f"缺少 JavaScript：{path.name}")
        return
    result = subprocess.run(
        ["node", "--check", str(path)],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode:
        errors.append(f"{path.name} 語法錯誤：{result.stderr.strip()}")


def audit() -> list[str]:
    errors: list[str] = []

    for page in REQUIRED_PAGES:
        if not (ROOT / page).exists():
            errors.append(f"缺少頁面：{page}")

    data_path = ROOT / "data.json"
    if not data_path.exists():
        errors.append("缺少 data.json")
        return errors

    data = read_json(data_path)
    ids = [product.get("id") for product in data.get("products", [])]
    if ids != EXPECTED_PRODUCT_IDS:
        errors.append(f"產品順序或品項不一致：{ids}")
    if data.get("lineId") != "@762jybnm":
        errors.append(f"LINE ID 不一致：{data.get('lineId')}")
    if not {"guilu-drink-30", "guilu-drink-180"}.issubset(set(ids)):
        errors.append("龜鹿飲 30cc 與 180cc 兩種規格未完整保留")

    for product in data.get("products", []):
        for field in ("image", "dmImage", "detailPage"):
            value = str(product.get(field, "")).split("?", 1)[0]
            if not value:
                errors.append(f"{product.get('id')} 缺少 {field}")
            elif not (ROOT / value).exists():
                errors.append(f"{product.get('id')} 檔案不存在：{value}")

    for html_path in ROOT.glob("*.html"):
        if html_path.name.startswith("google"):
            continue
        text = html_path.read_text(encoding="utf-8")
        for ref in local_references(text):
            if not (ROOT / ref).exists():
                errors.append(f"{html_path.name} 參照不存在：{ref}")

    loader = ROOT / "site.js"
    core = ROOT / "site-core.js"
    fix = ROOT / "site-fix-v317.js"
    check_js(loader, errors)
    check_js(core, errors)
    check_js(fix, errors)

    if loader.exists():
        loader_text = loader.read_text(encoding="utf-8")
        for required in ("site-core.js", "site-fix-v317.js", "site-v321.css"):
            if required not in loader_text:
                errors.append(f"site.js 缺少載入：{required}")

    if core.exists():
        core_text = core.read_text(encoding="utf-8")
        for required in REQUIRED_CORE_FUNCTIONS:
            if required not in core_text:
                errors.append(f"site-core.js 缺少必要功能：{required}")
        if "data.json" not in core_text:
            errors.append("site-core.js 未載入 data.json")

    sharp_mascot = ROOT / "images/brand/xianjiawei-scene-guide.jpg"
    if not sharp_mascot.exists():
        errors.append("缺少可用的小老闆高解析圖片")
    elif sharp_mascot.stat().st_size < 150_000:
        errors.append(f"小老闆圖片檔案過小：{sharp_mascot.stat().st_size} bytes")

    css = ROOT / "site-v321.css"
    if not css.exists() or css.stat().st_size < 500:
        errors.append("缺少小老闆手機版與清晰度修正 CSS")

    return errors


def main() -> None:
    errors = audit()
    if errors:
        print("\n".join(errors))
        sys.exit(1)

    print(
        f"PASS website v{VERSION}: {len(REQUIRED_PAGES)} pages, local assets, "
        "JavaScript loader/core/fix, LINE links, six specifications and mascot display"
    )


if __name__ == "__main__":
    main()
