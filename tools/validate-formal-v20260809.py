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
    batch5_paths = {
        "POST-PRODUCT-OVERVIEW": "images/posts/candidates-v20260809/product-overview.svg",
        "POST-COMBO": "images/posts/candidates-v20260809/combo.svg",
        "POST-GUIDE": "images/posts/candidates-v20260809/guide.svg",
        "POST-CHOOSE": "images/posts/candidates-v20260809/choose.svg",
        "POST-CHOOSE-BY-HABIT": "images/posts/candidates-v20260809/choose-by-habit.svg",
    }

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
            req(item.get("size") == expected_specs[pid], f"{source_name} {pid} 規格錯誤：{item.get('size')}")
            req(expected_path in str(item.get("image", "")), f"{source_name} {pid} 未使用 products-v3 正式原圖")

    scale = data("content/product-physical-scale-authority-v20260809.json")
    req(scale["products"]["guilu-drink-30"]["known_container_dimensions_mm"] == {"diameter": 42, "height": 51}, "30cc實際尺寸鎖錯誤")
    req(scale["products"]["guilu-gao"]["known_container_dimensions_mm"] == {"width": 51, "height": 78}, "龜鹿膏100g實際尺寸鎖錯誤")
    ratio = scale["products"]["guilu-drink-180"]["known_aspect_ratio_width_to_height"]
    req(ratio["target"] == 0.64 and ratio["min"] <= 0.64 <= ratio["max"], "180cc鋁袋比例鎖錯誤")
    for pid in ["guilu-tangkuai", "guilu-jiao", "luerong-fen"]:
        req(scale["products"][pid]["known_container_dimensions_mm"] is None, f"{pid} 未知毫米尺寸不得亂補")
    req(scale["review_gate"]["manual_approval_required_for_unknown_relative_scale"] is True, "未知多產品相對尺度必須人工審核")

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

    trial_manifest = data("content/final-published-assets-v20260808.json")
    asset = trial_manifest["assets"][0]
    req(asset["asset_id"] == "guilu-drink-trial-final-20260808", "試喝正式素材ID錯誤")
    req(asset["source_width_px"] == 1254 and asset["source_height_px"] == 1254, "試喝來源母本尺寸錯誤")
    req(asset["source_sha256"] == "2546dd0c95ef78d6e97a8119ee18633c69f47c9b9e56c78e44aa9df6e15635b7", "試喝來源母本SHA錯誤")
    req(asset["do_not_regenerate"] is True and asset["prevent_republish"] is True, "試喝正式圖必須鎖定不重生成／不重發")
    web_trial = asset["git_web_display_url"]
    req((ROOT / web_trial).exists(), "試喝正式Web顯示圖不存在")
    req(web_trial in text("trial.html"), "trial.html 未使用正式試喝Web圖")

    v8 = text("publishing-center-data-v8-fixes.js")
    v12 = text("publishing-center-data-v12-auto-candidates.js")
    v13 = text("publishing-center-data-v13-character-scenes.js")
    v14 = text("publishing-center-data-v14-boss-daily.js")
    v15 = text("publishing-center-data-v15-companions.js")
    v16 = text("publishing-center-data-v16-actual-product-photos.js")
    ai = text("publishing-center-ai-tools.js")
    guardian = text("publishing-center-guardian.js")
    policy = data("content/public-content-policy.json")
    queue = data("content/image-generation-queue-v20260808.json")
    asset_overrides = data("content/public-asset-status-overrides-v20260809.json")

    req("images/products-v2/" not in v8, "v8仍綁 products-v2")
    req("generated-v20260808-priority1/product-overview.svg" not in v8, "v8仍把舊多產品SVG當候選")
    req("MULTI_PRODUCT_HOLD" in v8 and "image_status:'needs_generation'" in v8, "v8未保留舊多產品圖的早期隔離")

    req("images/products-v2/" not in v12, "v12仍會生成 products-v2 候選")
    req("if(productIds(p).length>1)return false" in v12, "v12仍可能自動假生成多產品候選")

    character_layers = [
        ("v13", v13, "chatgpt-character-scene-v13-required"),
        ("v14", v14, "chatgpt-boss-daily-v14-required"),
        ("v15", v15, "chatgpt-companion-v15-required"),
    ]
    for label, source, mode in character_layers:
        req(mode in source, f"{label} 未切到正式ChatGPT重生成模式")
        req("image_status:'needs_generation'" in source, f"{label} 未維持needs_generation")
        req("images/brand/line-oa/" not in source, f"{label} 仍混用LINE OA專用角色素材")
        req("<clipPath" not in source and "clip-path=" not in source, f"{label} 仍含真正的SVG裁切程式")
        req("preserveAspectRatio=" not in source, f"{label} 仍含舊slice／preserveAspectRatio裁切程式")
        req("完整" in source and "不得裁切" in source, f"{label} 缺少角色完整不裁切規則")
    req("簡單SVG" in v15 or "簡單向量" in v15, "v15未明確禁止未核准向量陪伴角色")

    req("LEGACY_MULTI_SVG" in v16 and "generated-v20260808" in v16, "v16未攔截內嵌舊產品圖SVG")
    req("SAFE_PREFLIGHT" in v16 and "BATCH5_CANDIDATES" in v16, "v16未套用預檢安全替代／第一批產品候選")
    req("batch5-products-v3-independent-panel-candidate" in v16, "v16未標記第一批產品候選模式")
    for pid, path in batch5_paths.items():
        req(pid in v16 and path in v16, f"v16缺少第一批產品候選：{pid}")
        candidate = text(path)
        req("images/products-v2/" not in candidate, f"第一批候選仍引用products-v2：{path}")
        req("preserveAspectRatio=\"xMidYMid meet\"" in candidate, f"第一批候選未使用contain式等比例圖片：{path}")
        req("clipPath" not in candidate and "slice" not in candidate, f"第一批候選仍含裁切：{path}")
    req("products-v2" in v16, "v16缺少舊products-v2攔截")
    for pid in ["XJW-WORK-REST-001", "POST-STORAGE", "POST-SEASONS-RHYTHM", "POST-INGREDIENT-PRINCIPLE", "POST-DAILY-SOUP", "POST-WEATHER-HOT", "POST-WEATHER-TEMP", "POST-WEATHER-RAIN", "POST-STORE", "POST-RECIPES"]:
        req(pid in v16, f"v16缺少安全預檢替代：{pid}")

    req("products-v3/guilu-drink-30.jpg" in ai and "products-v3/guilu-drink-180.jpg" in ai, "ChatGPT重生成未帶新版正式產品圖")
    for phrase in ["42", "51", "0.64", "不裁切", "多產品"]:
        req(phrase in ai, f"ChatGPT重生成缺少尺度／完整構圖規則：{phrase}")
    req("products-v2" in guardian and "玻璃瓶" in guardian, "發佈中心守門員缺少舊圖／30cc瓶型偵測")

    req(policy["productAuthority"]["imageAuthority"] == "images/products-v3/", "公開內容政策未鎖 products-v3")
    req(policy["publishingSafety"]["multiProductUnknownScaleAction"] == "keep-needs-generation-until-reviewed", "公開政策未鎖未知多產品尺度的保守處理")

    req(queue["summary"]["runtimeCalculated"] is True, "生成佇列仍使用寫死候選數字")
    req(queue["knownForcedRegeneration"]["minimumKnownCount"] == 0, "第一批5篇已有候選後，基礎強制重生成應為0")
    req(queue["knownProductReviewCandidates"]["count"] == 5, "第一批產品候選必須是5篇")
    req(set(queue["knownProductReviewCandidates"]["post_ids"]) == set(batch5_paths), "第一批產品候選ID不一致")
    req(queue["knownSafePreflightReplacement"]["count"] == 10, "安全預檢替代清單必須是10篇")
    req(queue["knownCharacterSceneRegeneration"]["count"] == 120, "角色場景重生成必須記錄120篇")
    req(queue["knownCharacterSceneRegeneration"]["breakdown"] == {"v13FestivalLocationWanhua": 72, "v14BossDaily": 32, "v15Companions": 16}, "v13／v14／v15角色重生成分布錯誤")
    req(queue["summary"]["knownForcedRegenerationMinimum"] == 120, "已知需重生成最低數量應為120篇")

    deprecated_override_ids = {item["id"] for item in asset_overrides["deprecatedAssets"]}
    req(deprecated_override_ids == {"preflight-guide-use", "preflight-choose-products", "preflight-choose-by-habit"}, "預檢舊products-v2 SVG降級清單錯誤")
    req(len(asset_overrides["safeCandidateBindings"]) == 10, "素材狀態覆寫必須有10張安全候選")
    req(set(asset_overrides["productReviewCandidateBindings"]) == set(batch5_paths), "素材狀態覆寫的第一批5張產品候選ID錯誤")
    req(asset_overrides["forcedRegenerationPostIds"] == [], "第一批5篇已有候選後，不應仍列強制重生成")

    print("PASS formal v20260809: products-v3, physical scale, trial lock, 5 product review candidates, 10 safe replacements, 120 character regenerations, no cropped LINE mascot candidates")


if __name__ == "__main__":
    main()
