#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def text(path: str) -> str:
    p = ROOT / path
    if not p.exists():
        raise AssertionError(f"缺少正式檔案：{path}")
    return p.read_text(encoding="utf-8")


def data(path: str):
    return json.loads(text(path))


def req(ok: bool, message: str):
    if not ok:
        raise AssertionError(message)


def main():
    product_paths = {
        "guilu-gao": "images/products-v3/guilu-gao.jpg",
        "guilu-drink-30": "images/products-v3/guilu-drink-30.jpg",
        "guilu-drink-180": "images/products-v3/guilu-drink-180.jpg",
        "guilu-tangkuai": "images/products-v3/guilu-tangkuai.jpg",
        "guilu-jiao": "images/products-v3/guilu-jiao.jpg",
        "luerong-fen": "images/products-v3/luerong-fen.jpg",
    }
    expected_specs = {
        "guilu-gao": "100g／罐",
        "guilu-drink-30": "30cc／罐（小玻璃罐）",
        "guilu-drink-180": "180cc／包（鋁袋）",
        "guilu-tangkuai": "75g／盒｜8塊裝｜每塊約9.375g",
        "guilu-jiao": "600g（1斤）／盒｜32塊裝｜每塊約18.75g",
        "luerong-fen": "75g／罐",
    }

    # Canonical public product data.
    canonical = data("data.json")
    catalog = data("catalog-public.json")
    req(len(canonical.get("products", [])) == 6, "data.json 必須只有六項正式產品")
    req(len(catalog.get("products", [])) == 6, "catalog-public.json 必須只有六項正式產品")
    for source_name, source in [("data.json", canonical), ("catalog-public.json", catalog)]:
        raw = text(source_name)
        req("images/products-v2/" not in raw, f"{source_name} 仍引用 products-v2")
        by_id = {p["id"]: p for p in source["products"]}
        req(set(by_id) == set(product_paths), f"{source_name} 六項產品ID不一致")
        for pid, expected_path in product_paths.items():
            item = by_id[pid]
            req(expected_specs[pid] in str(item.get("size", item.get("spec", ""))) or item.get("size") == expected_specs[pid], f"{source_name} {pid} 規格錯誤")
            req(expected_path in str(item.get("image", "")), f"{source_name} {pid} 未使用 products-v3 正式原圖")

    # Physical scale authority.
    scale = data("content/product-physical-scale-authority-v20260809.json")
    req(scale["products"]["guilu-drink-30"]["known_container_dimensions_mm"] == {"diameter": 42, "height": 51}, "30cc實際尺寸鎖錯誤")
    req(scale["products"]["guilu-gao"]["known_container_dimensions_mm"] == {"width": 51, "height": 78}, "龜鹿膏100g實際尺寸鎖錯誤")
    ratio = scale["products"]["guilu-drink-180"]["known_aspect_ratio_width_to_height"]
    req(ratio["target"] == 0.64 and ratio["min"] <= 0.64 <= ratio["max"], "180cc鋁袋比例鎖錯誤")
    req(scale["products"]["guilu-tangkuai"]["known_container_dimensions_mm"] is None, "湯塊未知毫米尺寸不得亂補")
    req(scale["products"]["guilu-jiao"]["known_container_dimensions_mm"] is None, "龜鹿膠未知毫米尺寸不得亂補")
    req(scale["products"]["luerong-fen"]["known_container_dimensions_mm"] is None, "鹿茸粉未知毫米尺寸不得亂補")
    req(scale["review_gate"]["manual_approval_required_for_unknown_relative_scale"] is True, "未知多產品相對尺度必須人工審核")

    # Public pages must use current product authority, never legacy main images.
    live_pages = [
        "product-guilu-gao.html",
        "product-guilu-drink-30cc.html",
        "product-guilu-drink-180cc.html",
        "product-guilu-tangkuai.html",
        "product-guilu-jiao.html",
        "product-luerong-fen.html",
        "dm.html",
        "trial.html",
    ]
    combined_pages = "\n".join(text(p) for p in live_pages)
    req("images/products-v2/" not in combined_pages, "正式產品／DM／試喝頁仍引用 products-v2")
    for path in product_paths.values():
        req(path in combined_pages, f"正式頁面缺少產品原圖：{path}")
    req("30cc／瓶" not in combined_pages and "30cc玻璃瓶" not in combined_pages, "正式頁面仍出現30cc瓶型舊稱")

    # Trial final image identity and web display derivative.
    trial_manifest = data("content/final-published-assets-v20260808.json")
    asset = trial_manifest["assets"][0]
    req(asset["asset_id"] == "guilu-drink-trial-final-20260808", "試喝正式素材ID錯誤")
    req(asset["source_width_px"] == 1254 and asset["source_height_px"] == 1254, "試喝來源母本尺寸錯誤")
    req(asset["source_sha256"] == "2546dd0c95ef78d6e97a8119ee18633c69f47c9b9e56c78e44aa9df6e15635b7", "試喝來源母本SHA錯誤")
    req(asset["do_not_regenerate"] is True and asset["prevent_republish"] is True, "試喝正式圖必須鎖定不重生成／不重發")
    web_trial = asset["git_web_display_url"]
    req((ROOT / web_trial).exists(), "試喝正式Web顯示圖不存在")
    req(web_trial in text("trial.html"), "trial.html 未使用正式試喝Web圖")

    # Publishing center runtime authority.
    v8 = text("publishing-center-data-v8-fixes.js")
    v12 = text("publishing-center-data-v12-auto-candidates.js")
    v16 = text("publishing-center-data-v16-actual-product-photos.js")
    ai = text("publishing-center-ai-tools.js")
    guardian = text("publishing-center-guardian.js")
    policy = data("content/public-content-policy.json")
    queue = data("content/image-generation-queue-v20260808.json")

    req("images/products-v2/" not in v8, "v8仍綁 products-v2")
    req("generated-v20260808-priority1/product-overview.svg" not in v8, "v8仍把舊多產品SVG當候選")
    req("MULTI_PRODUCT_HOLD" in v8 and "image_status:'needs_generation'" in v8, "v8未把多產品舊圖退回需重生成")
    req("images/products-v2/" not in v12, "v12仍會生成 products-v2 候選")
    req("if(productIds(p).length>1)return false" in v12, "v12仍可能自動假生成多產品候選")
    req("LEGACY_MULTI_SVG" in v16 and "generated-v20260808" in v16, "v16未攔截內嵌舊產品圖SVG")
    req("/\\/images\\/products-v2\\//" in v16 or "products-v2" in v16, "v16缺少舊products-v2攔截")
    req("products-v3/guilu-drink-30.jpg" in ai and "products-v3/guilu-drink-180.jpg" in ai, "ChatGPT重生成未帶新版正式產品圖")
    for phrase in ["42", "51", "0.64", "不裁切", "多產品"]:
        req(phrase in ai, f"ChatGPT重生成缺少尺度／完整構圖規則：{phrase}")
    req("products-v2" in guardian and "玻璃瓶" in guardian, "發佈中心守門員缺少舊圖／30cc瓶型偵測")
    req(policy["productAuthority"]["imageAuthority"] == "images/products-v3/", "公開內容政策未鎖 products-v3")
    req(policy["publishingSafety"]["multiProductUnknownScaleAction"] == "keep-needs-generation-until-reviewed", "公開政策未鎖多產品未知尺度處理")
    req(queue["summary"]["runtimeCalculated"] is True, "生成佇列仍使用寫死候選數字")
    req("POST-PRODUCT-OVERVIEW" in queue["knownForcedRegeneration"]["post_ids"], "六項產品總覽未列強制重生成")
    req("POST-COMBO" in queue["knownForcedRegeneration"]["post_ids"], "多產品搭配未列強制重生成")

    print("PASS formal v20260809: products-v3 authority, physical-scale lock, trial lock, publishing regeneration safety")


if __name__ == "__main__":
    main()
