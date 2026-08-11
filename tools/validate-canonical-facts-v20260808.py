#!/usr/bin/env python3
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]

SPECS = {
    "guilu-gao": ("龜鹿膏", "100g／罐"),
    "guilu-drink-30": ("龜鹿飲30cc玻璃罐", "30cc／罐（小玻璃罐）"),
    "guilu-drink-180": ("龜鹿飲180cc鋁袋", "180cc／包（鋁袋）"),
    "guilu-tangkuai": ("龜鹿湯塊", "75g／盒｜8塊裝"),
    "guilu-jiao": ("龜鹿膠", "600g／盒｜32塊裝"),
    "luerong-fen": ("鹿茸粉", "75g／罐"),
}
INGREDIENTS = {
    "guilu-gao": ["鹿角萃取物", "龜板萃取物", "枸杞", "紅棗", "黃耆", "粉光蔘"],
    "guilu-drink-30": ["水", "龜板萃取物", "鹿角萃取物", "粉光蔘", "枸杞", "紅棗", "黃耆"],
    "guilu-drink-180": ["水", "龜板萃取物", "鹿角萃取物", "粉光蔘", "枸杞", "紅棗", "黃耆"],
    "guilu-tangkuai": ["龜板萃取物", "鹿角萃取物"],
    "guilu-jiao": ["龜板萃取物", "鹿角萃取物"],
    "luerong-fen": ["鹿茸"],
}
GAO_USAGE = "一天一次一小匙"


