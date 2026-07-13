from pathlib import Path
import json
import re

VERSION = "408.5"
DM_BY_ID = {
    "guilu-gao": "images/dm-final/01_guilu-gao-100g-dm.webp",
    "guilu-drink-30": "images/dm-final/02_guilu-drink-30cc-dm.webp",
    "guilu-drink-180": "images/dm-final/03_guilu-drink-180cc-dm.webp",
    "luerong-fen": "images/dm-final/04_luerong-fen-75g-dm.webp",
    "guilu-tangkuai": "images/dm-final/05_guilu-tangkuai-75g-dm.webp",
    "guilu-jiao": "images/dm-final/06_guilu-jiao-600g-dm.webp",
}
OLD_TO_NEW = {
    "images/dm-final/01_guilu-gao-100g-dm.jpg": DM_BY_ID["guilu-gao"],
    "images/dm-final/02_guilu-drink-30cc-dm.jpg": DM_BY_ID["guilu-drink-30"],
    "images/dm-final/03_guilu-drink-180cc-dm.jpg": DM_BY_ID["guilu-drink-180"],
    "images/dm-final/04_luerong-fen-75g-dm.jpg": DM_BY_ID["luerong-fen"],
    "images/dm-final/05_guilu-tangkuai-75g-dm.jpg": DM_BY_ID["guilu-tangkuai"],
    "images/dm-final/06_guilu-jiao-600g-dm.jpg": DM_BY_ID["guilu-jiao"],
}


def versioned(path: str) -> str:
    return f"{path.split('?')[0]}?v={VERSION}"


# 資料中心：產品主圖維持真實原圖；DM欄位改為核准WebP。
data_path = Path("data.json")
data = json.loads(data_path.read_text(encoding="utf-8"))
for product in data["products"]:
    product["image"] = versioned(product["image"])
    product["dmImage"] = versioned(DM_BY_ID[product["id"]])
    product["detailImages"] = [product["dmImage"]]
data_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

# 所有使用中的DM路徑改為WebP；全站資源更新快取版本。
paths = [Path("dm.html"), Path("site.js"), Path("deploy-version.json")]
paths += list(Path(".").glob("product-*.html"))
for path in paths:
    if not path.exists():
        continue
    text = path.read_text(encoding="utf-8")
    for old, new in OLD_TO_NEW.items():
        text = text.replace(old, new)
    text = re.sub(r"(\.(?:css|js|json|jpg|jpeg|png|webp|avif))\?v=[0-9.]+", lambda m: m.group(1) + f"?v={VERSION}", text)
    text = re.sub(r"仙加味網站核心｜整合正式版 v[0-9.]+", f"仙加味網站核心｜整合正式版 v{VERSION}", text)
    text = re.sub(r"data\.json\?v=[0-9.]+", f"data.json?v={VERSION}", text)
    path.write_text(text, encoding="utf-8")

# 其餘HTML同步版本號。
for path in Path(".").glob("*.html"):
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"(\.(?:css|js|json|jpg|jpeg|png|webp|avif))\?v=[0-9.]+", lambda m: m.group(1) + f"?v={VERSION}", text)
    path.write_text(text, encoding="utf-8")

site = Path("site.js").read_text(encoding="utf-8")
assert "const detailImage = p.image" in site
Path("site.js").write_text(site, encoding="utf-8")

# 更新正式部署標記。
deploy = {
    "version": VERSION,
    "updated": "2026-07-13",
    "status": "production-ready",
    "catalog": "five-types-six-specifications",
    "imagePolicy": {
        "productCards": "verified-original-product-image",
        "quickViewModal": "verified-original-product-image",
        "detailHero": "verified-original-product-image",
        "detailDM": "six-user-approved-final-dm-webp",
        "detailMascot": "approved-page-specific-mascot",
        "dmPage": "six-user-approved-final-dm-webp",
    },
    "frontend": "single-site-js-and-single-site-css",
    "automation": "main-only-auto-deploy-and-trusted-pr-auto-merge",
    "safety": "approved-dm-archive-sha256-verified-and-1122x1402",
}
Path("deploy-version.json").write_text(json.dumps(deploy, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

# 更新長期Pages驗收流程。
workflow_path = Path(".github/workflows/deploy-pages.yml")
workflow = workflow_path.read_text(encoding="utf-8")
for old, new in OLD_TO_NEW.items():
    workflow = workflow.replace(old, new)
workflow = workflow.replace("v408.4", f"v{VERSION}").replace("?v=408.4", f"?v={VERSION}")
workflow = workflow.replace('"version": "408.4"', f'"version": "{VERSION}"')
workflow_path.write_text(workflow, encoding="utf-8")

# 程式內驗收。
assert len(data["products"]) == 6
for product in data["products"]:
    assert product["image"].startswith("images/products-v3/")
    assert product["dmImage"].startswith("images/dm-final/")
    assert product["dmImage"].endswith(f".webp?v={VERSION}")
    assert product["detailImages"] == [product["dmImage"]]

dm_html = Path("dm.html").read_text(encoding="utf-8")
assert dm_html.count('class="dm-image-v2"') == 6
for dm in DM_BY_ID.values():
    assert f"{dm}?v={VERSION}" in dm_html
print("v408.5 DM references updated successfully")
