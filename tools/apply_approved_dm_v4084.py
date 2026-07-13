from pathlib import Path
import json
import re

VERSION = "408.4"

DM_BY_ID = {
    "guilu-gao": "images/dm-final/01_guilu-gao-100g-dm.jpg",
    "guilu-drink-30": "images/dm-final/02_guilu-drink-30cc-dm.jpg",
    "guilu-drink-180": "images/dm-final/03_guilu-drink-180cc-dm.jpg",
    "luerong-fen": "images/dm-final/04_luerong-fen-75g-dm.jpg",
    "guilu-tangkuai": "images/dm-final/05_guilu-tangkuai-75g-dm.jpg",
    "guilu-jiao": "images/dm-final/06_guilu-jiao-600g-dm.jpg",
}

PAGE_META = {
    "product-guilu-gao.html": ("龜鹿膏100g", DM_BY_ID["guilu-gao"]),
    "product-guilu-drink-30cc.html": ("龜鹿飲30cc", DM_BY_ID["guilu-drink-30"]),
    "product-guilu-drink-180cc.html": ("龜鹿飲180cc", DM_BY_ID["guilu-drink-180"]),
    "product-guilu-tangkuai.html": ("龜鹿湯塊75g", DM_BY_ID["guilu-tangkuai"]),
    "product-guilu-jiao.html": ("龜鹿膠600g", DM_BY_ID["guilu-jiao"]),
    "product-luerong-fen.html": ("鹿茸粉75g", DM_BY_ID["luerong-fen"]),
}


def versioned(path: str) -> str:
    return f"{path.split('?')[0]}?v={VERSION}"


# 1. 資料中心：產品主圖維持真實原圖；DM欄位與詳細圖改為正式DM。
data_path = Path("data.json")
data = json.loads(data_path.read_text(encoding="utf-8"))
for product in data.get("products", []):
    product["image"] = versioned(product["image"])
    dm = DM_BY_ID[product["id"]]
    product["dmImage"] = versioned(dm)
    product["detailImages"] = [versioned(dm)]
data_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

# 2. 快速查看只顯示真實產品原圖，不再以DM取代。
site_path = Path("site.js")
site = site_path.read_text(encoding="utf-8")
site = site.replace("v408.3", f"v{VERSION}")
site = site.replace("?v=408.3", f"?v={VERSION}")
site = re.sub(
    r"\s*// v253 強制規則：.*?const detailImage =\s*p\.dmImage \|\|\s*\(Array\.isArray\(p\.detailImages\) && p\.detailImages\[0\]\) \|\|\s*'images/logo\.png';",
    "\n  // v408.4：快速查看固定使用真實產品原圖；正式DM只放DM頁與產品詳細頁。\n  const detailImage = p.image || 'images/logo.png';",
    site,
    flags=re.S,
)
site = site.replace("${p.name || '產品'} 產品圖文整理", "${p.name || '產品'} 實際產品與包裝")
site_path.write_text(site, encoding="utf-8")

# 3. DM總覽：六張卡片全部改為核准正式DM。
dm_html_path = Path("dm.html")
dm_html = dm_html_path.read_text(encoding="utf-8")
product_to_dm = {
    "images/products-v3/guilu-gao.jpg": DM_BY_ID["guilu-gao"],
    "images/products-v3/guilu-drink-30.jpg": DM_BY_ID["guilu-drink-30"],
    "images/products-v3/guilu-drink-180.jpg": DM_BY_ID["guilu-drink-180"],
    "images/products-v3/guilu-tangkuai.jpg": DM_BY_ID["guilu-tangkuai"],
    "images/products-v3/guilu-jiao.jpg": DM_BY_ID["guilu-jiao"],
    "images/products-v3/luerong-fen.jpg": DM_BY_ID["luerong-fen"],
}
for original, dm in product_to_dm.items():
    dm_html = re.sub(re.escape(original) + r"\?v=[0-9.]+", versioned(dm), dm_html)
