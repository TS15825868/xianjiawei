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
    v13 = text("publishing-center-data-v13-character-scenes.js")
    v14 = text("publishing-center-data-v14-boss-daily.js")
    v15 = text("publishing-center-data-v15-companions.js")

    req(spec["status"] == "locked", "角色正式母本未鎖定")
    req(spec["rules"]["fullCharacterNoCropRequired"] is True, "角色母本未要求完整不裁切")
    req(spec["rules"]["separateSceneAssetPoolsAcrossWebsiteAndLine"] is True, "角色母本未分離官網與LINE場景素材池")
    req(spec["rules"]["unapprovedVectorCompanionsForbidden"] is True, "角色母本未禁止未核准向量陪伴角色")
    req(spec["mascot"]["displayMode"] == "contain-no-crop", "角色顯示模式不是contain-no-crop")

    req(authority["totalKnownRegeneration"] == 120, "角色已知重生成總數不是120")
    counts = {item["layer"]: item["count"] for item in authority["breakdown"]}
    req(counts == {"v13": 72, "v14": 32, "v15": 16}, f"角色重生成分布錯誤：{counts}")
    req(authority["regenerationRules"]["lineOACropReuseForbidden"] is True, "角色稽核未禁止LINE OA裁切重用")
    req(authority["regenerationRules"]["coverSliceClipPathForbiddenForMascot"] is True, "角色稽核未禁止cover/slice/clipPath")
    req(authority["reviewOutcome"]["currentStatus"] == "needs_generation", "舊角色候選未退回needs_generation")

    layers = [
        ("v13", v13, "chatgpt-character-scene-v13-required"),
        ("v14", v14, "chatgpt-boss-daily-v14-required"),
        ("v15", v15, "chatgpt-companion-v15-required"),
    ]
    for label, source, mode in layers:
        req(mode in source, f"{label} 未使用正式重生成模式")
        req("image_status:'needs_generation'" in source, f"{label} 未退回needs_generation")
        req("candidate_generated:false" in source, f"{label} 仍把舊圖標成已生成候選")
        req("images/brand/line-oa/" not in source, f"{label} 仍直接引用LINE OA角色圖片")
        req("<clipPath" not in source and "clip-path=" not in source, f"{label} 仍有真正SVG裁切程式")
        req("preserveAspectRatio=" not in source, f"{label} 仍有舊slice裁切程式")
        req("products-v3" in source, f"{label} 若需產品時未指向products-v3")

    req(queue["knownCharacterSceneRegeneration"]["count"] == 120, "生成佇列未記錄120篇角色重生成")
    req(queue["summary"]["knownForcedRegenerationMinimum"] == 125, "生成佇列已知重生成最低數量不是125")

    print("PASS character regeneration v20260809: 72 v13 + 32 v14 + 16 v15; full-frame website mascot, no LINE crop/vector substitutes")


if __name__ == "__main__":
    main()
