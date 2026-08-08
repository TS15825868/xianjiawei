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
    reuse_ids=set(authority["safeApprovedWebsiteCandidates"])
    expected_reuse={"XJW-CHARACTER-006","XJW-CHARACTER-008","XJW-CHARACTER-011","XJW-CHARACTER-012","XJW-CHARACTER-014"}
    req(reuse_ids==expected_reuse, f"官網核准精準重用ID錯誤：{reuse_ids}")
    req(authority["regenerationRules"]["lineOACropReuseForbidden"] is True, "角色稽核未禁止LINE OA裁切重用")
    req(authority["regenerationRules"]["coverSliceClipPathForbiddenForMascot"] is True, "角色稽核未禁止cover/slice/clipPath")
    req(authority["reviewOutcome"]["remainingStatus"] == "needs_generation", "剩餘舊角色候選未維持needs_generation")
    req(authority["reviewOutcome"]["safeExactMatches"] == "candidate-review-required", "精準既有圖未回待審核")

    for label, source, mode in [
        ("v13", v13, "chatgpt-character-scene-v13-required"),
        ("v15", v15, "chatgpt-companion-v15-required"),
    ]:
        req(mode in source, f"{label} 未使用正式重生成模式")
        req("image_status:'needs_generation'" in source, f"{label} 未退回needs_generation")
        req("candidate_generated:false" in source, f"{label} 仍把舊圖標成已生成候選")
        req("images/brand/line-oa/" not in source, f"{label} 仍直接引用LINE OA角色圖片")
        req("<clipPath" not in source and "clip-path=" not in source, f"{label} 仍有真正SVG裁切程式")
        req("preserveAspectRatio=" not in source, f"{label} 仍有舊slice裁切程式")
        req("products-v3" in source, f"{label} 若需產品時未指向products-v3")

    req("SAFE_EXISTING" in v14 and "approved-v405-semantic-reuse-v14" in v14, "v14未建立精準官網核准圖重用")
    for pid in expected_reuse:
        req(pid in v14, f"v14缺少精準重用ID：{pid}")
    for path in ["home-brand.webp","choose.webp","guide-how-to-use.webp","recipes.webp","faq.webp"]:
        req(path in v14, f"v14缺少核准官網場景：{path}")
    req("chatgpt-boss-daily-v14-required" in v14, "v14剩餘27篇未維持正式重生成模式")
    req("approvedExistingCandidate:5" in v14 and "regenerationRequired:27" in v14, "v14統計不是5張重用＋27篇重生成")
    req("images/brand/line-oa/" not in v14, "v14仍直接引用LINE OA角色圖片")
    req("<clipPath" not in v14 and "preserveAspectRatio=" not in v14, "v14仍有舊角色裁切程式")

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

    print("PASS character regeneration v20260809: 5 exact approved-v405 reuses + executable batches 27 boss / 16 companions / 72 festival-location-wanhua = 115 remaining")


if __name__ == "__main__":
    main()
