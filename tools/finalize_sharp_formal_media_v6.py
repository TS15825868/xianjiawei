#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import json
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
V = "20260813-sharp-formal-media-v6"

PRODUCT_PATHS = {
    "guilu-gao": "images/customer-display-v20260812/guilu-gao.avif",
    "guilu-drink-30": "images/customer-display-v20260812/guilu-drink-30cc.avif",
    "guilu-drink-180": "images/customer-display-v20260812/guilu-drink-180cc.jpg",
    "guilu-tangkuai": "images/customer-display-v20260812/guilu-tangkuai.avif",
    "guilu-jiao": "images/customer-display-v20260812/guilu-jiao.avif",
    "luerong-fen": "images/customer-display-v20260812/luerong-fen.avif",
}
OLD_PRODUCT_PATHS = {
    "guilu-gao": "images/customer-display-v20260812/guilu-gao.webp",
    "guilu-drink-30": "images/customer-display-v20260812/guilu-drink-30cc.webp",
    "guilu-drink-180": "images/customer-display-v20260812/guilu-drink-180cc.webp",
    "guilu-tangkuai": "images/customer-display-v20260812/guilu-tangkuai.webp",
    "guilu-jiao": "images/customer-display-v20260812/guilu-jiao.webp",
    "luerong-fen": "images/customer-display-v20260812/luerong-fen.webp",
}
ID_TO_KEY = {
    "guilu-gao": "guilu-gao",
    "guilu-drink-30cc": "guilu-drink-30",
    "guilu-drink-180cc": "guilu-drink-180",
    "guilu-tangkuai": "guilu-tangkuai",
    "guilu-jiao": "guilu-jiao",
    "luerong-fen": "luerong-fen",
}

def save(path: Path, text: str) -> None:
    path.write_text(text, encoding="utf-8")
    print("UPDATED", path.relative_to(ROOT))


def replace_file(path: Path, replacements: list[tuple[str, str]]) -> None:
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    updated = text
    for old, new in replacements:
        updated = updated.replace(old, new)
    if updated != text:
        save(path, updated)


def install_180_customer_master() -> None:
    source = ROOT / "images/dm-v3/guilu-drink-180.jpg"
    target = ROOT / PRODUCT_PATHS["guilu-drink-180"]
    if not source.is_file():
        raise SystemExit("missing vetted 180cc HD JPEG source")
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, target)
    if target.read_bytes() != source.read_bytes():
        raise SystemExit("180cc customer master copy mismatch")
    print("INSTALLED exact 180cc customer master", target.relative_to(ROOT))


def replace_old_product_paths_in_runtime() -> None:
    replacements = [(old, PRODUCT_PATHS[key]) for key, old in OLD_PRODUCT_PATHS.items()]
    replacements += [
        ("20260812-formal-image-fix-v3", V),
        ("20260812-public-image-hotfix-v4", V),
    ]
    # Only current public runtime/entry files. Historical data is not rewritten blindly.
    for path in list(ROOT.glob("site*.js")) + list(ROOT.glob("*.html")):
        replace_file(path, replacements)


def update_customer_display() -> None:
    p = ROOT / "site-customer-display-v20260812.js"
    text = p.read_text(encoding="utf-8")
    text = re.sub(r"const VERSION='[^']+';", f"const VERSION='{V}';", text, count=1)
    text = text.replace("產品圖只用六張正式WebP", "產品圖只用六張正式高解析產品母圖")
    text = re.sub(r"productMainImageSource:'[^']+'", f"productMainImageSource:'{V}'", text)
    save(p, text)


def update_product_safety() -> None:
    for name in ["site-product-image-safety.js", "site-image-safety-v20260812.js"]:
        p = ROOT / name
        if not p.exists():
            continue
        text = p.read_text(encoding="utf-8")
        text = re.sub(r"const VERSION='[^']+';", f"const VERSION='{V}';", text, count=1)
        text = text.replace("official-product-image-formal-image-fix-v3", "official-product-image-sharp-formal-media-v6")
        save(p, text)