def load(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def text(path):
    return (ROOT / path).read_text(encoding="utf-8")


def must_contain(path, *phrases):
    value = text(path)
    for phrase in phrases:
        assert phrase in value, f"{path} 缺少正式資料：{phrase}"


def must_not_contain(path, *phrases):
    value = text(path)
    for phrase in phrases:
        assert phrase not in value, f"{path} 仍含舊／禁止資料：{phrase}"


def check_json_authority():
    data = load("data.json")
    catalog = load("catalog-public.json")
    data_products = {p["id"]: p for p in data["products"]}
    catalog_products = {p["id"]: p for p in catalog["products"]}
    assert set(data_products) == set(SPECS), "data.json 不是目前六項正式產品"
    assert set(catalog_products) == set(SPECS), "catalog-public.json 不是目前六項正式產品"

    for product_id, (name, spec) in SPECS.items():
        item = data_products[product_id]
        catalog_item = catalog_products[product_id]
        assert item.get("name") == name, f"data.json {product_id} 名稱錯誤"
        assert (item.get("size") or item.get("specification") or item.get("spec")) == spec, f"data.json {product_id} 規格錯誤"
        assert catalog_item.get("name") == name, f"catalog {product_id} 名稱錯誤"
        assert catalog_item.get("size") == spec, f"catalog {product_id} 規格錯誤"
        assert item.get("ingredients") == INGREDIENTS[product_id], f"data.json {product_id} 成分／順序錯誤"
        assert catalog_item.get("ingredients") == INGREDIENTS[product_id], f"catalog {product_id} 成分／順序錯誤"

    assert data_products["guilu-gao"]["usage"][0] == GAO_USAGE, "data.json 龜鹿膏主要使用方式不同步"
    assert catalog_products["guilu-gao"]["usage"][0] == GAO_USAGE, "catalog 龜鹿膏主要使用方式不同步"
    assert catalog_products["guilu-tangkuai"].get("package") == "深藍正式盒裝"
    assert catalog_products["guilu-jiao"].get("package") == "淡紫色正式盒裝"


def check_product_pages():
    must_contain("product-guilu-gao.html", GAO_USAGE, "鹿角萃取物、龜板萃取物、枸杞、紅棗、黃耆、粉光蔘")
    must_not_contain("product-guilu-gao.html", "每日早上及下午各一小匙", "每天一次，每次一小匙")

    must_contain(
        "product-guilu-drink-30cc.html",
        "龜鹿飲30cc玻璃罐",
        "30cc／罐（小玻璃罐）",
        "無貼紙、無外盒、無外袋、金色蓋",
        "水、龜板萃取物、鹿角萃取物、粉光蔘、枸杞、紅棗、黃耆",
    )
    must_not_contain("product-guilu-drink-30cc.html", "30cc／瓶", "小玻璃瓶", "龜鹿飲30cc玻璃瓶")

    must_contain(
        "product-guilu-drink-180cc.html",
        "180cc／包（鋁袋）",
        "水、龜板萃取物、鹿角萃取物、粉光蔘、枸杞、紅棗、黃耆",
        "不拉寬、不加高",
    )
    must_contain("product-guilu-tangkuai.html", "75g／盒", "8塊裝", "龜板萃取物", "鹿角萃取物")
    must_not_contain("product-guilu-tangkuai.html", "300g／盒", "600g／盒")
    must_contain("product-guilu-jiao.html", "600g／盒", "32塊裝", "龜板萃取物", "鹿角萃取物")
    must_contain("product-luerong-fen.html", "75g／罐", "鹿茸")


def check_ai_and_content_surfaces():
    must_contain("ingredients.html", "六個正式產品成分已同步")
    ai = load("content/ai-brand-control-v20260807.json")
    assert ai["productAuthority"]["rejectLegacyProductFacts"] is True
    assert ai["productAuthority"]["canonicalFacts"]["guiluDrink30"]["ingredients"] == INGREDIENTS["guilu-drink-30"]


def check_publishing_architecture():
    html = text("publishing-center.html")
    bridge = text("publishing-center-erp-bridge.js")
    assert "publishing-center-erp-bridge.js" in html, "公開發布中心未載入ERP交接層"
    assert "真正的社群立即發布由受保護的 ERP 執行" in html
    assert "前往ERP立即發布" in bridge
    assert "published-manual" in bridge and "erp-handoff-required" in bridge, "未處理舊前端假發布紀錄"
    assert "xianjiawei-internal.tung314069.workers.dev/#posts" in bridge
    assert "CHANNEL_ACCESS_TOKEN" not in html and "CHANNEL_ACCESS_TOKEN" not in bridge
    assert "FACEBOOK_PAGE_ACCESS_TOKEN" not in html and "INSTAGRAM_ACCESS_TOKEN" not in html


def check_post_library():
    posts = load("content/public-post-library.json")
    items=posts.get("posts", [])
    assert items and posts.get("counts", {}).get("total") == len(items), "公開貼文母庫宣告數量必須跟目前實際數量一致"
    ids=[str(p.get('id') or '').strip() for p in items]
    assert all(ids) and len(ids)==len(set(ids)), "公開貼文ID不可空白或重複"
    for post in items:
        body = json.dumps(post, ensure_ascii=False)
        assert post.get("status") in {"published", "pending_review", "draft", "rejected", "archived", "campaign_hold"}, f"未知貼文狀態：{post.get('id')}"
        if "龜鹿湯塊" in body:
            for value in re.findall(r"(?<!\d)(\d+(?:\.\d+)?)g", body):
                number = float(value)
                if number >= 50 and abs(number - 75) > 0.001 and "龜鹿膠" not in body:
                    raise AssertionError(f"貼文 {post.get('id')} 疑似含未核准湯塊重量 {value}g")
        assert "龜鹿飲30cc玻璃瓶" not in body
        assert "30cc／瓶" not in body


def main():
    required = [
        "data.json", "catalog-public.json", "ingredients.html",
        "product-guilu-gao.html", "product-guilu-drink-30cc.html", "product-guilu-drink-180cc.html",
        "product-guilu-tangkuai.html", "product-guilu-jiao.html", "product-luerong-fen.html",
        "publishing-center.html", "publishing-center-erp-bridge.js",
        "content/ai-brand-control-v20260807.json", "content/public-post-library.json",
    ]
    missing = [path for path in required if not (ROOT / path).is_file()]
    assert not missing, f"缺少必要檔案：{missing}"
    check_json_authority()
    check_product_pages()
    check_ai_and_content_surfaces()
    check_publishing_architecture()
    check_post_library()
    print("PASS canonical audit: 直接驗證目前來源資料，不先在記憶體改寫；六產品正式規格／成分、龜鹿膏一天一次、30cc小玻璃罐、180cc鋁袋、75g湯塊、600g龜鹿膠、動態母庫ID唯一與公開→ERP發布架構一致。")


if __name__ == "__main__":
    main()
