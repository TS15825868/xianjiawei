#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

INGREDIENT_PATH = Path("images/posts/generated/post-ingredient-principle.webp")
INGREDIENT_SIZE = 35886
INGREDIENT_SHA256 = "b44b5b1d62f0efc770fd077b6dac541abc192046cc1b52743d0e797e4405b1c3"


def main() -> None:
    required = [
        "index.html",
        "products.html",
        "choose.html",
        "dm.html",
        "guide.html",
        "brand.html",
        "faq.html",
        "contact.html",
        "site.css",
        "site.js",
        "data.json",
        "catalog-public.json",
        "deploy-version.json",
        "brand-character-spec.json",
        "MASCOT_CHARACTER_SPEC.md",
        "sitemap.xml",
        "robots.txt",
        "llms.txt",
        str(INGREDIENT_PATH),
    ]
    missing = [name for name in required if not Path(name).is_file()]
    if missing:
        raise SystemExit(f"缺少必要檔案：{missing}")

    ingredient = INGREDIENT_PATH.read_bytes()
    if len(ingredient) != INGREDIENT_SIZE:
        raise SystemExit(f"用料原則圖片大小錯誤：{len(ingredient)}")
    ingredient_sha = hashlib.sha256(ingredient).hexdigest()
    if ingredient_sha != INGREDIENT_SHA256:
        raise SystemExit(f"用料原則圖片 SHA256 錯誤：{ingredient_sha}")
    if ingredient[:4] != b"RIFF" or ingredient[8:12] != b"WEBP":
        raise SystemExit("用料原則圖片不是有效 WebP")

    version = json.loads(Path("deploy-version.json").read_text(encoding="utf-8")).get(
        "version"
    )
    if not version:
        raise SystemExit("deploy-version.json 缺少 version")

    data = json.loads(Path("data.json").read_text(encoding="utf-8"))
    products = data.get("products", [])
    if len(products) != 6:
        raise SystemExit(f"產品數量應為 6，目前為 {len(products)}")
    ids = {product.get("id") for product in products}
    if not {"guilu-drink-30", "guilu-drink-180"} <= ids:
        raise SystemExit("龜鹿飲 30cc／180cc 資料缺漏")

    character = json.loads(
        Path("brand-character-spec.json").read_text(encoding="utf-8")
    )
    if character.get("status") != "locked":
        raise SystemExit("角色母版尚未鎖定")
    if character.get("mascot", {}).get("name") != "仙加味小老闆":
        raise SystemExit("小老闆名稱不正確")
    partners = set(character.get("partners", []))
    if not {"小鹿娃娃", "小烏龜娃娃"} <= partners:
        raise SystemExit("小老闆固定夥伴缺漏")
    rules = character.get("rules", {})
    if rules.get("realProductImagesOnly") is not True:
        raise SystemExit("產品未固定為真實原圖")
    if rules.get("noProductRedraw") is not True:
        raise SystemExit("產品重畫禁止規則缺漏")
    if rules.get("newImagesRequireReview") is not True:
        raise SystemExit("新圖待審規則缺漏")

    approved_assets = list(Path("images/brand/approved-v405").glob("*.webp"))
    if len(approved_assets) != 15:
        raise SystemExit(
            f"官網核准小老闆素材應為 15 張，目前 {len(approved_assets)}"
        )

    product_pages = [
        "product-guilu-gao.html",
        "product-guilu-drink-30cc.html",
        "product-guilu-drink-180cc.html",
        "product-guilu-tangkuai.html",
        "product-guilu-jiao.html",
        "product-luerong-fen.html",
    ]
    for name in product_pages:
        text = Path(name).read_text(encoding="utf-8")
        if text.count("<h1") != 1:
            raise SystemExit(f"{name} 的 H1 數量不正確")

    brand = Path("brand.html").read_text(encoding="utf-8")
    brand_compact = re.sub(r"\s+", "", brand)
    if "四代" not in brand or not ("傳承" in brand or "累積" in brand):
        raise SystemExit("品牌頁缺少四代傳承敘事")
    if "品牌故事時間軸" not in brand:
        raise SystemExit("品牌頁缺少品牌故事時間軸")
    if "2008年" not in brand_compact:
        raise SystemExit("品牌頁缺少 2008 年品牌註冊節點")
    if brand.count("brand-generation__year") < 9:
        raise SystemExit("品牌頁年份時間軸節點不足")

    attr_pattern = re.compile(r"(?:href|src)=[\"']([^\"']+)[\"']")
    for page in Path(".").glob("*.html"):
        text = page.read_text(encoding="utf-8", errors="ignore")
        if page.name != "googlec5c2af289948c263.html" and not (
            'name="robots"' in text or "name='robots'" in text
        ):
            raise SystemExit(f"{page} 缺少 robots meta")
        for value in attr_pattern.findall(text):
            if value.startswith(
                (
                    "http://",
                    "https://",
                    "mailto:",
                    "tel:",
                    "data:",
                    "#",
                    "javascript:",
                )
            ):
                continue
            target = value.split("#")[0].split("?")[0]
            if target and not (page.parent / target).exists():
                raise SystemExit(f"{page} 連結到不存在的檔案：{target}")

    sitemap = Path("sitemap.xml").read_text(encoding="utf-8")
    if sitemap.count("<url>") < 20:
        raise SystemExit("sitemap 頁數不足")
    robots = Path("robots.txt").read_text(encoding="utf-8")
    if "Sitemap: https://ts15825868.github.io/xianjiawei/sitemap.xml" not in robots:
        raise SystemExit("robots.txt 缺少正式 sitemap")
    if "catalog-public.json" not in Path("llms.txt").read_text(encoding="utf-8"):
        raise SystemExit("llms.txt 缺少公開產品資料入口")

    print(
        f"PASS website validation: v{version}, "
        f"mascot assets={len(approved_assets)}, ingredient={len(ingredient)} bytes"
    )


if __name__ == "__main__":
    main()