def update_retirement_layer() -> None:
    p = ROOT / "site-public-image-retirement-v20260812.js"
    text = p.read_text(encoding="utf-8")
    text = re.sub(r"const VERSION='[^']+';", f"const VERSION='{V}';", text, count=1)
    # replace_old_product_paths_in_runtime already moved each replacement to HD path.
    save(p, text)


def update_manifest() -> None:
    p = ROOT / "images/formal-display/manifest.json"
    m = json.loads(p.read_text(encoding="utf-8"))
    m["runtime"] = V
    formats = {k: ("jpeg" if k == "guilu-drink-180" else "avif") for k in PRODUCT_PATHS}
    for key, path in PRODUCT_PATHS.items():
        item = m["products"][key]
        item["path"] = "/" + path
        item["format"] = formats[key]
        item["binary_status"] = "verified_high_resolution_1122x1402"
        item["status"] = "approved_display"
    m["rules"]["product_authority"] = "six user-confirmed high-resolution product masters are the customer-facing product image authority; products-v3 remains physical identity reference only"
    m["rules"]["customer_main_visual"] = "six HD official product masters for product surfaces; valid detailed DMs only for DM surfaces; user-provided small-boss trial poster only for trial surfaces"
    save(p, json.dumps(m, ensure_ascii=False, indent=2) + "\n")


def update_authority() -> None:
    p = ROOT / "data/formal-media-authority-v20260810.json"
    a = json.loads(p.read_text(encoding="utf-8"))
    a["runtime"] = V
    a["principle"] = "six user-confirmed high-resolution product masters, valid detailed DMs, and the user-provided small-boss trial image are three separate media roles; products-v3 remains immutable real-product identity reference only"
    a["product_image_authority"] = "six user-confirmed 1122x1402 high-resolution product masters; products-v3 remains immutable real-product identity reference only"
    for item in a["products"]:
        key = ID_TO_KEY[item["id"]]
        item["image"] = "/" + PRODUCT_PATHS[key]
        item["binary_status"] = "verified_high_resolution_1122x1402"
        item["status"] = "approved_display"
    save(p, json.dumps(a, ensure_ascii=False, indent=2) + "\n")


def fix_formal_media_helper_dm_role() -> None:
    p = ROOT / "site-formal-media-v20260810.js"
    text = p.read_text(encoding="utf-8")
    text = re.sub(r"const V='[^']+';", f"const V='{V}';", text, count=1)
    old = "for(const p of Object.values(m.products||{})){if(t.includes(p.name)||t.includes(p.spec)){replace(img,p.path);break;}}"
    new = "for(const [key,p] of Object.entries(m.products||{})){if(t.includes(p.name)||t.includes(p.spec)){const dm=m.dm?.paths?.[key];if(dm)replace(img,dm);break;}}"
    if old in text:
        text = text.replace(old, new)
    if "m.dm?.paths?.[key]" not in text:
        raise SystemExit("could not enforce DM-only path in formal media helper")
    save(p, text)


def bump_loader_and_html() -> None:
    replace_file(ROOT / "site.js", [("20260812-mobile-visual-fix-v5", V)])
    pattern = re.compile(r'(?P<prefix>(?:src|href)=["\'])(?P<file>site(?:-[^?"\']+)?\.(?:js|css))\?v=[^"\']+(?P<suffix>["\'])', re.I)
    for p in ROOT.glob("*.html"):
        text = p.read_text(encoding="utf-8")
        updated = pattern.sub(lambda m: f"{m.group('prefix')}{m.group('file')}?v={V}{m.group('suffix')}", text)
        updated = updated.replace("v=20260812-mobile-visual-fix-v5", "v=" + V)
        if updated != text:
            save(p, updated)

    replace_file(ROOT / "tools/bump_site_entry_cache_v20260812.py", [
        ('VERSION = "20260812-mobile-visual-fix-v5"', f'VERSION = "{V}"'),
        ('?v=20260812-mobile-visual-fix-v5', f'?v={V}'),
    ])
    replace_file(ROOT / ".github/workflows/bump-site-entry-cache-v20260812.yml", [
        ("version='20260812-mobile-visual-fix-v5'", f"version='{V}'"),
        ("'guilu-gao.webp','guilu-drink-30cc.webp','guilu-drink-180cc.webp','guilu-tangkuai.webp','guilu-jiao.webp','luerong-fen.webp'", "'guilu-gao.avif','guilu-drink-30cc.avif','guilu-drink-180cc.jpg','guilu-tangkuai.avif','guilu-jiao.avif','luerong-fen.avif'"),
    ])


