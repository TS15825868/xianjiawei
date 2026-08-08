#!/usr/bin/env python3
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://ts15825868.github.io/xianjiawei/"

EXPECTED_DATA = {
    "guilu-gao": {"name": "龜鹿膏", "size": "100g／罐"},
    "guilu-drink-30": {"name": "龜鹿飲30cc玻璃罐", "size": "30cc／罐（小玻璃罐）"},
    "guilu-drink-180": {"name": "龜鹿飲180cc鋁袋", "size": "180cc／包（鋁袋）"},
    "guilu-tangkuai": {"name": "龜鹿湯塊", "size": "75g／盒｜8塊裝｜每塊約9.375g"},
    "guilu-jiao": {"name": "龜鹿膠", "size": "600g（1斤）／盒｜32塊裝｜每塊約18.75g"},
    "luerong-fen": {"name": "鹿茸粉", "size": "75g／罐"},
}

OFFICIAL_SPECS = [
    "龜鹿膏 100g／罐",
    "龜鹿飲30cc玻璃罐 30cc／罐",
    "龜鹿飲180cc鋁袋 180cc／包",
    "龜鹿湯塊 75g／盒",
    "龜鹿膠 600g（1斤）／盒",
    "鹿茸粉 75g／罐",
]

CANONICAL_INGREDIENTS = {
    "guilu-gao": ["鹿角萃取物", "龜板萃取物", "枸杞", "紅棗", "黃耆", "粉光蔘"],
    "guilu-drink-30": ["水", "龜板萃取物", "鹿角萃取物", "粉光蔘", "枸杞", "紅棗", "黃耆"],
    "guilu-drink-180": ["水", "龜板萃取物", "鹿角萃取物", "粉光蔘", "枸杞", "紅棗", "黃耆"],
    "guilu-tangkuai": ["龜板萃取物", "鹿角萃取物"],
    "guilu-jiao": ["龜板萃取物", "鹿角萃取物"],
    "luerong-fen": ["鹿茸"],
}

REQUIRED_FILES = [
    "index.html", "products.html", "choose.html", "guide.html", "combo.html", "faq.html",
    "brand-facts.html", "product-guilu-gao.html", "product-guilu-drink-30cc.html",
    "product-guilu-drink-180cc.html", "product-guilu-tangkuai.html", "product-guilu-jiao.html",
    "product-luerong-fen.html", "trial.html", "site.js", "site-official-product-variants.js",
    "data.json", "deploy-version.json", "catalog-public.json", "geo-data.json", "llms.txt", "llms-full.txt",
    "config/official-products.json", "assets/data/official-products.json",
    "content/visual-production-spec-v20260807.json", "content/content-calendar-seed-v20260807.json",
    "content/public-post-library.json", "content/public-asset-library.json", "content/public-content-policy.json",
    "content/social-guilu-drink-trial-v1.json", "content/image-generation-queue-v20260808.json",
]

AUTHORITY_SCAN_FILES = [
    "index.html", "products.html", "choose.html", "guide.html", "combo.html", "faq.html",
    "brand-facts.html", "product-guilu-gao.html", "product-guilu-drink-30cc.html",
    "product-guilu-drink-180cc.html", "product-guilu-tangkuai.html", "product-guilu-jiao.html",
    "product-luerong-fen.html", "data.json", "deploy-version.json", "catalog-public.json",
    "geo-data.json", "llms.txt", "llms-full.txt", "config/official-products.json",
    "assets/data/official-products.json", "content/visual-production-spec-v20260807.json",
    "content/content-calendar-seed-v20260807.json", "content/public-post-library.json",
    "content/public-content-policy.json",
]

FORBIDDEN_PHRASES = [
    "30cc玻璃瓶", "小玻璃瓶", "八個正式規格", "龜鹿湯塊三種", "龜鹿湯塊三規格",
]


