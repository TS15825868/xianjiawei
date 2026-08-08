#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def text(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def data(path: str):
    return json.loads(text(path))


def req(ok: bool, msg: str):
    if not ok:
        raise AssertionError(msg)


def main():
    spec = data("brand-character-spec.json")
    authority = data("content/character-regeneration-authority-v20260809.json")
    queue = data("content/image-generation-queue-v20260808.json")
    batches = data("content/character-generation-batches-v20260809.json")
    b1 = data("content/character-b1-prompt-manifest-v20260809.json")
    b2 = data("content/character-b2-prompt-manifest-v20260809.json")
    b3 = data("content/character-b3-prompt-manifest-v20260809.json")
    v13 = text("publishing-center-data-v13-character-scenes.js")
    v14 = text("publishing-center-data-v14-boss-daily.js")
    v15 = text("publishing-center-data-v15-companions.js")

    req(spec["status"] == "locked", "角色正式母本未鎖定")
    req(spec["rules"]["fullCharacterNoCropRequired"] is True, "角色母本未要求完整不裁切")
    req(spec["rules"]["separateSceneAssetPoolsAcrossWebsiteAndLine"] is True, "角色母本未分離官網與LINE場景素材池")
    req(spec["rules"]["unapprovedVectorCompanionsForbidden"] is True, "角色母本未禁止未核准向量陪伴角色")
    req(spec["mascot"]["displayMode"] == "contain-no-crop", "角色顯示模式不是contain-no-crop")

    req(authority["originalInvalidCharacterCandidates"] == 120, "原始不合格角色候選總數不是120")
    req(authority["safeApprovedWebsiteReuse"] == 5, "精準可重用官網核准角色圖不是5張")
    req(authority["totalKnownRegeneration"] == 115, "角色剩餘已知重生成總數不是115")
    counts = {item["layer"]: item["count"] for item in authority["breakdown"]}
    req(counts == {"v13": 72, "v14": 27, "v15": 16}, f"角色剩餘重生成分布錯誤：{counts}")
    by_layer={item["layer"]:item for item in authority["breakdown"]}
    req(by_layer["v13"]["newMode"]=="chatgpt-character-scene-v13-b3-context-required", "角色權威v13模式不是B3保留情境模式")
    req(by_layer["v13"]["contextPromptCount"]==72 and by_layer["v13"]["compositionVariantCount"]==4, "角色權威v13數量／構圖變體錯誤")
    req(by_layer["v13"]["promptManifest"]=="content/character-b3-prompt-manifest-v20260809.json", "角色權威v13未連結B3提示母本")
    req(by_layer["v14"]["newMode"]=="chatgpt-boss-daily-v14-b1-exact-required", "角色權威v14模式不是B1精準提示")
    req(by_layer["v14"]["exactPromptCount"]==27 and by_layer["v14"]["promptManifest"]=="content/character-b1-prompt-manifest-v20260809.json", "角色權威v14精準提示母本錯誤")
    req(by_layer["v15"]["newMode"]=="chatgpt-companion-v15-b2-exact-required", "角色權威v15模式不是B2精準提示")
    req(by_layer["v15"]["exactPromptCount"]==16 and by_layer["v15"]["promptManifest"]=="content/character-b2-prompt-manifest-v20260809.json", "角色權威v15精準提示母本錯誤")

    reuse_ids=set(authority["safeApprovedWebsiteCandidates"])
    expected_reuse={"XJW-CHARACTER-006","XJW-CHARACTER-008","XJW-CHARACTER-011","XJW-CHARACTER-012","XJW-CHARACTER-014"}
    req(reuse_ids==expected_reuse, f"官網核准精準重用ID錯誤：{reuse_ids}")
    req(authority["regenerationRules"]["lineOACropReuseForbidden"] is True, "角色稽核未禁止LINE OA裁切重用")
    req(authority["regenerationRules"]["coverSliceClipPathForbiddenForMascot"] is True, "角色稽核未禁止cover/slice/clipPath")
    req(authority["reviewOutcome"]["remainingStatus"] == "needs_generation", "剩餘舊角色候選未維持needs_generation")
    req(authority["reviewOutcome"]["safeExactMatches"] == "candidate-review-required", "精準既有圖未回待審核")

    req("chatgpt-character-scene-v13-b3-context-required" in v13, "v13未切到B3保留原情境模式")
    req("image_generation_manifest:'content/character-b3-prompt-manifest-v20260809.json'" in v13, "v13未連結B3正式提示母本")
    req("const original=String(p.image_prompt||'').trim()" in v13, "v13沒有保留原始image_prompt")
    req("compositionVariants:4" in v13 and "VARIANTS" in v13, "v13沒有四種構圖變化")
    req("萬華場景不得誤用其他城市地標" in v13 and "地點必須維持" in v13, "v13缺少萬華／地點守門")
    req("image_status:'needs_generation'" in v13 and "candidate_generated:false" in v13, "v13未維持needs_generation")
    req("images/brand/line-oa/" not in v13 and "<clipPath" not in v13 and "preserveAspectRatio=" not in v13, "v13仍有LINE OA裁切來源")

    req("SAFE_EXISTING" in v14 and "approved-v405-semantic-reuse-v14" in v14, "v14未建立精準官網核准圖重用")
    for pid in expected_reuse:
        req(pid in v14, f"v14缺少精準重用ID：{pid}")
    for path in ["home-brand.webp","choose.webp","guide-how-to-use.webp","recipes.webp","faq.webp"]:
        req(path in v14, f"v14缺少核准官網場景：{path}")
    req("chatgpt-boss-daily-v14-b1-exact-required" in v14, "v14剩餘27篇未切到B1逐篇精準重生成模式")
    req("B1_DIRECTION" in v14 and "exactPromptCount:Object.keys(B1_DIRECTION).length" in v14, "v14未載入27篇逐篇精準場景")
    req("image_generation_manifest:'content/character-b1-prompt-manifest-v20260809.json'" in v14, "v14未連結B1正式提示母本")
    req("approvedExistingCandidate:5" in v14 and "regenerationRequired:27" in v14, "v14統計不是5張重用＋27篇重生成")
    req("images/brand/line-oa/" not in v14 and "<clipPath" not in v14 and "preserveAspectRatio=" not in v14, "v14仍有舊角色裁切程式")

    req("chatgpt-companion-v15-b2-exact-required" in v15, "v15未切到B2逐篇精準重生成模式")
    req("B2_DIRECTION" in v15 and "exactPromptCount:Object.keys(B2_DIRECTION).length" in v15, "v15未載入16篇逐篇陪伴場景")
    req("image_generation_manifest:'content/character-b2-prompt-manifest-v20260809.json'" in v15, "v15未連結B2正式提示母本")
    req("灰色小河馬必須明確是娃娃" in v15 and "米色小鹿安撫巾必須保持布巾" in v15, "v15陪伴角色硬規則不完整")
    req("images/brand/line-oa/" not in v15 and "<clipPath" not in v15 and "preserveAspectRatio=" not in v15, "v15仍有LINE OA裁切來源")

    req(queue["knownCharacterSafeReuseCandidates"]["count"] == 5, "生成佇列未記錄5篇安全角色重用")
    req(queue["knownCharacterSceneRegeneration"]["count"] == 115, "生成佇列未記錄115篇角色重生成")
    req(queue["knownCharacterSceneRegeneration"]["breakdown"] == {"v13FestivalLocationWanhua":72,"v14BossDaily":27,"v15Companions":16}, "生成佇列角色剩餘分布錯誤")
    req(queue["summary"]["knownForcedRegenerationMinimum"] == 115, "生成佇列已知重生成最低數量不是115")

    req(batches["totalNeedsGeneration"] == 115, "角色生成批次總數不是115")
    by_id={item["id"]:item for item in batches["batches"]}
    req(set(by_id)=={"CHAR-B1-BOSS-DAILY","CHAR-B2-COMPANIONS","CHAR-B3-FESTIVAL-LOCATION-WANHUA"}, "角色生成批次ID不完整")
    req(by_id["CHAR-B1-BOSS-DAILY"]["count"]==27 and len(by_id["CHAR-B1-BOSS-DAILY"]["postIds"])==27, "B1小老闆日常批次不是27篇")
    req(len(set(by_id["CHAR-B1-BOSS-DAILY"]["postIds"]))==27, "B1小老闆日常批次有重複ID")
    req(not (set(by_id["CHAR-B1-BOSS-DAILY"]["postIds"]) & expected_reuse), "已轉待審核的5篇角色又被塞回B1生成批次")
    req(by_id["CHAR-B2-COMPANIONS"]["count"]==16 and len(by_id["CHAR-B2-COMPANIONS"]["postIds"])==16, "B2陪伴角色批次不是16篇")
    req(len(set(by_id["CHAR-B2-COMPANIONS"]["postIds"]))==16, "B2陪伴角色批次有重複ID")
    req(by_id["CHAR-B3-FESTIVAL-LOCATION-WANHUA"]["count"]==72, "B3節慶／地點／萬華批次不是72篇")
    req(batches["alreadyMovedToReview"]["count"]==5 and set(batches["alreadyMovedToReview"]["postIds"])==expected_reuse, "批次檔未正確排除5篇已回待審核角色")

    req(b1["batch"]=="CHAR-B1-BOSS-DAILY" and b1["count"]==27, "B1精準提示母本不是27篇")
    b1_ids=[item["postId"] for item in b1["entries"]]
    req(len(b1_ids)==27 and len(set(b1_ids))==27, "B1精準提示母本ID重複或缺漏")
    req(set(b1_ids)==set(by_id["CHAR-B1-BOSS-DAILY"]["postIds"]), "B1精準提示母本與批次ID不一致")
    req(all(item.get("direction") for item in b1["entries"]), "B1有貼文缺少精準製圖方向")

    req(b2["batch"]=="CHAR-B2-COMPANIONS" and b2["count"]==16, "B2精準提示母本不是16篇")
    b2_ids=[item["postId"] for item in b2["entries"]]
    req(len(b2_ids)==16 and len(set(b2_ids))==16, "B2精準提示母本ID重複或缺漏")
    req(set(b2_ids)==set(by_id["CHAR-B2-COMPANIONS"]["postIds"]), "B2精準提示母本與批次ID不一致")
    req(all(item.get("direction") and item.get("companion") for item in b2["entries"]), "B2有貼文缺少陪伴角色或精準製圖方向")
    req({item["companion"] for item in b2["entries"]}=={"小鹿","小烏龜","灰色小河馬娃娃","米色小鹿安撫巾"}, "B2陪伴角色種類不完整")

    req(b3["batch"]=="CHAR-B3-FESTIVAL-LOCATION-WANHUA" and b3["count"]==72, "B3提示母本不是72篇")
    req(b3["sharedRules"]["preserveOriginalImagePrompt"] is True, "B3未要求保留原始image_prompt")
    req(set(b3["compositionVariants"])=={"1","2","3","4"}, "B3不是四種構圖變化")
    req(set(b3["categoryRules"])=={"節慶","地點","萬華在地"}, "B3三類情境規則不完整")
    req(b3["sharedRules"]["publish"]=="生成後只進待審核，不自動核准、不自動排程、不自動發布", "B3發布安全規則錯誤")

    print("PASS character regeneration v20260809: 5 safe reuses + B1 27 exact + B2 16 exact + B3 72 context-preserving prompts = 115 generation-ready")


if __name__ == "__main__":
    main()