dm_html = dm_html.replace("?v=408.3", f"?v={VERSION}")
dm_html_path.write_text(dm_html, encoding="utf-8")

# 4. 六個產品詳細頁：主圖保留真實產品照，另加入正式DM區塊與大圖按鈕。
for filename, (display_name, dm) in PAGE_META.items():
    path = Path(filename)
    html = path.read_text(encoding="utf-8")
    html = html.replace("?v=408.3", f"?v={VERSION}")
    dm_url = versioned(dm)

    # 將既有「查看產品圖文整理」按鈕指向正式DM。
    html = re.sub(
        r'data-dm-src="images/products-v3/[^"?]+\.jpg\?v=[0-9.]+"\s+href="images/products-v3/[^"?]+\.jpg\?v=[0-9.]+"',
        f'data-dm-src="{dm_url}" href="{dm_url}"',
        html,
        count=1,
    )

    if "product-dm-section" not in html:
        hero_start = html.find('<section class="product-detail-hero">')
        hero_end = html.find("</section>", hero_start)
        if hero_start < 0 or hero_end < 0:
            raise RuntimeError(f"找不到產品主區塊：{filename}")
        hero_end += len("</section>")
        section = f'''\n<section class="section product-dm-section">\n<div class="section-heading"><p class="eyebrow">正式產品DM</p><h2>{display_name}產品圖文整理</h2><p>主產品圖維持真實外包裝；下方為本次核准的正式DM，點擊圖片可開啟清晰大圖。</p></div>\n<a class="dm-lightbox-link product-dm-link" data-dm-src="{dm_url}" href="{dm_url}" aria-label="開啟{display_name}正式DM大圖"><img alt="{display_name}正式產品DM" class="dm-image-v2" decoding="async" loading="lazy" src="{dm_url}"/></a>\n</section>'''
        html = html[:hero_end] + section + html[hero_end:]

    path.write_text(html, encoding="utf-8")

# 5. 全站靜態資源版本更新，避免手機快取仍顯示舊圖。
for path in Path(".").glob("*.html"):
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"(\.(?:css|js|json|jpg|jpeg|png|webp|avif))\?v=[0-9.]+", rf"\1?v={VERSION}", text)
    path.write_text(text, encoding="utf-8")

# 6. 部署標記。
deploy = {
    "version": VERSION,
    "updated": "2026-07-13",
    "status": "production-ready",
    "catalog": "five-types-six-specifications",
    "imagePolicy": {
        "productCards": "verified-original-product-image",
        "quickViewModal": "verified-original-product-image",
        "detailHero": "verified-original-product-image",
        "detailDM": "six-approved-final-dm-images",
        "detailMascot": "approved-page-specific-mascot",
        "dmPage": "six-approved-final-dm-images"
    },
    "frontend": "single-site-js-and-single-site-css",
    "automation": "main-only-auto-deploy-and-trusted-pr-auto-merge",
    "safety": "no-redrawn-product-packaging-in-product-card-or-quick-view"
}
Path("deploy-version.json").write_text(json.dumps(deploy, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

# 7. 驗收。
assert len(data.get("products", [])) == 6
for p in data["products"]:
    assert p["image"].startswith("images/products-v3/")
    assert p["dmImage"].startswith("images/dm-final/")
    assert p["detailImages"] == [p["dmImage"]]
for dm in DM_BY_ID.values():
    target = Path(dm)
    assert target.is_file() and target.stat().st_size > 100000, target
assert Path("dm.html").read_text(encoding="utf-8").count('class="dm-image-v2"') == 6
for page in PAGE_META:
    text = Path(page).read_text(encoding="utf-8")
    assert "product-dm-section" in text
    assert "images/dm-final/" in text
print("v408.4：六張正式DM已放入DM頁及六個產品詳細頁；產品卡與快速查看維持真實產品原圖。")