def load_json(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def public_path(value):
    text = str(value or "").strip()
    if text.startswith(BASE):
        text = text[len(BASE):]
    return text.split("?", 1)[0].lstrip("/")


def asset_exists(value):
    text = str(value or "").strip()
    if text.startswith(("http://", "https://")) and not text.startswith(BASE):
        return True
    path = public_path(text)
    return bool(path) and (ROOT / path).is_file()


def assert_no_unauthorized_soup_weight(text, source_name):
    labels = ["龜鹿湯塊", "龜鹿膠", "龜鹿膏", "鹿茸粉"]
    for match in re.finditer(r"(?<!\d)(\d+(?:\.\d+)?)\s*g", text, re.I):
        number = float(match.group(1))
        if number < 50:
            continue
        before = text[max(0, match.start() - 80):match.start()]
        positions = [(before.rfind(label), label) for label in labels]
        position, label = max(positions)
        if position < 0 or label != "龜鹿湯塊":
            continue
        if abs(number - 75.0) > 0.001:
            raise AssertionError(f"{source_name} 出現未核准龜鹿湯塊重量：{match.group(0)}")


def validate_authority_texts():
    for path in AUTHORITY_SCAN_FILES:
        text = (ROOT / path).read_text(encoding="utf-8")
        for phrase in FORBIDDEN_PHRASES:
            assert phrase not in text, f"{path} 仍含舊資料：{phrase}"
        assert_no_unauthorized_soup_weight(text, path)

    for path in ["product-guilu-gao.html", "guide.html", "faq.html"]:
        text = (ROOT / path).read_text(encoding="utf-8")
        assert "每日早上及下午各一小匙" in text, f"{path} 龜鹿膏正式使用方式未同步"
        assert "每天一次，每次一小匙" not in text, f"{path} 仍含舊龜鹿膏使用方式"


def validate_products():
    data = load_json("data.json")
    products = {item.get("id"): item for item in data.get("products", [])}
    assert set(products) == set(EXPECTED_DATA), "data.json 正式產品必須剛好六項"
    for product_id, expected in EXPECTED_DATA.items():
        item = products[product_id]
        assert item.get("name") == expected["name"], f"{product_id} 正式名稱錯誤"
        assert item.get("size") == expected["size"], f"{product_id} 正式規格錯誤"
        assert item.get("ingredients") == CANONICAL_INGREDIENTS[product_id], f"{product_id} 成分或順序不同步"
    assert "瓶" not in products["guilu-drink-30"].get("name", ""), "30cc正式名稱不得稱瓶"
    assert products["guilu-gao"].get("usage", [None])[0] == "每日早上及下午各一小匙", "data.json 龜鹿膏使用方式不同步"

    for path, key in [
        ("config/official-products.json", "spec"),
        ("assets/data/official-products.json", "specification"),
    ]:
        document = load_json(path)
        items = {item.get("id"): item for item in document.get("products", [])}
        assert set(items) == set(EXPECTED_DATA), f"{path} 正式產品必須剛好六項"
        assert items["guilu-tangkuai"].get(key) == "75g／盒", f"{path} 龜鹿湯塊只能75g／盒"
        assert items["guilu-drink-30"].get("name") == "龜鹿飲30cc玻璃罐", f"{path} 30cc名稱錯誤"

    catalog = load_json("catalog-public.json")
    assert catalog.get("officialSpecifications") == OFFICIAL_SPECS, "catalog-public.json 六項正式規格不同步"
    catalog_products = {item.get("id"): item for item in catalog.get("products", [])}
    assert set(catalog_products) == set(EXPECTED_DATA), "catalog-public.json 正式產品必須剛好六項"
    for product_id, ingredients in CANONICAL_INGREDIENTS.items():
        assert catalog_products[product_id].get("ingredients") == ingredients, f"catalog-public.json {product_id} 成分或順序不同步"
    assert catalog_products["guilu-gao"].get("usage", [None])[0] == "每日早上及下午各一小匙"
    assert catalog_products["guilu-tangkuai"].get("size") == "75g／盒"
    assert catalog_products["guilu-tangkuai"].get("package") == "深藍正式盒裝"
    assert catalog_products["guilu-jiao"].get("package") == "淡紫色正式盒裝"

    visual = load_json("content/visual-production-spec-v20260807.json")
    assert visual.get("official_specs") == OFFICIAL_SPECS, "視覺母本正式規格不同步"
    assert visual["products"]["guilu-tangkuai"]["spec"] == "75g／盒"
    assert visual["products"]["guilu-tangkuai"]["presentation"] == "深藍正式盒裝"

    deploy = load_json("deploy-version.json")
    authority = deploy.get("productAuthority", {})
    assert authority.get("productCount") == 6
    assert authority.get("sellableSpecificationCount") == 6
    assert authority.get("specifications") == OFFICIAL_SPECS
    assert deploy.get("catalog") == "six-official-products-six-single-specs"


def validate_posts_and_assets():
    posts_doc = load_json("content/public-post-library.json")
    assets_doc = load_json("content/public-asset-library.json")
    posts = posts_doc.get("posts", [])
    assets = assets_doc.get("assets", [])
    defaults = posts_doc.get("publishing_defaults", {})
    asset_by_id = {str(item.get("id") or ""): item for item in assets}

    assert posts, "公開貼文不可為空"
    assert len(asset_by_id) == len(assets), "公開素材ID不可空白或重複"
    ids = [str(post.get("id") or "") for post in posts]
    assert all(ids) and len(ids) == len(set(ids)), "公開貼文ID不可空白或重複"

    image_ids, image_urls = [], []
    published = pending = 0
    for post in posts:
        post_id = post["id"]
        effective = {**defaults, **post}
        assert post.get("copy"), f"貼文缺少文案：{post_id}"
        asset_id = str(post.get("image_asset_id") or "")
        assert asset_id in asset_by_id, f"貼文素材綁定不存在：{post_id} -> {asset_id}"
        assert asset_exists(post.get("image_url")), f"貼文圖片不存在：{post_id}"
        assert public_path(post.get("image_url")) == public_path(asset_by_id[asset_id].get("path")), f"貼文與素材網址不一致：{post_id}"
        image_ids.append(asset_id)
        image_urls.append(public_path(post.get("image_url")))
        assert_no_unauthorized_soup_weight(json.dumps(post, ensure_ascii=False), f"貼文 {post_id}")

        status = str(post.get("status") or "")
        if status == "published":
            published += 1
            assert effective.get("prevent_republish") is True, f"已發布貼文缺少防重發：{post_id}"
            assert effective.get("do_not_republish") is True, f"已發布貼文缺少永久防重發：{post_id}"
            assert effective.get("publish_allowed") is False, f"已發布貼文不得再發布：{post_id}"
            assert effective.get("schedule_enabled") is False, f"已發布貼文不得排程：{post_id}"
        else:
            pending += 1
            assert status in {"pending_review", "draft", "rejected", "archived"}, f"未知貼文狀態：{post_id}"
            if status != "archived":
                assert effective.get("owner_review_required") is True, f"待審貼文缺少人工審核：{post_id}"
                assert effective.get("publish_allowed") is False, f"待審貼文不得允許發布：{post_id}"
                assert effective.get("auto_approve") is False
                assert effective.get("auto_schedule") is False
                assert effective.get("auto_publish") is False
        if post.get("image_status") == "replace-required":
            assert post.get("regeneration_mode") == "chatgpt_handoff", f"需換圖貼文未交給ChatGPT：{post_id}"

    assert len(image_ids) == len(set(image_ids)), "公開貼文主素材ID重複"
    assert len(image_urls) == len(set(image_urls)), "公開貼文主圖片網址重複"
    counts = posts_doc.get("counts", {})
    assert counts.get("total") == len(posts)
    assert counts.get("published_locked") == published
    assert counts.get("pending_review") == pending

    trial_posts = [post for post in posts if post.get("id") == "POST-GUILU-DRINK-TRIAL-EVERGREEN"]
    assert len(trial_posts) == 1
    assert trial_posts[0].get("image_asset_id") == "guilu-drink-trial-final-20260808", "公開貼文仍未綁定最終試喝主圖"
    assert trial_posts[0].get("do_not_regenerate") is True


def validate_trial():
    trial = load_json("content/social-guilu-drink-trial-v1.json")
    poster = trial.get("currentPoster", {})
    assert poster.get("assetId") == "guilu-drink-trial-final-20260808"
    assert poster.get("userConfirmedFinal") is True
    assert poster.get("userConfirmedPublished") is True
    assert poster.get("preventRepublish") is True
    assert poster.get("doNotRegenerate") is True
    assert trial.get("publishingSafety", {}).get("publishAllowed") is False


def validate_policy():
    policy = load_json("content/public-content-policy.json")
    authority = policy.get("productAuthority", {})
    assert authority.get("productCount") == 6
    assert authority.get("sellableSpecificationCount") == 6
    assert authority.get("specifications") == OFFICIAL_SPECS
    assert policy.get("erpPolicy", {}).get("customerDataPublic") is False
    assert policy.get("erpPolicy", {}).get("secretDataPublic") is False
    assert policy.get("publishingSafety", {}).get("ownerReviewRequiredBeforePublish") is True


def main():
    missing = [path for path in REQUIRED_FILES if not (ROOT / path).is_file()]
    assert not missing, f"缺少必要檔案：{missing}"
    validate_authority_texts()
    validate_products()
    validate_posts_and_assets()
    validate_trial()
    validate_policy()
    print("PASS 仙加味正式發布檢查：六個產品／六個規格、龜鹿湯塊75g唯一規格、正式成分順序、龜鹿膏使用方式、30cc玻璃罐命名、圖片綁定、待審核閘門與已發布防重發均一致。")


if __name__ == "__main__":
    main()
