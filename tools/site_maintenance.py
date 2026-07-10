from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
VERSION = "300.5"
UPDATED_DATE = "2026-07-10"
EXPECTED_PRODUCT_IDS = [
    "guilu-gao",
    "guilu-drink-30",
    "guilu-drink-180",
    "guilu-tangkuai",
    "guilu-jiao",
    "luerong-fen",
]
SHARED_PRODUCT_FIELDS = [
    "id",
    "series",
    "name",
    "displayName",
    "size",
    "image",
    "dmImage",
    "description",
    "ingredients",
    "usage",
    "storage",
    "fit",
    "page",
    "purpose",
    "purposeDirection",
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
OBSOLETE_FILES = [
    "SITE_AUDIT_v292.txt",
    "site-v287-core.js",
    "site-header-brand-v298-8.css",
    "site-v298-5-products.js",
    "TMP_TEST_TREE.txt",
    "TMP_TREE_TARGET.txt",
    "CONSOLIDATE_V299_1.txt",
    "RUN_WEBSITE_CONSOLIDATE.txt",
]


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_text_if_changed(path: Path, content: str) -> bool:
    current = path.read_text(encoding="utf-8") if path.exists() else None
    if current == content:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return True


def build_public_catalog(data: dict) -> dict:
    products = []
    for product in data.get("products", []):
        item = {field: product.get(field) for field in SHARED_PRODUCT_FIELDS if product.get(field) not in (None, "", [])}
        item["page"] = item.get("page") or product.get("detailPage")
        products.append(item)

    return {
        "schemaVersion": 1,
        "catalogVersion": VERSION,
        "updatedAt": UPDATED_DATE,
        "source": {
            "repository": "TS15825868/xianjiawei",
            "branch": "main",
            "file": "data.json",
            "role": "官網與 LINE OA 共用公開產品資料來源",
        },
        "brand": data.get("brand", "仙加味"),
        "lineId": data.get("lineId", "@762jybnm"),
        "siteUrl": data.get("siteUrl", "https://ts15825868.github.io/xianjiawei/"),
        "payments": data.get("payments", []),
        "shipping": data.get("shipping", []),
        "products": products,
    }


def replace_reveal_function(site_js: str) -> str:
    replacement = r'''function initReveal() {
  const items = Array.from(document.querySelectorAll('.reveal'));
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('show'));
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('show');
      currentObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -60px 0px', threshold: 0.05 });

  items.forEach(el => observer.observe(el));
}

function finalCtaBlock'''
    pattern = re.compile(r"function initReveal\(\) \{[\s\S]*?\n\}\n\nfunction finalCtaBlock")
    updated, count = pattern.subn(replacement, site_js, count=1)
    if count != 1:
        raise RuntimeError("找不到 initReveal() 區塊，無法安全更新")
    return updated


def apply_fixes() -> list[str]:
    changed: list[str] = []
    data_path = ROOT / "data.json"
    data = read_json(data_path)
    data["version"] = VERSION
    data["catalogVersion"] = VERSION
    data["catalogFile"] = "catalog-public.json"
    for product in data.get("products", []):
        if not product.get("page") and product.get("detailPage"):
            product["page"] = product["detailPage"]
    if write_text_if_changed(data_path, json.dumps(data, ensure_ascii=False, indent=2) + "\n"):
        changed.append("data.json")

    catalog = build_public_catalog(data)
    if write_text_if_changed(ROOT / "catalog-public.json", json.dumps(catalog, ensure_ascii=False, indent=2) + "\n"):
        changed.append("catalog-public.json")

    site_js_path = ROOT / "site.js"
    site_js = site_js_path.read_text(encoding="utf-8")
    site_js = re.sub(r"fetch\('data\.json\?v=[^']+'\)", f"fetch('data.json?v={VERSION}')", site_js)
    site_js = replace_reveal_function(site_js)
    if write_text_if_changed(site_js_path, site_js):
        changed.append("site.js")

    for html_path in ROOT.glob("*.html"):
        text = html_path.read_text(encoding="utf-8")
        updated = re.sub(r"site\.css\?v=[^\"']+", f"site.css?v={VERSION}", text)
        updated = re.sub(r"site\.js\?v=[^\"']+", f"site.js?v={VERSION}", updated)
        updated = re.sub(r"資料更新：\d{4}-\d{2}-\d{2}｜內容版本 v[0-9.]+", f"資料更新：{UPDATED_DATE}｜內容版本 v{VERSION}", updated)
        if write_text_if_changed(html_path, updated):
            changed.append(html_path.name)

    for name in OBSOLETE_FILES:
        path = ROOT / name
        if path.exists():
            path.unlink()
            changed.append(f"刪除 {name}")

    return changed


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


def audit() -> list[str]:
    errors: list[str] = []
    for page in REQUIRED_PAGES:
        if not (ROOT / page).exists():
            errors.append(f"缺少頁面：{page}")

    data = read_json(ROOT / "data.json")
    ids = [product.get("id") for product in data.get("products", [])]
    if ids != EXPECTED_PRODUCT_IDS:
        errors.append(f"產品順序或品項不一致：{ids}")
    if data.get("lineId") != "@762jybnm":
        errors.append(f"LINE ID 不一致：{data.get('lineId')}")
    if data.get("version") != VERSION or data.get("catalogVersion") != VERSION:
        errors.append("data.json 版本或 catalogVersion 尚未更新")

    for product in data.get("products", []):
        for field in SHARED_PRODUCT_FIELDS:
            if field == "storage" and product.get("id") == "luerong-fen":
                pass
            if product.get(field) in (None, "", []):
                errors.append(f"{product.get('id')} 缺少 {field}")
        for asset_field in ("image", "dmImage"):
            asset = str(product.get(asset_field, "")).split("?", 1)[0]
            if asset and not (ROOT / asset).exists():
                errors.append(f"{product.get('id')} 圖片不存在：{asset}")
        page = str(product.get("page", "")).split("?", 1)[0]
        if page and not (ROOT / page).exists():
            errors.append(f"{product.get('id')} 詳細頁不存在：{page}")

    catalog_path = ROOT / "catalog-public.json"
    if not catalog_path.exists():
        errors.append("缺少 catalog-public.json")
    else:
        catalog = read_json(catalog_path)
        if catalog != build_public_catalog(data):
            errors.append("catalog-public.json 與 data.json 不同步，請執行 --fix")

    for html_path in ROOT.glob("*.html"):
        text = html_path.read_text(encoding="utf-8")
        if html_path.name.startswith("google"):
            continue
        if f"site.css?v={VERSION}" not in text:
            errors.append(f"{html_path.name} CSS 版本不一致")
        if f"site.js?v={VERSION}" not in text:
            errors.append(f"{html_path.name} JS 版本不一致")
        for ref in local_references(text):
            if not (ROOT / ref).exists():
                errors.append(f"{html_path.name} 參照不存在：{ref}")

    site_js = (ROOT / "site.js").read_text(encoding="utf-8")
    for required in (
        f"fetch('data.json?v={VERSION}')",
        "IntersectionObserver",
        "function buildLineAutoLink",
        "function openProductModal",
        "function initDMLightboxV282",
    ):
        if required not in site_js:
            errors.append(f"site.js 缺少必要功能：{required}")

    for name in OBSOLETE_FILES:
        if (ROOT / name).exists():
            errors.append(f"無用舊檔仍存在：{name}")

    syntax = subprocess.run(["node", "--check", str(ROOT / "site.js")], capture_output=True, text=True)
    if syntax.returncode:
        errors.append(syntax.stderr.strip())

    return errors


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fix", action="store_true", help="套用統一版本、產生共用目錄並清除舊檔")
    args = parser.parse_args()

    if args.fix:
        changed = apply_fixes()
        print("已更新：" + ("、".join(changed) if changed else "無變更"))

    errors = audit()
    if errors:
        print("\n".join(errors))
        sys.exit(1)

    print(f"PASS website v{VERSION}: pages, assets, links, JavaScript, reveal, LINE links and shared catalog")


if __name__ == "__main__":
    main()