def validate() -> None:
    expected = [ROOT / p for p in PRODUCT_PATHS.values()]
    for p in expected:
        if not p.is_file() or p.stat().st_size < 10000:
            raise SystemExit(f"HD product master missing/too small: {p.relative_to(ROOT)}")
    if (ROOT / PRODUCT_PATHS["guilu-drink-180"]).read_bytes() != (ROOT / "images/dm-v3/guilu-drink-180.jpg").read_bytes():
        raise SystemExit("180cc customer master is not exact vetted source")

    old_names = [Path(x).name for x in OLD_PRODUCT_PATHS.values()]
    for p in ROOT.glob("site*.js"):
        text = p.read_text(encoding="utf-8")
        for old in old_names:
            if "customer-display-v20260812/" + old in text:
                raise SystemExit(f"low-resolution product runtime remains: {p.name} {old}")

    m = json.loads((ROOT / "images/formal-display/manifest.json").read_text(encoding="utf-8"))
    a = json.loads((ROOT / "data/formal-media-authority-v20260810.json").read_text(encoding="utf-8"))
    if m.get("runtime") != V or a.get("runtime") != V:
        raise SystemExit("formal media runtime is not v6")
    if m["trial"]["path"] != "/images/customer-display-v20260812/trial-small-boss.webp":
        raise SystemExit("trial authority regressed in manifest")
    if a["trial"]["image"] != "/images/customer-display-v20260812/trial-small-boss.webp":
        raise SystemExit("trial authority regressed in authority")
    if "m.dm?.paths?.[key]" not in (ROOT / "site-formal-media-v20260810.js").read_text(encoding="utf-8"):
        raise SystemExit("DM page is not using separate detailed DM paths")

    css = (ROOT / "site-ux-v4104.css").read_text(encoding="utf-8")
    if "body.ux-v410 .hero__content::after" not in css or "content:none!important" not in css:
        raise SystemExit("transparent hero-circle removal regressed")
    brand = (ROOT / "brand.html").read_text(encoding="utf-8")
    if "images/brand/hd-v20260812/brand-story.png" not in brand:
        raise SystemExit("brand HD hero regressed")

    cache_pattern = re.compile(r'(?:src|href)=["\']site(?:-[^?"\']+)?\.(?:js|css)\?v=([^"\']+)', re.I)
    stale = []
    for p in ROOT.glob("*.html"):
        for value in cache_pattern.findall(p.read_text(encoding="utf-8")):
            if value != V:
                stale.append((p.name, value))
    if stale:
        raise SystemExit(f"stale root HTML cache refs: {stale[:20]}")

    print("PASS six sharp formal product masters")
    print("PASS low-resolution customer-display WebPs retired from runtime")
    print("PASS product / detailed DM / trial roles remain separate")
    print("PASS transparent hero circle removal and brand HD layout retained")
    print("PASS all root HTML cache refs", V)


def main() -> None:
    install_180_customer_master()
    replace_old_product_paths_in_runtime()
    update_customer_display()
    update_product_safety()
    update_retirement_layer()
    update_manifest()
    update_authority()
    fix_formal_media_helper_dm_role()
    bump_loader_and_html()
    validate()

if __name__ == "__main__":
    main()
